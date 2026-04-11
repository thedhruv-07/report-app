import React, { useState } from "react";
import { colors, buttonStyle, sectionHeaderStyle } from "../styles";

const OnSiteTests = ({ form, handleChange, onPrev, onNext }) => {
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
  return (
    <div style={{ color: colors.text, fontSize: "14px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>Step 7: C. ON-SITE TESTS</h2>

      {/* C. ON-SITE TESTS Section */}
      <h3 style={{ ...sectionHeaderStyle, marginBottom: "0px", padding: "10px", background: colors.headerBg, color: colors.text, fontWeight: "bold", fontSize: "14px" }}>C. ON-SITE TESTS</h3>

      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", minWidth: "40px", width: "5%" }}>#</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left", minWidth: "120px" }}>Description</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left", minWidth: "200px" }}>Method</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", minWidth: "100px" }}>Sample Size</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "left", minWidth: "150px" }}>Result / Reading</th>
              <th style={{ padding: "8px", background: colors.headerBg, border: `1px solid ${colors.border}`, color: colors.text, textAlign: "center", minWidth: "50px" }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {testRows.map((row, idx) => {
              const num = idx + 1;
              return (
                <tr key={row.id}>
                  <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center", color: colors.text, fontWeight: "bold" }}>{num}</td>
                  <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}>
                    <input type="text" name={`testDesc${row.id}`} value={form[`testDesc${row.id}`] || ""} onChange={handleChange} placeholder="Enter description" style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontSize: "12px" }} />
                  </td>
                  <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}>
                    <textarea name={`testMethod${row.id}`} value={form[`testMethod${row.id}`] || ""} onChange={handleChange} placeholder="Enter method" style={{ width: "100%", minHeight: "60px", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "11px", boxSizing: "border-box" }} />
                  </td>
                  <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text }}>
                    <input type="text" name={`testSample${row.id}`} value={form[`testSample${row.id}`] || ""} onChange={handleChange} placeholder="Sample size" style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", textAlign: "center", fontSize: "12px" }} />
                  </td>
                  <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                    <input type="text" name={`testResult${row.id}`} value={form[`testResult${row.id}`] || ""} onChange={handleChange} placeholder="Result" style={{ width: "100%", padding: "4px", background: colors.surface, color: colors.text, border: "none", borderRadius: "2px", fontSize: "12px" }} />
                  </td>
                  <td style={{ padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "center" }}>
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

      <div style={{ marginBottom: "25px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: colors.text, fontSize: "14px" }}>Result:</label>
          <input type="text" name="onSiteTestResult" value={form.onSiteTestResult || ""} onChange={handleChange} placeholder="Enter result" style={{ width: "100%", padding: "10px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px", fontSize: "14px", transition: "all 0.3s ease" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: colors.text, fontSize: "14px" }}>Remark:</label>
          <textarea name="onSiteTestRemark" value={form.onSiteTestRemark || ""} onChange={handleChange} placeholder="Enter remark" style={{ width: "100%", minHeight: "80px", padding: "10px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px", fontFamily: "inherit", fontSize: "14px", boxSizing: "border-box", transition: "all 0.3s ease" }} />
        </div>
      </div>

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
