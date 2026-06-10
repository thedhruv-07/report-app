import { useState } from 'react';
import { inputStyle, colors } from '../../../styles';
import NavButtons from '../../shared/components/NavButtons';
import { readImagePreview } from '../../../utils/fileUtils';
import Lightbox from '../../../components/shared/Lightbox';

const card = {
  background: "#fff",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
  overflow: "hidden",
  marginBottom: "16px",
};

const cardHeader = {
  padding: "9px 16px",
  borderBottom: `1px solid #edf0f5`,
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const accent = {
  width: "3px", height: "14px",
  background: colors.primary,
  borderRadius: "2px",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: "11px", fontWeight: 700,
  color: colors.header,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const cardBody = { padding: "14px 16px" };

export default function ConclusionStep({ form, handleChange, onPrev, onNext }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const setField = (name, value) => handleChange({ target: { name, value } });
  const conclusionPhotos = Array.isArray(form.conclusionPhotos) ? form.conclusionPhotos : [];
  const conclusionReviewerPhotos = Array.isArray(form.conclusionReviewerPhotos) ? form.conclusionReviewerPhotos : [];

  const handlePhotoUpload = async (files, fieldName, prefix, currentPhotos) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;
    const processedPhotos = await Promise.all(
      selectedFiles.map(async (file, index) => {
        const id = `${prefix}_${Date.now()}_${Math.random()}_${index}`;
        try {
          const preview = await readImagePreview(file);
          return { id, label: "", fileName: file.name, preview, originalSize: file.size, compressedSize: file.size };
        } catch {
          return { id, label: "", fileName: file.name, preview: "", originalSize: file.size, compressedSize: file.size, error: true };
        }
      })
    );
    setField(fieldName, [...currentPhotos, ...processedPhotos]);
  };

  const photoGrid = (photos, onLabelChange, onRemove) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginTop: "12px" }}>
      {photos.map((photo) => (
        <div key={photo.id} style={{ border: `1px solid ${colors.border}`, borderRadius: "6px", overflow: "hidden", background: colors.surfaceAlt }}>
          <img src={photo.preview} alt={photo.fileName || "photo"} onClick={() => setLightboxSrc(photo.preview)} style={{ width: "100%", height: "100px", objectFit: "cover", display: "block", cursor: "zoom-in" }} />
          <div style={{ padding: "6px" }}>
            <input
              type="text"
              value={photo.label || ""}
              placeholder="Description"
              onChange={(e) => onLabelChange(photo.id, e.target.value)}
              style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "4px", background: "#fff", color: colors.text, fontSize: "11px", padding: "4px 6px", boxSizing: "border-box", marginBottom: "4px" }}
            />
            <button type="button" onClick={() => onRemove(photo.id)}
              style={{ width: "100%", border: "none", borderRadius: "4px", background: colors.danger, color: "#fff", fontSize: "11px", padding: "4px", cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const STATUSES = [
    { value: "PASSED",  label: "✓ PASSED — Conform to Client's Requirement",        color: colors.success },
    { value: "PENDING", label: "⏳ PENDING — Subject to Client's Evaluation",         color: colors.warning },
    { value: "FAILED",  label: "✗ FAILED — Does Not Conform to Client's Requirement", color: colors.danger  },
  ];

  return (
    <div>
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* Conclusion status */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={accent} />
          <span style={cardTitle}>IV. Conclusion</span>
        </div>
        {STATUSES.map((s, i) => (
          <label key={s.value} style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "10px 16px", cursor: "pointer",
            borderBottom: i < STATUSES.length - 1 ? `1px solid #edf0f5` : "none",
            background: form.conclusionStatus === s.value ? `${s.color}10` : "#fff",
            transition: "background 0.15s",
          }}>
            <input type="radio" name="conclusionStatus" value={s.value}
              checked={form.conclusionStatus === s.value} onChange={handleChange}
              style={{ accentColor: s.color, width: "15px", height: "15px", flexShrink: 0 }} />
            <span style={{ color: s.color, fontWeight: 600, fontSize: "13px" }}>{s.label}</span>
          </label>
        ))}
      </div>

      {/* Report Reviewer Photos */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={accent} />
          <span style={{ ...cardTitle, flex: 1 }}>Report Reviewer Photos</span>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "20px", border: "none", background: colors.primary, color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
            + Upload
            <input type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={(e) => { handlePhotoUpload(e.target.files, "conclusionReviewerPhotos", "reviewer", conclusionReviewerPhotos); e.target.value = ""; }} />
          </label>
        </div>
        <div style={cardBody}>
          {conclusionReviewerPhotos.length === 0
            ? <div style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center", padding: "16px 0" }}>No photos uploaded yet</div>
            : photoGrid(conclusionReviewerPhotos,
                (id, label) => setField("conclusionReviewerPhotos", conclusionReviewerPhotos.map(p => p.id === id ? { ...p, label } : p)),
                (id) => setField("conclusionReviewerPhotos", conclusionReviewerPhotos.filter(p => p.id !== id))
              )
          }
        </div>
      </div>

      {/* Approved by + Inspector/Reviewer */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={accent} />
          <span style={cardTitle}>Signatures</span>
        </div>
        <div style={{ ...cardBody, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            { name: "approvedBy",    label: "Approved by",     placeholder: "e.g., Amvt, Manager of Report Reviewing" },
            { name: "inspector",     label: "Inspector",       placeholder: "Inspector name / title" },
            { name: "reportReviewer",label: "Report Reviewer", placeholder: "Reviewer name / title" },
          ].map(f => (
            <div key={f.name}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: colors.header, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</div>
              <textarea
                name={f.name}
                value={form[f.name] || ""}
                onChange={(e) => setField(f.name, e.target.value)}
                placeholder={f.placeholder}
                style={{ ...inputStyle, background: colors.surfaceAlt, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: "6px", fontSize: "12px", minHeight: "60px", resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion Photos */}
      <div style={card}>
        <div style={cardHeader}>
          <div style={accent} />
          <span style={{ ...cardTitle, flex: 1 }}>Conclusion Photos (Inspector Upload)</span>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "20px", border: "none", background: colors.primary, color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
            + Upload
            <input type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={(e) => { handlePhotoUpload(e.target.files, "conclusionPhotos", "conclusion", conclusionPhotos); e.target.value = ""; }} />
          </label>
        </div>
        <div style={cardBody}>
          {conclusionPhotos.length === 0
            ? <div style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center", padding: "16px 0" }}>No photos uploaded yet</div>
            : photoGrid(conclusionPhotos,
                (id, label) => setField("conclusionPhotos", conclusionPhotos.map(p => p.id === id ? { ...p, label } : p)),
                (id) => setField("conclusionPhotos", conclusionPhotos.filter(p => p.id !== id))
              )
          }
        </div>
      </div>

      {/* Note */}
      <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: `1px solid #edf0f5`, fontSize: "11px", color: colors.textMuted, lineHeight: "1.7", marginBottom: "16px" }}>
        <span style={{ fontWeight: 700, color: colors.header }}>Note: </span>
        1. This report reflects our findings at the time and the place of inspection based on random samples selected. 2. This inspection was agreed upon based on the time, the date of samples given by client, and our responsibility is limited to the exercise of reasonable due diligence concerning the source of the report. 3. The inspection and results reflect observations of the item selected and not an analysis of production. 4. This report does not evidence shipment. 5. Our services are subject to the General Conditions of Absolute Veritas. 6. This report result only relate to the samples as (randomly picked) by our inspector. 7. This report is complete and its content may not be reproduced.
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}
