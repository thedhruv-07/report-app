import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config/api';

export const useManagerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      socket.emit('join', 'manager_room');
    });

    socket.on('report_status_changed', (data) => {
      const newNotification = {
        id: Date.now(),
        message: `Report ${(data.reportId?.toString() || '').slice(-6)} status changed to ${data.status}`,
        time: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAllAsRead };
};