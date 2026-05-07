import { colors, tableLabelStyle } from "../../styles";
import SmartTextarea from "../SmartTextarea";
import { compressImage } from "../../utils/imageCompression";
import { UploadCloud } from "lucide-react";

export default function SchemaSection({ title, fields, formData, onChange, ai = true }) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "20px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>
        {title}
      </h3>
      
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}` }}>
        <tbody>
          {Array.isArray(fields) && fields.map((field) => (
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
                ) : field.type === "photo" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {formData[field.name] ? (
                      <div style={{ position: "relative", width: "160px" }}>
                        <img 
                          src={formData[field.name]} 
                          alt="Preview" 
                          style={{ width: "160px", height: "160px", objectFit: "contain", borderRadius: "8px", border: `1px solid ${colors.border}`, background: "#f8f9fa" }} 
                        />
                        <button
                          type="button"
                          onClick={() => onChange({ target: { name: field.name, value: "" } })}
                          style={{ position: "absolute", top: "-8px", right: "-8px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "10px 20px", borderRadius: "8px",
                        background: colors.primaryLight,
                        color: colors.primary,
                        cursor: "pointer",
                        fontSize: "14px", fontWeight: "600",
                        border: `1px dashed ${colors.primary}`,
                        width: "fit-content",
                        transition: "all 0.2s"
                      }}>
                        <UploadCloud size={18} />
                        Upload Document
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              try {
                                const { preview } = await compressImage(file);
                                onChange({ target: { name: field.name, value: preview } });
                              } catch (err) {
                                alert("Failed to process image");
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                ) : (field.type === "text" || field.type === "textarea" || !field.type) ? (
                  ai ? (
                    <SmartTextarea
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={onChange}
                      placeholder={field.placeholder || ""}
                      context={field.label}
                      minHeight={field.type === "textarea" ? 80 : 38}
                      style={{ 
                        width: "100%", background: colors.surface, color: colors.text, 
                        border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", 
                        boxSizing: "border-box", fontSize: "14px", fontFamily: "inherit",
                        resize: "none"
                      }}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={onChange}
                      placeholder={field.placeholder || ""}
                      style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px", minHeight: "80px", fontFamily: "inherit" }}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      placeholder={field.placeholder || ""}
                      value={formData[field.name] || ""}
                      onChange={onChange}
                      style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }}
                    />
                  )
                ) : field.type === "radio" ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {field.options.map(opt => {
                      const isSelected = formData[field.name] === opt;
                      const isYesNo = field.options.includes("Yes") && field.options.includes("No");
                      const isYes = opt === "Yes";
                      const isNo = opt === "No";
                      
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => onChange({ target: { name: field.name, value: opt } })}
                          style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "8px 16px", borderRadius: "8px",
                            border: `2px solid ${isSelected ? (isYesNo ? (isYes ? colors.success : colors.danger) : colors.primary) : colors.border}`,
                            background: isSelected ? (isYesNo ? (isYes ? "#f0fdf4" : "#fef2f2") : colors.primaryLight) : colors.surface,
                            color: isSelected ? (isYesNo ? (isYes ? colors.success : colors.danger) : colors.primary) : colors.text,
                            cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            transition: "all 0.2s", minWidth: "100px", justifyContent: "center"
                          }}
                        >
                          {isYes && <span style={{ fontSize: "16px" }}>✓</span>}
                          {isNo && <span style={{ fontSize: "16px" }}>✕</span>}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
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
