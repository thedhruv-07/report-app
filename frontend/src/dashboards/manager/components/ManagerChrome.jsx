import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import ToastList from '../../../components/shared/ToastList';

const getInitials = (name, role) => {
  if (name) {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  }
  const roleMap = { technical_manager: 'TM', manager: 'TM', admin: 'AD', inspector: 'IN' };
  return roleMap[role?.toLowerCase()] || 'U';
};

export default function ManagerChrome({
  currentUser,
  activeView,
  activeReportId,
  pendingCount,
  unreadCount,
  systemUnreadCount,
  notificationsPanelOpen,
  notifications,
  toasts,
  activeReport,
  overallRemarksInput,
  showFinalizeModal,
  showCorrectionModal,
  setActiveView,
  setActiveReportId,
  setNotificationsPanelOpen,
  handleLogout,
  handleMarkAsRead,
  handleOpenReport,
  handleMarkAllRead,
  dismissToast,
  setShowFinalizeModal,
  setShowCorrectionModal,
  confirmFinalizeReport,
  confirmRequestCorrection
}) {
  return (
    <>
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0">
        <div className="flex items-center gap-4">
          <img
            src="/company-logo.png"
            alt="Absolute Veritas"
            className="h-10 w-auto object-contain cursor-pointer"
            onClick={() => { setActiveView('dashboard'); setActiveReportId(null); }}
          />
          {activeReportId && (
            <button
              onClick={() => setActiveReportId(null)}
              className="ml-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors border-l pl-4 border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Queue</span>
            </button>
          )}
        </div>

        {!activeReportId && (
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => { setActiveView('dashboard'); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveView('queue'); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === 'queue' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Report Queue</span>
                {pendingCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeView === 'queue' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => { setActiveView('notifications'); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeView === 'notifications' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => { setActiveView('profile'); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                <span>Profile</span>
              </div>
            </button>
          </nav>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200"
          >
            <Bell className="w-5 h-5" />
            {systemUnreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold px-1">
                {systemUnreadCount > 9 ? "9+" : systemUnreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#6C47FF' }}>
              {getInitials(currentUser?.name, currentUser?.role)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-none">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Technical Manager</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-rose-500 hover:bg-rose-50 rounded-xl font-semibold text-sm transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className={`fixed top-0 bottom-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-55 flex flex-col transition-transform duration-300 ease-out transform ${
        notificationsPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-16 shrink-0 border-b border-slate-200 px-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <span>Inspection Alerts</span>
          </h3>
          <button
            onClick={() => setNotificationsPanelOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No alerts active today.</div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  handleMarkAsRead(notif.id);
                  handleOpenReport(notif.reportId);
                  setNotificationsPanelOpen(false);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 text-xs leading-normal hover:bg-slate-50 ${
                  notif.isRead ? 'bg-white border-slate-100 opacity-60' : 'bg-blue-50/20 border-blue-100 hover:border-blue-200 font-semibold'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-600'}`} />
                <div className="space-y-1">
                  <p className="text-slate-800">{notif.message}</p>
                  <span className="text-[10px] text-slate-400">{notif.timeAgo}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {unreadCount > 0 && (
          <div className="p-4 border-t border-slate-150 bg-slate-50 shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-100 hover:bg-blue-700 transition-all text-center"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {showFinalizeModal && activeReport && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFinalizeModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center mb-2">Finalize Audit Report?</h3>
            <p className="text-slate-500 text-center text-xs mb-6 leading-relaxed">
              Are you sure you want to finalize report <strong className="text-slate-800">{activeReport.id}</strong>? This action is permanent, locks parameters, and immediately notifies the Admin.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalizeReport}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
              >
                Yes, Finalize Report
              </button>
            </div>
          </div>
        </div>
      )}

      {showCorrectionModal && activeReport && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCorrectionModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="shrink-0 text-center mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-base font-black text-slate-800">
                Send Correction Cycle to {activeReport.inspectorName}?
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                They will receive a notification with the following section comments attached:
              </p>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl p-4.5 bg-slate-50/50 space-y-3 mb-6">
              {activeReport.correctionFeedback.length > 0 ? (
                activeReport.correctionFeedback.map(f => (
                  <div key={f.section} className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-normal">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 font-bold">
                      <span className="text-slate-800 capitalize">{f.section.replace('section', 'Section ')}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        f.priority === 'Critical' ? 'bg-rose-50 text-rose-600 font-extrabold' : 'bg-slate-100 text-slate-600'
                      }`}>{f.priority}</span>
                    </div>
                    <p className="text-slate-600 font-medium">{f.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center text-xs italic">No section-specific comments added.</p>
              )}

              {overallRemarksInput.trim() && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-normal">
                  <div className="border-b border-slate-100 pb-1.5 mb-1.5 font-bold text-slate-800">
                    Overall Remarks (Admin & Inspector visible)
                  </div>
                  <p className="text-slate-600 font-medium">{overallRemarksInput}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRequestCorrection}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-100 transition-all active:scale-[0.98]"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
