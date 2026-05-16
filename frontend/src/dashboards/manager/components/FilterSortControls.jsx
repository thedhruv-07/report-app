import React from 'react';

export default function FilterSortControls({ filters, setFilters }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <select 
        value={filters.status} 
        onChange={(e) => setFilters({...filters, status: e.target.value})}
        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: '14px' }}
      >
        <option value="all">All Statuses</option>
        <option value="submitted">Pending Review</option>
        <option value="under_review">Under Review</option>
        <option value="revision_required">Correction Requested</option>
        <option value="approved">Finalized</option>
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
}