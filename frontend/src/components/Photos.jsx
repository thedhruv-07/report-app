import React, { useState } from "react";
import { colors, buttonStyle } from "../styles";
import { formatFileSize } from "../utils/imageCompression";

const Photos = ({ photos, onPhotoLabelChange, onPhotoFileChange, onRemovePhoto, onPrev, onNext }) => {
  const [dragActive, setDragActive] = useState(false);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onPhotoFileChange(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onPhotoFileChange(e.target.files);
      e.target.value = ""; // Reset input for re-uploads
    }
  };

  return (
    <div style={{ color: colors.text, fontSize: "14px", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: colors.text, fontSize: "18px", fontWeight: "bold" }}>
        Step 12: Photos
      </h2>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? colors.primary : colors.border}`,
          borderRadius: "6px",
          padding: "20px",
          background: dragActive ? "rgba(59, 130, 246, 0.05)" : colors.surfaceAlt,
          textAlign: "center",
          marginBottom: "20px",
          transition: "all 0.3s ease",
          cursor: "pointer"
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <h3 style={{ color: colors.text, margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
            📸 Drag & Drop Images Here
          </h3>
          <p style={{ color: colors.textMuted, margin: "0 0 10px 0", fontSize: "12px" }}>
            Select multiple images at once - compression to 5-10KB happens automatically
          </p>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          id="photoFileInput"
        />

        <label
          htmlFor="photoFileInput"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            background: colors.primary,
            color: "#fff",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "700",
            transition: "all 0.3s ease",
            border: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primaryHover || "#1d4ed8";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          📁 Choose Photos
        </label>
      </div>

      {/* Photos Gallery Grid */}
      {photos.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: colors.text, marginBottom: "12px", fontSize: "13px", fontWeight: "700" }}>
            Uploaded Photos: {photos.length}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "12px"
            }}
          >
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  overflow: "hidden",
                  background: colors.surface,
                  transition: "all 0.3s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                }}
              >
                {/* Image Preview */}
                <div
                  style={{
                    width: "100%",
                    height: "120px",
                    background: colors.surfaceAlt,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  {photo.preview ? (
                    <img
                      src={photo.preview}
                      alt={`photo-${idx}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  ) : (
                    <div style={{ color: colors.textMuted, fontSize: "11px" }}>Loading...</div>
                  )}
                </div>

                {/* Photo Info & Controls */}
                <div style={{ padding: "10px" }}>
                  {/* Label Input */}
                  <input
                    type="text"
                    placeholder="Add description"
                    value={photo.label}
                    onChange={(e) => onPhotoLabelChange(photo.id, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      marginBottom: "8px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "3px",
                      fontSize: "11px",
                      color: colors.text,
                      background: colors.surface,
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                  />

                  {/* File Size */}
                  {photo.compressedSize && (
                    <div style={{ fontSize: "9px", color: photo.error ? colors.danger : colors.success, marginBottom: "6px", padding: "3px 5px", background: "rgba(0,0,0,0.02)", borderRadius: "2px" }}>
                      {photo.originalSize > photo.compressedSize ? (
                        <div>
                          <div>📦 {formatFileSize(photo.compressedSize)}</div>
                          <div>↓ Saved {formatFileSize(photo.originalSize - photo.compressedSize)}</div>
                        </div>
                      ) : (
                        <div>{formatFileSize(photo.compressedSize)}</div>
                      )}
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    style={{
                      width: "100%",
                      padding: "5px",
                      background: colors.danger,
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "600",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{ marginBottom: "20px", padding: "12px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "4px", fontSize: "11px", color: colors.textMuted }}>
        <strong style={{ color: colors.text }}>✓ Auto-Compression:</strong> Images larger than 7.5KB are automatically compressed to maintain your report file size.
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
        <button
          onClick={onPrev}
          style={{
            ...buttonStyle,
            minWidth: "110px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13px",
          }}
        >
          Previous
        </button>
        <button
          onClick={onNext}
          style={{
            ...buttonStyle,
            minWidth: "110px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13px",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Photos;
