import React from 'react';

const Card = ({ title, value, subtitle, color, icon, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: '#fff', padding: '20px', borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer',
      display: 'flex', alignItems: 'flex-start', gap: '15px',
      borderLeft: `4px solid ${color}`, transition: 'transform 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ fontSize: '24px', background: `${color}15`, padding: '12px', borderRadius: '10px' }}>{icon}</div>
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
        color="#F59E0B" icon="⏳" onClick={() => onCardClick('submitted')} 
      />
      <Card 
        title="Correction Sent" value={stats.sentForCorrection || 0} subtitle="Awaiting resubmission"
        color="#DC2626" icon="🔄" onClick={() => onCardClick('revision_required')} 
      />
      <Card 
        title="Finalized Today" value={stats.finalizedToday || 0} subtitle="Approved in last 24h"
        color="#10B981" icon="✅" onClick={() => onCardClick('approved')} 
      />
    </div>
  );
}