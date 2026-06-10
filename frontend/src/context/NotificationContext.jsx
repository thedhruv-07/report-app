// frontend/src/context/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { ENDPOINTS, API_BASE_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import { Bell, X } from "lucide-react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
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

  // Socket: join user room and refresh on new_notification event
  useEffect(() => {
    if (!user || !token) return;
    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('join', `user_${user.id || user._id}`);
    });
    socket.on('new_notification', () => {
      fetchNotifications();
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
      
      {/* Global Notification Banners — slide-down from top, auto-dismiss */}
      {activeBanners.length > 0 && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none', alignItems: 'center' }}>
          <style>{`
            @keyframes notif-drop-in {
              0%   { transform: translateY(-120%); opacity: 0; }
              60%  { transform: translateY(6px);   opacity: 1; }
              100% { transform: translateY(0);      opacity: 1; }
            }
            @keyframes notif-drop-out {
              from { transform: translateY(0);      opacity: 1; }
              to   { transform: translateY(-120%);  opacity: 0; }
            }
          `}</style>
          {activeBanners.map(banner => (
            <div key={banner.bannerId} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '14px 18px',
              borderRadius: '14px',
              background: '#1e1b4b',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 2px 10px rgba(99,102,241,0.25)',
              color: '#fff',
              minWidth: '320px',
              maxWidth: '460px',
              pointerEvents: 'auto',
              animation: 'notif-drop-in 0.45s cubic-bezier(0.22,1,0.36,1) both',
              borderBottom: '3px solid #6366f1',
            }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={16} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#e0e7ff', lineHeight: '1.3' }}>{banner.title || 'New Notification'}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#a5b4fc', lineHeight: '1.5' }}>{banner.message}</p>
              </div>
              <button onClick={() => removeBanner(banner.bannerId)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: '#a5b4fc', padding: '4px 7px', borderRadius: '6px', flexShrink: 0, lineHeight: 1, marginTop: '2px' }}>
                <X size={14} />
              </button>
            </div>
          ))}
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
