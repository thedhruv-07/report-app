import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { AddRowButton, RemoveRowButton } from './RowButtons';

export default function SchemaRemarks({ title, formData, onChange, dataKey }) {
  const remarks = Array.isArray(formData[dataKey]) && formData[dataKey].length > 0
    ? formData[dataKey]
    : [""];

  const update = (index, value) => {
    const next = [...remarks];
    next[index] = value;
    onChange({ target: { name: dataKey, value: next } });
  };

  const add    = () => onChange({ target: { name: dataKey, value: [...remarks, ""] } });
  const remove = (i) => { if (remarks.length <= 1) return; onChange({ target: { name: dataKey, value: remarks.filter((_, idx) => idx !== i) } }); };

  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: "16px" }}>

      {/* Header */}
      <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
      </div>

      {/* Rows */}
      {remarks.map((remark, i) => (
        <div key={i} style={{ display: "flex", padding: "10px 16px", gap: "12px", borderBottom: i < remarks.length - 1 ? "1px solid #edf0f5" : "none" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: colors.primaryLight, color: colors.primary, fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "3px" }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <SmartTextarea
              name={`${dataKey}_${i}`}
              value={remark}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Enter observation or remark…"
              context="inspection observation or remark"
              minHeight={52}
              style={{ width: "100%", border: "none", borderBottom: "1px solid transparent", outline: "none", background: "transparent", color: colors.text, fontSize: "13px", padding: "1px 4px", fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
              onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
              <RemoveRowButton onClick={() => remove(i)} disabled={remarks.length <= 1} />
            </div>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid #edf0f5", background: "#f8fafc" }}>
        <AddRowButton onClick={add} label="Add Remark" />
      </div>
    </div>
  );
}
