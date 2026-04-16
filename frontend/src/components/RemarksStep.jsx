import { buttonStyle, colors, sectionHeaderStyle } from "../styles";
import { compressImage, formatFileSize } from "../utils/imageCompression";

const yesNoQuestions = [
  { key: "remarkQ1", text: "Is there any leakage on the roofs and walls (including windows and doors)?" },
  { key: "remarkQ2", text: "Is there any special-assigned person or department to be responsible for mold control?" },
  { key: "remarkQ3", text: "Is there any record for mold control?" },
  { key: "remarkQ4", text: "Do all cartons put on plastic pallets with min. 12cm height away from the floor, and at least 1.5 meters away from windows?" },
  { key: "remarkQ5", text: "Is there anyone such as factory QCs or supervisors to verify the procedure daily?" },
  { key: "remarkQ6", text: "Are the export cartons kept dry?" },
  { key: "remarkQ7", text: "Are there any damaged or wet cartons used?" },
];

const factoryCooperationOptions = [
  { value: "good", label: "Good - Enough manpower to assist, and good cooperation." },
  { value: "average", label: "Average - Enough manpower to assist." },
  { value: "poor", label: "Poor - Manpower, equipment or document not provided timely." },
];

const workerCountOptions = [
  { value: "lt50", label: "Less than 50 people" },
  { value: "50to100", label: "50-100 people" },
  { value: "100to500", label: "100-500 people" },
  { value: "500to1000", label: "500-1000 people" },
  { value: "gt1000", label: "More than 1000" },
];

const inspectorOpinionOptions = [
  { value: "good", label: "Good - The factory was neat and tidy. The testing equipment was well maintained and calibrated." },
  { value: "average", label: "Average - The factory was tidy, and the testing equipment ran normally." },
  { value: "poor", label: "Poor - The factory was messed, the basic testing equipment was not available / not workable." },
];

