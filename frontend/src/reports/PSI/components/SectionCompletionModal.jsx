import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function SectionCompletionModal({ stepLabel, missingFields, onConfirm, onGoBack }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason before continuing.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#fef3c7', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #fde68a' }}>
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#92400e' }}>Section Incomplete</div>
            <div style={{ fontSize: '12px', color: '#b45309' }}>{stepLabel}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', color: '#374151', marginBottom: '12px', lineHeight: '1.5' }}>
            The following required fields are not filled:
          </p>
          <ul style={{ margin: '0 0 16px 0', paddingLeft: '18px' }}>
            {missingFields.map((f, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#dc2626', marginBottom: '4px', fontWeight: '600' }}>{f}</li>
            ))}
          </ul>

          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Reason for skipping *
          </label>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            placeholder="e.g. Client did not provide AQL values yet, will update before submission…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1px solid ${error ? '#dc2626' : '#e2e8f0'}`,
              borderRadius: '8px', padding: '10px 12px',
              fontSize: '13px', color: '#1e293b', fontFamily: 'inherit',
              resize: 'vertical', outline: 'none',
            }}
          />
          {error && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onGoBack}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
          >
            Go Back & Fill
          </button>
          <button
            onClick={handleConfirm}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d97706', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
