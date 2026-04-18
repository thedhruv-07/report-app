import React, { useState, useEffect } from "react";
import { inputStyle, buttonStyle, colors, sectionHeaderStyle } from "../styles";
import SmartTextarea from "./SmartTextarea";

export default function WorkmanshipDefects({ form, handleChange, onPrev, onNext, onWorkmanshipDefectsChange, onWorkmanshipPhotosChange, items }) {
  const setField = (name, value) => handleChange({ target: { name, value } });
  // Initialize defects from form
  const [defects, setDefects] = useState(() => {
    if (form.workmanshipDefects && Array.isArray(form.workmanshipDefects) && form.workmanshipDefects.length > 0) {
      return form.workmanshipDefects;
    }
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item, idx) => ({
        id: Date.now() + idx,
        itemName: item.itemName || item.name || `Item ${idx + 1}`,
        description: "",
        critical: "",
        major: "",
        minor: "",
        sampleSize: item.sampleSizePacked || "0"
      }));
    }
    return [{ id: Date.now(), itemName: "Item 1", description: "", critical: "", major: "", minor: "", sampleSize: "0" }];
  });

  // Initialize defect photos from form
  const [defectPhotos, setDefectPhotos] = useState(() => {
    if (form.workmanshipPhotos && Array.isArray(form.workmanshipPhotos) && form.workmanshipPhotos.length > 0) {
      return form.workmanshipPhotos;
    }
    return [{ id: Date.now(), preview: "", fileName: "", description: "" }];
  });

  // Sync to parent whenever defects change
  useEffect(() => {
    onWorkmanshipDefectsChange(defects);
  }, [defects]);

  // Sync to parent whenever photos change
  useEffect(() => {
    onWorkmanshipPhotosChange(defectPhotos);
  }, [defectPhotos]);

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const resolveResult = (manual, found, accepted) => {
    if (manual) return manual;
    return toNum(found) <= toNum(accepted) ? "Pass" : "Fail";
  };

  const addDefect = () => {
    setDefects([
      ...defects,
      { id: Date.now(), itemName: "", description: "", critical: "", major: "", minor: "", sampleSize: "" }
    ]);
  };

  const removeDefect = (id) => {
    if (defects.length <= 1) return;
    setDefects(defects.filter(d => d.id !== id));
  };

  const updateDefect = (id, field, value) => {
    setDefects(defects.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addDefectPhoto = () => {
    setDefectPhotos([
      ...defectPhotos,
      { id: Date.now(), preview: "", fileName: "", description: "" }
    ]);
  };

  const removeDefectPhoto = (id) => {
    if (defectPhotos.length <= 1) {
      updateDefectPhoto(id, { preview: "", fileName: "", description: "" });
      return;
    }
    setDefectPhotos(defectPhotos.filter(p => p.id !== id));
  };

  const updateDefectPhoto = (id, updates) => {
    setDefectPhotos(defectPhotos.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDefectPhotoUpload = (id, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateDefectPhoto(id, {
        preview: reader.result,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <h3 style={{ ...sectionHeaderStyle, marginBottom: "0px", padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>B. WORKMANSHIP</h3>

      {/* Workmanship Summary Table */}
      <div style={{ marginBottom: "25px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text, width: "18%" }}>
                Inspection Standard:
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, width: "26%" }}>
                <input
                  type="text"
                  name="inspectionStandardWM"
                  value={form.inspectionStandardWM || "ANSI/ASQ Z1.4 (ISO 2859-1)"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text, textAlign: "center", width: "20%" }}>AQL</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text, textAlign: "center", width: "10%" }}>Accepted</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text, textAlign: "center", width: "11%" }}>Total Found</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, fontWeight: "bold", color: colors.text, textAlign: "center", width: "15%" }}>Result</td>
            </tr>

            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text, fontWeight: "bold" }}>Sampling Plan:</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input type="text" name="samplingPlanWM" value={form.samplingPlanWM || "Fixed Sample Size"} onChange={handleChange} style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text }}>
                <strong>Critical:</strong>&nbsp;
                <input type="text" name="aqlCriticalWM" value={form.aqlCriticalWM || "Not Allowed"} onChange={handleChange} style={{ width: "55%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="acceptedCritical"
                  value={form.acceptedCritical || "0"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="totalFoundCritical"
                  value={form.totalFoundCritical || "0"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                 <input
                  type="text"
                  name="result1WM"
                  value={form.result1WM || resolveResult(form.result1WM, form.totalFoundCritical, form.acceptedCritical)}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
            </tr>

            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text, fontWeight: "bold" }}>Inspection Level:</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input type="text" name="inspectionLevelWM" value={form.inspectionLevelWM || "Level II"} onChange={handleChange} style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text }}>
                <strong>Major:</strong>&nbsp;
                <input type="number" name="aqlMajorWM" value={form.aqlMajorWM || "2.5"} onChange={handleChange} style={{ width: "55%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="acceptedMajor"
                  value={form.acceptedMajor || "0"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="totalFoundMajor"
                  value={form.totalFoundMajor || "0"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="text"
                  name="result2WM"
                  value={form.result2WM || resolveResult(form.result2WM, form.totalFoundMajor, form.acceptedMajor)}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
            </tr>

            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text, fontWeight: "bold" }}>Sample Size:</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input type="text" name="sampleSizeWM" value={form.sampleSizeWM || "5 Sets"} onChange={handleChange} style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surfaceAlt, color: colors.text }}>
                <strong>Minor:</strong>&nbsp;
                <input type="text" name="aqlMinorWM" value={form.aqlMinorWM || "4.0"} onChange={handleChange} style={{ width: "55%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="acceptedMinor"
                  value={form.acceptedMinor || "0"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="totalFoundMinor"
                  value={form.totalFoundMinor || "0"}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="text"
                  name="result3WM"
                  value={form.result3WM || resolveResult(form.result3WM, form.totalFoundMinor, form.acceptedMinor)}
                  onChange={handleChange}
                  style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none", textAlign: "center" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: "20px", ...sectionHeaderStyle, padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>WORKMANSHIP DEFECTS / INSPECTION FINDINGS</h3>

      {/* Workmanship Defects Table */}
      <div style={{ marginBottom: "15px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left", width: "30%" }}>Item Name</th>
              <th style={{ padding: "10px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left" }}>Description</th>
              <th style={{ padding: "10px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "80px" }}>Critical</th>
              <th style={{ padding: "10px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "80px" }}>Major</th>
              <th style={{ padding: "10px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "80px" }}>Minor</th>
              <th style={{ padding: "10px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", width: "50px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((defect) => (
              <tr key={defect.id}>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                  <input
                    type="text"
                    value={defect.itemName}
                    onChange={(e) => updateDefect(defect.id, "itemName", e.target.value)}
                    placeholder="Enter item name..."
                    style={{ width: "100%", padding: "4px", background: "transparent", color: colors.text, border: "none", fontSize: "12px", outline: "none" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                  <SmartTextarea
                    value={defect.description}
                    onChange={(e) => updateDefect(defect.id, "description", e.target.value)}
                    placeholder="Defect description..."
                    context="workmanship quality defect description"
                    style={{
                      width: "100%",
                      padding: "4px",
                      background: "transparent",
                      color: colors.text,
                      border: "none",
                      fontSize: "12px",
                      outline: "none",
                      fontFamily: "inherit",
                      minHeight: "30px"
                    }}
                  />
                </td>
                <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={defect.critical}
                    onChange={(e) => updateDefect(defect.id, "critical", e.target.value)}
                    style={{ width: "100%", padding: "12px 0", background: "transparent", color: colors.text, border: "none", textAlign: "center", outline: "none" }}
                  />
                </td>
                <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={defect.major}
                    onChange={(e) => updateDefect(defect.id, "major", e.target.value)}
                    style={{ width: "100%", padding: "12px 0", background: "transparent", color: colors.text, border: "none", textAlign: "center", outline: "none" }}
                  />
                </td>
                <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={defect.minor}
                    onChange={(e) => updateDefect(defect.id, "minor", e.target.value)}
                    style={{ width: "100%", padding: "12px 0", background: "transparent", color: colors.text, border: "none", textAlign: "center", outline: "none" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <button
                    onClick={() => removeDefect(defect.id)}
                    style={{
                      background: colors.danger,
                      color: "#fff",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "10px"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {/* Total Found Row aligned with columns */}
            <tr>
              <td colSpan={2} style={{ padding: "12px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text, textAlign: "right" }}>
                Total Found:
              </td>
              <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="totalFoundCritical"
                  value={form.totalFoundCritical || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px 0", border: "none", textAlign: "center", background: "#f8fafc", color: colors.text, fontWeight: "bold", outline: "none" }}
                />
              </td>
              <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="totalFoundMajor"
                  value={form.totalFoundMajor || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px 0", border: "none", textAlign: "center", background: "#f8fafc", color: colors.text, fontWeight: "bold", outline: "none" }}
                />
              </td>
              <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="totalFoundMinor"
                  value={form.totalFoundMinor || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px 0", border: "none", textAlign: "center", background: "#f8fafc", color: colors.text, fontWeight: "bold", outline: "none" }}
                />
              </td>
              <td style={{ border: `1px solid ${colors.border}`, background: colors.headerBg }}></td>
            </tr>

            {/* Accepted Row aligned with columns */}
            <tr>
              <td colSpan={2} style={{ padding: "12px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text, textAlign: "right" }}>
                Accepted:
              </td>
              <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="acceptedCritical"
                  value={form.acceptedCritical || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px 0", border: "none", textAlign: "center", background: "#f8fafc", color: colors.text, fontWeight: "bold", outline: "none" }}
                />
              </td>
              <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="acceptedMajor"
                  value={form.acceptedMajor || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px 0", border: "none", textAlign: "center", background: "#f8fafc", color: colors.text, fontWeight: "bold", outline: "none" }}
                />
              </td>
              <td style={{ padding: "0px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  name="acceptedMinor"
                  value={form.acceptedMinor || ""}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "12px 0", border: "none", textAlign: "center", background: "#f8fafc", color: colors.text, fontWeight: "bold", outline: "none" }}
                />
              </td>
              <td style={{ border: `1px solid ${colors.border}`, background: colors.headerBg }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={addDefect}
        style={{
          ...buttonStyle,
          background: colors.success,
          color: "#fff",
          marginBottom: "25px",
          padding: "8px 15px",
          fontSize: "12px"
        }}
      >
        + Add Defect Row
      </button>

      {/* Notes Section */}
      <div style={{ marginBottom: "20px", padding: "15px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
        <p style={{ color: colors.textMuted, fontSize: "12px", marginBottom: "10px" }}>
          <strong>Notes:</strong> A Defective is defined as a unit of product that contains one or more defects. A Defect is defined as any non-conformance of the inspected unit of product with specified requirement. A single defect is taken into account per each defective unit; only one most critical classification per defective unit.
        </p>
      </div>

      {/* Result and Remark */}
      <div style={{ marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px" }}>
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: colors.text }}>Result:</label>
          <select
            name="workmanshipResult"
            value={form.workmanshipResult || ""}
            onChange={handleChange}
            style={{
              ...inputStyle,
              color: form.workmanshipResult === "Failed" ? colors.danger : form.workmanshipResult === "Passed" ? colors.success : form.workmanshipResult === "Pending" ? colors.warning : colors.text,
              fontWeight: "bold"
            }}
          >
            <option value="">Select Result</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: colors.text }}>Remark:</label>
          <SmartTextarea
            name="workmanshipRemark"
            value={form.workmanshipRemark || ""}
            onChange={(e) => setField("workmanshipRemark", e.target.value)}
            placeholder="Enter remarks..."
            context="overall workmanship inspection summary and findings"
            style={{ ...inputStyle }}
          />
        </div>
      </div>

      {/* Defect Photos Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "bold", color: colors.text }}>Defect Photos:</h4>
        
        {defectPhotos.map((photo, index) => (
          <div key={photo.id} style={{ marginBottom: "20px", padding: "15px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "8px", position: "relative" }}>
            <button
              onClick={() => removeDefectPhoto(photo.id)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: colors.danger,
                color: "#fff",
                border: "none",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "14px",
                zIndex: 10
              }}
            >
              ×
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px", alignItems: "start" }}>
              {/* Photo Upload Area */}
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  accept="image/*"
                  id={`defectPhotoInput-${photo.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleDefectPhotoUpload(photo.id, file);
                  }}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={`defectPhotoInput-${photo.id}`}
                  style={{
                    height: "150px",
                    border: `2px dashed ${colors.border}`,
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: colors.surface,
                    transition: "all 0.3s",
                    color: colors.textMuted
                  }}
                >
                  <div style={{ textAlign: "center", color: colors.textMuted }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>📷</div>
                    <div style={{ fontSize: "12px" }}>Click to upload</div>
                    <div style={{ fontSize: "11px", marginTop: "5px", color: colors.textMuted, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {photo.fileName || "No photo selected"}
                    </div>
                  </div>
                </label>

                {photo.preview && (
                  <div style={{ marginTop: "8px" }}>
                    <img
                      src={photo.preview}
                      alt={`Defect preview ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: `1px solid ${colors.border}`,
                        display: "block",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Description Area */}
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: colors.text }}>
                  Defect Photo {index + 1} Description:
                </label>
                <SmartTextarea
                  value={photo.description}
                  onChange={(e) => updateDefectPhoto(photo.id, { description: e.target.value })}
                  placeholder={`Describe defect photo ${index + 1}...`}
                  context="specific defect photo description and location"
                  style={{
                    ...inputStyle,
                    minHeight: "120px",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        
        <button
          onClick={addDefectPhoto}
          style={{
            ...buttonStyle,
            background: colors.primary,
            color: "#fff",
            padding: "8px 15px",
            fontSize: "12px"
          }}
        >
          + Add Defect Photo
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
