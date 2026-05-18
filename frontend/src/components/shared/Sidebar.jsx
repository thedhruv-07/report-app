import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { services } from '../../shared/services';
import { LayoutDashboard, ClipboardCheck, Package, X, ChevronDown, FileStack } from "lucide-react";

const iconMap = {
  psi: ClipboardCheck,
  cls: Package,
};

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(true);

  // Auto-expand reports if we are on a report route
  useEffect(() => {
    if (location.pathname.startsWith("/dashboard/")) {
      setReportsOpen(true);
    }
  }, [location.pathname]);

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200
        flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Mobile close */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-100">
          <span className="text-sm font-bold text-slate-700">Navigation</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {/* Dashboard Item */}
          <button
            onClick={() => handleNav("/dashboard")}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${location.pathname === "/dashboard"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${location.pathname === "/dashboard" ? "text-blue-600" : "text-slate-400"}`} />
            <span>Dashboard</span>
          </button>

          {/* Collapsible Reports Group */}
          <div className="pt-4 pb-2">
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileStack className="w-3.5 h-3.5" />
                <span>Inspection Reports</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${reportsOpen ? "" : "-rotate-90"}`} />
            </button>

            {reportsOpen && (
              <div className="mt-1.5 space-y-1 ml-1 pl-2 border-l-2 border-slate-50">
                {services.map(service => {
                  const Icon = iconMap[service.id] || ClipboardCheck;
                  const isActive = location.pathname === service.route;
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleNav(service.route)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="truncate">{service.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Absolute Veritas v2.0
          </div>
        </div>
      </aside>
    </>
  );
}
