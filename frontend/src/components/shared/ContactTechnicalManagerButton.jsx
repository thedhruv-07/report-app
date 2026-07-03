import { useState, useEffect } from 'react';
import { LifeBuoy, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import useToast from '../../hooks/useToast';
import ToastList from './ToastList';

export default function ContactTechnicalManagerButton({ reportType, sectionLabel, taskId }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, addToast, dismiss } = useToast();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.CONTACT_TM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportType, sectionLabel, taskId, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }
      addToast('Message sent to Technical Manager', 'success');
      setOpen(false);
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px',
          border: '1px solid #f59e0b', background: '#fffbeb', color: '#b45309',
          fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <LifeBuoy size={13} />
        Contact Technical Manager
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(92vw, 440px)', background: '#fff', borderRadius: '14px',
              padding: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>Contact Technical Manager</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
              What do you need help with?
            </label>
            <textarea
              autoFocus
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you're stuck on..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px',
                fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }}
            />
            {error && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>{error}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: sending || !message.trim() ? '#94a3b8' : '#6C47FF', color: '#fff',
                  fontSize: '13px', fontWeight: 700, cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
