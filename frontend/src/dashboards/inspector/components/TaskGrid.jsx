import { ClipboardList, Building, MapPin, Calendar, ChevronRight } from 'lucide-react';

export default function TaskGrid({
  loading,
  filteredTasks,
  searchTerm,
  statusFilter,
  getStatusConfig,
  getDisplayStatus,
  onSelectTask,
  onClearFilters
}) {
  if (loading) {
    return (
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
    );
  }

  if (filteredTasks.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredTasks.map(task => {
          const config = getStatusConfig(task.status);
          return (
            <div
              key={task._id}
              onClick={() => onSelectTask(task)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group cursor-pointer"
            >
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
                    <span>{new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono font-semibold">
                  #{task._id.slice(-6).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-blue-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all duration-150">
                  {task.status === 'Pending Acceptance' ? 'Review & Accept' : task.status === 'Accepted' ? 'Start Report' : 'View Details'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-20 text-center">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ClipboardList className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">No tasks found</h3>
      <p className="text-sm text-slate-500 mb-4">
        {searchTerm || statusFilter !== 'All'
          ? 'No tasks match your current search or filter.'
          : 'You have no assigned inspection tasks yet.'}
      </p>
      {(searchTerm || statusFilter !== 'All') && (
        <button
          onClick={onClearFilters}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
