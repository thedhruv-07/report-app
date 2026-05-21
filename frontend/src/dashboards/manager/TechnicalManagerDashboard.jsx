import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useManagerNotifications } from './hooks/useManagerNotifications';
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  X,
  CheckCircle,
  MessageSquare,
  Clock,
  ArrowLeft,
  Camera,
  Info,
  ExternalLink,
  Lock,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

import { useReportQueue } from './hooks/useReportQueue';
import { useReportReview } from './hooks/useReportReview';

// ==========================================
// MOCK SEED DATA REMOVED

const SECTIONS_CONFIG = {
  sectionA: { label: "Section A — Inspection Summary", icon: Info },
  sectionB: { label: "Section B — Product Workmanship", icon: CheckCircle },
  sectionC: { label: "Section C — Quantity Verification", icon: ClipboardList },
  sectionD: { label: "Section D — Measurement & Spec Check", icon: SlidersHorizontal },
  sectionE: { label: "Section E — Function & Safety Tests", icon: Lock },
  sectionF: { label: "Section F — Defect Classification", icon: AlertTriangle },
  sectionG: { label: "Section G — Photo Gallery", icon: Camera },
  sectionH: { label: "Section H — Inspector Declaration", icon: User }
};

export default function TechnicalManagerDashboard() {
  const navigate = useNavigate();
  
  // Try to use global AuthContext but fallback to Sarah Chen
  let auth = null;
  try {
    auth = useAuth();
  } catch (e) {
    // console.warn("useAuth hook failed, utilizing mockup context.", e);
  }
  
  const currentUser = auth?.user || {
    name: "Sarah Chen",
    role: "manager",
    email: "sarah.chen@rms.com"
  };

  // Queue view filters
  const [queueFilters, setQueueFilters] = useState({
    type: "All",
    status: "All",
    inspector: "All",
    fromDate: "",
    toDate: ""
  });

  // Fetch Reports list
  const mapStatusToBackend = (status) => {
    if (status === "Pending Review") return "submitted";
    if (status === "Under Review") return "under_review";
    if (status === "Correction Requested (Round 1)" || status === "Correction Requested (Round 2)") return "revision_required";
    if (status === "Finalized") return "approved";
    return "all";
  };

  const mapTypeToBackend = (type) => {
    if (type === "Factory Audit") return "factory_audit";
    if (type === "All") return "all";
    return type;
  };

  const { reports: backendReports, stats: backendStats, refetch: refetchQueue } = useReportQueue({
    status: mapStatusToBackend(queueFilters.status),
    type: mapTypeToBackend(queueFilters.type)
  });

  // Active view management
  const [activeView, setActiveView] = useState(() => {
    return sessionStorage.getItem("managerActiveView") || "dashboard";
  });
  const [activeReportId, setActiveReportId] = useState(() => {
    return sessionStorage.getItem("managerActiveReportId") || null;
  });

  // Fetch Active Report Details
  const { reportData, submitFeedback, finalizeReport, addRemark, refetch: refetchReport } = useReportReview(activeReportId);

  // Map queue to expected UI format
  const reports = (backendReports || []).map(r => ({
    id: r.id, // For routing/fetching detailed
    displayId: r.reportId,
    clientName: r.clientName,
    inspectionType: r.inspectionType,
    inspectorName: r.inspectorName,
    submissionDate: new Date(r.submittedAt).toLocaleDateString(),
    status: r.status === "submitted" ? "Pending Review" :
            r.status === "under_review" ? "Under Review" :
            r.status === "revision_required" ? `Correction Requested (Round ${r.revisionRound})` :
            r.status === "approved" ? "Finalized" : r.status,
    revisionRound: r.revisionRound
  }));

  const [notifications, setNotifications] = useState([]);

  // Wire real-time socket notifications from backend
  useManagerNotifications((newNotif) => {
    setNotifications(prev => [newNotif, ...prev]);
    if (newNotif.type === 'submission' || newNotif.type === 'status') {
      refetchQueue();
    }
  });

  useEffect(() => {
    sessionStorage.setItem("managerActiveView", activeView);
  }, [activeView]);

  useEffect(() => {
    if (activeReportId) {
      sessionStorage.setItem("managerActiveReportId", activeReportId);
    } else {
      sessionStorage.removeItem("managerActiveReportId");
    }
  }, [activeReportId]);
  
  // Navigation & UI States
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  // Modal states
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  
  // Comment Section Local form inputs
  const [commentInputs, setCommentInputs] = useState({
    sectionA: { comment: "", priority: "Critical" },
    sectionB: { comment: "", priority: "Critical" },
    sectionC: { comment: "", priority: "Critical" },
    sectionD: { comment: "", priority: "Critical" },
    sectionE: { comment: "", priority: "Critical" },
    sectionF: { comment: "", priority: "Critical" },
    sectionG: { comment: "", priority: "Critical" },
    sectionH: { comment: "", priority: "Critical" }
  });
  
  // Sidebar expanded / mobile state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);



  // Active report mapping for detailed view
  let activeReport = null;
  if (reportData && reportData.report) {
    const r = reportData.report;
    const isFactoryAudit = reportData.type === 'factoryAudit';
    
    // Map correction feedback properly
    const mappedFeedback = (r.correctionFeedback || []).map(fb => ({
      section: fb.section,
      comment: fb.comment,
      priority: fb.priority === "critical" ? "Critical" : "Advisory",
      addedAt: new Date(fb.addedAt).toLocaleString()
    }));

    activeReport = {
      id: r._id,
      displayId: r.reportNumber || r._id,
      clientName: r.generalInfo?.client || "Unknown",
      inspectionType: isFactoryAudit ? "Factory Audit" : (r.title || "Inspection"),
      inspectorName: r.userId?.name || "Unknown",
      submissionDate: new Date(r.submittedAt || r.updatedAt).toLocaleDateString(),
      status: r.operationStatus === "submitted" ? "Pending Review" :
              r.operationStatus === "under_review" ? "Under Review" :
              r.operationStatus === "revision_required" ? `Correction Requested (Round ${r.revisionRound || 1})` :
              r.operationStatus === "approved" ? "Finalized" : r.operationStatus,
      revisionRound: r.revisionRound || 1,
      correctionFeedback: mappedFeedback,
      tmRemarks: r.tmRemarks?.[r.tmRemarks.length - 1]?.text || "",
      templateData: {
        sectionA: { title: "Inspection Summary", fields: { clientName: r.generalInfo?.client || "Unknown", orderNumber: r.generalInfo?.order_number || "N/A", productDescription: r.generalInfo?.product_description || "N/A" } },
        sectionB: { title: "Product Workmanship", fields: {}, notes: "Review workmanship data in full report" },
        sectionC: { title: "Quantity Verification", fields: { cartonCount: r.quantityDetails?.carton_numbers || "N/A" } },
        sectionD: { title: "Measurement & Spec Check", fields: { measurements: [] } },
        sectionE: { title: "Function & Safety Tests", fields: {} },
        sectionF: { title: "Defect Classification", fields: {} },
        sectionG: { title: "Photo Gallery", photos: [] },
        sectionH: { title: "Inspector Declaration", fields: { inspectorName: r.userId?.name } }
      }
    };
  }

  // Section collapsible states
  const [collapsedSections, setCollapsedSections] = useState({
    sectionA: false,
    sectionB: false,
    sectionC: false,
    sectionD: false,
    sectionE: false,
    sectionF: false,
    sectionG: false,
    sectionH: false
  });

  // Local state for overall remarks in sidebar
  const [overallRemarksInput, setOverallRemarksInput] = useState("");

  useEffect(() => {
    if (activeReport) {
      setOverallRemarksInput(activeReport.tmRemarks || "");
      // Reset comments inputs
      const newCommentInputs = {};
      Object.keys(SECTIONS_CONFIG).forEach(key => {
        newCommentInputs[key] = { comment: "", priority: "Critical" };
      });
      setCommentInputs(newCommentInputs);
    }
  }, [activeReportId, activeReport?.id]);

  // Toast adder helper
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Status computation for stats from backend
  const getStats = () => {
    return {
      total: backendStats?.totalReports || 0,
      pending: backendStats?.pendingReview || 0,
      correction: backendStats?.sentForCorrection || 0,
      finalized: backendStats?.finalizedToday || 0
    };
  };

  const stats = getStats();

  // Animation for count ups on Dashboard Screen
  const [animatedStats, setAnimatedStats] = useState({ total: 0, pending: 0, correction: 0, finalized: 0 });

  useEffect(() => {
    if (activeView === "dashboard") {
      const duration = 600;
      const steps = 15;
      const interval = duration / steps;
      let step = 0;
      
      const timer = setInterval(() => {
        step++;
        setAnimatedStats({
          total: Math.round((stats.total / steps) * step),
          pending: Math.round((stats.pending / steps) * step),
          correction: Math.round((stats.correction / steps) * step),
          finalized: Math.round((stats.finalized / steps) * step)
        });
        
        if (step >= steps) {
          setAnimatedStats(stats);
          clearInterval(timer);
        }
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [activeView, reports]);

  // Compute pending review reports count
  const pendingCount = reports.filter(r => r.status === "Pending Review").length;
  
  // Compute unread notification count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle opening a report review interface
  const handleOpenReport = async (reportId) => {
    setActiveReportId(reportId);
    
    // The backend update status will be called if the report is newly opened
    try {
      const token = localStorage.getItem("reportToken");
      const report = reports.find(r => r.id === reportId);
      if (report && report.status === "Pending Review") {
        await fetch(`http://localhost:5000/api/manager/reports/${reportId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: "under_review" })
        });
        
        refetchQueue();
        
        // Add notification locally
        const newNotif = {
          id: `notif-${Date.now()}`,
          message: `Report ${report.displayId} opened. Status: Under Review`,
          reportId: reportId,
          isRead: false,
          createdAt: new Date().toISOString(),
          timeAgo: "Just now",
          type: "review"
        };
        setNotifications(prev => [newNotif, ...prev]);
        addToast(`Report marked as Under Review.`, "info");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Notification helper: mark as read
  const handleMarkAsRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    addToast("All notifications marked as read.", "info");
  };

  // Save section-specific comment
  const saveSectionComment = async (sectionKey) => {
    const input = commentInputs[sectionKey];
    if (!input.comment.trim()) {
      addToast("Comment field cannot be empty.", "error");
      return;
    }

    try {
      await submitFeedback(sectionKey, input.comment.trim(), input.priority.toLowerCase());
      addToast(`Section ${sectionKey.slice(-1).toUpperCase()} comment saved successfully.`, "success");
    } catch (e) {
      addToast("Failed to save comment.", "error");
    }
  };

  // Clear section-specific comment (local only until submitted)
  const clearSectionComment = (sectionKey) => {
    setCommentInputs(prev => ({
      ...prev,
      [sectionKey]: { comment: "", priority: "Critical" }
    }));
    addToast(`Section ${sectionKey.slice(-1).toUpperCase()} comment cleared. Note: you still need to request correction.`, "info");
  };

  // Blur handler for overall remarks auto-save
  const handleRemarksBlur = async () => {
    if (activeReport && overallRemarksInput.trim()) {
      try {
        await addRemark(overallRemarksInput);
        addToast("Remarks auto-saved.", "info");
      } catch (e) {
        // ignore
      }
    }
  };

  // Save internal remarks (no correction cycle)
  const saveInternalRemarksOnly = async () => {
    if (activeReport && overallRemarksInput.trim()) {
      try {
        await addRemark(overallRemarksInput);
        addToast("Internal remarks saved. Inspector has NOT been notified.", "info");
      } catch (e) {
        addToast("Failed to save remarks.", "error");
      }
    }
  };

  // Action: Finalize Report
  const confirmFinalizeReport = async () => {
    if (!activeReport) return;
    
    try {
      await finalizeReport();
      addToast(`Report has been finalized. Admin and Inspector have been notified.`, "success");
      
      // Add notification
      const newNotif = {
        id: `notif-${Date.now()}`,
        message: `Report finalized successfully.`,
        reportId: activeReport.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        timeAgo: "Just now",
        type: "finalize"
      };
      setNotifications(prev => [newNotif, ...prev]);

      setShowFinalizeModal(false);
      setActiveReportId(null);
      refetchQueue();
    } catch (e) {
      addToast("Failed to finalize report.", "error");
    }
  };

  // Action: Request Correction
  const confirmRequestCorrection = async () => {
    if (!activeReport) return;
    
    // We already saved the feedback via saveSectionComment which hit submitFeedback API.
    // The submitFeedback API automatically requests correction on the backend (sets status to revision_required).
    // So we just need to ensure the user knows it's sent.
    
    addToast(`Correction request finalized. Inspector has been notified.`, "warning");
    
    // Add notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      message: `Correction cycle requested.`,
      reportId: activeReport.id,
      isRead: false,
      createdAt: new Date().toISOString(),
      timeAgo: "Just now",
      type: "correction"
    };
    setNotifications(prev => [newNotif, ...prev]);

    setShowCorrectionModal(false);
    setActiveReportId(null);
    refetchQueue();
  };

  // Global Logout triggers
  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
      navigate('/login');
    } else {
      addToast("Logged out successfully.", "success");
      navigate('/login');
    }
  };

  // Unique inspectors list for filters
  const uniqueInspectors = Array.from(new Set(reports.map(r => r.inspectorName)));

  // Filtered reports computed property
  const filteredReports = reports.filter(r => {
    const typeMatch = queueFilters.type === "All" || r.inspectionType === queueFilters.type;
    const statusMatch = queueFilters.status === "All" || r.status === queueFilters.status;
    const inspectorMatch = queueFilters.inspector === "All" || r.inspectorName === queueFilters.inspector;
    
    let dateMatch = true;
    if (queueFilters.fromDate) {
      dateMatch = dateMatch && new Date(r.submissionDate) >= new Date(queueFilters.fromDate);
    }
    if (queueFilters.toDate) {
      dateMatch = dateMatch && new Date(r.submissionDate) <= new Date(queueFilters.toDate);
    }

    return typeMatch && statusMatch && inspectorMatch && dateMatch;
  });

  // Days calculations helper
  const getDaysSinceSubmission = (subDate) => {
    const sub = new Date(subDate);
    const baseline = new Date("2025-01-15");
    const diffTime = baseline - sub;
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  // Style helper for Status badge
  const getStatusBadgeClass = (status) => {
    if (status === "Pending Review") return "bg-orange-50 text-orange-600 border border-orange-200";
    if (status === "Under Review") return "bg-blue-50 text-blue-600 border border-blue-200";
    if (status.includes("Correction Requested (Round 1)")) return "bg-amber-50 text-amber-600 border border-amber-200";
    if (status.includes("Correction Requested (Round 2")) return "bg-rose-50 text-rose-600 border border-rose-200";
    if (status === "Finalized") return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    return "bg-slate-50 text-slate-600 border border-slate-200";
  };

  // Style helper for Inspection Type badge
  const getTypeBadgeClass = (type) => {
    if (type === "PSI") return "bg-blue-50 text-blue-600 border border-blue-200";
    if (type === "CLS") return "bg-purple-50 text-purple-600 border border-purple-200";
    if (type === "DPI") return "bg-orange-50 text-orange-600 border border-orange-200";
    if (type === "Factory Audit") return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (type === "Social Audit") return "bg-teal-50 text-teal-600 border border-teal-200";
    return "bg-slate-50 text-slate-600 border border-slate-200";
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
            onClick={() => { setActiveView("dashboard"); setActiveReportId(null); }}
          />
          {activeReportId && (
            <button 
              onClick={() => setActiveReportId(null)}
              className="ml-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors border-l pl-4 border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Queue</span>
            </button>
          )}
        </div>

        {/* Center: Navigation Links */}
        {!activeReportId && (
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => { setActiveView("dashboard"); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === "dashboard" ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveView("queue"); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === "queue" ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Report Queue</span>
                {pendingCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeView === "queue" ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => { setActiveView("notifications"); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === "notifications" ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeView === "notifications" ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => { setActiveView("profile"); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === "profile" ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 shrink-0" />
                <span>Profile</span>
              </div>
            </button>
          </nav>
        )}

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
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              SC
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-none">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Technical Manager</p>
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
      <main className="flex-1 overflow-y-auto relative p-6 bg-slate-50">
          
          {/* VIEW: DASHBOARD (Home Screen) */}
          {activeView === "dashboard" && !activeReportId && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
              
              {/* Top Welcome Title */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back, Sarah Chen 👋</h1>
                  <p className="text-slate-500 text-sm mt-0.5">Ensure highest compliance. You have {pendingCount} new inspection reports awaiting review today.</p>
                </div>
              </div>

              {/* Summary Cards Row (4 cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Card 1: Total Reports */}
                <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Received</p>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.total}</h3>
                    <p className="text-[11px] text-blue-500 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Updated live</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 2: Pending/Under Review */}
                <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Review</p>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.pending}</h3>
                    <p className="text-[11px] text-orange-500 font-semibold">Active queue</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                {/* Card 3: Correction Requested */}
                <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sent for Correction</p>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.correction}</h3>
                    <p className="text-[11px] text-amber-500 font-semibold">Pending correction</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 4: Finalized */}
                <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Finalized Reports</p>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:scale-105 transition-transform duration-300">{animatedStats.finalized}</h3>
                    <p className="text-[11px] text-emerald-500 font-semibold">Quality stamp approved</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Table section: Recent Reports (Last 5 sorted by submissionDate descending) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Recent Submissions</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Quickly access the newest inspector reports.</p>
                  </div>
                  <button 
                    onClick={() => setActiveView("queue")} 
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View all queue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Report ID</th>
                        <th className="py-3 px-4">Client Name</th>
                        <th className="py-3 px-4">Inspection Type</th>
                        <th className="py-3 px-4">Inspector</th>
                        <th className="py-3 px-4">Submitted Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {[...reports]
                        .sort((a,b) => new Date(b.submissionDate) - new Date(a.submissionDate))
                        .slice(0, 5)
                        .map(report => (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 text-slate-900 font-extrabold">{report.id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-700">{report.clientName}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getTypeBadgeClass(report.inspectionType)}`}>
                                {report.inspectionType}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">{report.inspectorName}</td>
                            <td className="py-3.5 px-4 text-slate-500">{report.submissionDate}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${getStatusBadgeClass(report.status)}`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleOpenReport(report.id)}
                                className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* VIEW: REPORT QUEUE */}
          {activeView === "queue" && !activeReportId && (
            <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
              
              {/* Filter Controls Row */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-100 pb-3">
                  <Filter className="w-4 h-4 text-blue-500" />
                  <span>Queue Filters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  
                  {/* Dropdown: Type */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inspection Type</label>
                    <select
                      value={queueFilters.type}
                      onChange={(e) => setQueueFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="All">All Types</option>
                      <option value="PSI">PSI (Pre-Shipment)</option>
                      <option value="CLS">CLS (Container Loading)</option>
                      <option value="DPI">DPI (During Production)</option>
                      <option value="Factory Audit">Factory Audit</option>
                      <option value="Social Audit">Social Audit</option>
                    </select>
                  </div>

                  {/* Dropdown: Status */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Review Status</label>
                    <select
                      value={queueFilters.status}
                      onChange={(e) => setQueueFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Correction Requested (Round 1)">Correction Requested (Round 1)</option>
                      <option value="Correction Requested (Round 2)">Correction Requested (Round 2)</option>
                      <option value="Finalized">Finalized</option>
                    </select>
                  </div>

                  {/* Dropdown: Inspector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inspector</label>
                    <select
                      value={queueFilters.inspector}
                      onChange={(e) => setQueueFilters(prev => ({ ...prev, inspector: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="All">All Inspectors</option>
                      {uniqueInspectors.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Input: From */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Submitted From</span>
                    </label>
                    <input
                      type="date"
                      value={queueFilters.fromDate}
                      onChange={(e) => setQueueFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600"
                    />
                  </div>

                  {/* Date Input: To */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Submitted To</span>
                    </label>
                    <input
                      type="date"
                      value={queueFilters.toDate}
                      onChange={(e) => setQueueFilters(prev => ({ ...prev, toDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600"
                    />
                  </div>

                </div>

                {/* Filter Cleanup button */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setQueueFilters({ type: "All", status: "All", inspector: "All", fromDate: "", toDate: "" })}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset filters</span>
                  </button>
                </div>

              </div>

              {/* Reports Table Queue */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="overflow-x-auto">
                  {filteredReports.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto border border-slate-100">
                        <Info className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700">No reports found matching filters</h4>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto">Try resetting or modifying your selected inspector, type, or date range.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Report ID</th>
                          <th className="py-3 px-4">Client Name</th>
                          <th className="py-3 px-4">Inspection Type</th>
                          <th className="py-3 px-4">Inspector</th>
                          <th className="py-3 px-4">Submitted Date</th>
                          <th className="py-3 px-4 text-center">Revision Round</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                        {filteredReports.map(report => (
                          <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 text-slate-900 font-extrabold">{report.id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-700">{report.clientName}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getTypeBadgeClass(report.inspectionType)}`}>
                                {report.inspectionType}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">{report.inspectorName}</td>
                            <td className="py-3.5 px-4 text-slate-500">{report.submissionDate}</td>
                            <td className="py-3.5 px-4 text-center">
                              {report.revisionRound === 0 ? (
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">Initial</span>
                              ) : (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">Round {report.revisionRound}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${getStatusBadgeClass(report.status)}`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {report.status === "Finalized" ? (
                                <button
                                  onClick={() => handleOpenReport(report.id)}
                                  className="px-4.5 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200"
                                >
                                  View
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenReport(report.id)}
                                  className="px-4.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100"
                                >
                                  Open Report
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: REPORT REVIEW INTERFACE (Full screen inside main content, replacing the queue) */}
          {activeReportId && activeReport && (
            <div className="h-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto animate-in zoom-in-95 duration-200 overflow-hidden">
              
              {/* LEFT COLUMN: 65% width, Scrollable Report Content */}
              <div className="flex-1 lg:w-[65%] h-full flex flex-col gap-6 overflow-y-auto pr-2 pb-12">
                
                {/* Warning / Feedback banner if returned/revision */}
                {activeReport.revisionRound > 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex gap-3 shadow-sm items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Resubmission — Round {activeReport.revisionRound}</h4>
                      <p className="text-xs text-amber-700 mt-0.5">This report has been resubmitted after corrections. Please review the inspector's updates thoroughly.</p>
                    </div>
                  </div>
                )}

                {activeReport.correctionFeedback.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex gap-3 shadow-sm items-start">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">⚠ Action Required: Correction Feedback Active</h4>
                      <p className="text-xs text-rose-700 mt-0.5">This report contains active correction remarks. Section-specific feedback is shown inline below.</p>
                    </div>
                  </div>
                )}

                {/* Report Header */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Report Details</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeClass(activeReport.inspectionType)}`}>
                          {activeReport.inspectionType}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mt-1">{activeReport.displayId} — {activeReport.clientName}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Current State:</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(activeReport.status)}`}>
                        {activeReport.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-500">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Client Name</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{activeReport.clientName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Lead Inspector</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{activeReport.inspectorName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Submission Date</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{activeReport.submissionDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Revision Round</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">
                        {activeReport.revisionRound === 0 ? "Initial (No corrections)" : `Round ${activeReport.revisionRound}`}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Section-by-Section Collapsible display */}
                <div className="space-y-4">
                  {Object.entries(SECTIONS_CONFIG).map(([sectionKey, config]) => {
                    const sectionData = activeReport.templateData[sectionKey];
                    const isCollapsed = collapsedSections[sectionKey];
                    const SectionIcon = config.icon;
                    
                    // Filter feedback for this section
                    const sectionFeedback = activeReport.correctionFeedback.find(f => f.section === sectionKey);
                    
                    return (
                      <div 
                        key={sectionKey} 
                        className={`bg-white border rounded-3xl shadow-sm transition-all duration-300 ${
                          sectionFeedback ? 'border-rose-200' : 'border-slate-200'
                        }`}
                      >
                        {/* Section Header */}
                        <div 
                          onClick={() => setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                          className="px-6 py-4.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50/50 rounded-t-3xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${sectionFeedback ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
                              <SectionIcon className="w-4 h-4 shrink-0" />
                            </div>
                            <h3 className="font-extrabold text-slate-800 text-sm">{config.label}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {sectionFeedback && (
                              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">FEEDBACK ATTACHED</span>
                            )}
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {!isCollapsed && (
                          <div className="p-6 space-y-6">
                            
                            {/* RENDER FIELD DETAILS FOR SECTIONS */}
                            {sectionKey !== "sectionD" && sectionKey !== "sectionG" && sectionData?.fields && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                                {Object.entries(sectionData.fields).map(([label, val]) => (
                                  <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs py-1.5 border-b border-slate-100/50 last:border-b-0">
                                    <span className="font-extrabold text-slate-400 capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span className={`sm:text-right font-bold mt-1 sm:mt-0 ${
                                      val === "Pass" ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" :
                                      val === "Fail" ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-black" :
                                      "text-slate-700"
                                    }`}>{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section B Notes specific */}
                            {sectionKey === "sectionB" && sectionData?.notes && (
                              <div className="text-xs border-l-4 border-slate-300 pl-3 italic text-slate-500 bg-slate-50 p-3 rounded-r-xl">
                                <strong>Workmanship Notes:</strong> {sectionData.notes}
                              </div>
                            )}

                            {/* Special display: Section D (Measurements Spec table) */}
                            {sectionKey === "sectionD" && sectionData?.fields?.measurements && (
                              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                      <th className="py-2.5 px-3">Parameter Name</th>
                                      <th className="py-2.5 px-3">Required Spec</th>
                                      <th className="py-2.5 px-3">Actual Measured</th>
                                      <th className="py-2.5 px-3 text-center">Result</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-150 font-medium text-slate-600">
                                    {sectionData.fields.measurements.map((m, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 text-slate-800 font-bold">{m.param}</td>
                                        <td className="py-2.5 px-3">{m.spec}</td>
                                        <td className="py-2.5 px-3">{m.actual}</td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            m.result === "Pass" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100 font-extrabold"
                                          }`}>
                                            {m.result}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Special display: Section G (Photos) */}
                            {sectionKey === "sectionG" && sectionData?.photos && (
                              <div className="grid grid-cols-3 gap-4">
                                {sectionData.photos.map((photo, pIdx) => (
                                  <div key={pIdx} className="bg-slate-100 border border-slate-200 rounded-2xl aspect-video flex flex-col items-center justify-center p-3 relative group overflow-hidden">
                                    <Camera className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform duration-200" />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-2 truncate w-full text-center">{photo}</span>
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                      VIEW PHOTO
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Previous TM Feedback display banner */}
                            {sectionFeedback && (
                              <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Active Correction Feedback:</span>
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                                    sectionFeedback.priority === "Critical" ? "bg-rose-500 text-white" : "bg-slate-400 text-white"
                                  }`}>
                                    {sectionFeedback.priority}
                                  </span>
                                </div>
                                <p className="text-xs text-amber-900 leading-relaxed font-medium">{sectionFeedback.comment}</p>
                                <span className="text-[10px] text-amber-500 self-end">Added: {sectionFeedback.addedAt}</span>
                              </div>
                            )}

                            {/* Inline Comments block (only if NOT Finalized) */}
                            {activeReport.status !== "Finalized" && (
                              <div className="border-t border-slate-100 pt-4.5">
                                
                                {/* Toggle block */}
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold text-slate-400">Section Correction Comments</span>
                                  <button
                                    onClick={() => {
                                      // Toggle custom inputs
                                      setCommentInputs(prev => ({
                                        ...prev,
                                        [sectionKey]: { comment: sectionFeedback ? sectionFeedback.comment : "", priority: sectionFeedback ? sectionFeedback.priority : "Critical" }
                                      }));
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  >
                                    <span>{sectionFeedback ? "Edit Section Comment" : "Add Section Comment"}</span>
                                  </button>
                                </div>

                                {/* Inputs panel */}
                                <div className="mt-4 bg-slate-50 border border-slate-150 p-4.5 rounded-2xl space-y-4">
                                  <textarea
                                    placeholder="Write specific correction details or compliance notes..."
                                    value={commentInputs[sectionKey].comment}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setCommentInputs(prev => ({
                                        ...prev,
                                        [sectionKey]: { ...prev[sectionKey], comment: text }
                                      }));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 leading-relaxed"
                                    rows={3}
                                  />

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                      <span className="text-xs font-extrabold text-slate-400">Feedback Priority:</span>
                                      
                                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                                        <input
                                          type="radio"
                                          name={`priority-${sectionKey}`}
                                          value="Critical"
                                          checked={commentInputs[sectionKey].priority === "Critical"}
                                          onChange={() => setCommentInputs(prev => ({
                                            ...prev,
                                            [sectionKey]: { ...prev[sectionKey], priority: "Critical" }
                                          }))}
                                          className="text-rose-500 focus:ring-rose-500 focus:ring-1"
                                        />
                                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Critical Failure</span>
                                      </label>

                                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                                        <input
                                          type="radio"
                                          name={`priority-${sectionKey}`}
                                          value="Advisory"
                                          checked={commentInputs[sectionKey].priority === "Advisory"}
                                          onChange={() => setCommentInputs(prev => ({
                                            ...prev,
                                            [sectionKey]: { ...prev[sectionKey], priority: "Advisory" }
                                          }))}
                                          className="text-slate-500 focus:ring-slate-500 focus:ring-1"
                                        />
                                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Advisory / Quality Warning</span>
                                      </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {sectionFeedback && (
                                        <button
                                          onClick={() => clearSectionComment(sectionKey)}
                                          className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all"
                                        >
                                          Clear Comment
                                        </button>
                                      )}
                                      <button
                                        onClick={() => saveSectionComment(sectionKey)}
                                        className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100"
                                      >
                                        Save Comment
                                      </button>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* RIGHT SIDEBAR: 35% width, Fixed Actions and TM review panel */}
              <div className="w-full lg:w-[35%] h-fit shrink-0 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6">
                
                {/* Inspector Info and Details */}
                <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Inspector & Assignment</span>
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">TM Gatekeeper</span>
                  </div>

                  <div className="space-y-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inspector:</span>
                      <span className="font-bold text-slate-800">{activeReport.inspectorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Submitted:</span>
                      <span className="font-bold text-slate-800">{activeReport.submissionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Revision Round:</span>
                      <span className="font-bold text-slate-800">
                        {activeReport.revisionRound === 0 ? "Initial (Round 0)" : `Round ${activeReport.revisionRound}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/50 pt-2 text-[11px] font-bold text-slate-700">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>Days Since Submission:</span>
                      </span>
                      <span>{getDaysSinceSubmission(activeReport.submissionDate)} days ago</span>
                    </div>
                  </div>
                </div>

                {/* Overall Remarks global feedback */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 block">Overall Remarks (visible to Admin)</label>
                  <textarea
                    placeholder="Provide overarching quality review summary, client notes, or instructions..."
                    value={overallRemarksInput}
                    onChange={(e) => setOverallRemarksInput(e.target.value)}
                    onBlur={handleRemarksBlur}
                    disabled={activeReport.status === "Finalized"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 leading-relaxed disabled:opacity-60"
                    rows={5}
                  />
                  <p className="text-[10px] text-slate-400 italic">This content auto-saves on blur. This remark will be logged directly inside the client report.</p>
                </div>

                {/* Main Action buttons stacked (only show if NOT finalized) */}
                {activeReport.status !== "Finalized" ? (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    
                    {/* BUTTON 1: FINALIZE */}
                    <button
                      onClick={() => setShowFinalizeModal(true)}
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span>FINALIZE REPORT</span>
                    </button>

                    {/* BUTTON 2: REQUEST CORRECTION */}
                    {activeReport.correctionFeedback.length === 0 && !overallRemarksInput.trim() ? (
                      <div className="relative group">
                        <button
                          disabled={true}
                          className="w-full py-3.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                        >
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <span>REQUEST CORRECTION</span>
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center leading-normal">
                          Add at least one section comment or overall remarks before requesting correction
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCorrectionModal(true)}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span>REQUEST CORRECTION</span>
                      </button>
                    )}

                    {/* BUTTON 3: SAVE REMARKS ONLY */}
                    <button
                      onClick={saveInternalRemarksOnly}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-slate-500" />
                      <span>Save Internal Remarks Only</span>
                    </button>

                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4.5 flex gap-3 text-slate-600 text-xs leading-normal">
                    <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-slate-700">Finalized - Read Only Mode</h4>
                      <p className="text-[11px] text-slate-500 mt-1">This report is locked. Visual and workmanship parameters are sealed permanently, and changes cannot be saved.</p>
                    </div>
                  </div>
                )}

                {/* Back button */}
                <button
                  onClick={() => setActiveReportId(null)}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all"
                >
                  ← Back to Queue
                </button>

              </div>

            </div>
          )}

          {/* VIEW: NOTIFICATIONS (Full list view) */}
          {activeView === "notifications" && !activeReportId && (
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Quality Inspection Alerts</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Logs of all submissions, revisions, and corrections.</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      handleMarkAsRead(notif.id);
                      handleOpenReport(notif.reportId);
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-4 items-center hover:bg-slate-50/50 ${
                      notif.isRead 
                        ? 'bg-white border-slate-100 opacity-60' 
                        : 'bg-blue-50/30 border-blue-100 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {/* Icon matching notification type */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.type === 'new' ? 'bg-blue-50 text-blue-600' :
                      notif.type === 'revision' ? 'bg-purple-50 text-purple-600' :
                      notif.type === 'correction' ? 'bg-amber-50 text-amber-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Bell className="w-4 h-4 shrink-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${notif.isRead ? 'text-slate-600 font-medium' : 'text-slate-900 font-bold'} leading-normal`}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{notif.timeAgo}</span>
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* VIEW: PROFILE */}
          {activeView === "profile" && !activeReportId && (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
              
              <div className="text-center space-y-3 pb-6 border-b border-slate-150">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-3xl mx-auto shadow-lg shadow-blue-200">
                  SC
                </div>
                <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
                <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-bold border border-blue-100 uppercase tracking-wider">
                  Quality Gatekeeper — Manager
                </span>
                <p className="text-xs text-slate-400">Sarah Chen holds final review authority across all PSI, CLS, and Social Audit modules.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700">Account Credentials</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
                    <span className="text-slate-400">Registered Email</span>
                    <p className="text-slate-800 font-bold mt-1 text-sm">{currentUser.email}</p>
                  </div>
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
                    <span className="text-slate-400">Assigned Department</span>
                    <p className="text-slate-800 font-bold mt-1 text-sm">Quality Assurance / Verification</p>
                  </div>
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
                    <span className="text-slate-400">Security Clearance</span>
                    <p className="text-slate-800 font-bold mt-1 text-sm">Full Gatekeeper Privilege</p>
                  </div>
                  <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
                    <span className="text-slate-400">Review Hierarchy</span>
                    <p className="text-slate-800 font-bold mt-1 text-sm">Level 3 (Final Sign-off)</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl text-xs text-amber-800 leading-normal flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-900">Privileged Operations Note</h4>
                  <p className="text-[11px] text-amber-700 mt-1">As a Technical Quality Manager, you do not assign inspection agents or schedule customer dates. You serve as the final filter prior to PDF generation for clients.</p>
                </div>
              </div>

            </div>
          )}

        </main>

        {/* ==========================================
            RIGHT SLIDE-IN BELL PANEL (BELL PANEL)
            ========================================== */}
        <div className={`fixed top-0 bottom-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-55 flex flex-col transition-transform duration-300 ease-out transform ${
          notificationsPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          
          <div className="h-16 shrink-0 border-b border-slate-200 px-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <span>Inspection Alerts</span>
            </h3>
            <button 
              onClick={() => setNotificationsPanelOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">No alerts active today.</div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    handleMarkAsRead(notif.id);
                    handleOpenReport(notif.reportId);
                    setNotificationsPanelOpen(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 text-xs leading-normal hover:bg-slate-50 ${
                    notif.isRead ? 'bg-white border-slate-100 opacity-60' : 'bg-blue-50/20 border-blue-100 hover:border-blue-200 font-semibold'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.isRead ? 'bg-slate-300' : 'bg-blue-600'}`}></span>
                  <div className="space-y-1">
                    <p className="text-slate-800">{notif.message}</p>
                    <span className="text-[10px] text-slate-400">{notif.timeAgo}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {unreadCount > 0 && (
            <div className="p-4 border-t border-slate-150 bg-slate-50 shrink-0">
              <button
                onClick={handleMarkAllRead}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-100 hover:bg-blue-700 transition-all text-center"
              >
                Mark all as read
              </button>
            </div>
          )}

        </div>

      {/* ==========================================
          MODALS & TOASTS
          ========================================== */}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[3000] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4.5 py-3 rounded-2xl shadow-xl transition-all duration-300 transform scale-100 pointer-events-auto max-w-sm ${
              toast.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-200/50' :
              toast.type === 'warning' ? 'bg-amber-500 text-white shadow-amber-200/50' :
              toast.type === 'error' ? 'bg-rose-500 text-white shadow-rose-200/50' :
              'bg-blue-500 text-white shadow-blue-200/50'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {toast.type === 'error' && <X className="w-5 h-5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
            <span className="text-xs font-bold leading-normal">{toast.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
              className="text-white hover:opacity-80 transition-opacity ml-auto"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal 1: Finalize Report Confirmation */}
      {showFinalizeModal && activeReport && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFinalizeModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            
            <h3 className="text-lg font-black text-slate-800 text-center mb-2">
              Finalize Audit Report?
            </h3>
            <p className="text-slate-500 text-center text-xs mb-6 leading-relaxed">
              Are you sure you want to finalize report <strong className="text-slate-800">{activeReport.id}</strong>? This action is permanent, locks parameters, and immediately notifies the Admin.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalizeReport}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
              >
                Yes, Finalize Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Request Correction Confirmation */}
      {showCorrectionModal && activeReport && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCorrectionModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            
            <div className="shrink-0 text-center mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-base font-black text-slate-800">
                Send Correction Cycle to {activeReport.inspectorName}?
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                They will receive a notification with the following section comments attached:
              </p>
            </div>

            {/* List of comments summary */}
            <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl p-4.5 bg-slate-50/50 space-y-3 mb-6">
              
              {/* Section comments */}
              {activeReport.correctionFeedback.length > 0 ? (
                activeReport.correctionFeedback.map(f => (
                  <div key={f.section} className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-normal">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5 font-bold">
                      <span className="text-slate-800 capitalize">{f.section.replace("section", "Section ")}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                        f.priority === 'Critical' ? 'bg-rose-50 text-rose-600 font-extrabold' : 'bg-slate-100 text-slate-600'
                      }`}>{f.priority}</span>
                    </div>
                    <p className="text-slate-600 font-medium">{f.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center text-xs italic">No section-specific comments added.</p>
              )}

              {/* Overall remarks */}
              {overallRemarksInput.trim() && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs leading-normal">
                  <div className="border-b border-slate-100 pb-1.5 mb-1.5 font-bold text-slate-800">
                    Overall Remarks (Admin & Inspector visible)
                  </div>
                  <p className="text-slate-600 font-medium">{overallRemarksInput}</p>
                </div>
              )}

            </div>
            
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs transition-all border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRequestCorrection}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-amber-100 transition-all active:scale-[0.98]"
              >
                Send Request
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}