import { colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import { compressImage, formatFileSize } from '../../../utils/imageCompression';
import SmartTextarea from '../../../components/shared/SmartTextarea';
import RemarksExtras from '../../shared/components/RemarksExtras';

function CardHeader({ title }) {
  return (
    <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
      <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</span>
    </div>
  );
}

const cardStyle = {
  background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`,
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: "16px",
};

export default function RemarksStep({ form, handleChange, onPrev, onNext }) {
  const setField = (name, value) => handleChange({ target: { name, value } });

  const getRemarkPhotosByIndex = () => form.remarkPhotosByIndex || {};
  const getPhotosForRow = (rowIndex) => getRemarkPhotosByIndex()[rowIndex] || [];

  const handleRemarkPhotosUpload = async (rowIndex, files) => {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;
    const processed = await Promise.all(selectedFiles.map(async (file, idx) => {
      const id = `remark_${rowIndex}_${Date.now()}_${idx}`;
      try {
        const { file: cf, preview, originalSize, compressedSize } = await compressImage(file);
        return { id, label: "", fileName: cf.name, preview, originalSize, compressedSize };
      } catch {
        const preview = await new Promise(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result); fr.readAsDataURL(file); });
        return { id, label: "", fileName: file.name, preview, originalSize: file.size, compressedSize: file.size, error: true };
      }
    }));
    const byIndex = getRemarkPhotosByIndex();
    setField("remarkPhotosByIndex", { ...byIndex, [rowIndex]: [...(byIndex[rowIndex] || []), ...processed] });
  };

  const updateRemarkPhotoLabel = (rowIndex, id, label) => {
    const byIndex = getRemarkPhotosByIndex();
    setField("remarkPhotosByIndex", { ...byIndex, [rowIndex]: (byIndex[rowIndex] || []).map(p => p.id === id ? { ...p, label } : p) });
  };

  const removeRemarkPhoto = (rowIndex, id) => {
    const byIndex = getRemarkPhotosByIndex();
    setField("remarkPhotosByIndex", { ...byIndex, [rowIndex]: (byIndex[rowIndex] || []).filter(p => p.id !== id) });
  };

  const handleProblemRemarkChange = (index, value) => {
    const remarks = [...(Array.isArray(form.remarks) && form.remarks.length > 0 ? form.remarks : Array(3).fill(""))];
    remarks[index] = value;
    setField("remarks", remarks);
  };

  const remarkRows = Array.isArray(form.remarks) && form.remarks.length > 0 ? form.remarks : Array(3).fill("");

  const addRemarkRow = () => setField("remarks", [...remarkRows, ""]);

  const removeRemarkRow = (removeIndex) => {
    if (remarkRows.length <= 1) return;
    const nextRemarks = remarkRows.filter((_, i) => i !== removeIndex);
    const byIndex = getRemarkPhotosByIndex();
    const reindexed = {};
    Object.keys(byIndex).forEach(key => {
      const i = Number(key);
      if (!Number.isFinite(i) || i === removeIndex) return;
      reindexed[i > removeIndex ? i - 1 : i] = byIndex[key];
    });
    setField("remarks", nextRemarks);
    setField("remarkPhotosByIndex", reindexed);
  };

  return (
    <div>

      {/* ── Card: Problem Remarks ── */}
      <div style={cardStyle}>
        <CardHeader title="III. Problem Remarks" />

        {remarkRows.map((_, i) => (
          <div key={i} style={{ borderBottom: i < remarkRows.length - 1 ? "1px solid #edf0f5" : "none" }}>
            <div style={{ display: "flex", padding: "10px 16px", gap: "12px" }}>
              {/* Row number */}
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: colors.primaryLight, color: colors.primary, fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "3px" }}>
                {i + 1}
              </div>

              <div style={{ flex: 1 }}>
                <SmartTextarea
                  name="remark"
                  value={remarkRows[i] || ""}
                  onChange={(e) => handleProblemRemarkChange(i, e.target.value)}
                  placeholder="Enter remark or defect finding…"
                  context="factory inspection defect finding or observation"
                  minHeight={52}
                  style={{ width: "100%", border: "none", borderBottom: "1px solid transparent", outline: "none", background: "transparent", color: colors.text, fontSize: "13px", padding: "1px 4px", fontFamily: "inherit", transition: "border-color 0.2s" }}
                  onFocus={(e) => { e.target.style.borderBottomColor = colors.primary; }}
                  onBlur={(e)  => { e.target.style.borderBottomColor = "transparent"; }}
                />

                {/* Per-row photos */}
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "6px", border: `1px dashed ${colors.border}`, background: colors.surfaceAlt, color: colors.textMuted, cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>
                    📎 Add photo
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { handleRemarkPhotosUpload(i, e.target.files); e.target.value = ""; }} />
                  </label>
                  <button type="button" onClick={() => removeRemarkRow(i)} disabled={remarkRows.length <= 1}
                    style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: "6px", border: "none", background: remarkRows.length <= 1 ? colors.surfaceAlt : "#fef2f2", color: remarkRows.length <= 1 ? colors.textMuted : colors.danger, cursor: remarkRows.length <= 1 ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: 600 }}
                  >Remove</button>
                </div>

                {getPhotosForRow(i).length > 0 && (
                  <div style={{ marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px" }}>
                    {getPhotosForRow(i).map(photo => (
                      <div key={photo.id} style={{ borderRadius: "6px", overflow: "hidden", border: `1px solid ${colors.border}`, background: "#f8f9fa" }}>
                        <img src={photo.preview} alt={photo.fileName} style={{ width: "100%", height: "80px", objectFit: "cover", display: "block" }} />
                        <div style={{ padding: "5px" }}>
                          <input type="text" value={photo.label || ""} placeholder="Photo note" onChange={e => updateRemarkPhotoLabel(i, photo.id, e.target.value)}
                            style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "4px", fontSize: "10px", padding: "3px 5px", boxSizing: "border-box", marginBottom: "4px" }} />
                          <div style={{ fontSize: "9px", color: photo.error ? colors.danger : colors.success, marginBottom: "3px" }}>
                            {photo.compressedSize ? formatFileSize(photo.compressedSize) : "—"}
                          </div>
                          <button type="button" onClick={() => removeRemarkPhoto(i, photo.id)}
                            style={{ width: "100%", border: "none", borderRadius: "4px", background: colors.danger, color: "#fff", fontSize: "10px", padding: "3px", cursor: "pointer" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add row footer */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid #edf0f5", background: "#f8fafc" }}>
          <button type="button" onClick={addRemarkRow}
            style={{ border: "none", borderRadius: "6px", background: colors.primary, color: "#fff", fontSize: "12px", fontWeight: 600, padding: "6px 14px", cursor: "pointer" }}>
            + Add Remark Row
          </button>
        </div>
      </div>

      {/* ── Shared: Informative Remarks + Risk Assessment + Factory Info + Sample Collection ── */}
      <RemarksExtras form={form} onChange={handleChange} />

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
