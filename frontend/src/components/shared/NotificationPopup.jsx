// frontend/src/components/shared/NotificationPopup.jsx
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { timeAgo } from "../../utils/timeAgo";

const TYPE_CONFIG = {
  urgent:  { label: "URGENT",  bg: "bg-red-100",    text: "text-red-700",    border: "border-l-red-500" },
  warning: { label: "WARNING", bg: "bg-amber-100",  text: "text-amber-700",  border: "border-l-amber-500" },
  info:    { label: "INFO",    bg: "bg-blue-100",   text: "text-blue-700",   border: "border-l-blue-500" },
  success: { label: "SUCCESS", bg: "bg-emerald-100",text: "text-emerald-700",border: "border-l-emerald-500" },
};

const PRIORITY_BORDER = {
  1: "border-l-red-500",
  2: "border-l-amber-500",
  3: "border-l-blue-500",
};

export default function NotificationPopup() {
  const { popupNotifications, markAllAsRead } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [markOnClose, setMarkOnClose] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("notif_popup_shown");
    if (!alreadyShown && popupNotifications.length > 0) {
      setVisible(true);
      // Slight delay so the animation plays after mount
      requestAnimationFrame(() => setTimeout(() => setEntered(true), 50));
    }
  }, [popupNotifications]);

  if (!visible) return null;

  const topPriority = Math.min(...popupNotifications.map(n => n.priority ?? 3));
  const cardBorderClass = PRIORITY_BORDER[topPriority] || PRIORITY_BORDER[3];

  const handleClose = async () => {
    if (markOnClose) {
      const ids = popupNotifications.map(n => n._id);
      await markAllAsRead(ids);
    }
    sessionStorage.setItem("notif_popup_shown", "true");
    setEntered(false);
    setTimeout(() => setVisible(false), 300);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay — not dismissible */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Card */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] border-l-4 ${cardBorderClass}
          transform transition-all duration-300 ease-out
          ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  You have {popupNotifications.length} new notification{popupNotifications.length !== 1 ? "s" : ""}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Please review before continuing to your dashboard
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-4 mt-1"
            >
              Dismiss All
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto max-h-[360px] px-6 py-3 space-y-1">
          {popupNotifications.map((notif, idx) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
            return (
              <div
                key={notif._id}
                className="py-3 border-l-2 border-l-blue-200 pl-3"
                style={{ borderBottom: idx < popupNotifications.length - 1 ? "1px solid #f1f5f9" : "none" }}
              >
                <div className="flex items-start gap-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 mt-0.5 ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{notif.title}</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markOnClose}
              onChange={(e) => setMarkOnClose(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-slate-500">Mark all as read when I close this</span>
          </label>
          <button
            onClick={handleClose}
            className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
          >
            Got it, continue to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
