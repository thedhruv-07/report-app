import { useState, useEffect } from "react";
import { inputStyle, buttonStyle } from "../styles";

export default function InspectionSummaryTable({ form, handleChange, onPrev, onNext }) {
  const criteriaOptions = ["Passed", "Failed", "Pending", "N/A"];

  // Debug logging
  console.log("InspectionSummaryTable rendered");
  console.log("form prop:", form);
  console.log("handleChange prop:", typeof handleChange);

  // Define inline styles to avoid undefined references
  const tableStyle = { width: "100%", borderCollapse: "collapse", border: "1px solid #3a4a5c" };
  const headerCellStyle = { padding: "10px", fontWeight: "bold", background: "#1a2332", border: "1px solid #3a4a5c", textAlign: "center", color: "#fff" };
  const labelCellStyle = { padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff", lHeight: "1.4" };
  const dataCellStyle = { padding: "8px", border: "1px solid #3a4a5c", background: "#1e293b", textAlign: "left" };
  const inputFieldStyle = { width: "100%", padding: "12px", background: "#2a3a4c", color: "#fff", border: "1px solid #4a5a6c", borderRadius: "4px", fontSize: "16px", fontFamily: "inherit", boxSizing: "border-box", minHeight: "40px", minWidth: "100%", pointerEvents: "auto", zIndex: 10, position: "relative" };

  // Add CSS for placeholder styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input::placeholder {
        color: #8a9aaa;
        opacity: 1;
        font-size: 16px;
      }
      textarea::placeholder {
        color: #8a9aaa;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <h3>II. INSPECTION SUMMARY</h3>

      {/* Inspection Criteria Table */}
      <div style={{ marginBottom: "20px", overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Criteria</th>
              <th style={headerCellStyle}>Passed</th>
              <th style={headerCellStyle}>Failed</th>
              <th style={headerCellStyle}>Pending</th>
              <th style={headerCellStyle}>N/A</th>
            </tr>
          </thead>
          <tbody>
            {[
              { key: "quantity", label: "A. Quantity" },
              { key: "workmanship", label: "B. Workmanship" },
              { key: "onSiteTests", label: "C. On-Site Tests" },
              { key: "dimensions", label: "D. Dimensions" },
              { key: "packing", label: "E. Packing" },
              { key: "markingLabeling", label: "F. Marking & Labeling" },
              { key: "clientSpecial", label: "G. Client Special Requirement" },
            ].map((row) => (
              <tr key={row.key}>
                <td style={labelCellStyle}>{row.label}</td>
                {criteriaOptions.map((option) => (
                  <td key={option} style={dataCellStyle}>
                    <input
                      type="radio"
                      name={row.key}
                      value={option}
                      checked={form[row.key] === option}
                      onChange={handleChange}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workmanship Summary */}
      <h4 style={{ marginTop: "20px", marginBottom: "15px" }}>Workmanship Summary (based on the finished products)</h4>
      
      {/* Inspection Standard */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Inspection Standard:</div>
        <input 
          type="text" 
          name="inspectionStandard" 
          value={form.inspectionStandard || ""} 
          onChange={(e) => {
            console.log("Inspection Standard changed:", e.target.value);
            handleChange(e);
          }}
          onMouseDown={(e) => console.log("Mouse down on Inspection Standard")}
          onClick={(e) => console.log("Clicked on Inspection Standard")}
          style={{
            ...inputFieldStyle,
            pointerEvents: "auto",
            cursor: "text"
          }} 
          placeholder="Enter standard" 
        />
        <div style={{ padding: "10px", fontWeight: "bold", background: "#1a2332", border: "1px solid #3a4a5c", textAlign: "center", color: "#fff" }}>Critical</div>
        <div style={{ padding: "10px", fontWeight: "bold", background: "#1a2332", border: "1px solid #3a4a5c", textAlign: "center", color: "#fff" }}>Major</div>
        <div style={{ padding: "10px", fontWeight: "bold", background: "#1a2332", border: "1px solid #3a4a5c", textAlign: "center", color: "#fff" }}>Minor</div>
      </div>

      {/* Sampling Plan with AQL */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Sampling Plan:</div>
        <input type="text" name="samplingPlan" value={form.samplingPlan || ""} onChange={(e) => { console.log("Sampling Plan:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Enter plan" />
        <input type="text" name="aqlCritical" value={form.aqlCritical || ""} onChange={(e) => { console.log("AQL Critical:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="AQL" />
        <input type="text" name="aqlMajor" value={form.aqlMajor || ""} onChange={(e) => { console.log("AQL Major:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="AQL" />
        <input type="text" name="aqlMinor" value={form.aqlMinor || ""} onChange={(e) => { console.log("AQL Minor:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="AQL" />
      </div>

      {/* Inspection Level with Accepted */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Inspection Level:</div>
        <input type="text" name="inspectionLevel" value={form.inspectionLevel || ""} onChange={(e) => { console.log("Inspection Level:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Enter level" />
        <input type="text" name="acceptedCritical" value={form.acceptedCritical || ""} onChange={(e) => { console.log("Accepted Critical:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Accepted" />
        <input type="text" name="acceptedMajor" value={form.acceptedMajor || ""} onChange={(e) => { console.log("Accepted Major:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Accepted" />
        <input type="text" name="acceptedMinor" value={form.acceptedMinor || ""} onChange={(e) => { console.log("Accepted Minor:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Accepted" />
      </div>

      {/* Order Quantity with Found */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Order Quantity:</div>
        <input type="text" name="orderQuantity" value={form.orderQuantity || ""} onChange={(e) => { console.log("Order Quantity:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Enter qty" />
        <input type="text" name="foundCritical" value={form.foundCritical || ""} onChange={(e) => { console.log("Found Critical:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Found" />
        <input type="text" name="foundMajor" value={form.foundMajor || ""} onChange={(e) => { console.log("Found Major:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Found" />
        <input type="text" name="foundMinor" value={form.foundMinor || ""} onChange={(e) => { console.log("Found Minor:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Found" />
      </div>

      {/* Available Quantity */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Available Quantity:</div>
        <input type="text" name="availableQuantity" value={form.availableQuantity || ""} onChange={(e) => { console.log("Available Quantity:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Enter qty" />
      </div>

      {/* Sample Size */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Sample Size:</div>
        <input type="text" name="sampleSize" value={form.sampleSize || ""} onChange={(e) => { console.log("Sample Size:", e.target.value); handleChange(e); }} style={{...inputFieldStyle, pointerEvents: "auto", cursor: "text"}} placeholder="Enter size" />
      </div>

      {/* Result Dropdown */}
      <div style={{ marginBottom: "20px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", alignItems: "start", pointerEvents: "auto" }}>
        <div style={{ padding: "10px", fontWeight: "bold", background: "#0f172a", border: "1px solid #3a4a5c", color: "#fff" }}>Result:</div>
        <select name="overallResult" value={form.overallResult || ""} onChange={(e) => { console.log("Overall Result:", e.target.value); handleChange(e); }} style={{ ...inputFieldStyle, color: form.overallResult === "Failed" ? "#ef4444" : form.overallResult === "Passed" ? "#10b981" : "#fbbf24", fontWeight: "bold", pointerEvents: "auto", cursor: "pointer" }}>
          <option value="">Select Result</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Factory Comments */}
      <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>Factory Comments & Signature</label>
      <textarea
        placeholder="Enter factory comments and signature"
        name="factoryComments"
        value={form.factoryComments || ""}
        onChange={handleChange}
        style={{ ...inputStyle, height: "100px" }}
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
