import { colors } from "../../styles";
import { Plus, Trash2 } from "lucide-react";

export default function SchemaTable({ title, config, formData, onChange, dataKey }) {
  const rows = Array.isArray(formData[dataKey]) ? formData[dataKey] : [];

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    onChange({ target: { name: dataKey, value: newRows } });
  };

  const addRow = () => {
    const emptyRow = config.columns.reduce((acc, col) => ({ ...acc, [col.key]: "" }), {});
    onChange({ target: { name: dataKey, value: [...rows, emptyRow] } });
  };

  const removeRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    onChange({ target: { name: dataKey, value: newRows } });
  };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: colors.text, margin: 0 }}>
          {title}
        </h3>
        <button 
          onClick={addRow}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: colors.primary, color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
        >
          <Plus size={14} /> Add Row
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: colors.surfaceAlt }}>
              <th style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, width: "40px", color: colors.textMuted, fontSize: "12px" }}>#</th>
              {config.columns.map(col => (
                <th key={col.key} style={{ padding: "10px", textAlign: "left", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "12px", fontWeight: "600" }}>
                  {col.label}
                </th>
              ))}
              <th style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 2} style={{ textAlign: "center", padding: "30px", color: colors.textMuted, fontSize: "14px" }}>
                  No rows added yet. Click "Add Row" to start.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  <td style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "13px", fontWeight: "600", background: colors.surfaceAlt }}>
                    {index + 1}
                  </td>
                  {config.columns.map(col => (
                    <td key={col.key} style={{ padding: "6px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
                      <input
                        type={col.type || "text"}
                        value={row[col.key] || ""}
                        onChange={(e) => handleRowChange(index, col.key, e.target.value)}
                        placeholder={`Enter ${col.label.toLowerCase()}`}
                        style={{ width: "100%", border: `1px solid ${colors.border}`, padding: "8px", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
                    <button 
                      onClick={() => removeRow(index)}
                      style={{ background: "transparent", color: colors.danger, border: "none", cursor: "pointer", padding: "4px" }}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {config.metadata && (
        <div style={{ padding: "16px", background: colors.surfaceAlt, borderTop: `1px solid ${colors.border}`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {config.metadata.map(field => (
            <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: colors.textMuted }}>{field.label}</label>
              {field.type === "select" ? (
                <select
                  value={formData[field.name] || field.defaultValue || ""}
                  onChange={(e) => onChange({ target: { name: field.name, value: e.target.value } })}
                  style={{ padding: "8px", borderRadius: "4px", border: `1px solid ${colors.border}`, fontSize: "13px", background: "white" }}
                >
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={formData[field.name] || field.defaultValue || ""}
                  onChange={(e) => onChange({ target: { name: field.name, value: e.target.value } })}
                  placeholder={field.placeholder || ""}
                  style={{ padding: "8px", borderRadius: "4px", border: `1px solid ${colors.border}`, fontSize: "13px", background: "white", minHeight: "80px", fontFamily: "inherit" }}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={formData[field.name] || field.defaultValue || ""}
                  onChange={(e) => onChange({ target: { name: field.name, value: e.target.value } })}
                  placeholder={field.placeholder || ""}
                  style={{ padding: "8px", borderRadius: "4px", border: `1px solid ${colors.border}`, fontSize: "13px", background: "white" }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
