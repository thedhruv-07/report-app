import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, ClipboardList, Users, Bell, LogOut
} from 'lucide-react';
import {
  MOCK_BOOKINGS, MOCK_NOTIFICATIONS,
  STATUS_COLORS, INSPECTION_TYPES, ALL_STATUSES
} from './constants/adminMockData';

// Modular Sub-components
import SummaryCards from './components/SummaryCards';
import BookingsQueue from './components/BookingsQueue';
import InspectorDirectory from './components/InspectorDirectory';
import DeliveryConfirmationModal from './components/DeliveryConfirmationModal';
import NotificationPanel from './components/NotificationPanel';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

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
        </nav>

        {/* Right: Notifications Bell, User Info & Logout */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200 cursor-pointer"
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
            INSPECTION_TYPES={INSPECTION_TYPES}
            ALL_STATUSES={ALL_STATUSES}
          />

          {/* Inspector Performance Cards */}
          <InspectorDirectory
            activeView={activeView}
          />

        </main>

        {/* Sliding Alerts Drawer */}
        <NotificationPanel 
          notificationsPanelOpen={notificationsPanelOpen}
          setNotificationsPanelOpen={setNotificationsPanelOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          handleMarkAllRead={handleMarkAllRead}
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
