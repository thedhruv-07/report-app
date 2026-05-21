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
  X,
  ChevronRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const STATUS_FILTERS = [
  { label: "All",                  value: "All" },
  { label: "Pending Acceptance",   value: "Pending Acceptance" },
  { label: "Awaiting Report",      value: "Awaiting Report" },
  { label: "Report Submitted",     value: "Report Submitted" },
  { label: "Under Review",         value: "Under Review" },
  { label: "Correction Requested", value: "Correction Requested" },
  { label: "Finalized",            value: "Finalized" },
];

const STAT_CARDS = (summary) => [
  { label: "Total Assigned",    value: summary.totalTasks,       icon: ClipboardList, color: "text-blue-600",    bg: "bg-blue-50",    accent: "border-t-blue-500" },
  { label: "Pending Actions",   value: summary.pendingTasks,     icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50",   accent: "border-t-amber-500",   highlight: summary.pendingTasks > 0 },
  { label: "Reports Submitted", value: summary.submittedReports, icon: Send,          color: "text-indigo-600",  bg: "bg-indigo-50",  accent: "border-t-indigo-500" },
  { label: "Review / Finalized",value: summary.reviewFinalized,  icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50", accent: "border-t-emerald-500" },
];

const STATUS_CONFIG = {
  'Pending Acceptance':   { badge: 'bg-slate-100 text-slate-700 border-slate-200',   bar: 'bg-slate-400' },
  'Accepted':             { badge: 'bg-amber-100 text-amber-700 border-amber-200',    bar: 'bg-amber-400' },
  'Report Submitted':     { badge: 'bg-blue-100 text-blue-700 border-blue-200',       bar: 'bg-blue-500'  },
  'Under Review':         { badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'bg-orange-400' },
  'Correction Requested': { badge: 'bg-red-100 text-red-700 border-red-200',          bar: 'bg-red-500'   },
  'Finalized':            { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG['Pending Acceptance'];
const getDisplayStatus = (status) => status === "Accepted" ? "Awaiting Report" : status;

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ totalTasks: 0, pendingTasks: 0, submittedReports: 0, reviewFinalized: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedTask, setSelectedTask] = useState(null);
  const [acceptingTaskId, setAcceptingTaskId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, tasksRes] = await Promise.all([
        fetch(ENDPOINTS.INSPECTOR.SUMMARY, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(ENDPOINTS.INSPECTOR.TASKS,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (tasksRes.ok)   setTasks((await tasksRes.json()).tasks);
    } catch {
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token]);

  const handleAcceptTask = async (taskId) => {
    try {
      setAcceptingTaskId(taskId);
      const res = await fetch(ENDPOINTS.INSPECTOR.ACCEPT_TASK(taskId), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => prev.map(t => t._id === taskId ? data.task : t));
        setSelectedTask(data.task);
        setSummary(prev => ({ ...prev, pendingTasks: Math.max(0, prev.pendingTasks - 1) }));
      }
    } catch (err) {
      console.error("Accept task error:", err);
    } finally {
      setAcceptingTaskId(null);
    }
  };

  const getInspectionRoute = (type) => ({
    'PSI': '/dashboard/pre-shipment',
    'CLS': '/dashboard/container-loading',
    'Factory Audit': '/dashboard/factory-audit',
    'DPI': '/dashboard/during-production',
    'Social Audit': '/dashboard/social-audit',
  })[type] || '/dashboard/pre-shipment';

  const handleStartReport = (task) => navigate(getInspectionRoute(task.inspectionType), { state: { task } });

  const filteredTasks = tasks.filter(task => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      task.clientName.toLowerCase().includes(q) ||
      task.factoryName.toLowerCase().includes(q) ||
      task.factoryAddress.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" ||
      (statusFilter === "Awaiting Report" ? task.status === "Accepted" : task.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const filterCount = (filterValue) => filterValue === "All"
    ? tasks.length
    : tasks.filter(t => filterValue === "Awaiting Report" ? t.status === "Accepted" : t.status === filterValue).length;

  const firstName = user?.name?.split(' ')[0] || 'Inspector';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full">

      {/* ── Header: welcome + stat cards ── */}
      <div className="bg-white border-b border-slate-200 px-8 pt-6 pb-5 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{today}</p>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, <span className="text-blue-600">{firstName}</span>
            </h1>
            {summary.pendingTasks > 0 ? (
              <p className="text-sm text-amber-600 font-medium mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {summary.pendingTasks} pending action{summary.pendingTasks !== 1 ? 's' : ''} require your attention
              </p>
            ) : (
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                All caught up — no pending actions
              </p>
            )}
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS(summary).map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`bg-white rounded-xl border ${card.highlight ? 'border-amber-200' : 'border-slate-200'} border-t-4 ${card.accent} p-4 shadow-sm`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${card.highlight ? 'text-amber-600' : 'text-slate-900'}`}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-auto px-8 py-5 space-y-4 bg-slate-50">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-800">Inspection Tasks</h2>
            {!loading && (
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {filteredTasks.length}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client, factory or location…"
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm w-72 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status pill filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => {
            const count = filterCount(f.value);
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs font-bold ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Task grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-1 bg-slate-100" />
                <div className="p-5 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 bg-slate-100 rounded-lg w-12" />
                    <div className="h-5 bg-slate-100 rounded-lg w-24" />
                  </div>
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-5/6" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between">
                  <div className="h-4 bg-slate-100 rounded w-12" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTasks.map(task => {
              const config = getStatusConfig(task.status);
              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group cursor-pointer"
                >
                  {/* Status color bar */}
                  <div className={`h-1 w-full ${config.bar}`} />

                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                        {task.inspectionType}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${config.badge}`}>
                        {getDisplayStatus(task.status)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {task.clientName}
                    </h3>

                    <div className="space-y-2 mt-3">
                      <div className="flex items-start gap-2 text-sm text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 leading-tight">{task.factoryName}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 leading-tight">{task.factoryAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono font-semibold">
                      #{task._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-blue-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all duration-150">
                      {task.status === "Pending Acceptance" ? "Review & Accept" :
                       task.status === "Accepted"           ? "Start Report"    : "View Details"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-20 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No tasks found</h3>
            <p className="text-sm text-slate-500 mb-4">
              {searchTerm || statusFilter !== "All"
                ? "No tasks match your current search or filter."
                : "You have no assigned inspection tasks yet."}
            </p>
            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Task Details Modal ── */}
      {selectedTask && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${getStatusConfig(selectedTask.status).badge.split(' ').find(c => c.startsWith('bg-'))} flex items-center justify-center`}>
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Task Details</h3>
                  <p className="text-xs text-slate-400 font-mono">#{selectedTask._id.slice(-6).toUpperCase()}</p>
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
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${getStatusConfig(selectedTask.status).badge}`}>
                  {getDisplayStatus(selectedTask.status)}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold uppercase tracking-wide">
                  {selectedTask.inspectionType}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
                  <p className="text-base font-semibold text-slate-900">{selectedTask.clientName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled Date</p>
                  <p className="text-base font-semibold text-slate-900">
                    {new Date(selectedTask.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Factory</p>
                  <p className="text-base font-semibold text-slate-900">{selectedTask.factoryName}</p>
                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {selectedTask.factoryAddress}
                  </p>
                </div>
              </div>

              {selectedTask.adminInstructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-bold text-amber-800">Admin Instructions</p>
                  </div>
                  <p className="text-sm text-amber-700 leading-relaxed">{selectedTask.adminInstructions}</p>
                </div>
              )}

              {selectedTask.status === "Correction Requested" && selectedTask.correctionFeedback && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-bold text-red-800">Correction Requested by TM</p>
                  </div>
                  <p className="text-sm text-red-700 leading-relaxed">{selectedTask.correctionFeedback}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
              {selectedTask.status === "Pending Acceptance" && (
                <>
                  <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Close
                  </button>
                  <button
                    onClick={() => handleAcceptTask(selectedTask._id)}
                    disabled={acceptingTaskId === selectedTask._id}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all disabled:opacity-70 flex items-center gap-2"
                  >
                    {acceptingTaskId === selectedTask._id
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle className="w-4 h-4" />}
                    Accept Inspection
                  </button>
                </>
              )}

              {selectedTask.status === "Accepted" && (
                <>
                  <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Close
                  </button>
                  <button
                    onClick={() => handleStartReport(selectedTask)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Start Report
                  </button>
                </>
              )}

              {(selectedTask.status === "Report Submitted" || selectedTask.status === "Under Review") && (
                <>
                  <p className="flex-1 text-sm text-slate-500 flex items-center">
                    Report submitted. Awaiting Technical Manager review.
                  </p>
                  <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Close
                  </button>
                </>
              )}

              {selectedTask.status === "Correction Requested" && (
                <>
                  <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Close
                  </button>
                  <button
                    onClick={() => handleStartReport(selectedTask)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Report
                  </button>
                </>
              )}

              {selectedTask.status === "Finalized" && (
                <>
                  <p className="flex-1 text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Report approved and finalized.
                  </p>
                  <button onClick={() => setSelectedTask(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
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
