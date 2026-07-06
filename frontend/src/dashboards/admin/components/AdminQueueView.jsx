import React from 'react';
import { Filter, FileX } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusBadgeStyle = (status) => {
  if (status === 'Pending Review') return { background: '#FEF3C7', color: '#92400E' };
  if (status === 'In Review' || status === 'Under Review') return { background: '#DBEAFE', color: '#1E40AF' };
  if (status?.includes('Rejected')) return { background: '#FEE2E2', color: '#991B1B' };
  if (status === 'Approved') return { background: '#D1FAE5', color: '#065F46' };
  return { background: '#F3F4F6', color: '#374151' };
};

const getRevisionBadgeStyle = (round) => {
  if (round >= 3) return { background: '#FEF3C7', color: '#92400E' };
  if (round >= 2) return { background: '#FEE2E2', color: '#991B1B' };
  return { background: '#DBEAFE', color: '#1E40AF' };
};

const filterSelectClass = [
  'w-full border border-gray-200 rounded-lg px-3 py-2',
  'text-sm bg-white focus:outline-none',
  'focus:ring-2 focus:ring-purple-500 focus:border-transparent',
].join(' ');

function AdminQueueView({
  queueFilters,
  setQueueFilters,
  uniqueInspectors,
  uniqueReviewers,
  filteredReports,
  handleOpenReport,
  onAssignTM,
}) {
  const resetFilters = () =>
    setQueueFilters({ type: 'All', status: 'All', inspector: 'All', fromDate: '', toDate: '', reviewedBy: 'All' });

  const getActionButton = (report) => {
    if (report.status === 'Pending Review') {
      return (
        <button
          onClick={() => onAssignTM(report.id)}
          className="hover:opacity-90 transition-opacity"
          style={{ fontSize: '13px', fontWeight: 500, color: 'white', background: '#F59E0B', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Assign to TM
        </button>
      );
    }
    if (report.status === 'Approved') {
      return (
        <button
          onClick={() => handleOpenReport(report.id)}
          className="hover:opacity-90 transition-opacity"
          style={{ fontSize: '13px', fontWeight: 500, color: 'white', background: '#10B981', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          View Report
        </button>
      );
    }
    return (
      <button
        onClick={() => handleOpenReport(report.id)}
        className="hover:bg-[#5538E0] transition-colors"
        style={{ fontSize: '13px', fontWeight: 500, color: 'white', background: '#6C47FF', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Open Report
      </button>
    );
  };

  return (
    <div className="px-6 py-8 animate-in fade-in duration-300 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Report Queue</h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>All inspector submissions across the platform</p>
        </div>
        <span style={{ background: '#EDE9FE', color: '#6C47FF', borderRadius: '9999px', padding: '4px 12px', fontSize: '14px', fontWeight: 500, flexShrink: 0 }}>
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} color="#6C47FF" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Queue Filters</span>
          </div>
          <button
            onClick={resetFilters}
            className="hover:underline"
            style={{ fontSize: '13px', color: '#6C47FF', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Inspection Type</label>
            <select value={queueFilters.type} onChange={(e) => setQueueFilters(prev => ({ ...prev, type: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All Types</option>
              <option value="PSI">PSI (Pre-Shipment)</option>
              <option value="CLS">CLS (Container Loading)</option>
              <option value="DPI">DPI (During Production)</option>
              <option value="Factory Audit">Factory Audit</option>
              <option value="Social Audit">Social Audit</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Review Status</label>
            <select value={queueFilters.status} onChange={(e) => setQueueFilters(prev => ({ ...prev, status: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="In Review">In Review</option>
              <option value="Rejected (Round 1)">Rejected (Round 1)</option>
              <option value="Rejected (Round 2)">Rejected (Round 2)</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Inspector</label>
            <select value={queueFilters.inspector} onChange={(e) => setQueueFilters(prev => ({ ...prev, inspector: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All Inspectors</option>
              {uniqueInspectors.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Submitted From</label>
            <input type="date" value={queueFilters.fromDate} onChange={(e) => setQueueFilters(prev => ({ ...prev, fromDate: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Submitted To</label>
            <input type="date" value={queueFilters.toDate} onChange={(e) => setQueueFilters(prev => ({ ...prev, toDate: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Reviewed By</label>
            <select value={queueFilters.reviewedBy} onChange={(e) => setQueueFilters(prev => ({ ...prev, reviewedBy: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All TMs</option>
              {uniqueReviewers.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileX size={48} color="#9CA3AF" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>No reports found</h4>
            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 16px' }}>Try adjusting your filters</p>
            <button onClick={resetFilters} className="hover:bg-[#F5F3FF] transition-colors" style={{ fontSize: '14px', color: '#6C47FF', fontWeight: 500, border: '1px solid #6C47FF', background: 'white', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer' }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {[
                    { label: 'REPORT ID', center: false },
                    { label: 'CLIENT NAME', center: false },
                    { label: 'INSPECTION TYPE', center: false },
                    { label: 'INSPECTOR', center: false },
                    { label: 'SUBMITTED DATE', center: false },
                    { label: 'REVISION ROUND', center: true },
                    { label: 'STATUS', center: false },
                    { label: 'REVIEWED BY', center: false },
                    { label: 'ACTIONS', center: true },
                  ].map(({ label, center }) => (
                    <th key={label} style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500, textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => {
                  const displayReviewer = report.assignedTMName || report.reviewedByName;
                  return (
                    <tr key={report.id} className="hover:bg-[#F5F3FF] transition-colors" style={{ background: idx % 2 === 0 ? '#ffffff' : '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>

                      {/* Report ID */}
                      <td style={{ padding: '14px 20px' }}>
                        <span title={report.displayId || report.id} style={{ fontFamily: 'monospace', fontSize: '13px', color: '#374151' }}>
                          {(() => { const id = report.displayId || report.id || ''; return id.length > 14 ? `${id.substring(0, 14)}...` : id; })()}
                        </span>
                      </td>

                      {/* Client Name */}
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{report.clientName}</td>

                      {/* Inspection Type */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ background: '#F3F4F6', color: '#374151', fontSize: '12px', padding: '4px 10px', borderRadius: '9999px', display: 'inline-block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(report.inspectionType || '').length > 30 ? `${report.inspectionType.substring(0, 30)}...` : (report.inspectionType || '—')}
                        </span>
                      </td>

                      {/* Inspector */}
                      <td style={{ padding: '14px 20px' }}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EDE9FE', color: '#6C47FF', fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getInitials(report.inspectorName)}
                          </div>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{report.inspectorName}</span>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {formatDate(report.submissionDate)}
                      </td>

                      {/* Revision Round */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {!report.revisionRound || report.revisionRound === 0 ? (
                          <span style={{ background: '#F3F4F6', color: '#374151', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px' }}>Initial</span>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px', ...getRevisionBadgeStyle(report.revisionRound) }}>Round {report.revisionRound}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px', display: 'inline-block', whiteSpace: 'nowrap', ...getStatusBadgeStyle(report.status) }}>
                          {report.status}
                        </span>
                      </td>

                      {/* Reviewed By */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: displayReviewer ? '#374151' : '#9CA3AF' }}>
                        {displayReviewer || 'Unassigned'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {getActionButton(report)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(AdminQueueView);
