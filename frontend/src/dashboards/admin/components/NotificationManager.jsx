import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useNotifications } from '../../../context/NotificationContext';
import { timeAgo } from '../../../utils/timeAgo';

export default function NotificationManager() {
  const { bellNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Notifications
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Your recent alerts and updates</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead(bellNotifications.map(n => n._id))}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {bellNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-semibold">No notifications yet</p>
            <p className="text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bellNotifications.map(notif => (
              <div 
                key={notif._id} 
                className={`p-5 flex gap-4 transition-colors ${
                  notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50/80'
                }`}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
              >
                <div className="shrink-0 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${notif.isRead ? 'bg-slate-300' : 'bg-indigo-500 shadow-sm'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                        {notif.title || 'Notification'}
                      </h4>
                      <p className={`text-sm mt-1 ${notif.isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap shrink-0">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
