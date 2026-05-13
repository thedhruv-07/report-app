import { services } from "../shared/services";
import ServiceCard from "../components/ServiceCard";
import { FileText, Activity, CheckCircle, FilePlus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../config/api";

const colorMap = {
  blue: { bg: "bg-blue-50/50", text: "text-blue-600", icon: "text-blue-500", border: "border-blue-100" },
  amber: { bg: "bg-amber-50/50", text: "text-amber-600", icon: "text-amber-500", border: "border-amber-100" },
  emerald: { bg: "bg-emerald-50/50", text: "text-emerald-600", icon: "text-emerald-500", border: "border-emerald-100" },
};

export default function Dashboard() {
  const [reportData, setReportData] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const { token, user } = useAuth();
  const isOperator = user?.role === "operator";
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const isAdmin = user?.role === "admin";
        
        if (isAdmin) {
          // Fetch global system stats for admins
          const adminStatsRes = await fetch(ENDPOINTS.ADMIN.STATS, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (adminStatsRes.ok) {
            const stats = await adminStatsRes.json();
            setReportData({
              total: stats.reports.total,
              active: stats.users.inspectors, // Show count of inspectors as 'Active' context
              completed: stats.reports.standard + stats.reports.audits
            });
          }
        } else if (!isOperator) {
          // Fetch standard stats for inspectors
          const statsRes = await fetch(ENDPOINTS.STATS, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (statsRes.ok) {
            const stats = await statsRes.json();
            setReportData(stats);
          }
        } else {
          // Fetch operations-specific stats for operators
          const opStatsRes = await fetch(ENDPOINTS.OPERATIONS.STATS, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (opStatsRes.ok) {
            const stats = await opStatsRes.json();
            setReportData({
              total: stats.pending + stats.approved + stats.rejected,
              active: stats.pending,
              completed: stats.approved
            });
          }
        }

        const reportsRes = await fetch(ENDPOINTS.REPORTS, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setRecentReports(data.reports.slice(0, 10));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token, isOperator]);

  const handleDeleteClick = (e, reportId) => {
    e.stopPropagation();
    setDeleteTarget(reportId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const baseUrl = ENDPOINTS.REPORTS.endsWith('/') 
        ? ENDPOINTS.REPORTS.slice(0, -1) 
        : ENDPOINTS.REPORTS;

      const res = await fetch(`${baseUrl}/${deleteTarget}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRecentReports(prev => prev.filter(r => r._id !== deleteTarget));
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const stats = [
    { label: "Total Reports", value: reportData ? reportData.total : "—", icon: FileText, color: "blue" },
    { label: "Active Inspections", value: reportData ? reportData.active : "—", icon: Activity, color: "amber" },
    { label: "Completed Reports", value: reportData ? reportData.completed : "—", icon: CheckCircle, color: "emerald" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isOperator ? "Operations Overview" : "Inspector Overview"}
        </h1>
        <p className="mt-2 text-base text-slate-500 font-medium">
          {isOperator 
            ? "Track global report statuses and pending reviews." 
            : "Monitor your inspection metrics and start new reports."}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const c = colorMap[stat.color];
          return (
            <div key={stat.label} className={`flex items-center justify-between bg-white rounded-2xl border ${c.border} p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
                <h2 className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </h2>
              </div>
              <div className={`w-14 h-14 rounded-xl ${c.bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${c.icon}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Cards - Hidden for Operators */}
      {!isOperator && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Inspection Services
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a service to create a new report.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Reports Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Recent Reports
          </h2>
        </div>

        {recentReports.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Report Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{report.generalInfo?.client || "No Client"}</span>
                        <span className="text-[11px] text-slate-400">ID: {report._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{report.generalInfo?.productName || "General Report"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.operationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                        report.operationStatus === 'rejected' ? 'bg-rose-50 text-rose-600' :
                        report.operationStatus === 'revision_required' ? 'bg-orange-50 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {report.operationStatus || 'submitted'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={(e) => handleDeleteClick(e, report._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-2xl py-16 px-6 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FilePlus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No reports yet
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              You haven't created any inspection reports yet. Select a service above to get started.
            </p>
          </div>
        )}
      </div>

      {/* Stylish Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-8 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
              Delete this report?
            </h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              This action is permanent and cannot be undone. The report and all associated data will be removed.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Report"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
