import { inputStyle, buttonStyle } from "../styles";

export default function ConclusionStep({ form, handleChange, onPrev, onNext }) {
  return (
    <>
      <h3 style={{ marginBottom: "20px" }}>IV. CONCLUSION</h3>

      {/* Conclusion Selection */}
      <div style={{ marginBottom: "25px", padding: "20px", background: "#0f172a", border: "2px solid #3a4a5c", borderRadius: "8px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "bold", color: "#fff" }}>Conclusion:</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", background: "#1e293b", borderRadius: "4px" }}>
            <input
              type="radio"
              name="conclusionStatus"
              value="PASSED"
              checked={form.conclusionStatus === "PASSED"}
              onChange={handleChange}
            />
            <span style={{ color: "#10b981", fontWeight: "bold" }}>PASSED - Conform to Client's Requirement</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", background: "#1e293b", borderRadius: "4px" }}>
            <input
              type="radio"
              name="conclusionStatus"
              value="PENDING"
              checked={form.conclusionStatus === "PENDING"}
              onChange={handleChange}
            />
            <span style={{ color: "#fbbf24", fontWeight: "bold" }}>PENDING - Subject to Client's Evaluation</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", background: "#1e293b", borderRadius: "4px" }}>
            <input
              type="radio"
              name="conclusionStatus"
              value="FAILED"
              checked={form.conclusionStatus === "FAILED"}
              onChange={handleChange}
            />
            <span style={{ color: "#ef4444", fontWeight: "bold" }}>FAILED - Does Not Conform to Client's Requirement</span>
          </label>
        </div>
      </div>

      {/* Approval Section */}
      <div style={{ marginBottom: "25px", padding: "20px", background: "#0f172a", border: "2px solid #3a4a5c", borderRadius: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "15px", color: "#fff" }}>Approved by:</label>
            <div style={{ minHeight: "80px", border: "1px dashed #4a5a6c", borderRadius: "4px", marginBottom: "10px" }}></div>
            <input
              type="text"
              name="approvedBy"
              value={form.approvedBy || ""}
              onChange={handleChange}
              placeholder="e.g., Amvt, Manager of Report Reviewing"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Inspector & Report Reviewer */}
      <div style={{ marginBottom: "25px", padding: "20px", background: "#0f172a", border: "2px solid #3a4a5c", borderRadius: "8px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "bold", color: "#fff" }}>Inspector & Report Reviewer:</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: "#fff" }}>Inspector:</label>
            <div style={{ minHeight: "60px", border: "1px solid #4a5a6c", borderRadius: "4px", marginBottom: "10px" }}></div>
            <input
              type="text"
              name="inspector"
              value={form.inspector || ""}
              onChange={handleChange}
              placeholder="Inspector name/signature"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px", color: "#fff" }}>Report Reviewer:</label>
            <div style={{ minHeight: "60px", border: "1px solid #4a5a6c", borderRadius: "4px", marginBottom: "10px" }}></div>
            <input
              type="text"
              name="reportReviewer"
              value={form.reportReviewer || ""}
              onChange={handleChange}
              placeholder="Reviewer name/signature"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: "25px", padding: "15px", background: "#0f172a", borderRadius: "8px", fontSize: "12px", color: "#8a9aaa", lineHeight: "1.6" }}>
        <h5 style={{ marginBottom: "10px", color: "#fff" }}>Note:</h5>
        <p>
          1. This report reflects our findings at the time and the place of inspection based on random samples selected. 2. This inspection was 
          agreed upon based on the time, the date of samples given by client, and our responsibility is limited to the exercise of reasonable due diligence 
          concerning the source of the report. 3. The inspection and results reflect observations of the item selected and not an analysis of production. 
          4. This report does not evidence shipment. 5. Our services are subject to the General Conditions of Absolute Veritas, which is shown in our website and can be sent to you upon written request. 6. This 
          report result only relate to the samples as (randomly picked) by our inspector. 7. This report is complete and its content may not be reproduced.
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={onPrev} style={buttonStyle}>Back</button>
        <button onClick={onNext} style={buttonStyle}>Next</button>
      </div>
    </>
  );
}
