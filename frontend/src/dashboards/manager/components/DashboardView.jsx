import React from 'react';
import {
  TrendingUp,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

function DashboardView({ pendingCount, animatedStats, reports, setActiveView, handleOpenReport, getTypeBadgeClass, getStatusBadgeClass, userName }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back, {userName || 'Manager'} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ensure highest compliance. You have {pendingCount} new inspection reports awaiting review today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Received</p>
            <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.total}</h3>
            <p className="text-[11px] text-blue-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Updated live</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Review</p>
            <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.pending}</h3>
            <p className="text-[11px] text-orange-500 font-semibold">Active queue</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sent for Correction</p>
            <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.correction}</h3>
            <p className="text-[11px] text-amber-500 font-semibold">Pending correction</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Finalized Reports</p>
            <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.finalized}</h3>
            <p className="text-[11px] text-emerald-500 font-semibold">Quality stamp approved</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent Submissions</h3>
            <p className="text-slate-400 text-xs mt-0.5">Quickly access the newest inspector reports.</p>
          </div>
          <button
            onClick={() => setActiveView('queue')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View all queue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Inspection Type</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
              {[...reports]
                .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
                .slice(0, 5)
                .map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-900 font-extrabold">{report.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{report.clientName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getTypeBadgeClass(report.inspectionType)}`}>
                        {report.inspectionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{report.inspectorName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{report.submissionDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenReport(report.id)}
                        className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardView);
