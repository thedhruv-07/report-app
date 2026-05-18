const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'dashboards', 'manager');

const writeComponent = (name, content) => {
  fs.writeFileSync(path.join(baseDir, 'components', name), content);
};

// --- SummaryCards.jsx ---
writeComponent('SummaryCards.jsx', `import React from 'react';

const Card = ({ title, value, subtitle, color, icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: '#fff', padding: '20px', borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer',
      display: 'flex', alignItems: 'flex-start', gap: '15px',
      borderLeft: \`4px solid \${color}\`, transition: 'transform 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ fontSize: '24px', background: \`\${color}15\`, padding: '12px', borderRadius: '10px' }}>{icon}</div>
    <div>
      <h3 style={{ margin: 0, fontSize: '28px', color: '#1F2937' }}>{value}</h3>
      <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: color, fontSize: '14px' }}>{title}</p>
      <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '12px' }}>{subtitle}</p>
    </div>
  </div>
);

export default function SummaryCards({ stats = {}, onCardClick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <Card 
        title="Total Received" value={stats.totalReports || 0} subtitle="All-time reports"
        color="#0052CC" icon="📋" onClick={() => onCardClick('all')} 
      />
      <Card 
        title="Pending Review" value={stats.pendingReview || 0} subtitle="Awaiting your review"
        color="#F59E0B" icon="⏳" onClick={() => onCardClick('pending_review')} 
      />
      <Card 
        title="Correction Sent" value={stats.sentForCorrection || 0} subtitle="Awaiting resubmission"
        color="#DC2626" icon="🔄" onClick={() => onCardClick('correction_requested')} 
      />
      <Card 
        title="Finalized Today" value={stats.finalizedToday || 0} subtitle="Approved in last 24h"
        color="#10B981" icon="✅" onClick={() => onCardClick('finalized_today')} 
      />
    </div>
  );
}`);

// --- ReportCard.jsx ---
writeComponent('ReportCard.jsx', `import React from 'react';

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
      case 'pending_review': return { bg: '#E5E7EB', text: '#374151', label: 'Pending Review' };
      case 'under_review': return { bg: '#FEF3C7', text: '#D97706', label: 'Under Review' };
      case 'correction_requested': return { bg: '#FEE2E2', text: '#DC2626', label: 'Correction Requested' };
      case 'finalized': return { bg: '#D1FAE5', text: '#059669', label: 'Finalized' };
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
}`);

// --- ReportQueue.jsx ---
writeComponent('ReportQueue.jsx', `import React, { useState } from 'react';
import ReportCard from './ReportCard';
import FilterSortControls from './FilterSortControls';

export default function ReportQueue({ onReportClick }) {
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });
  
  // Mock Data
  const mockReports = [
    { id: '1', reportId: 'RPT-PSI-001245', clientName: 'Acme Corp', inspectionType: 'PSI', inspectorName: 'John Doe', submittedAt: new Date().toISOString(), status: 'pending_review', revisionRound: 1 },
    { id: '2', reportId: 'RPT-CLS-001246', clientName: 'Global Tech', inspectionType: 'CLS', inspectorName: 'Jane Smith', submittedAt: new Date(Date.now() - 86400000).toISOString(), status: 'under_review', revisionRound: 2 },
    { id: '3', reportId: 'RPT-DPI-001247', clientName: 'Mega Build', inspectionType: 'DPI', inspectorName: 'Mike Johnson', submittedAt: new Date(Date.now() - 172800000).toISOString(), status: 'correction_requested', revisionRound: 1 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1F2937' }}>Report Queue</h2>
        <FilterSortControls filters={filters} setFilters={setFilters} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {mockReports.map(report => (
          <ReportCard 
            key={report.id} 
            report={report} 
            onViewReport={onReportClick} 
            onQuickPreview={(id) => alert(\`Quick preview for \${id} not implemented yet.\`)} 
          />
        ))}
      </div>
    </div>
  );
}`);

// --- FilterSortControls.jsx ---
writeComponent('FilterSortControls.jsx', `import React from 'react';

export default function FilterSortControls({ filters, setFilters }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <select 
        value={filters.status} 
        onChange={(e) => setFilters({...filters, status: e.target.value})}
        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: '14px' }}
      >
        <option value="all">All Statuses</option>
        <option value="pending_review">Pending Review</option>
        <option value="under_review">Under Review</option>
        <option value="correction_requested">Correction Requested</option>
        <option value="finalized">Finalized</option>
      </select>

      <select 
        value={filters.type} 
        onChange={(e) => setFilters({...filters, type: e.target.value})}
        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: '14px' }}
      >
        <option value="all">All Types</option>
        <option value="PSI">PSI</option>
        <option value="CLS">CLS</option>
        <option value="DPI">DPI</option>
        <option value="factory_audit">Factory Audit</option>
      </select>
      
      <button style={{ padding: '8px 16px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#374151', fontWeight: '500', cursor: 'pointer' }}>
        Sort: Newest First
      </button>
    </div>
  );
}`);

// --- HomeScreen.jsx ---
writeComponent('HomeScreen.jsx', `import React, { useState } from 'react';
import SummaryCards from './SummaryCards';
import ReportQueue from './ReportQueue';

export default function HomeScreen({ onReportClick }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const stats = {
    totalReports: 47,
    pendingReview: 8,
    sentForCorrection: 3,
    finalizedToday: 5
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#111827' }}>Welcome back, Technical Manager 👋</h1>
        <p style={{ margin: 0, color: '#6B7280' }}>Here is your inspection report workflow overview for today.</p>
      </div>
      
      <SummaryCards stats={stats} onCardClick={setActiveFilter} />
      
      <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <ReportQueue onReportClick={onReportClick} />
      </div>
    </div>
  );
}`);

// --- ManagerNotifications.jsx ---
writeComponent('ManagerNotifications.jsx', `import React, { useState } from 'react';

export default function ManagerNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = 2;

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: '5px' }}
      >
        <span style={{ fontSize: '24px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#DC2626', color: '#fff', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '40px', right: '0', width: '320px', background: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 15px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>Notifications</span>
            <span style={{ fontSize: '12px', color: '#0052CC', cursor: 'pointer', fontWeight: '500' }}>Mark all read</span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid #F3F4F6', background: '#EFF6FF', cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', color: '#1F2937', marginBottom: '4px' }}><strong>New PSI report</strong> submitted by John Doe for Acme Corp</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>2 minutes ago</div>
            </div>
            <div style={{ padding: '15px', borderBottom: '1px solid #F3F4F6', background: '#EFF6FF', cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', color: '#1F2937', marginBottom: '4px' }}><strong>Resubmission (Round 2)</strong> by Jane Smith for Global Tech</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>1 hour ago</div>
            </div>
            <div style={{ padding: '15px', cursor: 'pointer' }}>
              <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '4px' }}>Report RPT-DPI-001242 finalized successfully.</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Yesterday at 4:30 PM</div>
            </div>
          </div>
          <div style={{ padding: '10px', textAlign: 'center', borderTop: '1px solid #E5E7EB', fontSize: '12px', color: '#0052CC', cursor: 'pointer', fontWeight: '500' }}>
            View All Notifications
          </div>
        </div>
      )}
    </div>
  );
}`);

console.log("HomeScreen and related components updated!");
