import { UploadCloud, Lock } from 'lucide-react';
import { colors } from '../../../styles';

const LABEL_W = "150px";

const rowStyle = (last) => ({
  display: "flex",
  alignItems: "center",
  padding: "8px 16px",
  borderBottom: last ? "none" : `1px solid #edf0f5`,
  transition: "background 0.15s",
});

const labelStyle = {
  width: LABEL_W,
  flexShrink: 0,
  fontSize: "12px",
  color: colors.textLight,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const inputStyle = {
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

const lockedInputStyle = {
  ...inputStyle,
  background: "#f1f5f9",
  color: "#64748b",
  cursor: "not-allowed",
  borderRadius: "4px",
  borderBottom: "1px solid #e2e8f0",
  padding: "1px 6px",
};

const FIELDS = [
  { label: "Service Performed",  name: "servicePerformed",  placeholder: "Pre-Shipment Inspection" },
  { label: "Client",             name: "client",            placeholder: "FRIN" },
  { label: "Supplier",           name: "supplier",          placeholder: "JUFENG" },
  { label: "Factory",            name: "factory",           placeholder: "JUFENG" },
  { label: "Product Name",       name: "productName",       placeholder: "Nut Forming Machine & Moulds" },
  { label: "P.O. No.",           name: "po",                placeholder: "8092023" },
  { label: "Item No.",           name: "itemNo",            placeholder: "30B nut forming machine..." },
  { label: "Destination Country",name: "country",           placeholder: "India" },
  { label: "Inspection Date",    name: "inspectionDate",    type: "date" },
  { label: "Inspection Location",name: "inspectionLocation",placeholder: "Jiangsu (CHINA)" },
  { label: "Reference Sample",   name: "referenceSample",   type: "yesNo" },
];

function GeneralPhotoCard({ photo, onUpload, onRemove }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>General Photo</span>
      </div>
      <div style={{ padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "160px" }}>
        {photo ? (
          <div style={{ position: "relative", width: "100%" }}>
            <img src={photo} alt="General" style={{ width: "100%", borderRadius: "6px", objectFit: "cover", display: "block" }} />
            <button type="button" onClick={onRemove} style={{ position: "absolute", top: "4px", right: "4px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700" }}>×</button>
          </div>
        ) : (
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", color: colors.textMuted, padding: "20px" }}>
            <UploadCloud size={32} strokeWidth={1.5} color={colors.primary} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: colors.primary }}>Upload Photo</span>
            <span style={{ fontSize: "11px", color: colors.textMuted, textAlign: "center" }}>Photo appears in General Info table of the report</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />
          </label>
        )}
      </div>
    </div>
  );
}

export default function GeneralInfo({ form, handleChange, onNext, handleGeneralPhotoUpload, clearGeneralPhoto, lockedFields }) {
  const isLocked = (name) => lockedFields?.has(name);

  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>

      {/* ── Main form card ── */}
      <div style={{ flex: 1, background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>

        {/* Card header */}
        <div style={{ padding: "9px 16px", borderBottom: `1px solid #f1f5f9`, background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            I. General Information
          </span>
        </div>

        {/* Field rows */}
        {FIELDS.map((field, i) => {
          const locked = isLocked(field.name);
          return (
            <div
              key={field.name}
              style={{ ...rowStyle(i === FIELDS.length - 1), background: locked ? "#fafbff" : undefined }}
              onMouseEnter={(e) => { if (!locked) e.currentTarget.style.background = "#fafbfc"; }}
              onMouseLeave={(e) => { if (!locked) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={labelStyle}>
                {field.label}
                {locked && <Lock size={10} color="#6366f1" />}
              </div>
              {field.type === "yesNo" ? (
                <select
                  name={field.name}
                  value={form[field.name] || ""}
                  onChange={handleChange}
                  disabled={locked}
                  style={{ ...inputStyle, cursor: locked ? "not-allowed" : "pointer", ...(locked ? { background: "#f1f5f9", color: "#64748b", borderRadius: "4px" } : {}) }}
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : field.type === "date" ? (
                <input
                  type="date"
                  name={field.name}
                  value={form[field.name] || ""}
                  onChange={handleChange}
                  readOnly={locked}
                  style={locked ? lockedInputStyle : inputStyle}
                  onFocus={(e) => { if (!locked) e.target.style.borderBottomColor = colors.primary; }}
                  onBlur={(e)  => { if (!locked) e.target.style.borderBottomColor = "transparent"; }}
                />
              ) : (
                <input
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={handleChange}
                  readOnly={locked}
                  style={locked ? lockedInputStyle : inputStyle}
                  onFocus={(e) => { if (!locked) e.target.style.borderBottomColor = colors.primary; }}
                  onBlur={(e)  => { if (!locked) e.target.style.borderBottomColor = "transparent"; }}
                />
              )}
            </div>
          );
        })}

        {/* Next button */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid #edf0f5`, background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onNext}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 24px", borderRadius: "24px", border: "none", background: colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}
          >
            Next Step →
          </button>
        </div>
      </div>

      {/* ── Photo card ── */}
      <div style={{ width: "200px", flexShrink: 0 }}>
        <GeneralPhotoCard photo={form.generalPhoto} onUpload={handleGeneralPhotoUpload} onRemove={clearGeneralPhoto} />
      </div>

    </div>
  );
}