export default function RemarksStep({ form, handleChange, onPrev, onNext }) {
  const SECTION_PHOTO_KEY = "__section_photos__";
  const setField = (name, value) => {
    handleChange({ target: { name, value } });
  };

  const getRemarkPhotosByIndex = () => form.remarkPhotosByIndex || {};

  const getPhotosForRow = (rowIndex) => getRemarkPhotosByIndex()[rowIndex] || [];
  const getSectionPhotos = () => Array.isArray(form.remarkSectionPhotos) ? form.remarkSectionPhotos : [];

  const handleRemarkPhotosUpload = async (rowIndex, files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const processedPhotos = await Promise.all(
      selectedFiles.map(async (file, index) => {
        const uniqueId = `remark_${rowIndex}_${Date.now()}_${Math.random()}_${index}`;

        try {
          const { file: compressedFile, preview, originalSize, compressedSize } = await compressImage(file);
          return {
            id: uniqueId,
            label: "",
            fileName: compressedFile.name,
            preview,
            originalSize,
            compressedSize,
          };
        } catch {
          const preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });

          return {
            id: uniqueId,
            label: "",
            fileName: file.name,
            preview,
            originalSize: file.size,
            compressedSize: file.size,
            error: true,
          };
        }
      })
    );

    const byIndex = getRemarkPhotosByIndex();
    const existingForRow = byIndex[rowIndex] || [];

    setField("remarkPhotosByIndex", {
      ...byIndex,
      [rowIndex]: [...existingForRow, ...processedPhotos],
    });
  };

  const handleSectionPhotosUpload = async (files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    const processedPhotos = await Promise.all(
      selectedFiles.map(async (file, index) => {
        const uniqueId = `${SECTION_PHOTO_KEY}_${Date.now()}_${Math.random()}_${index}`;
        try {
          const { file: compressedFile, preview, originalSize, compressedSize } = await compressImage(file);
          return {
            id: uniqueId,
            label: "",
            fileName: compressedFile.name,
            preview,
            originalSize,
            compressedSize,
          };
        } catch {
          const preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          return {
            id: uniqueId,
            label: "",
            fileName: file.name,
            preview,
            originalSize: file.size,
            compressedSize: file.size,
            error: true,
          };
        }
      })
    );

    setField("remarkSectionPhotos", [...getSectionPhotos(), ...processedPhotos]);
  };

  const updateRemarkPhotoLabel = (rowIndex, id, label) => {
    const byIndex = getRemarkPhotosByIndex();
    const updatedForRow = (byIndex[rowIndex] || []).map((p) =>
      p.id === id ? { ...p, label } : p
    );
    setField("remarkPhotosByIndex", {
      ...byIndex,
      [rowIndex]: updatedForRow,
    });
  };

  const removeRemarkPhoto = (rowIndex, id) => {
    const byIndex = getRemarkPhotosByIndex();
    const updatedForRow = (byIndex[rowIndex] || []).filter((p) => p.id !== id);
    setField("remarkPhotosByIndex", {
      ...byIndex,
      [rowIndex]: updatedForRow,
    });
  };

  const updateSectionPhotoLabel = (id, label) => {
    const updated = getSectionPhotos().map((p) => (p.id === id ? { ...p, label } : p));
    setField("remarkSectionPhotos", updated);
  };

  const removeSectionPhoto = (id) => {
    const updated = getSectionPhotos().filter((p) => p.id !== id);
    setField("remarkSectionPhotos", updated);
  };

  const handleProblemRemarkChange = (index, value) => {
    const remarks = [...(Array.isArray(form.remarks) && form.remarks.length > 0 ? form.remarks : Array(5).fill(""))];
    remarks[index] = value;
    setField("remarks", remarks);
  };

  const remarkRows = Array.isArray(form.remarks) && form.remarks.length > 0 ? form.remarks : Array(5).fill("");

  const addRemarkRow = () => {
    setField("remarks", [...remarkRows, ""]);
  };

  const removeRemarkRow = (removeIndex) => {
    if (remarkRows.length <= 1) return;
    const nextRemarks = remarkRows.filter((_, idx) => idx !== removeIndex);
    const byIndex = getRemarkPhotosByIndex();
    const reindexedPhotos = {};
    Object.keys(byIndex).forEach((key) => {
      const idx = Number(key);
      if (!Number.isFinite(idx) || idx === removeIndex) return;
      const newIdx = idx > removeIndex ? idx - 1 : idx;
      reindexedPhotos[newIdx] = byIndex[key];
    });
    setField("remarks", nextRemarks);
    setField("remarkPhotosByIndex", reindexedPhotos);
  };

  return (
    <>
      <h3 style={{ ...sectionHeaderStyle, color: colors.text, marginBottom: "20px" }}>III. REMARKS</h3>

      <div style={{ border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "8px 12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "700", color: colors.text }}>
          Problem Remarks
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {remarkRows.map((_, i) => (
              <tr key={i + 1}>
                <td style={{ width: "40px", textAlign: "center", borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "600", color: colors.text }}>
                  {i + 1}.
                </td>
                <td style={{ borderBottom: `1px solid ${colors.border}`, padding: "4px 8px", background: colors.surface }}>
                  <input
                    type="text"
                    value={remarkRows[i] || ""}
                    onChange={(e) => handleProblemRemarkChange(i, e.target.value)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: colors.text,
                      fontSize: "13px",
                      padding: "3px 0",
                    }}
                  />
                  <div style={{ marginTop: "8px", borderTop: `1px dashed ${colors.border}`, paddingTop: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", color: colors.textMuted }}>Upload photos for this remark (multiple allowed)</span>
                        <label
                          htmlFor={`remarkPhotoUpload_${i}`}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "4px",
                            border: `1px solid ${colors.border}`,
                            background: colors.surfaceAlt,
                            color: colors.text,
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          + Add Photos
                        </label>
                        <input
                          id={`remarkPhotoUpload_${i}`}
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          onChange={(e) => {
                            handleRemarkPhotosUpload(i, e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {getPhotosForRow(i).length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                          {getPhotosForRow(i).map((photo) => (
                            <div key={photo.id} style={{ border: `1px solid ${colors.border}`, borderRadius: "4px", overflow: "hidden", background: colors.surfaceAlt }}>
                              <img
                                src={photo.preview}
                                alt={photo.fileName || "Remark photo"}
                                style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }}
                              />
                              <div style={{ padding: "6px" }}>
                                <input
                                  type="text"
                                  value={photo.label || ""}
                                  placeholder="Photo note"
                                  onChange={(e) => updateRemarkPhotoLabel(i, photo.id, e.target.value)}
                                  style={{
                                    width: "100%",
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "4px",
                                    background: colors.surface,
                                    color: colors.text,
                                    fontSize: "11px",
                                    padding: "5px",
                                    boxSizing: "border-box",
                                    marginBottom: "5px",
                                  }}
                                />
                                <div style={{ fontSize: "10px", color: photo.error ? colors.danger : colors.success, marginBottom: "5px" }}>
                                  {photo.compressedSize ? formatFileSize(photo.compressedSize) : "processing..."}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRemarkPhoto(i, photo.id)}
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    borderRadius: "4px",
                                    background: colors.danger,
                                    color: "#fff",
                                    fontSize: "11px",
                                    padding: "5px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                        <button
                          type="button"
                          onClick={() => removeRemarkRow(i)}
                          disabled={remarkRows.length <= 1}
                          style={{
                            border: "none",
                            borderRadius: "4px",
                            background: remarkRows.length <= 1 ? colors.textMuted : colors.danger,
                            color: "#fff",
                            fontSize: "11px",
                            padding: "4px 8px",
                            cursor: remarkRows.length <= 1 ? "not-allowed" : "pointer",
                          }}
                        >
                          Delete Remark
                        </button>
                      </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${colors.border}`, background: colors.surfaceAlt }}>
          <button
            type="button"
            onClick={addRemarkRow}
            style={{
              border: "none",
              borderRadius: "6px",
              background: colors.primary,
              color: "#fff",
              fontSize: "12px",
              fontWeight: "600",
              padding: "7px 12px",
              cursor: "pointer",
            }}
          >
            + Add Remark Row
          </button>
        </div>
      </div>

      <div style={{ border: `1px solid ${colors.border}`, borderRadius: "8px", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "8px 12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "700", color: colors.text }}>
          General Remarks
        </div>

        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
          <div style={{ marginBottom: "8px", color: colors.text, fontSize: "13px", fontWeight: "600" }}>
            We had checked mold potential about warehouse:
          </div>
          {yesNoQuestions.map((q) => (
            <div key={q.key} style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "4px 0", borderBottom: `1px dashed ${colors.border}` }}>
              <span style={{ color: colors.text, fontSize: "13px", flex: 1 }}>{q.text}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: "110px", justifyContent: "flex-end" }}>
                <label style={{ fontSize: "12px", color: colors.text, display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="radio"
                    name={q.key}
                    value="Yes"
                    checked={form[q.key] === "Yes"}
                    onChange={(e) => setField(q.key, e.target.value)}
                  />
                  Yes
                </label>
                <label style={{ fontSize: "12px", color: colors.text, display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="radio"
                    name={q.key}
                    value="No"
                    checked={form[q.key] === "No"}
                    onChange={(e) => setField(q.key, e.target.value)}
                  />
                  No
                </label>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", padding: "10px 0", color: colors.text, fontWeight: "600" }}>11.</div>
          <div style={{ padding: "10px 12px", background: colors.surface }}>
            <div style={{ fontSize: "13px", color: colors.text, marginBottom: "6px" }}>
              Based on our finding of material/accessories/semi-finished/finished products and the observation of product line, we recommend the manufacturer to make improvement or pay attention on follow up mass production:
            </div>
            <textarea
              value={form.recommendationText || ""}
              onChange={(e) => setField("recommendationText", e.target.value)}
              placeholder="Write recommendation notes..."
              style={{
                width: "100%",
                minHeight: "130px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                background: colors.surface,
                color: colors.text,
                fontSize: "13px",
                padding: "8px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <div style={{ padding: "8px 12px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, fontWeight: "700", color: colors.text }}>
          Factory Information
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", padding: "10px 0", color: colors.text, fontWeight: "600" }}>12.</div>
          <div style={{ padding: "10px 12px", background: colors.surface }}>
            <div style={{ marginBottom: "6px", fontSize: "13px", color: colors.text, fontWeight: "600" }}>Factory cooperation:</div>
            {factoryCooperationOptions.map((opt) => (
              <label key={opt.value} style={{ display: "block", color: colors.text, fontSize: "13px", marginBottom: "5px" }}>
                <input
                  type="radio"
                  name="factoryCooperation"
                  value={opt.value}
                  checked={form.factoryCooperation === opt.value}
                  onChange={(e) => setField("factoryCooperation", e.target.value)}
                  style={{ marginRight: "6px" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", padding: "10px 0", color: colors.text, fontWeight: "600" }}>13.</div>
          <div style={{ padding: "10px 12px", background: colors.surface }}>
            <div style={{ marginBottom: "6px", fontSize: "13px", color: colors.text, fontWeight: "600" }}>Number of workers in factory:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {workerCountOptions.map((opt) => (
                <label key={opt.value} style={{ color: colors.text, fontSize: "13px" }}>
                  <input
                    type="radio"
                    name="workerCount"
                    value={opt.value}
                    checked={form.workerCount === opt.value}
                    onChange={(e) => setField("workerCount", e.target.value)}
                    style={{ marginRight: "5px" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr", borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", padding: "10px 0", color: colors.text, fontWeight: "600" }}>14.</div>
          <div style={{ padding: "10px 12px", background: colors.surface }}>
            <div style={{ marginBottom: "6px", fontSize: "13px", color: colors.text, fontWeight: "600" }}>Inspector's opinion on the factory:</div>
            {inspectorOpinionOptions.map((opt) => (
              <label key={opt.value} style={{ display: "block", color: colors.text, fontSize: "13px", marginBottom: "5px" }}>
                <input
                  type="radio"
                  name="inspectorOpinion"
                  value={opt.value}
                  checked={form.inspectorOpinion === opt.value}
                  onChange={(e) => setField("inspectorOpinion", e.target.value)}
                  style={{ marginRight: "6px" }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr" }}>
          <div style={{ borderRight: `1px solid ${colors.border}`, background: colors.surfaceAlt, textAlign: "center", padding: "10px 0", color: colors.text, fontWeight: "600" }}>15.</div>
          <div style={{ padding: "10px 12px", background: colors.surface }}>
            <div style={{ marginBottom: "6px", fontSize: "13px", color: colors.text, fontWeight: "600" }}>Sample Collection Record:</div>
            <input
              type="text"
              value={form.sampleCollectionRecord || ""}
              onChange={(e) => setField("sampleCollectionRecord", e.target.value)}
              placeholder="e.g., production sample(s) & defective sample"
              style={{
                width: "100%",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                background: colors.surface,
                color: colors.text,
                fontSize: "13px",
                padding: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ padding: "10px 12px", borderTop: `1px solid ${colors.border}`, background: colors.surfaceAlt }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: colors.textMuted }}>
              Additional photos for Remarks section (will be shown with description in Word)
            </span>
            <label
              htmlFor="remarkSectionPhotoUpload"
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.text,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              + Add More Photos
            </label>
            <input
              id="remarkSectionPhotoUpload"
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                handleSectionPhotosUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          {getSectionPhotos().length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
              {getSectionPhotos().map((photo) => (
                <div key={photo.id} style={{ border: `1px solid ${colors.border}`, borderRadius: "4px", overflow: "hidden", background: colors.surface }}>
                  <img
                    src={photo.preview}
                    alt={photo.fileName || "Remark section photo"}
                    style={{ width: "100%", height: "110px", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: "6px" }}>
                    <input
                      type="text"
                      value={photo.label || ""}
                      placeholder="Photo description"
                      onChange={(e) => updateSectionPhotoLabel(photo.id, e.target.value)}
                      style={{
                        width: "100%",
                        border: `1px solid ${colors.border}`,
                        borderRadius: "4px",
                        background: colors.surface,
                        color: colors.text,
                        fontSize: "11px",
                        padding: "5px",
                        boxSizing: "border-box",
                        marginBottom: "5px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSectionPhoto(photo.id)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: "4px",
                        background: colors.danger,
                        color: "#fff",
                        fontSize: "11px",
                        padding: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}

