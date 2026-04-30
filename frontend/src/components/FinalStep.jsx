import React, { useState, useEffect } from "react";
import { colors, buttonStyle } from "../styles";

const FinalStep = ({ form, onPrev, onSubmit, onClearAfterDownload, hasDownloaded, isGenerating, onToggleLoader }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 13: SUBMIT REPORT
      </h2>

      {/* Important Note Section */}
      <div style={{ marginBottom: "30px", padding: "20px", background: colors.surface, border: `2px solid ${colors.danger}`, borderRadius: "4px" }}>
        <h3 style={{ color: colors.danger, marginBottom: "15px", fontSize: "16px", fontWeight: "bold" }}>
          Important Note:
        </h3>
        <ol style={{ color: colors.textMuted, lineHeight: "1.8", marginLeft: "20px", paddingLeft: "0" }}>
          <li style={{ marginBottom: "10px" }}>
            THIS REPORT REFLECTS ABSOLUTE VERITAS FINDINGS AT THE TIME AND PLACE OF INSPECTION.
          </li>
          <li style={{ marginBottom: "10px" }}>
            THIS REPORT DOES NOT RELEASE THE BUYER OR SELLER FROM CONTRACTUAL RESPONSIBILITIES. NOR DOES IT PREJUDICE THE BUYER'S RIGHT OF CLAIM TOWARD THE SELLER/SUPPLIER FOR COMPENSATION FOR ANY APPARENT AND/OR HIDDEN DEFECTS NOT DETECTED DURING INSPECTION OR OCCURRING ANYTIME THEREAFTER.
          </li>
          <li style={{ marginBottom: "10px" }}>
            THIS REPORT DOES NOT PROVE SHIPMENT.
          </li>
          <li style={{ marginBottom: "10px" }}>
            RESULTS ARE RELATED TO ONLY THE SAMPLE TESTED.
          </li>
          <li>
            THE INSPECTION SCOPE IS BASED ON AGREEMENT BETWEEN ABSOLUTE VERITAS AND BUYER. ABSOLUTE VERITAS RESPONSIBILITY IS ONLY LIMITED TO REQUESTED CHECKING POINT
          </li>
        </ol>
      </div>

      {/* Steps Summary */}
      <div style={{ marginBottom: "30px", padding: "20px", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: "4px" }}>
        <h3 style={{ color: colors.success, marginBottom: "15px", fontSize: "16px", fontWeight: "bold" }}>
          ✓ All Information Collected
        </h3>
        <p style={{ color: colors.textMuted, lineHeight: "1.6", marginBottom: "15px" }}>
          You have completed all 12 steps of the pre-shipment inspection report form. Click the <strong style={{ color: colors.success }}>SUBMIT</strong> button below to generate and download your comprehensive inspection report.
        </p>
        <h4 style={{ color: colors.text, marginBottom: "10px", fontSize: "14px", fontWeight: "bold" }}>
          Form Steps Completed:
        </h4>
        <ul style={{ color: colors.textMuted, lineHeight: "1.8", marginLeft: "20px" }}>
          <li>✓ Step 1: General Information</li>
          <li>✓ Step 2: Inspection Summary</li>
          <li>✓ Step 3: Remarks</li>
          <li>✓ Step 4: Conclusion</li>
          <li>✓ Step 5: Quantity Details</li>
          <li>✓ Step 6: Workmanship & Defects</li>
          <li>✓ Step 7: On-Site Tests</li>
          <li>✓ Step 8: Product Specification</li>
          <li>✓ Step 9: Packing</li>
          <li>✓ Step 10: Marking & Labeling</li>
          <li>✓ Step 11: Client Special Requirement</li>
          <li>✓ Step 12: Photos</li>
        </ul>
      </div>

      {hasDownloaded && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            border: `1px solid ${colors.success}`,
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: colors.text, fontWeight: "600" }}>
            Report downloaded successfully. Ready to start a new one?
          </span>
          <button
            type="button"
            onClick={onClearAfterDownload}
            style={{
              ...buttonStyle,
              background: colors.danger,
              border: "none",
              color: "#fff",
            }}
          >
            Clear All Sections For New Report
          </button>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "10px", marginTop: "30px", flexWrap: "wrap" }}>
        <button
          onClick={onPrev}
          style={{ ...buttonStyle, flex: "0 0 auto", minWidth: "120px" }}
        >
          Previous
        </button>
        <button
          onClick={onSubmit}
          disabled={isGenerating}
          style={{ ...buttonStyle, flex: 1, minWidth: "200px", background: colors.success, opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
        >
          {isGenerating ? "⏳ GENERATING DOCX..." : "DOWNLOAD DOCX"}
        </button>

        {isClient && form && (
          <button
            onClick={() => onSubmit('pdf')}
            disabled={isGenerating}
            style={{ ...buttonStyle, flex: 1, minWidth: "200px", background: colors.primary, opacity: isGenerating ? 0.7 : 1, cursor: isGenerating ? 'not-allowed' : 'pointer' }}
          >
            {isGenerating ? "⏳ PREPARING PDF..." : "DOWNLOAD PDF"}
          </button>
        )}
      </div>
    </div>
  );
};

export default FinalStep;
