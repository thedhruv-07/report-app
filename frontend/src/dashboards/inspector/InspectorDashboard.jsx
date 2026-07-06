import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { useNavigate, useSearchParams } from "react-router-dom";
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

const TaskGrid = lazy(() => import('./components/TaskGrid'));
const TaskDetailsModal = lazy(() => import('./components/TaskDetailsModal'));
const MessagesPanel = lazy(() => import('./components/MessagesPanel'));

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [summary, setSummary] = useState({ totalTasks: 0, pendingTasks: 0, submittedReports: 0, reviewFinalized: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedTask, setSelectedTask] = useState(null);
  const [acceptingTaskId, setAcceptingTaskId] = useState(null);

  const [archiveMonthYear, setArchiveMonthYear] = useState(""); // "YYYY-MM" from <input type="month">
  const [archiveDate, setArchiveDate] = useState("");           // "YYYY-MM-DD" from <input type="date">
  const [archiveResult, setArchiveResult] = useState(null);     // number | null
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token, fetchDashboardData]);

  // Auto-open task if ?task= param is present
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length > 0 && !loading) {
      const taskToOpen = tasks.find(t => t._id === taskId);
      if (taskToOpen) {
        setSearchParams({}, { replace: true });
        handleSelectTask(taskToOpen);
      }
    }
  }, [searchParams, tasks, loading, setSearchParams]);

  const handleSelectTask = (task) => {
    if (task.status === 'Pending Acceptance') {
      setSelectedTask(task);
    } else {
      navigate(`/dashboard/inspector/task/${task._id}`, { state: { task } });
    }
  };

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

  const handleArchiveSearch = async () => {
    if (!archiveMonthYear && !archiveDate) return;
    setArchiveLoading(true);
    setArchiveError(null);
    setArchiveResult(null);
    try {
      const params = new URLSearchParams();
      if (archiveDate) {
        params.set('date', archiveDate);
      } else {
        const [year, month] = archiveMonthYear.split('-');
        params.set('year', year);
        params.set('month', String(Number(month)));
      }
      const res = await fetch(`${ENDPOINTS.INSPECTOR.ARCHIVED_COUNT}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setArchiveResult(data.count);
    } catch {
      setArchiveError('Could not fetch archived report count.');
    } finally {
      setArchiveLoading(false);
    }
  };

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
  };

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

        {/* Archived Reports count-search — reports older than 72h no longer appear in the grid above;
            this looks up how many were submitted in a given period without exposing their details. */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-700 shrink-0">Search Archived Reports</h3>
          <input
            type="month"
            value={archiveMonthYear}
            onChange={(e) => { setArchiveMonthYear(e.target.value); setArchiveDate(""); setArchiveResult(null); setArchiveError(null); }}
            aria-label="Search by month"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <span className="text-xs text-slate-400">or</span>
          <input
            type="date"
            value={archiveDate}
            onChange={(e) => { setArchiveDate(e.target.value); setArchiveMonthYear(""); setArchiveResult(null); setArchiveError(null); }}
            aria-label="Search by date"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleArchiveSearch}
            disabled={archiveLoading || (!archiveMonthYear && !archiveDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {archiveLoading ? 'Searching…' : 'Search'}
          </button>
          {archiveError && <span className="text-sm text-red-600">{archiveError}</span>}
          {archiveResult !== null && !archiveError && (
            <span className="text-sm text-slate-700">
              <strong className="text-blue-600">{archiveResult}</strong> report{archiveResult !== 1 ? 's' : ''} submitted in this period
            </span>
          )}
        </div>

        <Suspense fallback={null}>
          <MessagesPanel />
        </Suspense>

        <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"><div className="h-1 bg-slate-100" /><div className="p-5 space-y-4"><div className="flex justify-between"><div className="h-5 bg-slate-100 rounded-lg w-12" /><div className="h-5 bg-slate-100 rounded-lg w-24" /></div><div className="h-5 bg-slate-100 rounded w-3/4" /><div className="space-y-2"><div className="h-4 bg-slate-100 rounded w-full" /><div className="h-4 bg-slate-100 rounded w-5/6" /><div className="h-4 bg-slate-100 rounded w-1/2" /></div></div><div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between"><div className="h-4 bg-slate-100 rounded w-12" /><div className="h-4 bg-slate-100 rounded w-20" /></div></div>)}</div>}>
          <TaskGrid
            loading={loading}
            filteredTasks={filteredTasks}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            getStatusConfig={getStatusConfig}
            getDisplayStatus={getDisplayStatus}
            onSelectTask={handleSelectTask}
            onClearFilters={handleClearFilters}
          />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <TaskDetailsModal
          selectedTask={selectedTask}
          acceptingTaskId={acceptingTaskId}
          onClose={() => setSelectedTask(null)}
          onAcceptTask={handleAcceptTask}
          getStatusConfig={getStatusConfig}
          getDisplayStatus={getDisplayStatus}
        />
      </Suspense>
    </div>
  );
}
