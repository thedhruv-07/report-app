import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error:   XCircle,
  info:    Info,
};

const STYLES = {
  success: { bg: '#10b981', shadow: 'rgba(16,185,129,0.3)' },
  warning: { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.3)' },
  error:   { bg: '#ef4444', shadow: 'rgba(239,68,68,0.3)'  },
  info:    { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.3)' },
};

export default function ToastList({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9998, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
      {toasts.map(toast => {
        const Icon = ICONS[toast.type] ?? Info;
        const s = STYLES[toast.type] ?? STYLES.info;
        return (
          <div key={toast.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: s.bg,
            boxShadow: `0 6px 24px ${s.shadow}`,
            color: '#fff',
            maxWidth: '320px',
            fontSize: '13px',
            fontWeight: 600,
            pointerEvents: 'auto',
            animation: 'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, lineHeight: '1.4' }}>{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', opacity: 0.8, padding: '2px', display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
