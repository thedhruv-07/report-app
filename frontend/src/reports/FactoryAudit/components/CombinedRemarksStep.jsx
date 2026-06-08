import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { AddRowButton, RemoveRowButton } from '../../shared/components/RowButtons';

const SECTIONS = [
  { key: "generalOverviewRemarks", label: "General Overview:" },
  { key: "clientSpecialRemarks",   label: "Client's Special Requirement:" },
  { key: "suggestions",            label: "Suggestion:" },
];

function normalize(val) {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") return val.requirement || "";
  return "";
}

function getRows(form, key) {
  const raw = Array.isArray(form[key]) ? form[key] : [];
  const mapped = raw.map(normalize);
  return mapped.length > 0 ? mapped : [""];
}

function buildSectionData(form) {
  let n = 1;
  return SECTIONS.map(({ key, label }) => {
    const rows = getRows(form, key);
    const start = n;
    n += rows.length;
    return { key, label, rows, start };
  });
}

export default function CombinedRemarksStep({ form, handleChange }) {
  const setData = (key, arr) => handleChange({ target: { name: key, value: arr } });
  const addRow    = (key)    => setData(key, [...getRows(form, key), ""]);
  const removeRow = (key, i) => { const a = getRows(form, key); if (a.length > 1) setData(key, a.filter((_, idx) => idx !== i)); };
  const updateRow = (key, i, val) => { const a = [...getRows(form, key)]; a[i] = val; setData(key, a); };

  const sectionData = buildSectionData(form);

  return (
    <div>
      <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: "16px" }}>

        {/* Card header */}
        <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: colors.header, textTransform: "uppercase", letterSpacing: "0.06em" }}>Remarks</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <colgroup>
            <col style={{ width: "38px" }} />
            <col />
            <col style={{ width: "34px" }} />
          </colgroup>
          <tbody>
            {sectionData.map(({ key, label, rows, start }) => (
              <RemarksSection
                key={key}
                sectionKey={key}
                label={label}
                rows={rows}
                startCounter={start}
                onUpdate={updateRow}
                onRemove={removeRow}
                onAdd={addRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RemarksSection({ sectionKey, label, rows, startCounter, onUpdate, onRemove, onAdd }) {
  let c = startCounter;
  const jsxRows = rows.map((text, i) => {
    const num = c++;
    return (
      <tr key={`${sectionKey}-${i}`}>
        <td style={{ textAlign: "center", color: colors.textMuted, fontSize: "11px", fontWeight: 700, verticalAlign: "middle", borderRight: "1px solid #edf0f5", borderBottom: "1px solid #edf0f5", padding: "0 4px", background: "#fafbfc" }}>
          {num}
        </td>
        <td style={{ padding: "5px 10px", borderBottom: "1px solid #edf0f5", verticalAlign: "middle" }}>
          <SmartTextarea
            name={`${sectionKey}_${i}`}
            value={text}
            onChange={(e) => onUpdate(sectionKey, i, e.target.value)}
            placeholder="Enter remark…"
            context="factory audit remark or suggestion"
            minHeight={34}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", color: colors.text, fontSize: "13px", padding: "2px 4px", fontFamily: "inherit", resize: "none" }}
          />
        </td>
        <td style={{ textAlign: "center", verticalAlign: "middle", borderLeft: "1px solid #edf0f5", borderBottom: "1px solid #edf0f5" }}>
          <RemoveRowButton onClick={() => onRemove(sectionKey, i)} disabled={rows.length <= 1} />
        </td>
      </tr>
    );
  });

  return (
    <>
      {/* Sub-header */}
      <tr>
        <td colSpan={3} style={{ padding: "7px 12px", background: "#f1f5f9", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", fontWeight: 700, color: colors.text, fontSize: "12px" }}>
          {label}
        </td>
      </tr>

      {jsxRows}

      {/* Add row */}
      <tr>
        <td colSpan={3} style={{ padding: "7px 12px", background: "#fafbfc", borderBottom: "1px solid #e2e8f0" }}>
          <AddRowButton onClick={() => onAdd(sectionKey)} label={`Add ${label.replace(":", "").trim()}`} />
        </td>
      </tr>
    </>
  );
}
