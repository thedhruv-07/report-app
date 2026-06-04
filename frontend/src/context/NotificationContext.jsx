// frontend/src/context/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENDPOINTS } from "../config/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [popupNotifications, setPopupNotifications] = useState([]);
  const [bellNotifications, setBellNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setPopupNotifications(notifs);
      setBellNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // Fetch on login
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      setPopupNotifications([]);
      setBellNotifications([]);
      setUnreadCount(0);
    }
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
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  }, [token]);

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
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
