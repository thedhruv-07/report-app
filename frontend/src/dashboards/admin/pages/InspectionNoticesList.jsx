import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { Search, ChevronDown, Filter, Plus, FileEdit, UserPlus } from 'lucide-react';
import AdminNavbar from '../components/AdminNavbar';

export default function InspectionNoticesList() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchNotices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // Endpoint mapping handled locally for now or update ENDPOINTS later
      const response = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load notices');
      const data = await response.json();
      setNotices(data.notices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const STATUS_COLORS = {
    'draft': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    'scheduled': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'in_progress': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    'cancelled': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' }
  };

  const statusStylesFor = (status) => STATUS_COLORS[status] || STATUS_COLORS.draft;

  const ALL_STATUSES = ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'];
  
  const INSPECTION_TYPES = useMemo(() => {
    return Array.from(new Set(notices.map(n => n.basicInfo?.serviceType).filter(Boolean))).sort();
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch =
        (n.noticeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.basicInfo?.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || n.status === statusFilter;
      const matchesType = typeFilter === 'All' || n.basicInfo?.serviceType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [notices, searchTerm, statusFilter, typeFilter]);

  const pendingQueryCountOf = (notice) => (notice.inspectorQueries || []).filter(q => !q.reply).length;
  const totalPendingQueries = useMemo(
    () => notices.reduce((sum, n) => sum + pendingQueryCountOf(n), 0),
    [notices]
  );

  return (
    <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      <AdminNavbar stats={{ pendingQueries: totalPendingQueries }} />
      
      <main className="flex-1 overflow-y-auto p-8 relative flex flex-col">
        <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search notice ID, customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto items-center">
              <div className="relative flex-1 md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative flex-1 md:w-48">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="All">All Service Types</option>
                  {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={() => navigate('/admin/inspection-notices/new')}
                className="inline-flex items-center gap-2 bg-[#6C47FF] hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Notice
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Notice ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Service Type</th>
                    <th className="px-6 py-4">Inspector</th>
                    <th className="px-6 py-4">Inspection Date</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-20 text-center text-slate-500">
                        Loading notices…
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center text-rose-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredNotices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center">
                        <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No notices match your filters</h3>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your search term or dropdown selections.</p>
                        <button 
                          onClick={() => { setSearchTerm(''); setStatusFilter('All'); setTypeFilter('All'); }}
                          className="mt-6 px-6 py-2 bg-purple-50 text-purple-600 font-bold rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredNotices.map(notice => {
                      // Formatting dates for display
                      const dateFrom = notice.basicInfo?.inspectionDateFrom ? new Date(notice.basicInfo.inspectionDateFrom).toLocaleDateString() : '';
                      const dateTo = notice.basicInfo?.inspectionDateTo ? new Date(notice.basicInfo.inspectionDateTo).toLocaleDateString() : '';
                      const displayDate = dateFrom && dateTo && dateFrom !== dateTo ? `${dateFrom} - ${dateTo}` : dateFrom || 'Not Set';
                      
                      const inspectors = notice.teamAssignment?.inspectors || [];
                      const inspectorNames = inspectors.map(i => i.name).join(', ') || 'Unassigned';

                      return (
                        <tr 
                          key={notice._id} 
                          onClick={() => navigate(`/admin/inspection-notices/${notice.noticeId}`)} 
                          className="hover:bg-slate-50 transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-slate-800">{notice.noticeId}</p>
                              {pendingQueryCountOf(notice) > 0 && (
                                <span className="inline-flex items-center bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                                  {pendingQueryCountOf(notice)} msg{pendingQueryCountOf(notice) > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-700">{notice.basicInfo?.customerName || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              {notice.basicInfo?.serviceType || 'Not Set'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            {inspectorNames}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            {displayDate}
                          </td>
                          <td className="px-6 py-4">
                            {notice.sourceBookingId ? (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                🔗 Client Booking
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                ✍️ Manual
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${statusStylesFor(notice.status).bg} ${statusStylesFor(notice.status).text} ${statusStylesFor(notice.status).border}`}>
                              {notice.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/admin/inspection-notices/${notice.noticeId}`); }}
                              className="inline-flex items-center gap-2 bg-[#F4F5F7] border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer ml-auto"
                            >
                              {inspectors.length > 0 ? (
                                <><FileEdit className="w-4 h-4 text-purple-600" /> View & Edit</>
                              ) : (
                                <><UserPlus className="w-4 h-4 text-purple-600" /> Assign Inspector</>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
