// frontend/src/context/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { ENDPOINTS, API_BASE_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import { Bell, X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const DASHBOARD_ROUTE_BY_ROLE = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  inspector: '/dashboard/inspector',
};

function bannerLinkFor(banner, role) {
  if (banner.relatedTaskId && role === 'inspector') return `/dashboard/inspector?task=${banner.relatedTaskId}`;
  if (banner.relatedReportId) return role === 'manager' ? `/dashboard/manager?report=${banner.relatedReportId}` : '/admin/report-queue';
  if (banner.relatedBookingId || banner.relatedTaskId) return DASHBOARD_ROUTE_BY_ROLE[role] || '/dashboard';
  return null;
}

const BANNER_ICONS = { success: CheckCircle, warning: AlertTriangle, urgent: XCircle, info: Info };
const BANNER_STYLES = {
  success: { accent: '#10b981', iconBg: '#d1fae5', iconColor: '#059669' },
  warning: { accent: '#f59e0b', iconBg: '#fef3c7', iconColor: '#b45309' },
  urgent:  { accent: '#ef4444', iconBg: '#fee2e2', iconColor: '#dc2626' },
  info:    { accent: '#3b82f6', iconBg: '#dbeafe', iconColor: '#2563eb' },
};

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [popupNotifications, setPopupNotifications] = useState([]);
  const [bellNotifications, setBellNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For banners
  const [activeBanners, setActiveBanners] = useState([]);
  const previousNotifsRef = useRef([]);
  const initialLoadDone = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.NOTIFICATIONS.MY, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      const notifs = data.notifications || [];
      
      // Banner logic: check for new unread notifications
      const newUnread = notifs.filter(n => !n.isRead);
      if (initialLoadDone.current) {
        const prevUnreadIds = new Set(previousNotifsRef.current.filter(n => !n.isRead).map(n => n._id));
        const trulyNew = newUnread.filter(n => !prevUnreadIds.has(n._id));
        trulyNew.forEach(notif => {
          const bannerId = Math.random().toString(36).slice(2, 11);
          setActiveBanners(prev => [...prev, { ...notif, bannerId }]);
          setTimeout(() => {
            setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId));
          }, 5000);
        });
      } else {
        initialLoadDone.current = true;
        if (newUnread.length > 0) {
          const alreadyShown = sessionStorage.getItem("notif_popup_shown");
          if (!alreadyShown) {
            const bannerId = Math.random().toString(36).slice(2, 11);
            const summary = {
              bannerId,
              title: `${newUnread.length} unread notification${newUnread.length !== 1 ? 's' : ''}`,
              message: newUnread[0].message || newUnread[0].title || 'Check your notification panel for details.',
              type: 'info',
            };
            setActiveBanners(prev => [...prev, summary]);
            sessionStorage.setItem("notif_popup_shown", "true");
            setTimeout(() => {
              setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId));
            }, 6000);
          }
        }
      }
      previousNotifsRef.current = notifs;

      setPopupNotifications(notifs);
      setBellNotifications(notifs);
      setUnreadCount(newUnread.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // Fetch on login + poll every 30 s
  useEffect(() => {
    if (!user || !token) {
      setPopupNotifications([]);
      setBellNotifications([]);
      setUnreadCount(0);
      initialLoadDone.current = false;
      previousNotifsRef.current = [];
      setActiveBanners([]);
      return;
    }
    fetchNotifications();
    const poll = setInterval(fetchNotifications, 30000);
    return () => clearInterval(poll);
  }, [user, token, fetchNotifications]);

  // Socket: join user room (+ role room) and refresh on notification/system events
  useEffect(() => {
    if (!user || !token) return;
    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('join', `user_${user.id || user._id}`);
      if (user.role === 'admin') socket.emit('join', 'admin_room');
      if (user.role === 'manager') socket.emit('join', 'manager_room');
    });
    socket.on('new_notification', () => {
      fetchNotifications();
    });
    socket.on('new_system_notification', () => {
      fetchNotifications();
    });

    const pushBanner = (title, message, type = 'info') => {
      const bannerId = Math.random().toString(36).slice(2, 11);
      setActiveBanners(prev => [...prev, { bannerId, title, message, type }]);
      setTimeout(() => {
        setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId));
      }, 5000);
    };

    socket.on('new_report_submitted', (data) => {
      pushBanner(
        'New Report Submitted',
        `${data.inspectorName || 'An inspector'} submitted a ${data.reportType || 'report'}${data.client ? ` for ${data.client}` : ''}.`,
        'info'
      );
    });
    socket.on('report_status_changed', (data) => {
      const status = (data.status || '').toLowerCase();
      const type = status.includes('approve') ? 'success' : status.includes('revision') || status.includes('reject') ? 'warning' : 'info';
      pushBanner(
        'Report Status Changed',
        `Report ${(data.reportId?.toString() || '').slice(-6)} is now "${data.status}".`,
        type
      );
    });

    return () => socket.disconnect();
  }, [user, token, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return;
    try {
      await fetch(ENDPOINTS.NOTIFICATIONS.MARK_READ, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      });
      const mark = n => n._id === notificationId ? { ...n, isRead: true } : n;
      setPopupNotifications(prev => prev.map(mark));
      setBellNotifications(prev => prev.map(mark));
      setUnreadCount(prev => Math.max(0, prev - 1));
      previousNotifsRef.current = previousNotifsRef.current.map(mark);
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  }, [token]);

  const markAllAsRead = useCallback(async (notificationIds) => {
    if (!token || !notificationIds?.length) return;
    try {
      await fetch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds })
      });
      const markAll = n => ({ ...n, isRead: true });
      setPopupNotifications(prev => prev.map(markAll));
      setBellNotifications(prev => prev.map(markAll));
      setUnreadCount(0);
      previousNotifsRef.current = previousNotifsRef.current.map(markAll);
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  }, [token]);

  const removeBanner = (bannerId) => {
    setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId));
  };

  return (
    <NotificationContext.Provider value={{
      popupNotifications,
      bellNotifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      fetchNotifications
    }}>
      {children}
      
      {/* Global Notification Banners — slide in from the right, auto-dismiss */}
      {activeBanners.length > 0 && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none', alignItems: 'flex-end' }}>
          <style>{`
            @keyframes notif-slide-in {
              0%   { transform: translateX(120%); opacity: 0; }
              100% { transform: translateX(0);     opacity: 1; }
            }
            @keyframes notif-slide-out {
              from { transform: translateX(0);     opacity: 1; }
              to   { transform: translateX(120%);  opacity: 0; }
            }
          `}</style>
          {activeBanners.map(banner => {
            const style = BANNER_STYLES[banner.type] || BANNER_STYLES.info;
            const Icon = BANNER_ICONS[banner.type] || Bell;
            const link = bannerLinkFor(banner, user?.role);
            return (
              <div
                key={banner.bannerId}
                onClick={() => {
                  if (banner._id) markAsRead(banner._id);
                  if (link) navigate(link);
                  removeBanner(banner.bannerId);
                }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: '#ffffff',
                  boxShadow: '0 12px 32px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.08)',
                  color: '#0f172a',
                  minWidth: '340px',
                  maxWidth: '460px',
                  pointerEvents: 'auto',
                  cursor: link ? 'pointer' : 'default',
                  animation: 'notif-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
                  borderLeft: `4px solid ${style.accent}`,
                }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: style.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} style={{ color: style.iconColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: '1.3' }}>{banner.title || 'New Notification'}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{banner.message}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeBanner(banner.bannerId); }}
                  style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px 7px', borderRadius: '6px', flexShrink: 0, lineHeight: 1, marginTop: '2px' }}>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
