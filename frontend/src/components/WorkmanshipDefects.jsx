import { inputStyle, buttonStyle } from "../styles";

export default function WorkmanshipDefects({ form, handleChange, onPrev, onNext }) {
  return (
    <>
      <h3 style={{ marginBottom: "0px", padding: "10px", background: "#0f172a", color: "#fff", fontWeight: "bold", fontSize: "14px" }}>B. WORKMANSHIP</h3>

      {/* Workmanship Summary Table */}
      <div style={{ marginBottom: "25px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c", fontSize: "12px" }}>
          <tbody>
            {/* Header Row */}
            <tr>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1a2332", fontWeight: "bold", color: "#fff", width: "18%" }}>Inspection Standard:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1a2332", width: "18%" }}></td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1a2332", fontWeight: "bold", color: "#fff", width: "16%" }}>AQL</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1a2332", fontWeight: "bold", color: "#fff", width: "16%" }}>Accepted</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1a2332", fontWeight: "bold", color: "#fff", width: "16%" }}>Total Found</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1a2332", fontWeight: "bold", color: "#fff", width: "16%" }}>Result</td>
            </tr>

            {/* Row 1 - Inspection Standard Value */}
            <tr>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="inspectionStandardWM" value={form.inspectionStandardWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px", outline: "none" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}></td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}></td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}></td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}></td>
            </tr>

            {/* Row 2 - Sampling Plan with Critical */}
            <tr>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", color: "#fff", fontWeight: "bold" }}>Sampling Plan:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="samplingPlanWM" value={form.samplingPlanWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", fontWeight: "bold", color: "#fff" }}>Critical:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="aqlCriticalWM" value={form.aqlCriticalWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center", color: "#fff" }}>0</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="result1WM" value={form.result1WM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
            </tr>

            {/* Row 3 - Inspection Level with Major */}
            <tr>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", color: "#fff", fontWeight: "bold" }}>Inspection Level:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="inspectionLevelWM" value={form.inspectionLevelWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", fontWeight: "bold", color: "#fff" }}>Major:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="aqlMajorWM" value={form.aqlMajorWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center", color: "#fff" }}>0</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="result2WM" value={form.result2WM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
            </tr>

            {/* Row 4 - Sample Size with Minor */}
            <tr>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", color: "#fff", fontWeight: "bold" }}>Sample Size:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="sampleSizeWM" value={form.sampleSizeWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", fontWeight: "bold", color: "#fff" }}>Minor:</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="aqlMinorWM" value={form.aqlMinorWM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center", color: "#fff" }}>0</td>
              <td style={{ padding: "10px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                <input type="text" name="result3WM" value={form.result3WM || ""} onChange={handleChange} placeholder="" style={{ width: "100%", border: "none", background: "transparent", color: "#fff", fontSize: "12px" }} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: "20px" }}>VI. WORKMANSHIP DEFECTS / INSPECTION FINDINGS</h3>

      {/* Workmanship Defects Table */}
      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "left", minWidth: "250px" }}>Description</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", minWidth: "80px" }}>Critical</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", minWidth: "80px" }}>Major</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", minWidth: "80px" }}>Minor</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <tr key={num}>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                  <textarea
                    name={`defectDescription${num}`}
                    value={form[`defectDescription${num}`] || ""}
                    onChange={handleChange}
                    placeholder={`Defect ${num} description...`}
                    style={{
                      width: "100%",
                      padding: "4px",
                      background: "#2a3a4c",
                      color: "#fff",
                      border: "none",
                      borderRadius: "2px",
                      minHeight: "40px",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    name={`defectCritical${num}`}
                    value={form[`defectCritical${num}`] || ""}
                    onChange={handleChange}
                    style={{ width: "70px", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    name={`defectMajor${num}`}
                    value={form[`defectMajor${num}`] || ""}
                    onChange={handleChange}
                    style={{ width: "70px", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
                <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                  <input
                    type="text"
                    name={`defectMinor${num}`}
                    value={form[`defectMinor${num}`] || ""}
                    onChange={handleChange}
                    style={{ width: "70px", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                  />
                </td>
              </tr>
            ))}

            {/* Total Found Row */}
            <tr>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", fontWeight: "bold", color: "#fff" }}>
                Total Found:
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="totalFoundCritical"
                  value={form.totalFoundCritical || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="totalFoundMajor"
                  value={form.totalFoundMajor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="totalFoundMinor"
                  value={form.totalFoundMinor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
            </tr>

            {/* Accepted Row */}
            <tr>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", fontWeight: "bold", color: "#fff" }}>
                Accepted:
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="acceptedCritical"
                  value={form.acceptedCritical || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="acceptedMajor"
                  value={form.acceptedMajor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="acceptedMinor"
                  value={form.acceptedMinor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
            </tr>

            {/* Sample Size Row */}
            <tr>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", fontWeight: "bold", color: "#fff" }}>
                Sample Size:
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="sampleSizeCritical"
                  value={form.sampleSizeCritical || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="sampleSizeMajor"
                  value={form.sampleSizeMajor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
              <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#0f172a", textAlign: "center", fontWeight: "bold", color: "#fff" }}>
                <input
                  type="text"
                  name="sampleSizeMinor"
                  value={form.sampleSizeMinor || ""}
                  onChange={handleChange}
                  style={{ width: "70px", padding: "4px", background: "#1a2a3c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes Section */}
      <div style={{ marginBottom: "20px", padding: "15px", background: "#0f172a", border: "1px solid #3a4a5c", borderRadius: "8px" }}>
        <p style={{ color: "#8a9aaa", fontSize: "12px", marginBottom: "10px" }}>
          <strong>Notes:</strong> Class 1 | Class 2 | Blemishes
        </p>
      </div>

      {/* Defect Photos Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "bold", color: "#fff" }}>Defect Photos:</h4>
        
        {[1, 2, 3, 4].map((num) => (
          <div key={num} style={{ marginBottom: "20px", padding: "15px", background: "#0f172a", border: "1px solid #3a4a5c", borderRadius: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "15px", alignItems: "start" }}>
              {/* Photo Upload Area */}
              <div
                style={{
                  height: "150px",
                  border: "2px dashed #3a4a5c",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "#1e293b",
                  transition: "all 0.3s"
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  name={`defectPhoto${num}`}
                  onChange={(e) => {
                    const fileName = e.target.files?.[0]?.name || "";
                    handleChange({ target: { name: `defectPhoto${num}`, value: fileName } });
                  }}
                  style={{ display: "none" }}
                />
                <div style={{ textAlign: "center", color: "#8a9aaa" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>📷</div>
                  <div style={{ fontSize: "12px" }}>Click to upload photo</div>
                  <div style={{ fontSize: "11px", marginTop: "5px", color: "#5a6a7a" }}>
                    {form[`defectPhoto${num}`] || "No photo selected"}
                  </div>
                </div>
              </div>

              {/* Description Area */}
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", color: "#fff" }}>
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
