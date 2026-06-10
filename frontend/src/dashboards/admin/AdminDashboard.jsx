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
import BookingReviewModal from './components/BookingReviewModal';
import AdminNavbar from './components/AdminNavbar';
import ToastList from '../../components/shared/ToastList';
import useToast from '../../hooks/useToast';

export default function AdminDashboard() {
  const { logout, user, token } = useAuth();
  const { bellNotifications, unreadCount: notifUnreadCount, markAllAsRead: markAllNotifRead, fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const { reports: queueReports, loading: queueLoading, error: queueError } = useReportQueue();
  const [bookingInbox, setBookingInbox] = useState([]);
  const [bookingInboxLoading, setBookingInboxLoading] = useState(false);
  const [bookingInboxError, setBookingInboxError] = useState(null);
  const [inspectors, setInspectors] = useState([]);
  const [reviewModalBooking, setReviewModalBooking] = useState(null);

  // Load and preserve active view across browser refreshes
  const [activeView, setActiveView] = useState(() => {
    return sessionStorage.getItem("adminActiveView") || "dashboard";
  });
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const { toasts, addToast, dismiss: dismissToast } = useToast();

  useEffect(() => {
    sessionStorage.setItem("adminActiveView", activeView);
  }, [activeView]);

  const fetchBookingInbox = useCallback(async () => {
    if (!token) return [];
    setBookingInboxLoading(true);
    setBookingInboxError(null);
    try {
      const response = await fetch(ENDPOINTS.BOOKINGS.ADMIN_LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load bookings');
      const data = await response.json();
      const bookings = data.bookings || [];
      setBookingInbox(bookings);
      return bookings;
    } catch (error) {
      setBookingInboxError(error.message);
      return [];
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
      linkedNoticeId: booking.linkedNoticeId || null,
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
      addToast('Report marked as delivered.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to deliver report.', 'error');
    }

    setDeliveryModalOpen(false);
    setActiveBooking(null);
  };

  const openReviewModal = (booking) => setReviewModalBooking(booking);

  const handlePrepareNotice = (booking) => {
    if (booking.linkedNoticeId) {
      navigate(`/admin/inspection-notices/${booking.linkedNoticeId}`);
    } else {
      navigate(`/admin/inspection-notices/new?sourceBookingId=${booking.id}`);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      
      {/* ==========================================
          TOP NAVBAR
          ========================================== */}
      <AdminNavbar activeView={activeView} stats={stats} setActiveView={setActiveView} />

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
            onAssignClick={openReviewModal}
            onPrepareNotice={handlePrepareNotice}
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

      <BookingReviewModal
        booking={reviewModalBooking}
        inspectors={inspectors}
        token={token}
        onClose={() => setReviewModalBooking(null)}
        onSaved={async () => {
          const fresh = await fetchBookingInbox();
          const updated = fresh.find(b => b.id === reviewModalBooking?.id);
          if (updated) setReviewModalBooking(updated);
        }}
        onAssigned={() => { fetchBookingInbox(); fetchNotifications?.(); addToast('Booking assigned to inspector.', 'success'); }}
      />

    <ToastList toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
