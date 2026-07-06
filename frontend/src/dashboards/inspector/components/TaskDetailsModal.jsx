import { CheckCircle, FileText, MapPin, AlertCircle } from 'lucide-react';

export default function TaskDetailsModal({
  selectedTask,
  acceptingTaskId,
  onClose,
  onAcceptTask,
  getStatusConfig,
  getDisplayStatus
}) {
  if (!selectedTask) return null;

  const statusConfig = getStatusConfig(selectedTask.status);

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${statusConfig.badge.split(' ').find(c => c.startsWith('bg-'))} flex items-center justify-center`}>
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Task Details</h3>
              <p className="text-xs text-slate-400 font-mono">#{selectedTask._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${statusConfig.badge}`}>
              {getDisplayStatus(selectedTask.status)}
            </span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold uppercase tracking-wide">
              {selectedTask.inspectionType}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
              <p className="text-base font-semibold text-slate-900">{selectedTask.clientCode || 'Client'}</p>
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

        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Close
          </button>
          <button
            onClick={() => onAcceptTask(selectedTask._id)}
            disabled={acceptingTaskId === selectedTask._id}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {acceptingTaskId === selectedTask._id
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />}
            Accept Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
