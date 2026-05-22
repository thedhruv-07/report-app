// frontend/src/pages/Notifications.jsx
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/timeAgo';
import { Bell, CheckCheck } from 'lucide-react';

const TYPE_CONFIG = {
  urgent:  { label: "URGENT",  bg: "bg-red-100",    text: "text-red-700" },
  warning: { label: "WARNING", bg: "bg-amber-100",  text: "text-amber-700" },
  info:    { label: "INFO",    bg: "bg-blue-100",   text: "text-blue-700" },
  success: { label: "SUCCESS", bg: "bg-emerald-100",text: "text-emerald-700" },
};

export default function Notifications() {
  const { bellNotifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const handleMarkAll = () => {
    const ids = bellNotifications.map(n => n._id);
    markAllAsRead(ids);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">All Notifications</h1>
            <p className="text-sm text-slate-500">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}

      {!loading && bellNotifications.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">You're all caught up</p>
          <p className="text-sm mt-1">No unread notifications</p>
        </div>
      )}

      <div className="space-y-2">
        {bellNotifications.map(notif => {
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
          return (
            <div
              key={notif._id}
              className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex gap-4 hover:border-slate-300 transition-colors"
            >
              <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 mt-0.5 ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{notif.title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">{timeAgo(notif.createdAt)}</p>
              </div>
              <button
                onClick={() => markAsRead(notif._id)}
                className="shrink-0 self-start text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors mt-1"
              >
                Dismiss
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
