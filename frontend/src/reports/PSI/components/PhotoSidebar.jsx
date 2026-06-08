import { useState, useRef } from 'react';
import { colors } from '../../../styles';
import { compressImage } from '../../../utils/imageCompression';

const SECTIONS = [
  "General", "Quantity", "Workmanship", "On-Site Tests",
  "Packing", "Marking & Labeling", "Client Requirements", "Remarks", "Other",
];

export default function PhotoSidebar({ photos = [], photoGroups = [], onAddPhoto, onRemovePhoto }) {
  const [section, setSection] = useState("General");
  const [cols, setCols] = useState(2);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Build a map of photoId → section name for display
  const photoSectionMap = {};
  (photoGroups || []).forEach(g => {
    (g.photoIds || []).forEach(pid => { photoSectionMap[pid] = g.description; });
  });

  // All photos that came from the sidebar (have a group)
  const sidebarPhotos = (photos || []).filter(p => photoSectionMap[p.id]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const { preview } = await compressImage(file);
        const id = `sb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        onAddPhoto({ id, preview, section, label: section });
      } catch { /* skip broken file */ }
    }
    setUploading(false);
    if (e.target) e.target.value = "";
  };

  const groupIdFor = (photoId) => {
    const g = (photoGroups || []).find(g => (g.photoIds || []).includes(photoId));
    return g?.id;
  };

  return (
    <div style={{
      width: "220px",
      flexShrink: 0,
      borderLeft: `1px solid ${colors.border}`,
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{ padding: "9px 12px", borderBottom: `1px solid #edf0f5`, background: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "3px", height: "14px", background: colors.primary, borderRadius: "2px", flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: colors.header, textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>Photos</span>
        <span style={{ fontSize: "10px", color: colors.primary, background: colors.primaryLight, borderRadius: "10px", padding: "1px 7px", fontWeight: 700 }}>
          {sidebarPhotos.length}
        </span>
      </div>

      {/* Section selector + upload */}
      <div style={{ padding: "10px 12px", borderBottom: `1px solid #edf0f5`, display: "flex", flexDirection: "column", gap: "7px" }}>
        <select
          value={section}
          onChange={e => setSection(e.target.value)}
          style={{ width: "100%", fontSize: "12px", padding: "5px 8px", borderRadius: "6px", border: `1px solid ${colors.border}`, background: "#fff", color: colors.text, fontFamily: "inherit", outline: "none" }}
        >
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <label style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          padding: "6px", borderRadius: "6px", background: colors.primaryLight, color: colors.primary,
          cursor: uploading ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: 700,
          border: `1px dashed ${colors.primary}`, opacity: uploading ? 0.6 : 1,
        }}>
          📷 {uploading ? "Uploading…" : "Upload Photos"}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} disabled={uploading} />
        </label>
      </div>

      {/* Toolbar: count + col toggle */}
      <div style={{ padding: "5px 12px", borderBottom: `1px solid #edf0f5`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", color: colors.textMuted }}>
          {sidebarPhotos.length} photo{sidebarPhotos.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: "3px" }}>
          {[1, 2].map(n => (
            <button key={n} type="button" onClick={() => setCols(n)} style={{
              width: "22px", height: "22px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, cursor: "pointer",
              border: `1px solid ${cols === n ? colors.primary : colors.border}`,
              background: cols === n ? colors.primaryLight : "#fff",
              color: cols === n ? colors.primary : colors.textMuted,
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Photo grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {sidebarPhotos.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "120px", color: colors.textMuted, fontSize: "11px", gap: "8px" }}>
            <span style={{ fontSize: "28px", opacity: 0.25 }}>📷</span>
            <span>No photos yet</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "5px" }}>
            {sidebarPhotos.map(photo => (
              <div key={photo.id} style={{ position: "relative", borderRadius: "5px", overflow: "hidden", border: `1px solid ${colors.border}`, background: "#f8f9fa" }}>
                <img
                  src={photo.preview}
                  alt={photo.label || "photo"}
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }}
                />
                {/* Section label */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.48)", color: "#fff", fontSize: "8px", padding: "2px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {photoSectionMap[photo.id]}
                </div>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id, groupIdFor(photo.id))}
                  style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", cursor: "pointer", fontSize: "10px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
