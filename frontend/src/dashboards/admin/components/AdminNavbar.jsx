import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { LayoutDashboard, ClipboardList, Users, Bell, Mail, LogOut, FileText } from 'lucide-react';

export default function AdminNavbar({ activeView, stats = { readyToDeliver: 0, pendingReports: 0 }, setActiveView }) {
  const { logout, user } = useAuth();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  const navItemClass = (isActive) =>
    `px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 ${
      isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`;

  // Helper to handle navigation whether we are inside AdminDashboard (using activeView state)
  // or on a dedicated route page (using URL).
  const handleNav = (viewName, path) => {
    if (setActiveView) {
      setActiveView(viewName);
      if (location.pathname !== '/dashboard/admin') {
        navigate('/dashboard/admin');
      }
    } else {
      navigate(path || '/dashboard/admin');
    }
  };

  const isInspectionNoticesActive = location.pathname.startsWith('/admin/inspection-notices') || activeView === 'inspection-notices';

  return (
    <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-4">
        <img 
          src="/company-logo.png" 
          alt="Absolute Veritas" 
          className="h-10 w-auto object-contain cursor-pointer"
          onClick={() => handleNav("dashboard", "/dashboard/admin")}
        />
        <span className="hidden sm:inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          Admin Console
        </span>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center gap-2">
        <button
          onClick={() => handleNav("dashboard", "/dashboard/admin")}
          className={navItemClass(activeView === "dashboard" && location.pathname === '/dashboard/admin')}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => handleNav("bookings", "/dashboard/admin")}
          className={navItemClass(activeView === "bookings" && location.pathname === '/dashboard/admin')}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>All Bookings</span>
          {stats.readyToDeliver > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              (activeView === "bookings" && location.pathname === '/dashboard/admin') ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white animate-pulse'
            }`}>
              {stats.readyToDeliver} Ready
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/admin/report-queue')}
          className={navItemClass(location.pathname.startsWith('/admin/report-queue'))}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Report Queue</span>
          {(stats.pendingReports || 0) > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              location.pathname.startsWith('/admin/report-queue') ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'
            }`}>
              {stats.pendingReports}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate("/admin/inspection-notices")}
          className={navItemClass(isInspectionNoticesActive)}
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>Inspection Notices</span>
        </button>

        <button
          onClick={() => handleNav("inspectors", "/dashboard/admin")}
          className={navItemClass(activeView === "inspectors" && location.pathname === '/dashboard/admin')}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Inspectors</span>
        </button>

        <button
          onClick={() => handleNav("notifications", "/dashboard/admin")}
          className={navItemClass(activeView === "notifications" && location.pathname === '/dashboard/admin')}
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span>Notifications</span>
          {notifUnreadCount > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              (activeView === "notifications" && location.pathname === '/dashboard/admin') ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'
            }`}>
              {notifUnreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleNav("emails", "/dashboard/admin")}
          className={navItemClass(activeView === "emails" && location.pathname === '/dashboard/admin')}
        >
          <Mail className="w-4 h-4 shrink-0" />
          <span>Email Logs</span>
        </button>
      </nav>

      {/* Right: User Info & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
            {user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "AD"}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-700 leading-none">{user?.name || "System Admin"}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Global Admin</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-rose-500 hover:bg-rose-50 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-4 h-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
