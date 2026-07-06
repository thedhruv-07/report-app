import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { clearFormStorage } from '../../../shared/services';
import { ChevronLeft, FileText, Receipt, ClipboardList } from "lucide-react";
import NoticeSummary from '../components/NoticeSummary';
import ExpensePanel from '../components/ExpensePanel';

const TABS = [
  { key: 'notice', label: 'Notice', icon: ClipboardList },
  { key: 'expense', label: 'Expense', icon: Receipt },
  { key: 'report', label: 'Report', icon: FileText },
];

const INSPECTION_ROUTES = {
  'PSI': '/dashboard/pre-shipment',
  'CLS': '/dashboard/container-loading',
  'Factory Audit': '/dashboard/factory-audit',
  'DPI': '/dashboard/during-production',
  'Social Audit': '/dashboard/social-audit',
};

export default function TaskWorkspace() {
  const { taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [task, setTask] = useState(location.state?.task || null);
  const [activeTab, setActiveTab] = useState('notice');
  const [loading, setLoading] = useState(!location.state?.task);

  useEffect(() => {
    if (task || !token) return;
    fetch(ENDPOINTS.INSPECTOR.TASK_BY_ID(taskId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.task) setTask(data.task); })
      .finally(() => setLoading(false));
  }, [task, taskId, token]);

  const handleOpenReport = () => {
    if (!task) return;
    const savedTaskId = localStorage.getItem('inspectionTaskId');
    if (savedTaskId !== task._id) {
      clearFormStorage(INSPECTION_ROUTES[task.inspectionType] || '/dashboard/pre-shipment');
    }
    navigate(INSPECTION_ROUTES[task.inspectionType] || '/dashboard/pre-shipment', { state: { task } });
  };

  const statusLabel = useMemo(() => task?.status === 'Accepted' ? 'Awaiting Report' : task?.status, [task]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading task…</div>;
  }

  if (!task) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Task not found.</p>
        <button onClick={() => navigate('/dashboard/inspector')} className="mt-3 text-sm font-semibold text-blue-600">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={() => navigate('/dashboard/inspector')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">{task.clientName}</h1>
            <p className="text-xs text-slate-500">{task.factoryName} · {task.inspectionType} · {statusLabel}</p>
          </div>
        </div>

        <div className="flex gap-6 mt-4 border-b border-slate-200 -mb-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => tab.key === 'report' ? handleOpenReport() : setActiveTab(tab.key)}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'notice' && <NoticeSummary taskId={task._id} />}
        {activeTab === 'expense' && <ExpensePanel taskId={task._id} />}
      </div>
    </div>
  );
}
