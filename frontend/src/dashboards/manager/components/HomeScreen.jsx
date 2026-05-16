import React, { useState } from 'react';
import SummaryCards from './SummaryCards';
import ReportQueue from './ReportQueue';
import { useReportQueue } from '../hooks/useReportQueue';

export default function HomeScreen({ onReviewReport }) {
  const [filters, setFilters] = useState({ status: 'all', type: 'all' });
  const { reports, stats, loading, error } = useReportQueue(filters);

  // Map SummaryCard clicks to set the status filter
  const handleCardClick = (statusFilter) => {
    setFilters(prev => ({ ...prev, status: statusFilter }));
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#111827' }}>Welcome back, Technical Manager 👋</h1>
          <p style={{ margin: 0, color: '#6B7280' }}>Here is your inspection report workflow overview for today.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          🔄 Refresh Dashboard
        </button>
      </div>
      
      {loading && !reports.length ? (
        <p>Loading stats...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <SummaryCards stats={stats} onCardClick={handleCardClick} />
      )}
      
      <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <ReportQueue 
          reports={reports} 
          loading={loading}
          filters={filters} 
          setFilters={setFilters} 
          onReportClick={onReviewReport} 
        />
      </div>
    </div>
  );
}