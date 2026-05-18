import React, { useState, useEffect } from "react";
import { colors, buttonStyle } from '../../../styles';

const FinalStep = ({ form, onPrev, onSubmit, onClearAfterDownload, hasDownloaded, isGenerating, onToggleLoader }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", padding: "60px 0" }}>
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h3 style={{ fontSize: "28px", fontWeight: "900", color: colors.header, marginBottom: "15px" }}>Inspection Completed</h3>
        <p style={{ color: colors.textMuted, fontSize: "16px", marginBottom: "40px", lineHeight: "1.6" }}>
          Your pre-shipment inspection report has been successfully compiled. You can now download it in DOCX or PDF format.
        </p>

        {hasDownloaded && (
          <div
            style={{
              marginBottom: "30px",
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
            <span style={{ color: colors.text, fontWeight: "600", fontSize: "14px" }}>
              Report downloaded successfully. Ready to start a new one?
            </span>
            <button
              type="button"
              onClick={onClearAfterDownload}
              style={{
                padding: "8px 16px",
                background: colors.danger,
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Clear Form
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onSubmit('docx')}
            disabled={isGenerating}
            style={{
              padding: "16px 32px", borderRadius: "12px", border: "none",
              background: colors.success, color: "#fff", fontWeight: "700",
              cursor: isGenerating ? "not-allowed" : "pointer", fontSize: "15px",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
              display: "flex", alignItems: "center", gap: "10px",
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {isGenerating ? "Generating..." : "Download DOCX"}
          </button>
          {isClient && form && (
            <button
              onClick={() => onSubmit('pdf')}
              disabled={isGenerating}
              style={{
                padding: "16px 32px", borderRadius: "12px", border: `2px solid ${colors.primary}`,
                background: "transparent", color: colors.primary, fontWeight: "700",
                cursor: isGenerating ? "not-allowed" : "pointer", fontSize: "15px",
                display: "flex", alignItems: "center", gap: "10px",
                transition: "transform 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {isGenerating ? "Preparing..." : "Download PDF"}
            </button>
          )}
        </div>

        <p style={{ marginTop: "30px", fontSize: "13px", color: colors.textMuted }}>
          Note: PDF generation may take a few seconds as it processes high-resolution images.
        </p>

        <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: `1px solid ${colors.border}`, width: "100%", display: "flex", justifyContent: "flex-start" }}>
          <button 
            onClick={onPrev} 
            style={{ 
              padding: "12px 24px", borderRadius: "10px", border: `1px solid ${colors.border}`, 
              background: "#fff", color: colors.text, fontWeight: "600", 
              cursor: "pointer", transition: "all 0.2s"
            }}
          >
            ← Previous Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalStep;
