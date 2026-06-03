import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ENDPOINTS } from '../../config/api';
import {
  LayoutDashboard, ClipboardList, Users, Bell, Mail, LogOut
} from 'lucide-react';
import { useReportQueue } from '../manager/hooks/useReportQueue';

// Modular Sub-components
import SummaryCards from './components/SummaryCards';
import BookingsQueue from './components/BookingsQueue';
import InspectorDirectory from './components/InspectorDirectory';
import DeliveryConfirmationModal from './components/DeliveryConfirmationModal';
import NotificationPanel from './components/NotificationPanel';
import NotificationManager from './components/NotificationManager';
import EmailMonitoringPanel from './components/EmailMonitoringPanel';

export default function AdminDashboard() {
  const { logout, user, token } = useAuth();
  const { bellNotifications, unreadCount: notifUnreadCount, markAllAsRead: markAllNotifRead, fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const { reports: queueReports, loading: queueLoading, error: queueError } = useReportQueue();
  const [bookingInbox, setBookingInbox] = useState([]);
  const [bookingInboxLoading, setBookingInboxLoading] = useState(false);
  const [bookingInboxError, setBookingInboxError] = useState(null);
  const [inspectors, setInspectors] = useState([]);
  const [inspectorPickerOpen, setInspectorPickerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Load and preserve active view across browser refreshes
  const [activeView, setActiveView] = useState(() => {
    return sessionStorage.getItem("adminActiveView") || "dashboard";
  });
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("adminActiveView", activeView);
  }, [activeView]);

  const fetchBookingInbox = useCallback(async () => {
    if (!token) return;
    setBookingInboxLoading(true);
    setBookingInboxError(null);
    try {
      const response = await fetch(ENDPOINTS.BOOKINGS.ADMIN_LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load bookings');
      const data = await response.json();
      setBookingInbox(data.bookings || []);
    } catch (error) {
      setBookingInboxError(error.message);
    } finally {
      setBookingInboxLoading(false);
    }
  }, [token]);

  const fetchInspectors = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(ENDPOINTS.ADMIN.INSPECTORS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load inspectors');
      const data = await response.json();
      setInspectors(data.inspectors || []);
    } catch (error) {
      console.error('Failed to load inspectors:', error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchBookingInbox();
    fetchInspectors();
  }, [token, fetchBookingInbox, fetchInspectors]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  // Filters State for Bookings View
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [deliveryOverrides, setDeliveryOverrides] = useState({});

  const bookings = useMemo(() => {
    return (queueReports || [])
      .map(report => {
        const id = String(report.id || report.reportId || '');
        if (!id) return null;

        const baseBooking = {
          id,
          clientName: report.clientName || 'Unknown Client',
          inspectionType: report.inspectionType || 'Report',
          factoryName: report.factoryName || '',
          factoryLocation: report.factoryLocation || '',
          inspectorName: report.inspectorName || 'Unknown Inspector',
          createdDate: report.submittedAt ? new Date(report.submittedAt).toISOString().split('T')[0] : '',
          status: report.status === 'approved'
            ? 'Ready to Deliver'
            : report.status === 'under_review'
              ? 'Under TM Review'
              : report.status === 'revision_required'
                ? 'Correction Requested'
                : 'Scheduled',
          priority: report.priority || 'Normal',
          poNumber: report.reportId || '',
          reportId: report.reportId || '',
          deliveredDate: null,
        };

        return deliveryOverrides[id] ? { ...baseBooking, ...deliveryOverrides[id] } : baseBooking;
      })
      .filter(Boolean);
  }, [queueReports, deliveryOverrides]);

  const bookingRows = useMemo(() => {
    return (bookingInbox || []).map((booking) => ({
      id: String(booking.id || ''),
      clientName: booking.clientName || 'Unknown Client',
      clientEmail: booking.clientEmail || '',
      inspectionType: booking.inspectionType || 'PSI',
      inspectorName: booking.inspectorName || (booking.assignedInspectorId ? 'Assigned' : 'Unassigned'),
      createdDate: booking.createdAt ? new Date(booking.createdAt).toISOString().split('T')[0] : '',
      status: booking.status || 'new',
      priority: booking.priority || 'Normal',
      poNumber: booking.onlineBookingId || '',
      reportId: booking.onlineBookingId || '',
      assignedInspectorId: booking.assignedInspectorId || '',
      factoryName: booking.factoryName || '',
      factoryLocation: booking.factoryAddress || '',
      scheduledDate: booking.scheduledDate || null,
      specialInstructions: booking.specialInstructions || '',
      paymentInfo: booking.paymentInfo || null,
      deliveredDate: null,
    }));
  }, [bookingInbox]);

  const bookingInspectionTypes = useMemo(() => {
    return Array.from(new Set(bookingRows.map((booking) => booking.inspectionType).filter(Boolean))).sort();
  }, [bookingRows]);

  const bookingStatusOptions = useMemo(() => {
    return Array.from(new Set(bookingRows.map((booking) => booking.status).filter(Boolean))).sort();
  }, [bookingRows]);

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
    return bookingRows.filter(b => {
      const matchesSearch = 
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesType = typeFilter === 'All' || b.inspectionType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [bookingRows, searchTerm, statusFilter, typeFilter]);

  const inspectionTypes = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.inspectionType).filter(Boolean))).sort();
  }, [bookings]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(bookings.map(b => b.status).filter(Boolean))).sort();
  }, [bookings]);

  const STATUS_COLORS = {
    'Scheduled': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'Under TM Review': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    'Correction Requested': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    'Ready to Deliver': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    'Delivered': { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
    new: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    assigned: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    viewed: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
    accepted: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    submitted: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    under_review: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    correction_requested: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    finalized: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    delivered: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  };

  // Handlers

  const handleDeliverReport = async () => {
    if (!activeBooking) return;

    try {
      const response = await fetch(ENDPOINTS.MANAGER.UPDATE_STATUS(activeBooking.id), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery status');
      }

      setDeliveryOverrides(prev => ({
        ...prev,
        [activeBooking.id]: {
          status: 'Delivered',
          deliveredDate: new Date().toISOString().split('T')[0]
        }
      }));

      await fetch(ENDPOINTS.NOTIFICATIONS.CREATE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Report delivered',
          message: `Report ${activeBooking.reportId || activeBooking.id} was delivered to ${activeBooking.clientName}.`,
          type: 'success',
          priority: 2,
          targetRoles: ['admin'],
          expiresAt: null
        })
      });
      fetchNotifications?.();
    } catch (err) {
      console.error('Failed to create delivery notification:', err);
    }
    
    setDeliveryModalOpen(false);
    setActiveBooking(null);
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedInspectorId(booking.assignedInspectorId || inspectors[0]?._id || '');
    setInspectorPickerOpen(true);
  };

  const handleAssignBooking = async () => {
    if (!selectedBooking || !selectedInspectorId) return;
    setAssigning(true);
    try {
      const response = await fetch(ENDPOINTS.BOOKINGS.ASSIGN(selectedBooking.id), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedInspectorId: selectedInspectorId })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to assign booking');
      }

      await fetchBookingInbox();
      await fetchNotifications?.();
      setInspectorPickerOpen(false);
      setSelectedBooking(null);
      setSelectedInspectorId('');
    } catch (error) {
      console.error('Failed to assign booking:', error);
      alert(error.message);
    } finally {
      setAssigning(false);
    }
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
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
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
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
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
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeView === "inspectors" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              <span>Inspectors</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView("notifications")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeView === "notifications" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notifications</span>
              {notifUnreadCount > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeView === "notifications" ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'
                }`}>
                  {notifUnreadCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveView("emails")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeView === "emails" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Email Logs</span>
            </div>
          </button>
        </nav>

        {/* Right: Notifications Bell, User Info & Logout */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {notifUnreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4.5 h-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold px-1">
                {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
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
            className="flex items-center justify-center p-2 sm:px-3 sm:py-1.5 text-rose-500 hover:bg-rose-50 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
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
          
          {/* Summary Metric Cards */}
          {activeView === 'dashboard' && <SummaryCards stats={stats} />}

          {/* Bookings Queue Layout */}
          <BookingsQueue 
            deliveryBookings={bookings}
            bookingInbox={bookingRows}
            stats={stats}
            activeView={activeView}
            setActiveView={setActiveView}
            setActiveBooking={setActiveBooking}
            setDeliveryModalOpen={setDeliveryModalOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            filteredBookings={filteredBookings}
            STATUS_COLORS={STATUS_COLORS}
            INSPECTION_TYPES={activeView === 'bookings' ? bookingInspectionTypes : inspectionTypes}
            ALL_STATUSES={activeView === 'bookings' ? bookingStatusOptions : statusOptions}
            loading={queueLoading}
            error={queueError}
            bookingInboxLoading={bookingInboxLoading}
            bookingInboxError={bookingInboxError}
            onAssignClick={openAssignModal}
          />

          {/* Inspector Performance Cards */}
          <InspectorDirectory
            activeView={activeView}
          />

          {activeView === 'notifications' && <NotificationManager />}
          {activeView === 'emails' && <EmailMonitoringPanel />}

        </main>

        {/* Sliding Alerts Drawer */}
        <NotificationPanel
          notificationsPanelOpen={notificationsPanelOpen}
          setNotificationsPanelOpen={setNotificationsPanelOpen}
          notifications={bellNotifications}
          unreadCount={notifUnreadCount}
          handleMarkAllRead={() => markAllNotifRead(bellNotifications.map(n => n._id))}
        />

      </div>

      {/* Confirmation delivery Modal */}
      <DeliveryConfirmationModal 
        deliveryModalOpen={deliveryModalOpen}
        setDeliveryModalOpen={setDeliveryModalOpen}
        activeBooking={activeBooking}
        handleDeliverReport={handleDeliverReport}
      />

      {inspectorPickerOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-500 font-bold">Assign inspector</p>
                <h3 className="text-lg font-bold text-slate-800">Booking {selectedBooking.id}</h3>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setInspectorPickerOpen(false)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">{selectedBooking.clientName}</p>
                <p>{selectedBooking.clientEmail}</p>
                <p className="mt-1">Type: {selectedBooking.inspectionType}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Inspector</label>
                <select
                  value={selectedInspectorId}
                  onChange={(e) => setSelectedInspectorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select inspector</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector._id} value={inspector._id}>
                      {inspector.name} ({inspector.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setInspectorPickerOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignBooking}
                disabled={assigning || !selectedInspectorId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
              >
                Assign Booking
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
