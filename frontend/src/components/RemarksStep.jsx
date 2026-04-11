import { inputStyle, buttonStyle } from "../styles";

export default function RemarksStep({ form, handleChange, onPrev, onNext }) {
  const handleRemarkChange = (index, value) => {
    const remarks = form.remarks || [];
    remarks[index] = value;
    handleChange({ target: { name: "remarks", value: remarks } });
  };

  const handleCheckboxChange = (fieldName, value) => {
    handleChange({ target: { name: fieldName, value } });
  };

  return (
    <>
      <h3 style={{ marginBottom: "20px" }}>III. REMARKS</h3>

      {/* Problem Remarks */}
      <div style={{ marginBottom: "25px" }}>
        <h4 style={{ marginBottom: "10px", fontWeight: "bold", borderBottom: "2px solid #3a4a5c", paddingBottom: "8px" }}>Problem Remarks:</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c" }}>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <tr key={num}>
                <td style={{ padding: "8px 12px", fontWeight: "bold", background: "#0f172a", border: "1px solid #3a4a5c", textAlign: "center", color: "#fff", width: "40px" }}>{num}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                  <textarea
                    value={(form.remarks && form.remarks[num - 1]) || ""}
                    onChange={(e) => handleRemarkChange(num - 1, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#2a3a4c",
                      color: "#fff",
                      border: "1px solid #4a5a6c",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      minHeight: "50px",
                      boxSizing: "border-box"
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* General Remarks */}
      <div style={{ marginBottom: "25px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "bold", borderBottom: "2px solid #3a4a5c", paddingBottom: "8px" }}>General Remarks:</h4>
        
        {/* Checkbox items - one per row */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#0f172a", borderRadius: "4px" }}>
            <span style={{ color: "#fff", flex: "1" }}>We have checked mold potential about warehouse:</span>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="moldPotential"
                  value="Yes"
                  checked={form.moldPotential === "Yes"}
                  onChange={(e) => handleCheckboxChange("moldPotential", e.target.value)}
                />
                Yes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="moldPotential"
                  value="No"
                  checked={form.moldPotential === "No"}
                  onChange={(e) => handleCheckboxChange("moldPotential", e.target.value)}
                />
                No
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#0f172a", borderRadius: "4px" }}>
            <span style={{ color: "#fff", flex: "1" }}>The customer complained about the sample:</span>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="customerComplaint"
                  value="Yes"
                  checked={form.customerComplaint === "Yes"}
                  onChange={(e) => handleCheckboxChange("customerComplaint", e.target.value)}
                />
                Yes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="customerComplaint"
                  value="No"
                  checked={form.customerComplaint === "No"}
                  onChange={(e) => handleCheckboxChange("customerComplaint", e.target.value)}
                />
                No
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#0f172a", borderRadius: "4px" }}>
            <span style={{ color: "#fff", flex: "1" }}>Is there any special assigned person or department to be responsible for mold control?</span>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="moldResponsible"
                  value="Yes"
                  checked={form.moldResponsible === "Yes"}
                  onChange={(e) => handleCheckboxChange("moldResponsible", e.target.value)}
                />
                Yes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="moldResponsible"
                  value="No"
                  checked={form.moldResponsible === "No"}
                  onChange={(e) => handleCheckboxChange("moldResponsible", e.target.value)}
                />
                No
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#0f172a", borderRadius: "4px" }}>
            <span style={{ color: "#fff", flex: "1" }}>Is there any record for mold incident?</span>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="moldIncident"
                  value="Yes"
                  checked={form.moldIncident === "Yes"}
                  onChange={(e) => handleCheckboxChange("moldIncident", e.target.value)}
                />
                Yes
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#fff" }}>
                <input
                  type="radio"
                  name="moldIncident"
                  value="No"
                  checked={form.moldIncident === "No"}
                  onChange={(e) => handleCheckboxChange("moldIncident", e.target.value)}
                />
                No
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Numbered Items 9-15 */}
      <div style={{ marginBottom: "25px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c" }}>
          <tbody>
            {[
              { num: 9, text: "Do all cartons put on plastic pallets with min. 10cm height away from the floor, and at least 1 Meters away from windows? Are the cartons covered with plastic sealing dust?" },
              { num: 10, text: "Is the warehouse ventilation system adequate and is there adequate air circulation?" },
              { num: 11, text: "Are the export cartons kept dry?" },
              { num: 12, text: "Are there any damaged or wet cartons used?" },
              { num: 13, text: "Inspector's opinion on the factory:" },
              { num: 14, text: "" },
              { num: 15, text: "Sample Collection Record:" }
            ].map((item) => (
              <tr key={item.num}>
                <td style={{ padding: "8px 12px", fontWeight: "bold", background: "#0f172a", border: "1px solid #3a4a5c", textAlign: "center", color: "#fff", width: "40px" }}>{item.num}</td>
                <td style={{ padding: "8px 12px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                  <div style={{ marginBottom: "8px", color: "#fff", fontSize: "13px" }}>{item.text}</div>
                  <div style={{ display: "flex", gap: "20px", marginBottom: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`item${item.num}`}
                        value="Yes"
                        checked={form[`item${item.num}`] === "Yes"}
                        onChange={(e) => handleCheckboxChange(`item${item.num}`, e.target.value)}
                      />
                      <span style={{ color: "#fff" }}>Yes</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`item${item.num}`}
                        value="No"
                        checked={form[`item${item.num}`] === "No"}
                        onChange={(e) => handleCheckboxChange(`item${item.num}`, e.target.value)}
                      />
                      <span style={{ color: "#fff" }}>No</span>
                    </label>
                  </div>
                  <textarea
                    value={form[`item${item.num}Text`] || ""}
                    onChange={(e) => handleChange({ target: { name: `item${item.num}Text`, value: e.target.value } })}
                    placeholder="Enter details..."
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#2a3a4c",
                      color: "#fff",
                      border: "1px solid #4a5a6c",
                      borderRadius: "4px",
                      fontSize: "13px",
                      minHeight: "50px",
                      boxSizing: "border-box"
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Photos */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>Photos:</label>
        <div style={{ padding: "20px", background: "#0f172a", border: "2px dashed #3a4a5c", borderRadius: "8px", textAlign: "center", cursor: "pointer" }}>
          <input type="file" multiple accept="image/*" style={{ display: "none" }} id="photoInput" />
          <label htmlFor="photoInput" style={{ cursor: "pointer", color: "#60a5fa" }}>
            Click here to upload photos
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}

