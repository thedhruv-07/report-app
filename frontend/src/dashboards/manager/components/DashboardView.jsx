import React from 'react';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Smile
} from 'lucide-react';

const getInspectorInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};

const formatSubmissionDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusBadgeStyle = (status) => {
  if (status === 'Pending Review') return { background: '#FEF3C7', color: '#92400E' };
  if (status === 'Under Review' || status === 'In Review') return { background: '#DBEAFE', color: '#1E40AF' };
  if (status?.includes('Correction')) return { background: '#FEE2E2', color: '#991B1B' };
  if (status === 'Finalized') return { background: '#D1FAE5', color: '#065F46' };
  return { background: '#F3F4F6', color: '#374151' };
};

function DashboardView({ pendingCount, animatedStats, reports, setActiveView, handleOpenReport, userName }) {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const sortedReports = [...reports]
    .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
    .slice(0, 5);

  return (
    <div className="px-6 py-8 animate-in fade-in duration-300 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* SECTION 1 — Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
            Welcome back, {userName || 'Manager'} 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '6px' }}>
            <span style={{ fontWeight: 700, color: '#6C47FF' }}>{pendingCount}</span> reports awaiting your review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>{todayFormatted}</span>
          <button
            onClick={() => window.location.reload()}
            title="Refresh"
            className="hover:bg-gray-50 transition-colors"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', color: '#6B7280',
              flexShrink: 0
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* SECTION 2 — Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1 — Total Received */}
        <div
          className="bg-white rounded-r-xl shadow-sm relative overflow-hidden"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #6C47FF' }}
        >
          <div className="flex items-start justify-between p-5">
            <div>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500, marginBottom: '8px' }}>TOTAL RECEIVED</p>
              <h3 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1, margin: 0 }}>{animatedStats.total}</h3>
              <p style={{ fontSize: '12px', color: '#6C47FF', marginTop: '8px', fontWeight: 500 }}>↑ Updated live</p>
            </div>
            <ClipboardList size={28} color="#6C47FF" style={{ flexShrink: 0 }} />
          </div>
        </div>

        {/* Card 2 — Pending Review */}
        <div
          className="bg-white rounded-r-xl shadow-sm relative overflow-hidden"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #F59E0B' }}
        >
          <div className="flex items-start justify-between p-5">
            <div>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500, marginBottom: '8px' }}>PENDING REVIEW</p>
              <h3 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1, margin: 0 }}>{animatedStats.pending}</h3>
              <p style={{ fontSize: '12px', color: '#F59E0B', marginTop: '8px', fontWeight: 500 }}>Active queue</p>
            </div>
            <Clock size={28} color="#F59E0B" style={{ flexShrink: 0 }} />
          </div>
        </div>

        {/* Card 3 — Sent for Correction */}
        <div
          className="bg-white rounded-r-xl shadow-sm relative overflow-hidden"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #EF4444' }}
        >
          <div className="flex items-start justify-between p-5">
            <div>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500, marginBottom: '8px' }}>SENT FOR CORRECTION</p>
              <h3 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1, margin: 0 }}>{animatedStats.correction}</h3>
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '8px', fontWeight: 500 }}>Needs inspector action</p>
            </div>
            <AlertTriangle size={28} color="#EF4444" style={{ flexShrink: 0 }} />
          </div>
        </div>

        {/* Card 4 — Finalized Reports */}
        <div
          className="bg-white rounded-r-xl shadow-sm relative overflow-hidden"
          style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #10B981' }}
        >
          <div className="flex items-start justify-between p-5">
            <div>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500, marginBottom: '8px' }}>FINALIZED REPORTS</p>
              <h3 style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1, margin: 0 }}>{animatedStats.finalized}</h3>
              <p style={{ fontSize: '12px', color: '#10B981', marginTop: '8px', fontWeight: 500 }}>Quality stamp approved</p>
            </div>
            <CheckCircle size={28} color="#10B981" style={{ flexShrink: 0 }} />
          </div>
        </div>

      </div>

      {/* SECTION 3 — Recent Submissions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>

        {/* Card Header */}
        <div className="flex items-start justify-between px-6 py-4">
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#111827', margin: 0 }}>Recent Submissions</h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>Quickly access the newest inspector reports.</p>
          </div>
          <button
            onClick={() => setActiveView('queue')}
            className="hover:underline"
            style={{ fontSize: '13px', color: '#6C47FF', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            View all in queue →
          </button>
        </div>
        <div style={{ borderBottom: '1px solid #F3F4F6' }} />

        {/* Empty State */}
        {sortedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Smile size={48} color="#6C47FF" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>All caught up!</h4>
            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>No reports pending review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {['REPORT ID', 'CLIENT / PO', 'INSPECTION TYPE', 'INSPECTOR', 'DATE', 'STATUS', 'ACTION'].map(col => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 24px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#6B7280',
                        fontWeight: 500,
                        textAlign: 'left',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report, idx) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[#F5F3FF] transition-colors"
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#FAFAFA',
                      borderBottom: '1px solid #F3F4F6'
                    }}
                  >
                    {/* Report ID */}
                    <td style={{ padding: '16px 24px' }}>
                      <span
                        title={report.displayId || report.id}
                        style={{ fontFamily: 'monospace', fontSize: '13px', color: '#374151' }}
                      >
                        {(() => {
                          const id = report.displayId || report.id || '';
                          return id.length > 14 ? `${id.substring(0, 14)}...` : id;
                        })()}
                      </span>
                    </td>

                    {/* Client / PO */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{report.clientName}</div>
                      {report.poNumber && (
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{report.poNumber}</div>
                      )}
                    </td>

                    {/* Inspection Type */}
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        background: '#F3F4F6',
                        color: '#374151',
                        fontSize: '12px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        display: 'inline-block',
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {(report.inspectionType || '').length > 30
                          ? `${report.inspectionType.substring(0, 30)}...`
                          : (report.inspectionType || '—')
                        }
                      </span>
                    </td>

                    {/* Inspector */}
                    <td style={{ padding: '16px 24px' }}>
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: '#EDE9FE', color: '#6C47FF',
                          fontWeight: 600, fontSize: '11px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {getInspectorInitials(report.inspectorName)}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{report.inspectorName}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '16px 24px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {formatSubmissionDate(report.submissionDate)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 500,
                        padding: '4px 12px', borderRadius: '9999px',
                        display: 'inline-block', whiteSpace: 'nowrap',
                        ...getStatusBadgeStyle(report.status)
                      }}>
                        {report.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        onClick={() => handleOpenReport(report.id)}
                        className="hover:bg-[#5538E0] transition-colors"
                        style={{
                          background: '#6C47FF', color: 'white',
                          fontSize: '14px', padding: '6px 16px',
                          borderRadius: '8px', fontWeight: 500,
                          border: 'none', cursor: 'pointer'
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default React.memo(DashboardView);
