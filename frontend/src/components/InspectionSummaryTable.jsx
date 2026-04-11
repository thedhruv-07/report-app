import { inputStyle, buttonStyle, colors, sectionHeaderStyle } from "../styles";

export default function InspectionSummaryTable({ form, handleChange, onPrev, onNext }) {
  const criteriaOptions = ["Passed", "Failed", "Pending", "N/A"];

  // Define light theme styles
  const tableStyle = { width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}` };
  const headerCellStyle = { padding: "12px", fontWeight: "bold", background: colors.headerBg, border: `1px solid ${colors.border}`, textAlign: "center", color: colors.text };
  const labelCellStyle = { padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text, lineHeight: "1.4" };
  const dataCellStyle = { padding: "8px", border: `1px solid ${colors.border}`, background: colors.surface, textAlign: "left" };
  const inputFieldStyle = { width: "100%", padding: "12px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px", fontSize: "16px", fontFamily: "inherit", boxSizing: "border-box", minHeight: "40px", transition: "all 0.3s ease" };


  return (
    <>
      <h3 style={{ ...sectionHeaderStyle, color: colors.text }}>II. INSPECTION SUMMARY</h3>

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
      <h4 style={{ marginTop: "20px", marginBottom: "15px", color: colors.text, fontWeight: "600", fontSize: "14px" }}>Workmanship Summary (based on the finished products)</h4>
      
      {/* Inspection Standard */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Inspection Standard:</div>
        <input 
          type="text" 
          name="inspectionStandard" 
          value={form.inspectionStandard || ""} 
          onChange={handleChange}
          style={{
            ...inputFieldStyle,
          }} 
          placeholder="Enter standard" 
        />
        <div style={{ padding: "10px", fontWeight: "bold", background: colors.headerBg, border: `1px solid ${colors.border}`, textAlign: "center", color: colors.text }}>Critical</div>
        <div style={{ padding: "10px", fontWeight: "bold", background: colors.headerBg, border: `1px solid ${colors.border}`, textAlign: "center", color: colors.text }}>Major</div>
        <div style={{ padding: "10px", fontWeight: "bold", background: colors.headerBg, border: `1px solid ${colors.border}`, textAlign: "center", color: colors.text }}>Minor</div>
      </div>

      {/* Sampling Plan with AQL */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Sampling Plan:</div>
        <input type="text" name="samplingPlan" value={form.samplingPlan || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Enter plan" />
        <input type="text" name="aqlCritical" value={form.aqlCritical || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="AQL" />
        <input type="text" name="aqlMajor" value={form.aqlMajor || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="AQL" />
        <input type="text" name="aqlMinor" value={form.aqlMinor || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="AQL" />
      </div>

      {/* Inspection Level with Accepted */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Inspection Level:</div>
        <input type="text" name="inspectionLevel" value={form.inspectionLevel || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Enter level" />
        <input type="text" name="acceptedCritical" value={form.acceptedCritical || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Accepted" />
        <input type="text" name="acceptedMajor" value={form.acceptedMajor || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Accepted" />
        <input type="text" name="acceptedMinor" value={form.acceptedMinor || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Accepted" />
      </div>

      {/* Order Quantity with Found */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr 100px 100px 100px", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Order Quantity:</div>
        <input type="text" name="orderQuantity" value={form.orderQuantity || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Enter qty" />
        <input type="text" name="foundCritical" value={form.foundCritical || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Found" />
        <input type="text" name="foundMajor" value={form.foundMajor || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Found" />
        <input type="text" name="foundMinor" value={form.foundMinor || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Found" />
      </div>

      {/* Available Quantity */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Available Quantity:</div>
        <input type="text" name="availableQuantity" value={form.availableQuantity || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Enter qty" />
      </div>

      {/* Sample Size */}
      <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "500", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Sample Size:</div>
        <input type="text" name="sampleSize" value={form.sampleSize || ""} onChange={handleChange} style={{...inputFieldStyle}} placeholder="Enter size" />
      </div>

      {/* Result Dropdown */}
      <div style={{ marginBottom: "20px", display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px", alignItems: "start" }}>
        <div style={{ padding: "10px", fontWeight: "bold", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, color: colors.text }}>Result:</div>
        <select name="overallResult" value={form.overallResult || ""} onChange={handleChange} style={{ ...inputFieldStyle, color: form.overallResult === "Failed" ? colors.danger : form.overallResult === "Passed" ? colors.success : colors.warning, fontWeight: "bold" }}>
          <option value="">Select Result</option>
          <option value="Passed">Passed</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Factory Comments */}
      <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", color: colors.text, fontSize: "14px" }}>Factory Comments & Signature</label>
      <textarea
        placeholder="Enter factory comments and signature"
        name="factoryComments"
        value={form.factoryComments || ""}
        onChange={handleChange}
        style={{ ...inputStyle, height: "100px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
      />

      {/* Inspector Signature */}
      <label style={{ fontWeight: "600", display: "block", marginBottom: "8px", marginTop: "20px", color: colors.text, fontSize: "14px" }}>Inspector Signature & Chop</label>
      <input 
        type="text" 
        name="inspectorSignature" 
        value={form.inspectorSignature || ""} 
        onChange={handleChange} 
        style={{ ...inputStyle, background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
        placeholder="Enter inspector name and signature details"
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          onClick={onPrev} 
          style={buttonStyle}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 16px rgba(59, 130, 246, 0.4)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)"; }}
        >
          Back
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
    </>
  );
}
