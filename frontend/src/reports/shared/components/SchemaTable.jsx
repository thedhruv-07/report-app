import { colors } from '../../../styles';
import { Trash2, UploadCloud, X, Image as ImageIcon } from "lucide-react";
import SmartTextarea from '../../../components/shared/SmartTextarea';
import { readImagePreview } from '../../../utils/fileUtils';
import { useState } from "react";
import { AddRowButton, RemoveRowButton } from './RowButtons';
import Lightbox from '../../../components/shared/Lightbox';

export default function SchemaTable({ title, config, formData, onChange, dataKey, ai = true }) {
  const rows = Array.isArray(formData[dataKey]) ? formData[dataKey] : [];
  const [isUploading, setIsUploading] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    onChange({ target: { name: dataKey, value: newRows } });
  };

  const handlePhotoUpload = async (index, field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(`${index}_${field}`);
      const preview = await readImagePreview(file);
      handleRowChange(index, field, preview);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Photo processing failed.");
    } finally {
      setIsUploading(null);
    }
  };

  const addRow = () => {
    const emptyRow = config.columns.reduce((acc, col) => ({ ...acc, [col.name]: "" }), {});
    onChange({ target: { name: dataKey, value: [...rows, emptyRow] } });
  };

  const removeRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    onChange({ target: { name: dataKey, value: newRows } });
  };

  return (
    <div style={{ marginBottom: "30px", border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden" }}>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      <div style={{ padding: "12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: colors.text, margin: 0 }}>
          {title}
        </h3>
        <AddRowButton onClick={addRow} label="Add Row" />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: colors.surfaceAlt }}>
              <th key="col-index" style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, width: "40px", color: colors.textMuted, fontSize: "12px" }}>#</th>
              {config.columns.map(col => (
                <th key={col.name} style={{ padding: "10px", textAlign: "left", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "12px", fontWeight: "600" }}>
                  {col.label}
                </th>
              ))}
              <th key="col-actions" style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr key="no-rows">
                <td key="empty-msg" colSpan={config.columns.length + 2} style={{ textAlign: "center", padding: "30px", color: colors.textMuted, fontSize: "14px" }}>
                  No rows added yet. Click "Add Row" to start.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`row-${index}`}>
                  <td key="cell-index" style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: "13px", fontWeight: "600", background: colors.surfaceAlt }}>
                    {index + 1}
                  </td>
                  {config.columns.map(col => (
                    <td key={`cell-${col.name}`} style={{ padding: "6px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
                      {col.type === "photo" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center", minWidth: "100px" }}>
                          {row[col.name] ? (
                            <div style={{ position: "relative", width: "80px", height: "60px", border: `1px solid ${colors.border}`, borderRadius: "4px", overflow: "hidden" }}>
                              <img src={row[col.name]} alt="Machine" onClick={() => setLightboxSrc(row[col.name])} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />
                              <button
                                onClick={() => handleRowChange(index, col.name, "")}
                                style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px", border: `1px dashed ${colors.border}`, borderRadius: "4px", cursor: "pointer", background: colors.surfaceAlt, width: "80px", height: "60px", justifyContent: "center" }}>
                              {isUploading === `${index}_${col.name}` ? <span style={{ fontSize: "10px", color: colors.primary }}>...</span> : <ImageIcon size={20} color={colors.textMuted} />}
                              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoUpload(index, col.name, e)} disabled={!!isUploading} />
                            </label>
                          )}
                        </div>
                      ) : col.type === "number" ? (
                        <input
                          type="number"
                          value={row[col.name] || ""}
                          onChange={(e) => handleRowChange(index, col.name, e.target.value)}
                          placeholder={`0`}
                          style={{ width: "100%", border: `1px solid ${colors.border}`, padding: "8px", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box", textAlign: "center" }}
                        />
                      ) : ai && col.type === "textarea" ? (
                        <SmartTextarea
                          name={`${dataKey}_${index}_${col.name}`}
                          value={row[col.name] || ""}
                          onChange={(e) => handleRowChange(index, col.name, e.target.value)}
                          placeholder={`Enter ${col.label.toLowerCase()}`}
                          minHeight={36}
                          style={{ width: "100%", border: `1px solid ${colors.border}`, padding: "6px", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      ) : (
                        <input
                          type={col.type || "text"}
                          value={row[col.name] || ""}
                          onChange={(e) => handleRowChange(index, col.name, e.target.value)}
                          placeholder={`Enter ${col.label.toLowerCase()}`}
                          style={{ width: "100%", border: `1px solid ${colors.border}`, padding: "8px", borderRadius: "4px", fontSize: "13px", boxSizing: "border-box" }}
                        />
                      )}
                    </td>
                  ))}
                  <td key="cell-actions" style={{ padding: "10px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
                    <RemoveRowButton onClick={() => removeRow(index)} />
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
              ) : ai ? (
                <SmartTextarea
                  name={field.name}
                  value={formData[field.name] || field.defaultValue || ""}
                  onChange={(e) => onChange({ target: { name: field.name, value: e.target.value } })}
                  placeholder={field.placeholder || ""}
                  minHeight={field.type === "textarea" ? 80 : 38}
                  style={{ padding: "8px", borderRadius: "4px", border: `1px solid ${colors.border}`, fontSize: "13px", background: "white", fontFamily: "inherit" }}
                />
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
