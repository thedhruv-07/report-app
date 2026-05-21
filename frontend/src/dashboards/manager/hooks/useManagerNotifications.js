import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config/api';

export const useManagerNotifications = (onNewNotification) => {
  const callbackRef = useRef(onNewNotification);
  useEffect(() => { callbackRef.current = onNewNotification; });

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      socket.emit('join', 'manager_room');
    });

    socket.on('new_report_submitted', (data) => {
      callbackRef.current?.({
        id: `notif-${Date.now()}`,
        message: `New ${data.reportType || 'report'} submitted by ${data.inspectorName || 'Inspector'}${data.client ? ` for ${data.client}` : ''}`,
        reportId: data.reportId,
        isRead: false,
        createdAt: data.submittedAt || new Date().toISOString(),
        timeAgo: 'Just now',
        type: 'submission',
      });
    });

    socket.on('report_status_changed', (data) => {
      callbackRef.current?.({
        id: `notif-${Date.now()}`,
        message: `Report ${(data.reportId?.toString() || '').slice(-6)} status changed to ${data.status}`,
        reportId: data.reportId,
        isRead: false,
        createdAt: new Date().toISOString(),
        timeAgo: 'Just now',
        type: 'status',
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);
};
