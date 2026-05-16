import React from 'react';
import ReportCard from './ReportCard';
import FilterSortControls from './FilterSortControls';

export default function ReportQueue({ reports, loading, filters, setFilters, onReportClick }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1F2937' }}>Report Queue</h2>
        <FilterSortControls filters={filters} setFilters={setFilters} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p>No reports found.</p>
        ) : (
          reports.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onViewReport={onReportClick} 
              onQuickPreview={(id) => alert(`Quick preview for ${id} not implemented yet.`)} 
            />
          ))
        )}
      </div>
    </div>
  );
}