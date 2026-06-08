import { useState, useRef, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, LogOut, ChevronDown, UserCircle, Bell, Check } from "lucide-react";
import { services, clearFormStorage } from '../../shared/services';
import { ENDPOINTS } from '../../config/api';
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/timeAgo';

export default function Navbar() {
  const { user, logout, onboardingCompleted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const { bellNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAllRead = () => {
    const ids = bellNotifications.map(n => n._id);
    markAllAsRead(ids);
  };

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  // Hide the global shared Navbar when on the Manager or Admin Dashboard to allow its fully integrated premium top navbar to display exclusively.
  if (location.pathname.startsWith("/dashboard/manager") || location.pathname.startsWith("/dashboard/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-1001 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shadow-sm shrink-0">
      {/* Logo */}
      <div className="flex items-center cursor-pointer" onClick={() => navigate("/dashboard")}>
        <img 
          src="/company-logo.png" 
          alt="Absolute Veritas" 
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Center Navigation */}
      <div className="flex-1 flex justify-center items-center gap-6">
        <button 
          onClick={() => {
            if (user?.role === 'admin') navigate("/dashboard/admin");
            else if (user?.role === 'manager') navigate("/dashboard/manager");
            else navigate("/dashboard");
          }}
          className={`text-sm font-semibold transition-colors ${location.pathname === "/dashboard" || location.pathname === "/dashboard/manager" || location.pathname === "/dashboard/admin" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
        >
          Dashboard
        </button>

        {/* Show Inspector Links only if NOT on manager dashboard and user is NOT a manager, and inspector has completed onboarding */}
        {!((user?.role === 'manager' || user?.role === 'admin') || location.pathname.startsWith("/dashboard/manager")) &&
          !(user?.role === 'inspector' && !onboardingCompleted) && (
          <div className="relative group">
            <button className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${location.pathname.startsWith("/dashboard/") ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
              Reports
              <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-1002">
              <div className="absolute -top-4 left-0 w-full h-4" />
              <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 py-2">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Inspection Services
                </div>
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => { clearFormStorage(service.route); navigate(service.route); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${location.pathname === service.route ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <span className="truncate">{service.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show Manager Links if on manager dashboard or user is a manager */}
        {((user?.role === 'manager' || user?.role === 'admin') || location.pathname.startsWith("/dashboard/manager")) && (
          <button 
            onClick={() => navigate("/dashboard/manager")}
            className={`text-sm font-semibold transition-colors ${location.pathname === "/dashboard/manager" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Review Queue
          </button>
        )}
      </div>
      
      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden" />
      
      {/* Right Side: Notifications & User */}
      {user && (
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            
            <div className={`absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 py-2 z-50 transform origin-top-right transition-all duration-200 ease-out ${notificationsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {bellNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">No notifications</div>
                ) : (
                  bellNotifications.map(n => (
                    <div key={n._id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'urgent' ? 'bg-red-100 text-red-600' :
                        n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                        n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 font-bold truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button onClick={() => markAsRead(n._id)} className="shrink-0 self-center p-1 text-slate-300 hover:text-blue-600 transition-colors" title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <button
                  onClick={() => { navigate('/notifications'); setNotificationsOpen(false); }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 w-full text-center"
                >
                  View all notifications
                </button>
              </div>
            </div>
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{user.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 hidden md:block transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <div className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 py-1.5 z-1003 transform origin-top-right transition-all duration-200 ease-out ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              
              <div className="h-px bg-slate-100 my-1 mx-2" />
              
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/settings");
                }}
                className="w-[calc(100%-16px)] mx-auto flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                My Profile
              </button>
              

              <button
                onClick={handleLogoutClick}
                className="w-[calc(100%-16px)] mx-auto flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-8 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
              Ready to leave?
            </h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              Are you sure you want to log out? You will need to sign in again to access your reports.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmLogout}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
              >
                Log Out
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
