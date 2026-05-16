import React from 'react';

export default function ReportCard({ report, onViewReport, onQuickPreview }) {
  const getBadgeColor = (type) => {
    switch(type) {
      case 'PSI': return '#3B82F6';
      case 'CLS': return '#10B981';
      case 'DPI': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return { bg: '#E5E7EB', text: '#374151', label: 'Pending Review' };
      case 'under_review': return { bg: '#FEF3C7', text: '#D97706', label: 'Under Review' };
      case 'revision_required': return { bg: '#FEE2E2', text: '#DC2626', label: 'Correction Requested' };
      case 'approved': return { bg: '#D1FAE5', text: '#059669', label: 'Finalized' };
      default: return { bg: '#E5E7EB', text: '#374151', label: status };
    }
  };

  const statusInfo = getStatusColor(report.status);

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>{report.reportId}</span>
            <span style={{ background: getBadgeColor(report.inspectionType), color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
              {report.inspectionType}
            </span>
            <span style={{ background: statusInfo.bg, color: statusInfo.text, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
              {statusInfo.label}
            </span>
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1F2937' }}>{report.clientName}</h3>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#4B5563' }}>Inspector: <strong>{report.inspectorName}</strong></p>
          <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#6B7280', marginTop: '10px' }}>
            <span>📅 Submitted: {new Date(report.submittedAt).toLocaleString()}</span>
            <span>🔄 Round {report.revisionRound} {report.revisionRound === 1 ? '(Initial)' : '(Resubmission)'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onQuickPreview(report.id)} style={{ padding: '8px 16px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#374151', fontWeight: '600', cursor: 'pointer' }}>
            Quick Preview
          </button>
          <button onClick={() => onViewReport(report.id)} style={{ padding: '8px 16px', background: '#0052CC', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
            View Full Report
          </button>
        </div>

      </div>
    </div>
  );
}