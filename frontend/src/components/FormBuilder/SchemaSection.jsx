import { colors, tableLabelStyle } from "../../styles";
import SmartTextarea from "../SmartTextarea";

export default function SchemaSection({ title, fields, formData, onChange }) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "20px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>
        {title}
      </h3>
      
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}` }}>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name}>
              <td style={{ ...tableLabelStyle, width: "30%" }}>{field.label}:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <SmartTextarea
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    placeholder={field.placeholder || ""}
                    style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px", minHeight: "80px", fontFamily: "inherit" }}
                  />
                ) : field.type === "checkbox" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={!!formData[field.name]}
                      onChange={(e) => onChange({ target: { name: field.name, value: e.target.checked } })}
                      style={{ width: "18px", height: "18px", accentColor: colors.primary, cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px", color: colors.text }}>{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    placeholder={field.placeholder || ""}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
