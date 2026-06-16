import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ENDPOINTS } from '../../../config/api';

export default function AssignTMModal({ reportId, reportDisplayId, onClose, onSuccess }) {
  const [tms, setTms] = useState([]);
  const [selectedTM, setSelectedTM] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('reportToken');
    fetch(ENDPOINTS.ADMIN.USERS_BY_ROLE('manager'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setTms(data.users || []))
      .catch(() => setError('Failed to load Technical Managers'))
      .finally(() => setFetching(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedTM) { setError('Please select a Technical Manager'); return; }
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('reportToken');
      const res = await fetch(ENDPOINTS.ADMIN.ASSIGN_TM(reportId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ technicalManagerId: selectedTM, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');
      onSuccess(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', position: 'relative' }}>

        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
          <X size={20} />
        </button>

        {/* Title */}
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Assign Report to Technical Manager
        </h3>
        <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6B7280', margin: '0 0 24px' }}>
          {reportDisplayId || reportId}
        </p>

        {/* TM Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Technical Manager
          </label>
          {fetching ? (
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Loading...</p>
          ) : (
            <select
              value={selectedTM}
              onChange={e => setSelectedTM(e.target.value)}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#374151', background: 'white', outline: 'none' }}
            >
              <option value="" disabled>Select Technical Manager</option>
              {tms.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.name} — {tm.email}</option>
              ))}
            </select>
          )}
        </div>

        {/* Note textarea */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 200))}
            placeholder="e.g. Priority review, customer is waiting..."
            rows={3}
            style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#374151', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'right', margin: '4px 0 0' }}>
            {note.length} / 200
          </p>
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{error}</p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#374151', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || fetching}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: loading ? '#9CA3AF' : '#6C47FF', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            {loading ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
