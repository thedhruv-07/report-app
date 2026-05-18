import React from 'react';
import { UploadCloud, X } from "lucide-react";
import SchemaSection from '../../shared/components/SchemaSection';
import { colors } from '../../../styles';

export default function GeneralInfo({ form, handleChange, handleGeneralPhotoUpload, setForm, isPhotoProcessing, isMobile }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: "30px" }}>
        <div>
          <SchemaSection title="1. General Information" fields={schema.generalInfo} formData={form} onChange={handleChange} />
        </div>
        <div style={{ padding: "20px", border: `1px solid ${colors.border}`, borderRadius: "16px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <h4 style={{ margin: "0 0 15px 0", color: colors.header, fontSize: "14px", fontWeight: "700", borderBottom: `2px solid ${colors.surfaceAlt}`, paddingBottom: "8px" }}>General Photo</h4>
          <div style={{ position: "relative", width: "100%", height: "220px", border: `2px dashed ${form.generalPhoto ? colors.success : colors.border}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.surfaceAlt, transition: "all 0.3s ease" }}>
            {form.generalPhoto ? (
              <>
                <img src={form.generalPhoto} alt="General" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, generalPhoto: "" }))}
                  style={{ position: "absolute", top: "10px", right: "10px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <UploadCloud size={40} color={colors.textMuted} style={{ marginBottom: "10px", opacity: 0.5 }} />
                <span style={{ color: colors.textMuted, fontSize: "12px", display: "block" }}>No photo uploaded</span>
              </div>
            )}
            {isPhotoProcessing && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: colors.primary }}>Processing...</div>}
          </div>
          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            marginTop: "15px", padding: "10px", borderRadius: "8px",
            background: isPhotoProcessing ? colors.surfaceAlt : colors.primaryLight,
            color: isPhotoProcessing ? colors.textMuted : colors.primary,
            cursor: isPhotoProcessing ? "not-allowed" : "pointer",
            fontSize: "13px", fontWeight: "600", border: `1px solid ${colors.primary}40`
          }}>
            <UploadCloud size={16} />
            {form.generalPhoto ? "Change Photo" : "Upload Photo"}
            <input type="file" accept="image/*" onChange={handleGeneralPhotoUpload} disabled={isPhotoProcessing} style={{ display: "none" }} />
          </label>
        </div>
      </div>
    </div>
  );
}
