import { colors } from '../../../styles';

const OPTIONS = [
  { value: "PASSED",  label: "✓  PASSED",  color: colors.success },
  { value: "PENDING", label: "⏳  PENDING", color: colors.warning },
  { value: "FAILED",  label: "✗  FAILED",  color: colors.danger  },
];

export default function OverallConclusionStep({ form, setForm }) {
  const current = form.auditOverview?.overallConclusion || form.overallConclusion || "";

  const select = (value) => {
    setForm(prev => ({
      ...prev,
      overallConclusion: value,
      auditOverview: { ...prev.auditOverview, overallConclusion: value },
    }));
  };

  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: colors.header, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Overall Conclusion
        </span>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {OPTIONS.map(opt => {
          const selected = current === opt.value;
          return (
            <label key={opt.value} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "12px 16px", borderRadius: "8px", cursor: "pointer",
              border: `1px solid ${selected ? opt.color : colors.border}`,
              background: selected ? `${opt.color}12` : "#fff",
              transition: "all 0.15s",
            }}>
              <input type="radio" name="overallConclusion" value={opt.value} checked={selected}
                onChange={() => select(opt.value)}
                style={{ accentColor: opt.color, width: "16px", height: "16px", flexShrink: 0 }} />
              <span style={{ color: opt.color, fontWeight: 700, fontSize: "14px" }}>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
