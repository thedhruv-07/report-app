import React from 'react';
import SchemaSection from '../../shared/components/SchemaSection';
import { colors } from '../../../styles';

export default function GeneralInfo({ form, handleChange, handleGeneralPhotoUpload, clearGeneralPhoto, isPhotoProcessing, formatFileSize, isMobile }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", gap: "30px", flexDirection: isMobile ? "column" : "row" }}>
      <div style={{ flex: 1 }}>
        <SchemaSection title="I. GENERAL INFORMATION" fields={schema.generalInfo} formData={form} onChange={handleChange} ai={false} />
      </div>
      <div style={{ width: isMobile ? "100%" : "280px", flexShrink: 0 }}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: colors.text }}>General Photo:</label>
          <input type="file" accept="image/*" onChange={handleGeneralPhotoUpload} disabled={isPhotoProcessing}
            style={{ width: "100%", padding: "10px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", boxSizing: "border-box" }} />
        </div>
        {form.generalPhoto ? (
          <div>
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `2px solid ${colors.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <img src={form.generalPhoto} alt="General photo" style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} />
              {isPhotoProcessing && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: colors.primary }}>Processing...</div>}
            </div>
            {form.generalPhotoMeta && (
              <div style={{ marginTop: "10px", padding: "10px", background: colors.surfaceAlt, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: "11px", color: colors.text, fontWeight: "600", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.generalPhotoMeta.fileName}</div>
                <div style={{ fontSize: "10px", color: colors.success, fontWeight: "500" }}>
                  {formatFileSize(form.generalPhotoMeta.compressedSize)}
                  {form.generalPhotoMeta.originalSize > form.generalPhotoMeta.compressedSize && <span style={{ marginLeft: "4px", opacity: 0.8 }}>(saved {formatFileSize(form.generalPhotoMeta.originalSize - form.generalPhotoMeta.compressedSize)})</span>}
                </div>
              </div>
            )}
            <button type="button" onClick={clearGeneralPhoto} style={{ marginTop: "10px", width: "100%", border: "none", borderRadius: "8px", background: "#fee2e2", color: "#ef4444", fontSize: "12px", padding: "10px", cursor: "pointer", fontWeight: "600" }}>Remove Photo</button>
          </div>
        ) : (
          <div style={{ width: "100%", height: "220px", border: `2px dashed ${colors.border}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: colors.textMuted, background: colors.surfaceAlt, gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>📷</span>
            <span style={{ fontSize: "12px", fontWeight: "500" }}>No photo uploaded</span>
          </div>
        )}
      </div>
    </div>
  );
}
