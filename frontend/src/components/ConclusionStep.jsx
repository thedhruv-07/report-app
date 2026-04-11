import { inputStyle, buttonStyle, colors, sectionHeaderStyle } from "../styles";

export default function ConclusionStep({ form, handleChange, onPrev, onNext }) {
  return (
    <>
      <h3 style={{ ...sectionHeaderStyle, color: colors.text, marginBottom: "20px" }}>IV. CONCLUSION</h3>

      {/* Conclusion Selection */}
      <div style={{ marginBottom: "25px", padding: "20px", background: colors.surfaceAlt, border: `2px solid ${colors.border}`, borderRadius: "8px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "600", color: colors.text }}>Conclusion:</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", background: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}`, transition: "all 0.3s ease" }}>
            <input
              type="radio"
              name="conclusionStatus"
              value="PASSED"
              checked={form.conclusionStatus === "PASSED"}
              onChange={handleChange}
            />
            <span style={{ color: colors.success, fontWeight: "600" }}>✓ PASSED - Conform to Client's Requirement</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", background: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}`, transition: "all 0.3s ease" }}>
            <input
              type="radio"
              name="conclusionStatus"
              value="PENDING"
              checked={form.conclusionStatus === "PENDING"}
              onChange={handleChange}
            />
            <span style={{ color: colors.warning, fontWeight: "600" }}>⏳ PENDING - Subject to Client's Evaluation</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "10px", background: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}`, transition: "all 0.3s ease" }}>
            <input
              type="radio"
              name="conclusionStatus"
              value="FAILED"
              checked={form.conclusionStatus === "FAILED"}
              onChange={handleChange}
            />
            <span style={{ color: colors.danger, fontWeight: "600" }}>✗ FAILED - Does Not Conform to Client's Requirement</span>
          </label>
        </div>
      </div>

      {/* Approval Section */}
      <div style={{ marginBottom: "25px", padding: "20px", background: colors.surfaceAlt, border: `2px solid ${colors.border}`, borderRadius: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "15px", color: colors.text, fontSize: "14px" }}>Approved by:</label>
            <div style={{ minHeight: "80px", border: `2px dashed ${colors.border}`, borderRadius: "8px", marginBottom: "10px", background: colors.surface }}></div>
            <input
              type="text"
              name="approvedBy"
              value={form.approvedBy || ""}
              onChange={handleChange}
              placeholder="e.g., Amvt, Manager of Report Reviewing"
              style={{ ...inputStyle, background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
            />
          </div>
        </div>
      </div>

      {/* Inspector & Report Reviewer */}
      <div style={{ marginBottom: "25px", padding: "20px", background: colors.surfaceAlt, border: `2px solid ${colors.border}`, borderRadius: "8px" }}>
        <h4 style={{ marginBottom: "15px", fontWeight: "600", color: colors.text }}>Inspector & Report Reviewer:</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "10px", color: colors.text, fontSize: "14px" }}>Inspector:</label>
            <div style={{ minHeight: "60px", border: `2px solid ${colors.border}`, borderRadius: "8px", marginBottom: "10px", background: colors.surface }}></div>
            <input
              type="text"
              name="inspector"
              value={form.inspector || ""}
              onChange={handleChange}
              placeholder="Inspector name/signature"
              style={{ ...inputStyle, background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
            />
          </div>

          <div>
            <label style={{ fontWeight: "600", display: "block", marginBottom: "10px", color: colors.text, fontSize: "14px" }}>Report Reviewer:</label>
            <div style={{ minHeight: "60px", border: `2px solid ${colors.border}`, borderRadius: "8px", marginBottom: "10px", background: colors.surface }}></div>
            <input
              type="text"
              name="reportReviewer"
              value={form.reportReviewer || ""}
              onChange={handleChange}
              placeholder="Reviewer name/signature"
              style={{ ...inputStyle, background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px" }}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: "25px", padding: "15px", background: colors.surfaceAlt, borderRadius: "8px", fontSize: "12px", color: colors.textMuted, lineHeight: "1.6", border: `1px solid ${colors.border}` }}>
        <h5 style={{ marginBottom: "10px", color: colors.text, fontWeight: "600" }}>Note:</h5>
        <p>
          1. This report reflects our findings at the time and the place of inspection based on random samples selected. 2. This inspection was 
          agreed upon based on the time, the date of samples given by client, and our responsibility is limited to the exercise of reasonable due diligence 
          concerning the source of the report. 3. The inspection and results reflect observations of the item selected and not an analysis of production. 
          4. This report does not evidence shipment. 5. Our services are subject to the General Conditions of Absolute Veritas, which is shown in our website and can be sent to you upon written request. 6. This 
          report result only relate to the samples as (randomly picked) by our inspector. 7. This report is complete and its content may not be reproduced.
        </p>
      </div>

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
