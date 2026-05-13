import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock,
  LayoutDashboard,
  Users,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColors = {
  submitted: { bg: "bg-blue-50", text: "text-blue-700", icon: Clock, label: "Pending Review" },
  under_review: { bg: "bg-amber-50", text: "text-amber-700", icon: Search, label: "Under Review" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, label: "Approved" },
  rejected: { bg: "bg-rose-50", text: "text-rose-700", icon: XCircle, label: "Rejected" },
  revision_required: { bg: "bg-orange-50", text: "text-orange-700", icon: AlertCircle, label: "Revision Requested" },
  draft: { bg: "bg-slate-50", text: "text-slate-600", icon: FileText, label: "Draft" }
};

export default function OperationsDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]); // [{id, type}]
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch(ENDPOINTS.OPERATIONS.STATS, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      let url = `${ENDPOINTS.OPERATIONS.REPORTS}?limit=50`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const reportsRes = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Operations fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e, reportId, type) => {
    e.stopPropagation();
    setDeleteTarget({ id: reportId, type });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const isFA = deleteTarget.type === "Factory Audit";
      const rawBase = isFA ? ENDPOINTS.FACTORY_AUDIT.BASE : ENDPOINTS.REPORTS;
      const baseUrl = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
      
      const res = await fetch(`${baseUrl}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== deleteTarget.id));
        setSelectedReports(prev => prev.filter(r => r.id !== deleteTarget.id));
        setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSelectReport = (reportId, type) => {
    setSelectedReports(prev => {
      const isSelected = prev.find(r => r.id === reportId);
      if (isSelected) {
        return prev.filter(r => r.id !== reportId);
      } else {
        return [...prev, { id: reportId, type }];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(r => ({ id: r._id, type: r.type })));
    }
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const res = await fetch(ENDPOINTS.OPERATIONS.BULK_DELETE, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reportIds: selectedReports })
      });

      if (res.ok) {
        const deletedIds = selectedReports.map(r => r.id);
        setReports(prev => prev.filter(r => !deletedIds.includes(r._id)));
        setStats(prev => ({ 
          ...prev, 
          pending: Math.max(0, prev.pending - deletedIds.length) 
        }));
        setSelectedReports([]);
        setShowBulkDeleteModal(false);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.factoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Operations Workflow</h1>
          </div>
          <p className="text-slate-500 font-medium">Review and manage submitted inspection reports.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold">
            <Clock className="w-4 h-4" />
            <span>{stats.pending} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{stats.approved} Approved</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">
            <XCircle className="w-4 h-4" />
            <span>{stats.rejected} Rejected</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by ID, Client, or Factory..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all outline-none text-slate-700 font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-5 h-5 text-slate-500 ml-2 hidden md:block" />
          <select 
            className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none text-slate-700 font-bold shadow-sm cursor-pointer min-w-[200px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Pending Review</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revision_required">Revision Requested</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="pl-8 pr-4 py-5 w-10">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Report Detail</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Client & Factory</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inspector</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-8 py-6 h-20 bg-slate-50/30" />
                  </tr>
                ))
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const status = statusColors[report.status] || statusColors.draft;
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr 
                      key={report._id} 
                      className={`hover:bg-blue-50/30 transition-all duration-300 group ${selectedReports.find(r => r.id === report._id) ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="pl-8 pr-4 py-6">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={!!selectedReports.find(r => r.id === report._id)}
                            onChange={() => handleSelectReport(report._id, report.type)}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {report.reportNumber || "No Number"}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 mt-0.5">{report.type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-sm font-bold text-slate-700">{report.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-xs font-medium text-slate-500">{report.factoryName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Users className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{report.inspectorName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${status.bg} ${status.text} border border-current/10`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold whitespace-nowrap">{status.label}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right flex items-center justify-end gap-3">
                        <button 
                          onClick={() => navigate(`/operations/review/${report._id}?type=${encodeURIComponent(report.type)}`)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm"
                        >
                          Review
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        
                        {(user?.role === "admin" || user?.role === "operator") && (
                          <button 
                            onClick={(e) => handleDeleteClick(e, report._id, report.type)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">No reports found</p>
                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search term.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing {filteredReports.length} reports
          </p>
          <div className="flex items-center gap-2">
            <button disabled className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button disabled className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stylish Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          
          {/* Modal Content */}
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

      {/* Refined Bulk Action Bar */}
      {selectedReports.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] animate-in slide-in-from-bottom-10 fade-in duration-500 w-full max-w-2xl px-4">
          <div className="bg-white/80 backdrop-blur-xl border border-blue-100 shadow-[0_20px_50px_rgba(30,64,175,0.15)] px-6 py-4 rounded-[28px] flex items-center justify-between gap-6 overflow-hidden relative">
            {/* Subtle background glow */}
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <span className="text-sm font-black">{selectedReports.length}</span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 leading-none">Reports Selected</p>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Bulk Actions Available</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={() => setSelectedReports([])}
                className="px-5 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              {(user?.role === "admin" || user?.role === "operator") && (
                <button 
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-rose-200 flex items-center gap-2.5 active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !bulkDeleting && setShowBulkDeleteModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-8 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
              <div className="relative">
                <Trash2 className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                  {selectedReports.length}
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Multiple Reports?</h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              You are about to delete <span className="font-black text-rose-500">{selectedReports.length}</span> reports. This action is permanent and will remove all associated files and data.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : "Confirm Bulk Delete"}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm transition-all"
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
