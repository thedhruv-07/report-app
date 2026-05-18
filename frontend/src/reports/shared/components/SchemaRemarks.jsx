import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

export default function SchemaRemarks({ title, formData, onChange, dataKey }) {
  const remarks = Array.isArray(formData[dataKey]) && formData[dataKey].length > 0 
    ? formData[dataKey] 
    : [""];

  const handleRemarkChange = (index, value) => {
    const newRemarks = [...remarks];
    newRemarks[index] = value;
    onChange({ target: { name: dataKey, value: newRemarks } });
  };

  const addRemark = () => {
    onChange({ target: { name: dataKey, value: [...remarks, ""] } });
  };

  const removeRemark = (index) => {
    if (remarks.length <= 1) return;
    const newRemarks = remarks.filter((_, i) => i !== index);
    onChange({ target: { name: dataKey, value: newRemarks } });
  };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "700", color: colors.text }}>
        {title}
      </div>
      
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {remarks.map((remark, index) => (
            <tr key={index}>
              <td style={{ width: "40px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "600", color: colors.text }}>
                {index + 1}.
              </td>
              <td style={{ borderBottom: `1px solid ${colors.border}`, padding: "8px 12px", background: colors.surface }}>
                <SmartTextarea
                  name={`remark_${index}`}
                  value={remark}
                  onChange={(e) => handleRemarkChange(index, e.target.value)}
                  placeholder="Enter observation or remark..."
                  minHeight={60}
                  style={{
                    width: "100%", border: "none", outline: "none", background: "transparent",
                    color: colors.text, fontSize: "14px", padding: "0"
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => removeRemark(index)}
                    disabled={remarks.length <= 1}
                    style={{
                      border: "none", borderRadius: "4px",
                      background: remarks.length <= 1 ? colors.textMuted : colors.danger,
                      color: "#fff", fontSize: "11px", padding: "4px 8px",
                      cursor: remarks.length <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{ padding: "12px", background: colors.surfaceAlt, borderTop: `1px solid ${colors.border}` }}>
        <button
          type="button"
          onClick={addRemark}
          style={{
            border: "none", borderRadius: "6px", background: colors.primary, color: "#fff",
            fontSize: "13px", fontWeight: "600", padding: "8px 14px", cursor: "pointer",
          }}
        >
          + Add Remark Row
        </button>
      </div>
    </div>
  );
}
