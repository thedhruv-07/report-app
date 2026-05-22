import React, { useState } from 'react';

export default function RemarksPanel({ onAddRemark, existingRemarks = [] }) {
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!remark.trim()) return;
    setSubmitting(true);
    try {
      await onAddRemark(remark);
      setRemark('');
      alert('Remark saved');
    } catch {
      alert('Failed to save remark');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#111827' }}>Internal Remarks</h3>
      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '15px' }}>Visible only to Admin. Not sent to inspector.</p>
      
      <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {existingRemarks.map((rem, idx) => (
          <div key={idx} style={{ background: '#F3F4F6', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
            <p style={{ margin: '0 0 5px 0', color: '#374151' }}>{rem.text}</p>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>
              {new Date(rem.addedAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <textarea 
        rows="3" 
        placeholder="Add an internal note..."
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #D1D5DB', resize: 'vertical', marginBottom: '10px' }}
      />
      <button 
        onClick={handleSave}
        disabled={submitting}
        style={{ padding: '8px 12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
      >
        {submitting ? 'Saving...' : 'Save Remark'}
      </button>
    </div>
  );
}