import React, { useState, useEffect, useMemo } from 'react';
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

  // Load and preserve active view across browser refreshes
  const [activeView, setActiveView] = useState(() => {
    return sessionStorage.getItem("adminActiveView") || "dashboard";
  });
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("adminActiveView", activeView);
  }, [activeView]);

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
            bookings={bookings}
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
            INSPECTION_TYPES={inspectionTypes}
            ALL_STATUSES={statusOptions}
            loading={queueLoading}
            error={queueError}
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

    </div>
  );
}
