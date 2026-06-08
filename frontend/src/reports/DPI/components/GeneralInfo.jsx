import React from 'react';
import { UploadCloud } from 'lucide-react';
import SchemaSection from '../../shared/components/SchemaSection';
import { colors } from '../../../styles';

function GeneralPhotoCard({ photo, onUpload, onRemove }) {
  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${colors.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <div style={{ padding: "9px 16px", borderBottom: "1px solid #edf0f5", background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: "700", color: colors.header, textTransform: "uppercase", letterSpacing: "0.08em" }}>General Photo</span>
      </div>
      <div style={{ padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "160px" }}>
        {photo ? (
          <div style={{ position: "relative", width: "100%" }}>
            <img src={photo} alt="General" style={{ width: "100%", borderRadius: "6px", objectFit: "cover", display: "block" }} />
            <button type="button" onClick={onRemove} style={{ position: "absolute", top: "4px", right: "4px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700" }}>×</button>
          </div>
        ) : (
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", cursor: "pointer", padding: "20px" }}>
            <UploadCloud size={32} strokeWidth={1.5} color={colors.primary} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: colors.primary }}>Upload Photo</span>
            <span style={{ fontSize: "11px", color: colors.textMuted, textAlign: "center" }}>Photo appears in General Info table of the report</span>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />
          </label>
        )}
      </div>
    </div>
  );
}

export default function GeneralInfo({ form, handleChange, handleGeneralPhotoUpload, clearGeneralPhoto }) {
  const { schema } = form;
  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <SchemaSection title="I. GENERAL INFORMATION" fields={schema.generalInfo} formData={form} onChange={handleChange} ai={false} />
      </div>
      <div style={{ width: "200px", flexShrink: 0 }}>
        <GeneralPhotoCard photo={form.generalPhoto} onUpload={handleGeneralPhotoUpload} onRemove={clearGeneralPhoto} />
      </div>
    </div>
  );
}
