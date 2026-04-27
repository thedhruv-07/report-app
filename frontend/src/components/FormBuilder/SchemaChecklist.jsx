import { colors } from "../../styles";

export default function SchemaChecklist({ title, fields, formData, onChange }) {
  const handleCheckboxChange = (name, checked) => {
    onChange({ target: { name, value: checked } });
  };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "700", color: colors.text }}>
        {title}
      </div>

      <div style={{ padding: "16px", background: colors.surface }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {fields.map((field) => (
            <label 
              key={field.name} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "10px", 
                padding: "12px", 
                border: `1px solid ${formData[field.name] ? colors.primary : colors.border}`, 
                borderRadius: "8px", 
                background: formData[field.name] ? colors.primaryLight : colors.surfaceAlt,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <input
                type="checkbox"
                name={field.name}
                checked={!!formData[field.name]}
                onChange={(e) => handleCheckboxChange(field.name, e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: colors.primary, cursor: "pointer" }}
              />
              <span style={{ fontSize: "14px", color: colors.text, fontWeight: formData[field.name] ? "600" : "500" }}>
                {field.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
