import { useEffect } from 'react';

const TOAST_DURATION = 6000;

export default function PrefillToast({ prefillData, dismissed, onDismiss }) {
  useEffect(() => {
    if (!prefillData || dismissed) return;
    const t = setTimeout(onDismiss, TOAST_DURATION);
    return () => clearTimeout(t);
  }, [prefillData, dismissed, onDismiss]);

  if (!prefillData || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes prefill-slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes prefill-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        width: "340px",
        borderRadius: "12px",
        background: "#1e1b4b",
        boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(99,102,241,0.18)",
        overflow: "hidden",
        animation: "prefill-slide-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "linear-gradient(180deg,#818cf8,#6366f1)" }} />
        <div style={{ padding: "14px 16px 12px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                <span style={{ fontSize: "15px" }}>✅</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#e0e7ff" }}>Auto-filled from Online Booking</span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#a5b4fc", lineHeight: "1.5" }}>
                Review all fields before submitting.
              </p>
              {prefillData.specialInstructions && (
                <div style={{ marginTop: "8px", padding: "7px 10px", background: "rgba(99,102,241,0.15)", borderRadius: "6px", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.07em" }}>Admin note: </span>
                  <span style={{ fontSize: "12px", color: "#c7d2fe" }}>{prefillData.specialInstructions}</span>
                </div>
              )}
            </div>
            <button
              onClick={onDismiss}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", color: "#a5b4fc", fontSize: "16px", lineHeight: "1", padding: "4px 7px", borderRadius: "6px", flexShrink: 0 }}
              aria-label="Dismiss"
            >×</button>
          </div>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.08)" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#818cf8,#6366f1)", animation: `prefill-progress ${TOAST_DURATION}ms linear forwards` }} />
        </div>
      </div>
    </>
  );
}
