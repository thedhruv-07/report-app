import { colors } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { compressImage } from '../../../utils/imageCompression';
import { UploadCloud } from "lucide-react";

const LABEL_W = "150px";

const labelStyle = {
  width: LABEL_W,
  flexShrink: 0,
  fontSize: "12px",
  color: colors.textLight,
  fontWeight: 600,
};

const baseInputStyle = {
  flex: 1,
  border: "none",
  borderBottom: "1px solid transparent",
  outline: "none",
  fontSize: "13px",
  color: colors.text,
  background: "transparent",
  padding: "1px 4px",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

export default function SchemaSection({ title, fields, formData, onChange, ai = true }) {
  return (
    <div style={{ marginBottom: "16px", background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>

      {/* Card header */}
      <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </span>
      </div>

      {/* Field rows */}
      {Array.isArray(fields) && fields.map((field, i) => {
        const isLast = i === fields.length - 1;
        const isWide = field.type === "textarea" || field.type === "photo" || field.type === "radio";

        return (
          <div
            key={field.name}
            style={{
              display: "flex",
              alignItems: isWide ? "flex-start" : "center",
              padding: isWide ? "10px 16px" : "7px 16px",
              borderBottom: isLast ? "none" : "1px solid #edf0f5",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!isWide) e.currentTarget.style.background = "#fafbfc"; }}
            onMouseLeave={(e) => { if (!isWide) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ ...labelStyle, paddingTop: isWide ? "3px" : "0" }}>{field.label}</div>

            <div style={{ flex: 1 }}>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={onChange}
                  style={{ ...baseInputStyle, width: "100%", cursor: "pointer" }}
                >
                  <option value="">Select...</option>
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>

              ) : field.type === "photo" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {formData[field.name] ? (
                    <div style={{ position: "relative", width: "140px" }}>
                      <img src={formData[field.name]} alt="Preview" style={{ width: "140px", height: "110px", objectFit: "contain", borderRadius: "6px", border: `1px solid ${colors.border}`, background: "#f8f9fa" }} />
                      <button
                        type="button"
                        onClick={() => onChange({ target: { name: field.name, value: "" } })}
                        style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}
                      >×</button>
                    </div>
                  ) : (
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "6px", background: colors.primaryLight, color: colors.primary, cursor: "pointer", fontSize: "12px", fontWeight: "600", border: `1px dashed ${colors.primary}`, width: "fit-content" }}>
                      <UploadCloud size={13} />
                      Upload Document
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const { preview } = await compressImage(file);
                            onChange({ target: { name: field.name, value: preview } });
                          } catch { alert("Failed to process image"); }
                        }
                      }} />
                    </label>
                  )}
                </div>

              ) : field.type === "textarea" ? (
                ai ? (
                  <SmartTextarea
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    placeholder={field.placeholder || ""}
                    context={field.label}
                    minHeight={68}
                    style={{ width: "100%", background: "transparent", color: colors.text, border: "none", borderBottom: "1px solid transparent", padding: "1px 4px", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit", resize: "none", outline: "none", transition: "border-color 0.2s" }}
                    onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
                    onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
                  />
                ) : (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    placeholder={field.placeholder || ""}
                    style={{ width: "100%", background: "transparent", color: colors.text, border: "none", borderBottom: `1px solid ${colors.border}`, padding: "1px 4px", boxSizing: "border-box", fontSize: "13px", fontFamily: "inherit", minHeight: "68px", resize: "vertical", outline: "none" }}
                  />
                )

              ) : (field.type === "text" || !field.type) ? (
                <input
                  type="text"
                  name={field.name}
                  placeholder={field.placeholder || ""}
                  value={formData[field.name] || ""}
                  onChange={onChange}
                  style={{ ...baseInputStyle, width: "100%" }}
                  onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
                  onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
                />

              ) : field.type === "radio" ? (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "3px 10px", borderRadius: "6px",
                          border: `1px solid ${isSelected ? (isYesNo ? (isYes ? colors.success : colors.danger) : colors.primary) : colors.border}`,
                          background: isSelected ? (isYesNo ? (isYes ? "#f0fdf4" : "#fef2f2") : colors.primaryLight) : colors.surface,
                          color: isSelected ? (isYesNo ? (isYes ? colors.success : colors.danger) : colors.primary) : colors.text,
                          cursor: "pointer", fontWeight: "600", fontSize: "12px",
                        }}
                      >
                        {isYes && <span>✓</span>}
                        {isNo && <span>✕</span>}
                        {opt}
                      </button>
                    );
                  })}
                </div>

              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder || ""}
                  value={formData[field.name] || ""}
                  onChange={onChange}
                  style={{ ...baseInputStyle, width: "100%" }}
                  onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
                  onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
