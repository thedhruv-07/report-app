import { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  Send,
  CheckCircle,
  Calendar,
  MapPin,
  Building,
  AlertCircle,
  FileText,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronDown
} from "lucide-react";

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    submittedReports: 0,
    reviewFinalized: 0
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [acceptingTaskId, setAcceptingTaskId] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch Summary
        const summaryRes = await fetch(ENDPOINTS.INSPECTOR.SUMMARY, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data);
        }

        // Fetch Tasks
        const tasksRes = await fetch(ENDPOINTS.INSPECTOR.TASKS, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleAcceptTask = async (taskId) => {
    try {
      setAcceptingTaskId(taskId);
      const res = await fetch(ENDPOINTS.INSPECTOR.ACCEPT_TASK(taskId), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
        setSelectedTask(data.task);
        // Update summary counts locally
        setSummary(prev => ({
          ...prev,
          pendingTasks: prev.pendingTasks - 1 // It's still in "Accepted" which might be counted as pending in our DB logic, but let's re-fetch or assume it's fine.
        }));
      }
    } catch (error) {
      console.error("Accept task error:", error);
    } finally {
      setAcceptingTaskId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Pending Acceptance': 'bg-slate-100 text-slate-700 border-slate-200',
      'Accepted': 'bg-amber-100 text-amber-700 border-amber-200',
      'Report Submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'Under Review': 'bg-orange-100 text-orange-700 border-orange-200',
      'Correction Requested': 'bg-red-100 text-red-700 border-red-200',
      'Finalized': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getInspectionRoute = (type) => {
    const map = {
      'PSI': '/dashboard/pre-shipment',
      'CLS': '/dashboard/container-loading',
      'Factory Audit': '/dashboard/factory-audit',
      'DPI': '/dashboard/during-production',
      'Social Audit': '/dashboard/social-audit'
    };
    return map[type] || '/dashboard/pre-shipment';
  };

  const handleStartReport = (task) => {
    const route = getInspectionRoute(task.inspectionType);
    // Ideally we would pass task data as state so the form can pre-populate
    navigate(route, { state: { task } });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.factoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.factoryAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status mapping for filter
    let matchesStatus = true;
    if (statusFilter !== "All") {
      if (statusFilter === "Awaiting Report") {
        matchesStatus = task.status === "Accepted";
      } else {
        matchesStatus = task.status === statusFilter;
      }
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'Inspector'}
        </h1>
        <p className="mt-2 text-base text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Total Assigned</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.totalTasks}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Pending Actions</h3>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.pendingTasks}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Submitted</h3>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.submittedReports}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">Review / Finalized</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.reviewFinalized}</p>
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Assigned Inspection Tasks
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search client or location..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select 
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending Acceptance">Pending Acceptance</option>
                <option value="Awaiting Report">Awaiting Report</option>
                <option value="Report Submitted">Report Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Correction Requested">Correction Requested</option>
                <option value="Finalized">Finalized</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <div 
                key={task._id} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                      {task.inspectionType}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(task.status)}`}>
                      {task.status === "Accepted" ? "Awaiting Report" : task.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {task.clientName}
                  </h3>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{task.factoryName}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{task.factoryAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{new Date(task.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">ID: {task._id.slice(-6).toUpperCase()}</span>
                  <button 
                    onClick={() => setSelectedTask(task)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {task.status === "Pending Acceptance" ? "Review & Accept" : 
                     task.status === "Accepted" ? "Start Report" : "View Details"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 px-6 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              There are no assigned inspection tasks matching your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTask(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Task Details</h3>
                  <p className="text-xs text-slate-500 font-medium">Ref: {selectedTask._id.toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusBadge(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold uppercase tracking-wide">
                  {selectedTask.inspectionType}
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
                    <p className="text-base font-semibold text-slate-900">{selectedTask.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled Date</p>
                    <p className="text-base font-semibold text-slate-900">
                      {new Date(selectedTask.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Factory Info</p>
                    <p className="text-base font-semibold text-slate-900">{selectedTask.factoryName}</p>
                    <p className="text-sm text-slate-600 mt-1">{selectedTask.factoryAddress}</p>
                  </div>
                </div>

                {selectedTask.adminInstructions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-bold text-amber-800">Admin Instructions</p>
                    </div>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      {selectedTask.adminInstructions}
                    </p>
                  </div>
                )}

                {selectedTask.status === "Correction Requested" && selectedTask.correctionFeedback && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm font-bold text-red-800">Correction Requested by TM</p>
                    </div>
                    <p className="text-sm text-red-700 leading-relaxed">
                      {selectedTask.correctionFeedback}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              {selectedTask.status === "Pending Acceptance" && (
                <>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => handleAcceptTask(selectedTask._id)}
                    disabled={acceptingTaskId === selectedTask._id}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#0052CC] hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {acceptingTaskId === selectedTask._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Accept Inspection
                  </button>
                </>
              )}

              {selectedTask.status === "Accepted" && (
                <>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => handleStartReport(selectedTask)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#36C5F0] hover:bg-sky-500 rounded-xl shadow-lg shadow-sky-200 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Start Report
                  </button>
                </>
              )}

              {(selectedTask.status === "Report Submitted" || selectedTask.status === "Under Review") && (
                <>
                  <div className="flex-1 text-sm text-slate-500 flex items-center">
                    Report submitted. Awaiting Technical Manager review.
                  </div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </>
              )}

              {selectedTask.status === "Correction Requested" && (
                <>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => handleStartReport(selectedTask)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#AE2A19] hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                  >
                    Edit Report
                  </button>
                </>
              )}

              {selectedTask.status === "Finalized" && (
                <>
                  <div className="flex-1 text-sm text-emerald-600 flex items-center font-medium gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Report approved and finalized.
                  </div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
