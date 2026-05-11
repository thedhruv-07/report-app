import { services } from "../shared/services";
import ServiceCard from "../components/ServiceCard";
import { FileText, Activity, CheckCircle, FilePlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../config/api";

const colorMap = {
  blue: { bg: "bg-blue-50/50", text: "text-blue-600", icon: "text-blue-500", border: "border-blue-100" },
  amber: { bg: "bg-amber-50/50", text: "text-amber-600", icon: "text-amber-500", border: "border-amber-100" },
  emerald: { bg: "bg-emerald-50/50", text: "text-emerald-600", icon: "text-emerald-500", border: "border-emerald-100" },
};

export default function Dashboard() {
  // Simulating fetched data. Since this is an empty state, we start with null/empty.
  const [reportData, setReportData] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await fetch(ENDPOINTS.STATS, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setReportData(stats);
        }

        const reportsRes = await fetch(ENDPOINTS.REPORTS, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setRecentReports(data.reports.slice(0, 5));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

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
          Overview
        </h1>
        <p className="mt-2 text-base text-slate-500 font-medium">
          Monitor your inspection metrics and start new reports.
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

      {/* Service Cards */}
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

      {/* Recent Reports Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Recent Reports
          </h2>
        </div>

        {recentReports.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Real reports would map here. For now, it's just the empty state. */}
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

    </div>
  );
}
