import React from 'react';
import { 
  ClipboardList, Send, CheckCircle, Search, ChevronDown, Filter, Mail, ArrowRight 
} from 'lucide-react';

export default function BookingsQueue({
  bookings,
  /* stats removed (unused) */
  activeView,
  setActiveView,
  setActiveBooking,
  setDeliveryModalOpen,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  filteredBookings,
  STATUS_COLORS,
  INSPECTION_TYPES,
  ALL_STATUSES
}) {
  return (
    <>
      {/* VIEW: DASHBOARD (Actionable Table) */}
      {activeView === 'dashboard' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-500" />
                Action Required: Deliver to Client
              </h3>
              <p className="text-sm text-slate-500 mt-1">These reports have been finalized by the Technical Manager.</p>
            </div>
            <button 
              onClick={() => setActiveView('bookings')} 
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Report ID</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.filter(b => b.status === 'Ready to Deliver').length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-600 text-base">All caught up!</p>
                      <p className="text-xs mt-1">No reports waiting for delivery.</p>
                    </td>
                  </tr>
                ) : (
                  bookings.filter(b => b.status === 'Ready to Deliver').map(booking => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{booking.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{booking.clientName}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          {booking.inspectionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{booking.reportId}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setActiveBooking(booking); setDeliveryModalOpen(true); }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm shadow-emerald-200 transition-all animate-pulse hover:animate-none flex items-center gap-2 ml-auto cursor-pointer"
                        >
                          <Mail className="w-4 h-4" />
                          Send to Client
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: BOOKINGS */}
      {activeView === 'bookings' && (
        <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ID, client, PO..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              
              <div className="relative flex-1 md:w-48">
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Client / PO</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Inspector</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No bookings match your filters</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your search term or dropdown selections.</p>
                        <button 
                          onClick={() => { setSearchTerm(''); setStatusFilter('All'); setTypeFilter('All'); }}
                          className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-slate-800">{booking.id}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{booking.createdDate}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">{booking.clientName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{booking.poNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold">{booking.inspectionType}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {booking.inspectorName.split(' ').map(n=>n[0]).join('')}
                            </div>
                            {booking.inspectorName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[booking.status].bg} ${STATUS_COLORS[booking.status].text} ${STATUS_COLORS[booking.status].border}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {booking.status === 'Ready to Deliver' ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveBooking(booking); setDeliveryModalOpen(true); }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm shadow-emerald-200 transition-all animate-pulse hover:animate-none flex items-center gap-2 ml-auto cursor-pointer"
                            >
                              <Mail className="w-4 h-4" />
                              Send Report
                            </button>
                          ) : booking.status === 'Delivered' ? (
                            <span className="text-teal-600 font-semibold text-xs flex items-center gap-1 justify-end">
                              <CheckCircle className="w-4 h-4" /> Delivered {booking.deliveredDate}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold text-xs inline-block">
                              Processing
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
