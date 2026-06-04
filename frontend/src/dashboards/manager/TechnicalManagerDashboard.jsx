import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
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

const DashboardView = lazy(() => import('./components/DashboardView'));
const QueueView = lazy(() => import('./components/QueueView'));
const ReviewContentPane = lazy(() => import('./components/ReviewContentPane'));
const ReviewActionsSidebar = lazy(() => import('./components/ReviewActionsSidebar'));
const ManagerChrome = lazy(() => import('./components/ManagerChrome'));

export default function TechnicalManagerDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  
  const currentUser = auth?.user || {
    name: "Technical Manager",
    role: "manager",
    email: ""
  };

  const { unreadCount: systemUnreadCount, bellNotifications, markAsRead: markSystemAsRead, markAllAsRead: markAllSystemRead, fetchNotifications } = useNotifications();

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
  const { reportData, submitFeedback, finalizeReport, addRemark } = useReportReview(activeReportId);

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

  // DB-backed notifications from SystemNotification (task accept, report submit, etc.)
  const notifications = bellNotifications.map(n => ({
    id: n._id,
    message: n.message,
    reportId: null,
    isRead: false,
    createdAt: n.createdAt,
    timeAgo: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recently',
    type: n.type || 'info',
  }));

  // Wire real-time socket notifications — just refresh DB notifications on new events
  useManagerNotifications((newNotif) => {
    fetchNotifications();
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

  const activeReportRemarks = activeReport?.tmRemarks || "";

  useEffect(() => {
    if (activeReportId) {
      setOverallRemarksInput(activeReportRemarks);
      // Reset comments inputs
      const newCommentInputs = {};
      Object.keys(SECTIONS_CONFIG).forEach(key => {
        newCommentInputs[key] = { comment: "", priority: "Critical" };
      });
      setCommentInputs(newCommentInputs);
    }
  }, [activeReportId, activeReportRemarks]);

  // Toast adder helper
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Status computation for stats from backend
  const stats = useMemo(() => ({
    total: backendStats?.totalReports || 0,
    pending: backendStats?.pendingReview || 0,
    correction: backendStats?.sentForCorrection || 0,
    finalized: backendStats?.finalizedToday || 0
  }), [backendStats]);

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
  }, [activeView, reports, stats]);

  // Compute pending review reports count
  const pendingCount = reports.filter(r => r.status === "Pending Review").length;
  
  const unreadCount = systemUnreadCount;

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
    markSystemAsRead(notifId);
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    markAllSystemRead(bellNotifications.map(n => n._id));
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
    } catch {
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
      } catch {
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
      } catch {
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
    } catch {
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
      <Suspense fallback={<div className="h-16 shrink-0 bg-white border-b border-slate-200 animate-pulse" />}>
        <ManagerChrome
          currentUser={currentUser}
          activeView={activeView}
          activeReportId={activeReportId}
          pendingCount={pendingCount}
          unreadCount={unreadCount}
          systemUnreadCount={systemUnreadCount}
          notificationsPanelOpen={notificationsPanelOpen}
          notifications={notifications}
          toasts={toasts}
          activeReport={activeReport}
          overallRemarksInput={overallRemarksInput}
          showFinalizeModal={showFinalizeModal}
          showCorrectionModal={showCorrectionModal}
          setActiveView={setActiveView}
          setActiveReportId={setActiveReportId}
          setNotificationsPanelOpen={setNotificationsPanelOpen}
          handleLogout={handleLogout}
          handleMarkAsRead={handleMarkAsRead}
          handleOpenReport={handleOpenReport}
          handleMarkAllRead={handleMarkAllRead}
          setToasts={setToasts}
          setShowFinalizeModal={setShowFinalizeModal}
          setShowCorrectionModal={setShowCorrectionModal}
          confirmFinalizeReport={confirmFinalizeReport}
          confirmRequestCorrection={confirmRequestCorrection}
        />
      </Suspense>

      {/* ==========================================
          MAIN AREA CONTENT
          ========================================== */}
      <main className="flex-1 overflow-y-auto relative p-6 bg-slate-50">
          
          {/* VIEW: DASHBOARD (Home Screen) */}
          {activeView === "dashboard" && !activeReportId && (
            <Suspense fallback={<div className="max-w-6xl mx-auto h-144 bg-white border border-slate-200 rounded-3xl animate-pulse" />}>
              <DashboardView
                pendingCount={pendingCount}
                animatedStats={animatedStats}
                reports={reports}
                setActiveView={setActiveView}
                handleOpenReport={handleOpenReport}
                getTypeBadgeClass={getTypeBadgeClass}
                getStatusBadgeClass={getStatusBadgeClass}
              />
            </Suspense>
          )}

          {/* VIEW: REPORT QUEUE */}
          {activeView === "queue" && !activeReportId && (
            <Suspense fallback={<div className="max-w-6xl mx-auto h-144 bg-white border border-slate-200 rounded-3xl animate-pulse" />}>
              <QueueView
                queueFilters={queueFilters}
                setQueueFilters={setQueueFilters}
                uniqueInspectors={uniqueInspectors}
                filteredReports={filteredReports}
                handleOpenReport={handleOpenReport}
                getTypeBadgeClass={getTypeBadgeClass}
                getStatusBadgeClass={getStatusBadgeClass}
              />
            </Suspense>
          )}

          {/* VIEW: REPORT REVIEW INTERFACE (Full screen inside main content, replacing the queue) */}
          {activeReportId && activeReport && (
            <Suspense
              fallback={(
                <div className="h-full max-w-7xl mx-auto animate-pulse space-y-6">
                  <div className="h-40 bg-white border border-slate-200 rounded-3xl" />
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_35%] gap-6">
                    <div className="h-160 bg-white border border-slate-200 rounded-3xl" />
                    <div className="h-128 bg-white border border-slate-200 rounded-3xl" />
                  </div>
                </div>
              )}
            >
              <div className="h-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto animate-in zoom-in-95 duration-200 overflow-hidden">
                <ReviewContentPane
                  activeReport={activeReport}
                  collapsedSections={collapsedSections}
                  setCollapsedSections={setCollapsedSections}
                  commentInputs={commentInputs}
                  setCommentInputs={setCommentInputs}
                  clearSectionComment={clearSectionComment}
                  saveSectionComment={saveSectionComment}
                  SECTIONS_CONFIG={SECTIONS_CONFIG}
                  getTypeBadgeClass={getTypeBadgeClass}
                  getStatusBadgeClass={getStatusBadgeClass}
                />

                <ReviewActionsSidebar
                  activeReport={activeReport}
                  overallRemarksInput={overallRemarksInput}
                  setOverallRemarksInput={setOverallRemarksInput}
                  handleRemarksBlur={handleRemarksBlur}
                  saveInternalRemarksOnly={saveInternalRemarksOnly}
                  setShowFinalizeModal={setShowFinalizeModal}
                  setShowCorrectionModal={setShowCorrectionModal}
                  setActiveReportId={setActiveReportId}
                  getDaysSinceSubmission={getDaysSinceSubmission}
                />
              </div>
            </Suspense>
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
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-white text-3xl mx-auto shadow-lg shadow-blue-200">
                  SC
                </div>
                <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
                <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-bold border border-blue-100 uppercase tracking-wider">
                  Quality Gatekeeper — Manager
                </span>
                <p className="text-xs text-slate-400">{currentUser.name} holds final review authority across all PSI, CLS, and Social Audit modules.</p>
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

      {/* overlays are rendered by ManagerChrome */}

    </div>
  );
}