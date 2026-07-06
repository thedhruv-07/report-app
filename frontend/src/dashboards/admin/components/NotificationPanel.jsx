import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { timeAgo } from '../../../utils/timeAgo';
import { useNotifications } from '../../../context/NotificationContext';

export default function NotificationPanel({
  notificationsPanelOpen,
  setNotificationsPanelOpen,
  notifications,
  unreadCount,
  handleMarkAllRead
}) {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  const handleNotificationClick = (notif) => {
    markAsRead(notif._id);
    setNotificationsPanelOpen(false);
    if (notif.relatedReportId) {
      navigate('/admin/report-queue');
    } else if (notif.relatedBookingId || notif.relatedTaskId) {
      navigate('/dashboard/admin');
    }
  };
  return (
    <>
      {/* Sliding Alerts Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl transition-transform duration-300 transform ${
        notificationsPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-16 shrink-0 border-b border-slate-200 px-5 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Notifications
          </h3>
          <button 
            onClick={() => setNotificationsPanelOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {notifications.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No notifications</p>
          ) : (
            notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl border text-sm leading-relaxed transition-all cursor-pointer hover:border-indigo-200 ${
                  notif.isRead ? 'bg-white border-slate-200 opacity-60' : 'bg-indigo-50/50 border-indigo-100 font-medium shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.isRead ? 'bg-slate-300' : 'bg-indigo-500'}`}></span>
                  <div>
                    <p className="text-slate-800">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {unreadCount > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            <button 
              onClick={handleMarkAllRead}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
      
      {/* Panel Backdrop */}
      {notificationsPanelOpen && (
        <div 
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity"
          onClick={() => setNotificationsPanelOpen(false)}
        />
      )}
    </>
  );
}
