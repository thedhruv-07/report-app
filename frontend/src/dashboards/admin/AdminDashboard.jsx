import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, ClipboardList, Users, Bell, LogOut, 
  Search, Filter, ChevronDown, CheckCircle, AlertTriangle, 
  Clock, X, ArrowRight, FileText, Send, Building, ShieldCheck, Mail, User
} from 'lucide-react';
import { 
  MOCK_BOOKINGS, MOCK_INSPECTORS, MOCK_NOTIFICATIONS, 
  STATUS_COLORS, INSPECTION_TYPES, ALL_STATUSES 
} from './constants/adminMockData';

// Reusable CountUp component
const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span>{count}</span>;
};

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Global State
  const [activeView, setActiveView] = useState('dashboard');
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(MOCK_NOTIFICATIONS.filter(n => !n.isRead).length);

  // Filters State for Bookings View
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      readyToDeliver: bookings.filter(b => b.status === 'Ready to Deliver').length,
      underReview: bookings.filter(b => b.status === 'Under TM Review').length,
      delivered: bookings.filter(b => b.status === 'Delivered').length,
      correction: bookings.filter(b => b.status === 'Correction Requested').length,
    };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesType = typeFilter === 'All' || b.inspectionType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [bookings, searchTerm, statusFilter, typeFilter]);

  // Handlers
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDeliverReport = () => {
    if (!activeBooking) return;
    
    // Update booking status
    setBookings(prev => prev.map(b => 
      b.id === activeBooking.id ? { ...b, status: 'Delivered', deliveredDate: new Date().toISOString().split('T')[0] } : b
    ));
    
    // Add notification
    const newNotif = {
      id: Date.now(),
      message: `Report for ${activeBooking.id} delivered to ${activeBooking.clientName}`,
      type: 'success',
      timeAgo: 'Just now',
      isRead: false,
      bookingId: activeBooking.id
    };
    setNotifications([newNotif, ...notifications]);
    setUnreadCount(prev => prev + 1);
    
    setDeliveryModalOpen(false);
    setActiveBooking(null);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      
      {/* ==========================================
          TOP NAVBAR
          ========================================== */}
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <img 
            src="/company-logo.png" 
            alt="Absolute Veritas" 
            className="h-10 w-auto object-contain cursor-pointer"
            onClick={() => setActiveView("dashboard")}
          />
          <span className="hidden sm:inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            Admin Console
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "dashboard" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView("bookings")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "bookings" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>All Bookings</span>
              {stats.readyToDeliver > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeView === "bookings" ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white animate-pulse'
                }`}>
                  {stats.readyToDeliver} Ready
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveView("inspectors")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "inspectors" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              <span>Inspectors</span>
            </div>
          </button>
        </nav>

        {/* Right: Notifications Bell, User Info & Logout */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-none">{user?.name || "System Admin"}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Global Admin</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-rose-500 hover:bg-rose-50 rounded-xl font-semibold text-sm transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ==========================================
          MAIN AREA CONTENT
          ========================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          {/* VIEW: DASHBOARD */}
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.total} /></h3>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Bookings</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 animate-pulse">
                      <Send className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.readyToDeliver} /></h3>
                    <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mt-1">Ready for Delivery</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.underReview} /></h3>
                    <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider mt-1">Under TM Review</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800"><CountUp end={stats.correction} /></h3>
                    <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mt-1">Correction Required</p>
                  </div>
                </div>
              </div>

              {/* Actionable Table - Ready to Deliver */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Send className="w-5 h-5 text-emerald-500" />
                      Action Required: Deliver to Client
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">These reports have been finalized by the Technical Manager.</p>
                  </div>
                  <button onClick={() => setActiveView('bookings')} className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1">
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
                            <td className="px-6 py-4"><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold">{booking.inspectionType}</span></td>
                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{booking.reportId}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => { setActiveBooking(booking); setDeliveryModalOpen(true); }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm shadow-emerald-200 transition-all animate-pulse hover:animate-none flex items-center gap-2 ml-auto"
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
                              className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
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
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm shadow-emerald-200 transition-all animate-pulse hover:animate-none flex items-center gap-2 ml-auto"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send Report
                                </button>
                              ) : booking.status === 'Delivered' ? (
                                <span className="text-teal-600 font-semibold text-xs flex items-center gap-1 justify-end">
                                  <CheckCircle className="w-4 h-4" /> Delivered {booking.deliveredDate}
                                </span>
                              ) : (
                                <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                  View Details
                                </button>
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

          {/* VIEW: INSPECTORS */}
          {activeView === 'inspectors' && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_INSPECTORS.map(inspector => (
                  <div key={inspector.id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-xl">
                          {inspector.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{inspector.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{inspector.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {inspector.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-[11px]">{inspector.specialization}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{inspector.activeJobs}</p>
                      </div>
                      <div className="border-l border-r border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Done</p>
                        <p className="text-lg font-black text-slate-800 mt-0.5">{inspector.completedJobs}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rating</p>
                        <p className="text-lg font-black text-amber-500 mt-0.5">{inspector.rating}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ================= BELL NOTIFICATION PANEL ================= */}
        <div className={`absolute top-0 bottom-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          notificationsPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-16 shrink-0 border-b border-slate-200 px-5 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              Notifications
            </h3>
            <button 
              onClick={() => setNotificationsPanelOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No notifications</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className={`p-4 rounded-xl border text-sm leading-relaxed transition-all ${
                  notif.isRead ? 'bg-white border-slate-200 opacity-60' : 'bg-indigo-50/50 border-indigo-100 font-medium shadow-sm'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.isRead ? 'bg-slate-300' : 'bg-indigo-500'}`}></span>
                    <div>
                      <p className="text-slate-800">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase">{notif.timeAgo}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {unreadCount > 0 && (
            <div className="p-4 border-t border-slate-200 bg-white shrink-0">
              <button 
                onClick={handleMarkAllRead}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
        
        {/* Panel Backdrop */}
        {notificationsPanelOpen && (
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity"
            onClick={() => setNotificationsPanelOpen(false)}
          />
        )}

      </div>

      {/* ================= MODALS ================= */}
      {deliveryModalOpen && activeBooking && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setDeliveryModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
                  <Mail className="w-6 h-6" />
                </div>
                <button onClick={() => setDeliveryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-black text-slate-800">Deliver Report</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Send the finalized report <strong className="text-slate-700">{activeBooking.reportId}</strong> to the client portal and notify them via email.
              </p>
            </div>

            <div className="p-6 bg-slate-50 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  {activeBooking.clientName}
                </p>
              </div>
              
              <button 
                onClick={handleDeliverReport}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
