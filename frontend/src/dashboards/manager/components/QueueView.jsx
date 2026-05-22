import React from 'react';
import { Filter, Calendar, RefreshCw, Info } from 'lucide-react';

function QueueView({ queueFilters, setQueueFilters, uniqueInspectors, filteredReports, handleOpenReport, getTypeBadgeClass, getStatusBadgeClass }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Queue Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inspection Type</label>
            <select
              value={queueFilters.type}
              onChange={(e) => setQueueFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Types</option>
              <option value="PSI">PSI (Pre-Shipment)</option>
              <option value="CLS">CLS (Container Loading)</option>
              <option value="DPI">DPI (During Production)</option>
              <option value="Factory Audit">Factory Audit</option>
              <option value="Social Audit">Social Audit</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Review Status</label>
            <select
              value={queueFilters.status}
              onChange={(e) => setQueueFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Correction Requested (Round 1)">Correction Requested (Round 1)</option>
              <option value="Correction Requested (Round 2)">Correction Requested (Round 2)</option>
              <option value="Finalized">Finalized</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inspector</label>
            <select
              value={queueFilters.inspector}
              onChange={(e) => setQueueFilters((prev) => ({ ...prev, inspector: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Inspectors</option>
              {uniqueInspectors.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted From</span>
            </label>
            <input
              type="date"
              value={queueFilters.fromDate}
              onChange={(e) => setQueueFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Submitted To</span>
            </label>
            <input
              type="date"
              value={queueFilters.toDate}
              onChange={(e) => setQueueFilters((prev) => ({ ...prev, toDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={() => setQueueFilters({ type: 'All', status: 'All', inspector: 'All', fromDate: '', toDate: '' })}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          {filteredReports.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto border border-slate-100">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No reports found matching filters</h4>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">Try resetting or modifying your selected inspector, type, or date range.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Inspection Type</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-center">Revision Round</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredReports.map((report) => (
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
                    <td className="py-3.5 px-4 text-center">
                      {report.revisionRound === 0 ? (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">Initial</span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">Round {report.revisionRound}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {report.status === 'Finalized' ? (
                        <button
                          onClick={() => handleOpenReport(report.id)}
                          className="px-4.5 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200"
                        >
                          View
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenReport(report.id)}
                          className="px-4.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100"
                        >
                          Open Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(QueueView);
