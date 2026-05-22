import React, { useState } from "react";
import { colors, buttonStyle } from '../../../styles';
import SmartTextarea from '../../../components/shared/SmartTextarea';

const OnSiteTests = ({ form, handleChange, onPrev, onNext }) => {
  const setField = (name, value) => handleChange({ target: { name, value } });
  const [testRows, setTestRows] = useState([{ id: 1 }]);
  const [nextId, setNextId] = useState(2);

  const addRow = () => {
    setTestRows([...testRows, { id: nextId }]);
    setNextId(nextId + 1);
  };

  const removeRow = (id) => {
    if (testRows.length > 1) {
      setTestRows(testRows.filter(row => row.id !== id));
    }
  };

  // Color logic for result values
  const getResultColor = (value) => {
    const v = String(value || "").trim().toLowerCase();
    if (v.includes("fail")) return "#CC0000";
    if (v.includes("pass")) return "#228B22";
    return "#E36C09"; // orange for Pending / default
  };

  const resultColor = getResultColor(form.onSiteTestResult);

  // Shared styles
  const borderColor = "#1F1F1F";
  const cellBorder = `1px solid ${borderColor}`;
  const subHeaderBg = "#E9ECEF";

  return (
    <div style={{ color: colors.text, fontSize: "14px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>Step 7: C. ON-SITE TESTS</h2>

      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: cellBorder, fontSize: "12px" }}>
          {/* Section Header Row — dark navy background, white text */}
          <thead>
            <tr>
              <th
                colSpan={6}
                style={{
                  padding: "10px 12px",
                  background: "#E8E8E8",
                  border: cellBorder,
                  color: "#1F4E79",
                  textAlign: "left",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                C.&nbsp;&nbsp;ON-SITE TESTS
              </th>
            </tr>
            {/* Column Headers */}
            <tr>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", minWidth: "40px", width: "5%" }}></th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "left", minWidth: "120px" }}>Description</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "left", minWidth: "200px" }}>Method</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", minWidth: "100px" }}>Sample Size</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", minWidth: "120px" }}>Result / Reading</th>
              <th style={{ padding: "8px", background: subHeaderBg, border: cellBorder, color: colors.text, textAlign: "center", minWidth: "50px" }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {/* Data Rows */}
            {testRows.map((row, idx) => {
              const num = idx + 1;
              return (
                <tr key={row.id}>
                  <td style={{ padding: "8px", border: cellBorder, background: colors.surface, textAlign: "center", color: colors.text, fontWeight: "bold" }}>{num}</td>
                  <td style={{ padding: "8px", border: cellBorder, background: colors.surface, color: colors.text }}>
                    <input type="text" name={`testDesc${row.id}`} value={form[`testDesc${row.id}`] || ""} onChange={handleChange} placeholder="Enter description" style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontSize: "12px" }} />
                  </td>
                  <td style={{ padding: "8px", border: cellBorder, background: colors.surface, color: colors.text }}>
                    <SmartTextarea 
                      name={`testMethod${row.id}`} 
                      value={form[`testMethod${row.id}`] || ""} 
                      onChange={(e) => setField(`testMethod${row.id}`, e.target.value)} 
                      placeholder="Enter method" 
                      context="quality control test method and procedure"
                      style={{ width: "100%", minHeight: "60px", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "11px", boxSizing: "border-box" }} 
                    />
                  </td>
                  <td style={{ padding: "8px", border: cellBorder, background: colors.surface, color: colors.text }}>
                    <input type="text" name={`testSample${row.id}`} value={form[`testSample${row.id}`] || ""} onChange={handleChange} placeholder="Sample size" style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }} />
                  </td>
                  <td style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                    <input type="text" name={`testResult${row.id}`} value={form[`testResult${row.id}`] || ""} onChange={handleChange} placeholder="Result" style={{ width: "100%", padding: "4px", background: colors.surface, color: getResultColor(form[`testResult${row.id}`]), border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold" }} />
                  </td>
                  <td style={{ padding: "8px", border: cellBorder, background: colors.surface, textAlign: "center" }}>
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={testRows.length === 1}
                      style={{ padding: "4px 8px", background: testRows.length === 1 ? colors.border : colors.danger, color: "#fff", border: "none", borderRadius: "2px", cursor: testRows.length === 1 ? "not-allowed" : "pointer", fontSize: "11px", transition: "all 0.3s ease" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Result Row */}
            <tr>
              <td style={{ padding: "8px", border: cellBorder, background: subHeaderBg, fontWeight: "bold", textAlign: "left", color: colors.text }}>Result:</td>
              <td colSpan={5} style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <input
                  type="text"
                  name="onSiteTestResult"
                  value={form.onSiteTestResult || ""}
                  onChange={handleChange}
                  placeholder="Pending"
                  style={{ width: "100%", padding: "4px", background: colors.surface, color: resultColor, border: "none", borderRadius: "2px", fontSize: "12px", fontWeight: "bold" }}
                />
              </td>
            </tr>

            {/* Remark Row */}
            <tr>
              <td style={{ padding: "8px", border: cellBorder, background: colors.surface, fontWeight: "bold", textAlign: "left", color: colors.text }}>Remark:</td>
              <td colSpan={5} style={{ padding: "8px", border: cellBorder, background: colors.surface }}>
                <SmartTextarea
                  name="onSiteTestRemark"
                  value={form.onSiteTestRemark || ""}
                  onChange={(e) => setField("onSiteTestRemark", e.target.value)}
                  placeholder="Enter remark"
                  context="on-site testing results and observations remark"
                  style={{ width: "100%", minHeight: "40px", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "12px", boxSizing: "border-box" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        style={{ padding: "8px 16px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", marginBottom: "20px", fontWeight: "600", transition: "all 0.3s ease" }}
        onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)"; }}
        onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
      >
        + Add Row
      </button>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
        <button
          onClick={onPrev}
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.4)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)"; }}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.4)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)"; }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OnSiteTests;
