import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import AdminNavbar from '../components/AdminNavbar';
import AdminQueueView from '../components/AdminQueueView';
import AssignTMModal from '../components/AssignTMModal';
import { useAdminReportQueue } from '../hooks/useAdminReportQueue';
import useToast from '../../../hooks/useToast';
import ToastList from '../../../components/shared/ToastList';

const mapStatusToBackend = (status) => {
  if (status === 'Pending Review') return 'submitted';
  if (status === 'In Review') return 'under_review';
  if (status === 'Rejected (Round 1)' || status === 'Rejected (Round 2)') return 'revision_required';
  if (status === 'Approved') return 'approved';
  return 'all';
};

const mapTypeToBackend = (type) => {
  if (type === 'Factory Audit') return 'factory_audit';
  if (type === 'All') return 'all';
  return type;
};

export default function AdminReportQueue() {
  const navigate = useNavigate();

  const [queueFilters, setQueueFilters] = useState({
    type: 'All', status: 'All', inspector: 'All', fromDate: '', toDate: '', reviewedBy: 'All',
  });

  const { reports: backendReports, stats: backendStats, refetch: refetchQueue } = useAdminReportQueue({
    status: mapStatusToBackend(queueFilters.status),
    type: mapTypeToBackend(queueFilters.type),
  });

  const [assignModal, setAssignModal] = useState({ open: false, reportId: null, reportDisplayId: null });
  const { toasts, addToast, dismiss: dismissToast } = useToast();

  const reports = useMemo(() => (backendReports || []).map(r => ({
    id: r.id,
    displayId: r.reportId,
    clientName: r.clientName,
    inspectionType: r.inspectionType,
    inspectorName: r.inspectorName,
    submissionDate: new Date(r.submittedAt).toLocaleDateString(),
    status:
      r.status === 'submitted'         ? 'Pending Review' :
      r.status === 'under_review'      ? 'In Review' :
      r.status === 'revision_required' ? `Rejected (Round ${r.revisionRound})` :
      r.status === 'approved'          ? 'Approved' : r.status,
    revisionRound: r.revisionRound,
    assignedTMName: r.assignedTMName,
    reviewedByName: r.reviewedByName,
  })), [backendReports]);

  const filteredReports = useMemo(() => reports.filter(r => {
    const typeMatch      = queueFilters.type       === 'All' || r.inspectionType  === queueFilters.type;
    const statusMatch    = queueFilters.status     === 'All' || r.status          === queueFilters.status;
    const inspectorMatch = queueFilters.inspector  === 'All' || r.inspectorName   === queueFilters.inspector;
    const reviewerMatch  = queueFilters.reviewedBy === 'All' ||
      r.assignedTMName === queueFilters.reviewedBy || r.reviewedByName === queueFilters.reviewedBy;
    let dateMatch = true;
    if (queueFilters.fromDate) dateMatch = dateMatch && new Date(r.submissionDate) >= new Date(queueFilters.fromDate);
    if (queueFilters.toDate)   dateMatch = dateMatch && new Date(r.submissionDate) <= new Date(queueFilters.toDate);
    return typeMatch && statusMatch && inspectorMatch && reviewerMatch && dateMatch;
  }), [reports, queueFilters]);

  const uniqueInspectors = useMemo(() => Array.from(new Set(reports.map(r => r.inspectorName))), [reports]);
  const uniqueReviewers  = useMemo(() =>
    Array.from(new Set(reports.flatMap(r => [r.assignedTMName, r.reviewedByName].filter(Boolean)))),
    [reports]
  );

  const pendingCount = backendStats?.pendingReview || 0;

  const handleAssignTM = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setAssignModal({ open: true, reportId, reportDisplayId: report?.displayId });
  };

  const handleAssignSuccess = (updatedReport) => {
    setAssignModal({ open: false, reportId: null, reportDisplayId: null });
    refetchQueue();
    addToast(`Report assigned to ${updatedReport.assignedTMName}.`, 'success');
  };

  // "Open Report" navigates to the TM dashboard instead of opening inline
  // review, deep-linking to the specific report so it opens automatically.
  const handleOpenReport = (reportId) => {
    navigate(reportId ? `/dashboard/manager?report=${reportId}` : '/dashboard/manager');
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      <AdminNavbar
        activeView={null}
        stats={{ readyToDeliver: 0, pendingReports: pendingCount }}
      />

      <main className="flex-1 overflow-y-auto bg-[#F4F5F7]">
        <AdminQueueView
          queueFilters={queueFilters}
          setQueueFilters={setQueueFilters}
          uniqueInspectors={uniqueInspectors}
          uniqueReviewers={uniqueReviewers}
          filteredReports={filteredReports}
          handleOpenReport={handleOpenReport}
          onAssignTM={handleAssignTM}
        />
      </main>

      {assignModal.open && (
        <AssignTMModal
          reportId={assignModal.reportId}
          reportDisplayId={assignModal.reportDisplayId}
          onClose={() => setAssignModal({ open: false, reportId: null, reportDisplayId: null })}
          onSuccess={handleAssignSuccess}
        />
      )}

      {toasts.length > 0 && (
        <ToastList toasts={toasts} dismiss={dismissToast} />
      )}
    </div>
  );
}
