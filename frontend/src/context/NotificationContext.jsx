// frontend/src/context/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { ENDPOINTS, API_BASE_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";
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
          const bannerId = Math.random().toString(36).substr(2, 9);
          setActiveBanners(prev => [...prev, { ...notif, bannerId }]);
          
          // Auto dismiss after 5 seconds
          setTimeout(() => {
            setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId));
          }, 5000);
        });
      } else {
        initialLoadDone.current = true;
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
      
      {/* Global Notification Banners */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {activeBanners.map(banner => (
            <motion.div
              key={banner.bannerId}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-white border border-indigo-100 shadow-xl rounded-2xl p-4 flex gap-3 items-start w-full relative overflow-hidden"
            >
              {/* Left Accent border */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
              
              <div className="shrink-0 mt-0.5 bg-indigo-50 p-2 rounded-full text-indigo-600">
                <Bell className="w-4 h-4" />
              </div>
              
              <div className="flex-1 pr-6">
                <p className="font-bold text-slate-800 text-sm">{banner.title || 'New Notification'}</p>
                <p className="text-sm text-slate-600 mt-0.5 leading-snug">{banner.message}</p>
              </div>
              
              <button 
                onClick={() => removeBanner(banner.bannerId)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
