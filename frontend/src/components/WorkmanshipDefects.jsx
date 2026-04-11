import { inputStyle, buttonStyle, colors, sectionHeaderStyle } from "../styles";

export default function WorkmanshipDefects({ form, handleChange, onPrev, onNext }) {
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const resolveResult = (manual, found, accepted) => {
    if (manual) return manual;
    return toNum(found) <= toNum(accepted) ? "Pass" : "Fail";
  };

  const setField = (name, value) => {
    handleChange({ target: { name, value } });
  };

  const handleDefectPhotoUpload = (num, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setField(`defectPhotoPreview${num}`, reader.result);
      setField(`defectPhoto${num}`, file.name);
    };
    reader.readAsDataURL(file);
  };

  const clearDefectPhoto = (num) => {
    setField(`defectPhoto${num}`, "");
    setField(`defectPhotoPreview${num}`, "");
    setField(`defectPhotoDescription${num}`, form[`defectPhotoDescription${num}`] || "");
  };

  return (
    <>
      <h3 style={{ ...sectionHeaderStyle, marginBottom: "0px", padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>B. WORKMANSHIP</h3>

      {/* Workmanship Summary Table */}
      <div style={{ marginBottom: "25px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, fontWeight: "bold", color: colors.text, width: "18%" }}>
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
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, fontWeight: "bold", color: colors.text, textAlign: "center", width: "20%" }}>AQL</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, fontWeight: "bold", color: colors.text, textAlign: "center", width: "10%" }}>Accepted</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, fontWeight: "bold", color: colors.text, textAlign: "center", width: "11%" }}>Total Found</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, fontWeight: "bold", color: colors.text, textAlign: "center", width: "15%" }}>Result</td>
            </tr>

            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontWeight: "bold" }}>Sampling Plan:</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input type="text" name="samplingPlanWM" value={form.samplingPlanWM || "Fixed Sample Size"} onChange={handleChange} style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}>
                <strong>Critical:</strong>&nbsp;
                <input type="text" name="aqlCriticalWM" value={form.aqlCriticalWM || "Not Allowed"} onChange={handleChange} style={{ width: "55%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {form.acceptedCritical || "0"}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {form.totalFoundCritical || "0"}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {resolveResult(form.result1WM, form.totalFoundCritical, form.acceptedCritical)}
              </td>
            </tr>

            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontWeight: "bold" }}>Inspection Level:</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input type="text" name="inspectionLevelWM" value={form.inspectionLevelWM || "Level II"} onChange={handleChange} style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}>
                <strong>Major:</strong>&nbsp;
                <input type="text" name="aqlMajorWM" value={form.aqlMajorWM || "2.5"} onChange={handleChange} style={{ width: "55%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {form.acceptedMajor || "0"}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {form.totalFoundMajor || "0"}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {resolveResult(form.result2WM, form.totalFoundMajor, form.acceptedMajor)}
              </td>
            </tr>

            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontWeight: "bold" }}>Sample Size:</td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input type="text" name="sampleSizeWM" value={form.sampleSizeWM || "5 Sets"} onChange={handleChange} style={{ width: "100%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}>
                <strong>Minor:</strong>&nbsp;
                <input type="text" name="aqlMinorWM" value={form.aqlMinorWM || "4.0"} onChange={handleChange} style={{ width: "55%", border: "none", background: "transparent", color: colors.text, fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {form.acceptedMinor || "0"}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {form.totalFoundMinor || "0"}
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text }}>
                {resolveResult(form.result3WM, form.totalFoundMinor, form.acceptedMinor)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: "20px", ...sectionHeaderStyle, padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>VI. WORKMANSHIP DEFECTS / INSPECTION FINDINGS</h3>

      {/* Workmanship Defects Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left", minWidth: "250px" }}>Description</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", minWidth: "80px" }}>Critical</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", minWidth: "80px" }}>Major</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", minWidth: "80px" }}>Minor</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <tr key={num}>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                  <textarea
                    name={`defectDescription${num}`}
                    value={form[`defectDescription${num}`] || ""}
                    onChange={handleChange}
                    placeholder={`Defect ${num} description...`}
                    style={{
                      width: "100%",
                      padding: "4px",
                      background: colors.surface,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "2px",
                      minHeight: "40px",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="text"
                    name={`defectCritical${num}`}
                    value={form[`defectCritical${num}`] || ""}
                    onChange={handleChange}
                    style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="text"
                    name={`defectMajor${num}`}
                    value={form[`defectMajor${num}`] || ""}
                    onChange={handleChange}
                    style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
                  <input
                    type="text"
                    name={`defectMinor${num}`}
                    value={form[`defectMinor${num}`] || ""}
                    onChange={handleChange}
                    style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
              </tr>
            ))}

            {/* Total Found Row */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text }}>
                Total Found:
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="totalFoundCritical"
                  value={form.totalFoundCritical || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="totalFoundMajor"
                  value={form.totalFoundMajor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="totalFoundMinor"
                  value={form.totalFoundMinor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
            </tr>

            {/* Accepted Row */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text }}>
                Accepted:
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="acceptedCritical"
                  value={form.acceptedCritical || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="acceptedMajor"
                  value={form.acceptedMajor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="acceptedMinor"
                  value={form.acceptedMinor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
            </tr>

            {/* Sample Size Row */}
            <tr>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, fontWeight: "bold", color: colors.text }}>
                Sample Size:
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="sampleSizeCritical"
                  value={form.sampleSizeCritical || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="sampleSizeMajor"
                  value={form.sampleSizeMajor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.headerBg, textAlign: "center", fontWeight: "bold", color: colors.text }}>
                <input
                  type="text"
                  name="sampleSizeMinor"
                  value={form.sampleSizeMinor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: colors.surface, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "2px", textAlign: "center" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
          <input
            type="text"
            name="workmanshipRemark"
            value={form.workmanshipRemark || ""}
            onChange={handleChange}
            placeholder="Enter remarks..."
            style={{ ...inputStyle }}
          />
        </div>
      </div>

      {/* Defect Photos Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "bold", color: colors.text }}>Defect Photos:</h4>
        
        {[1, 2, 3, 4].map((num) => (
          <div key={num} style={{ marginBottom: "20px", padding: "15px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px", alignItems: "start" }}>
              {/* Photo Upload Area */}
              <div style={{ position: "relative" }}>
                <input
                  type="file"
                  accept="image/*"
                  id={`defectPhotoInput${num}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleDefectPhotoUpload(num, file);
                  }}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor={`defectPhotoInput${num}`}
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
                    <div style={{ fontSize: "11px", marginTop: "5px", color: colors.textMuted }}>
                      {form[`defectPhoto${num}`] || "No photo"}
                    </div>
                  </div>
                </label>

                {typeof form[`defectPhotoPreview${num}`] === "string" &&
                  form[`defectPhotoPreview${num}`].startsWith("data:image") && (
                    <div style={{ marginTop: "8px" }}>
                      <img
                        src={form[`defectPhotoPreview${num}`]}
                        alt={`Defect ${num} preview`}
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: `1px solid ${colors.border}`,
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => clearDefectPhoto(num)}
                        style={{
                          marginTop: "6px",
                          width: "100%",
                          border: "none",
                          borderRadius: "6px",
                          background: colors.danger,
                          color: "#fff",
                          fontSize: "11px",
                          padding: "6px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
              </div>

              {/* Description Area */}
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: colors.text }}>
                  Defect Photo {num} Description:
                </label>
                <textarea
                  name={`defectPhotoDescription${num}`}
                  value={form[`defectPhotoDescription${num}`] || ""}
                  onChange={handleChange}
                  placeholder={`Describe defect photo ${num}...`}
                  style={{
                    ...inputStyle,
                    minHeight: "120px",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
