import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, LogOut, ChevronDown, UserCircle } from "lucide-react";
import { services } from "../shared/services";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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

  return (
    <header className="sticky top-0 z-[1001] h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shadow-sm flex-shrink-0">
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
          onClick={() => navigate("/dashboard")}
          className={`text-sm font-semibold transition-colors ${location.pathname === "/dashboard" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
        >
          Dashboard
        </button>

        {(user.role === "admin" || user.role === "operator") && (
          <button 
            onClick={() => navigate("/operations")}
            className={`text-sm font-semibold transition-colors ${location.pathname.startsWith("/operations") ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Operations
          </button>
        )}

        {user.role !== "operator" && (
          <div className="relative group">
            <button className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${location.pathname.startsWith("/dashboard/") ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}>
              Reports
              <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1002]">
              {/* Invisible hover bridge */}
              <div className="absolute -top-4 left-0 w-full h-4" />
              <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 py-2">
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Inspection Services
                </div>
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => navigate(service.route)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${location.pathname === service.route ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <span className="truncate">{service.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {user.role === "admin" && (
          <button 
            onClick={() => navigate("/admin")}
            className={`text-sm font-semibold transition-colors ${location.pathname === "/admin" ? "text-purple-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Admin
          </button>
        )}
      </div>
      
      {/* Spacer for mobile */}
      <div className="flex-1 md:hidden" />
      {/* User dropdown */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-tight">{user.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{user.email}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 hidden md:block transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 py-1.5 z-50 transform origin-top-right transition-all duration-200 ease-out ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
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
      )}

      {/* Professional Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowLogoutModal(false)}
          />
          
          {/* Modal Content */}
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
