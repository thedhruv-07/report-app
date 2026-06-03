import React from 'react';
import { colors } from '../../../styles';

export default function FinalStep({ reportDownloaded, clearFormAfterDownload, submit, isGenerating, onSubmitForReview, generationError, onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", padding: "60px 0" }}>
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h3 style={{ fontSize: "28px", fontWeight: "900", color: colors.header, marginBottom: "15px" }}>Audit Completed</h3>
        <p style={{ color: colors.textMuted, fontSize: "16px", marginBottom: "40px", lineHeight: "1.6" }}>
          Your factory audit report has been successfully compiled. You can now download it in DOCX or PDF format.
        </p>

        {reportDownloaded && (
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
              onClick={clearFormAfterDownload}
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
            onClick={() => submit('docx')}
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
          <button
            onClick={() => submit('pdf')}
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
        </div>

        {generationError ? (
          <div style={{ marginTop: "20px", padding: "12px", border: `1px solid ${colors.danger}`, borderRadius: "8px", background: "rgba(239,68,68,0.06)", color: colors.text }}>
            <p style={{ margin: 0, fontWeight: 700, color: colors.danger }}>Report generation failed</p>
            <p style={{ marginTop: "6px", color: colors.textMuted, fontSize: "13px" }}>{generationError}</p>
            <div style={{ marginTop: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
              <button
                onClick={() => onRetry && onRetry('docx')}
                disabled={isGenerating}
                style={{ padding: "10px 18px", background: colors.primary, border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
              >
                Retry Download
              </button>
              <button
                onClick={() => window.open(window.location.origin, '_blank')}
                style={{ padding: "10px 18px", background: "transparent", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
              >
                Check Backend
              </button>
            </div>
          </div>
        ) : (
          <p style={{ marginTop: "30px", fontSize: "13px", color: colors.textMuted }}>
            Note: PDF generation may take a few seconds as it processes high-resolution images.
          </p>
        )}

        <div style={{ marginTop: "30px", paddingTop: "24px", borderTop: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "13px", color: colors.textMuted, marginBottom: "12px" }}>
            Ready to send for review? Notify the technical manager without downloading.
          </p>
          <button
            onClick={onSubmitForReview}
            disabled={isGenerating}
            style={{
              padding: "14px 28px", borderRadius: "12px", border: `2px solid ${colors.header}`,
              background: "transparent", color: colors.header, fontWeight: "700",
              cursor: isGenerating ? "not-allowed" : "pointer", fontSize: "15px",
              display: "inline-flex", alignItems: "center", gap: "8px",
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {isGenerating ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
