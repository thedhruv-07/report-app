import React, { useState } from "react";

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
    <div style={{ color: "#fff", fontSize: "14px" }}>
      <h2 style={{ marginBottom: "20px", color: "#fff", fontSize: "18px", fontWeight: "bold" }}>Step 7: C. ON-SITE TESTS</h2>

      {/* C. ON-SITE TESTS Section */}
      <h3 style={{ marginBottom: "0px", padding: "10px", background: "#0f172a", color: "#fff", fontWeight: "bold", fontSize: "14px" }}>C. ON-SITE TESTS</h3>

      <div style={{ marginBottom: "25px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", minWidth: "40px", width: "5%" }}>#</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "left", minWidth: "120px" }}>Description</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "left", minWidth: "200px" }}>Method</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", minWidth: "100px" }}>Sample Size</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "left", minWidth: "150px" }}>Result / Reading</th>
              <th style={{ padding: "8px", background: "#1a2332", border: "1px solid #3a4a5c", color: "#fff", textAlign: "center", minWidth: "50px" }}>Delete</th>
            </tr>
          </thead>
          <tbody>
            {testRows.map((row, idx) => {
              const num = idx + 1;
              return (
                <tr key={row.id}>
                  <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center", color: "#fff", fontWeight: "bold" }}>{num}</td>
                  <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", color: "#fff" }}>
                    <input type="text" name={`testDesc${row.id}`} value={form[`testDesc${row.id}`] || ""} onChange={handleChange} placeholder="Enter description" style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px" }} />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", color: "#fff" }}>
                    <textarea name={`testMethod${row.id}`} value={form[`testMethod${row.id}`] || ""} onChange={handleChange} placeholder="Enter method" style={{ width: "100%", minHeight: "60px", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", fontFamily: "inherit", fontSize: "11px" }} />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", color: "#fff" }}>
                    <input type="text" name={`testSample${row.id}`} value={form[`testSample${row.id}`] || ""} onChange={handleChange} placeholder="Sample size" style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px", textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b" }}>
                    <input type="text" name={`testResult${row.id}`} value={form[`testResult${row.id}`] || ""} onChange={handleChange} placeholder="Result" style={{ width: "100%", padding: "4px", background: "#2a3a4c", color: "#fff", border: "none", borderRadius: "2px" }} />
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "center" }}>
                    <button onClick={() => removeRow(row.id)} disabled={testRows.length === 1} style={{ padding: "4px 8px", background: testRows.length === 1 ? "#4a5a6c" : "#dc2626", color: "#fff", border: "none", borderRadius: "2px", cursor: testRows.length === 1 ? "not-allowed" : "pointer", fontSize: "11px" }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} style={{ padding: "8px 16px", background: "#2a5f3f", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginBottom: "20px" }}>+ Add Row</button>

      <div style={{ marginBottom: "25px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#fff" }}>Result:</label>
          <input type="text" name="onSiteTestResult" value={form.onSiteTestResult || ""} onChange={handleChange} placeholder="Enter result" style={{ width: "100%", padding: "8px", background: "#1e293b", color: "#fff", border: "1px solid #3a4a5c", borderRadius: "4px" }} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#fff" }}>Remark:</label>
          <textarea name="onSiteTestRemark" value={form.onSiteTestRemark || ""} onChange={handleChange} placeholder="Enter remark" style={{ width: "100%", minHeight: "80px", padding: "8px", background: "#1e293b", color: "#fff", border: "1px solid #3a4a5c", borderRadius: "4px", fontFamily: "inherit" }} />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
        <button onClick={onPrev} style={{ padding: "10px 20px", background: "#3a4a5c", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Previous</button>
        <button onClick={onNext} style={{ padding: "10px 20px", background: "#4ade80", color: "#000", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Next</button>
      </div>
    </div>
  );
};

export default OnSiteTests;
