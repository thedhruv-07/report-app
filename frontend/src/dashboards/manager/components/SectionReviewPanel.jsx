import React from 'react';

export default function SectionReviewPanel({ sectionId, report }) {
  if (!report) return null;

  // Mapping of section IDs to their data keys in the report object
  const dataMap = {
    'General Info': report.generalInfo,
    'Quantity': report.quantityDetails,
    'Workmanship': report.workmanship,
    'Inspection': report.inspection,
    'Materials': report.materials,
    'Safety': report.safety,
    'Packaging': report.inspection,
    'Comments': report.comments,
    'Media': report.media
  };

  const sectionData = dataMap[sectionId];

  const renderTable = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return <span style={{ color: '#9CA3AF' }}>No data</span>;
    
    // Get all unique keys from the objects
    const keys = Array.from(new Set(dataArray.flatMap(item => Object.keys(item)))).filter(k => k !== '_id');
    
    return (
      <div style={{ overflowX: 'auto', marginTop: '10px', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {keys.map(k => (
                <th key={k} style={{ padding: '10px', textAlign: 'left', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase', fontSize: '10px' }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataArray.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: idx === dataArray.length - 1 ? 'none' : '1px solid #F3F4F6' }}>
                {keys.map(k => (
                  <td key={k} style={{ padding: '10px', color: '#1F2937' }}>
                    {typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderValue = (val, key) => {
    if (val === null || val === undefined || val === "") return <span style={{ color: '#9CA3AF' }}>Not provided</span>;
    if (typeof val === 'boolean') return val ? '✅ Yes' : '❌ No';
    
    if (Array.isArray(val)) {
      if (val.length === 0) return <span style={{ color: '#9CA3AF' }}>Empty list</span>;
      
      // If it's an array of objects, render as table
      if (typeof val[0] === 'object' && val[0] !== null) {
        return renderTable(val);
      }

      return (
        <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
          {val.map((item, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }
    
    if (key && (key.toLowerCase().includes('defect') || key.toLowerCase().includes('spec') || key.toLowerCase().includes('check'))) {
      if (Array.isArray(val) && val.length > 0) {
        return renderTable(val);
      }
    }
    
    if (typeof val === 'object' && val !== null) {
      return (
        <div style={{ padding: '10px', background: '#F9FAFB', borderRadius: '6px', fontSize: '13px', border: '1px solid #F3F4F6' }}>
          {Object.entries(val).map(([k, v]) => (
            <div key={k} style={{ marginBottom: '4px' }}>
              <strong style={{ color: '#4B5563' }}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}:</strong> {String(v)}
            </div>
          ))}
        </div>
      );
    }
    return String(val);
  };

  const renderContent = () => {
    if (!sectionData && sectionId !== 'Media') {
      return (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: '#94A3B8', background: '#F8FAFC', borderRadius: '12px', border: '2px dashed #E2E8F0' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📄</div>
          <p style={{ margin: 0, fontWeight: '500' }}>No detailed data found for {sectionId}.</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>The inspector may have skipped this optional section.</p>
        </div>
      );
    }

    if (sectionId === 'Media') {
      const photos = report.media || [];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {photos.map((m, i) => (
            <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ height: '200px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={m.url} 
                  alt={m.description} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { 
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div style="color: #94A3B8; text-align: center; padding: 20px;">Image Unavailable</div>';
                  }}
                />
              </div>
              <div style={{ padding: '16px', fontSize: '13px', color: '#334155', fontWeight: '600', lineHeight: '1.4' }}>
                {m.description || 'Inspection Evidence Photo'}
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
              No evidence photos were uploaded for this report.
            </div>
          )}
        </div>
      );
    }

    // Exclude internal fields
    const displayFields = Object.entries(sectionData).filter(([key]) => 
      !['_id', 'reportId', 'createdAt', 'updatedAt', '__v'].includes(key) &&
      key !== 'media' && key !== 'sectionStatuses'
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {displayFields.map(([key, value]) => (
          <div key={key} style={{ background: '#fff', padding: '0 0 20px 0', borderBottom: '1px solid #F1F5F9' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.075em', marginBottom: '8px' }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <div style={{ fontSize: '15px', color: '#0F172A', fontWeight: '500' }}>
              {renderValue(value)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)', padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '24px', background: '#2563EB', borderRadius: '4px' }}></div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.025em' }}>
            {sectionId}
          </h2>
        </div>
        <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', padding: '6px 14px', background: '#EFF6FF', borderRadius: '30px', border: '1px solid #DBEAFE', textTransform: 'uppercase' }}>
          Verification Mode
        </div>
      </div>
      <div style={{ padding: '32px' }}>
        {renderContent()}
      </div>
    </div>
  );
}