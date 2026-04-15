import { inputStyle, buttonStyle, colors, sectionHeaderStyle } from "../styles";
import { compressImage, formatFileSize } from "../utils/imageCompression";

export default function ConclusionStep({ form, handleChange, onPrev, onNext }) {
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
          const { file: compressedFile, preview, originalSize, compressedSize } = await compressImage(file);
          return {
            id,
            label: "",
            fileName: compressedFile.name,
            preview,
            originalSize,
            compressedSize,
          };
        } catch {
          const preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          return {
            id,
            label: "",
            fileName: file.name,
            preview,
            originalSize: file.size,
            compressedSize: file.size,
            error: true,
          };
        }
      })
    );

    setField(fieldName, [...currentPhotos, ...processedPhotos]);
  };

  const handleConclusionPhotoUpload = async (files) => {
    await handlePhotoUpload(files, "conclusionPhotos", "conclusion", conclusionPhotos);
  };

  const handleReviewerPhotoUpload = async (files) => {
    await handlePhotoUpload(files, "conclusionReviewerPhotos", "reviewer", conclusionReviewerPhotos);
  };

  const updateConclusionPhotoLabel = (id, label) => {
    setField(
      "conclusionPhotos",
      conclusionPhotos.map((p) => (p.id === id ? { ...p, label } : p))
    );
  };

  const removeConclusionPhoto = (id) => {
    setField(
      "conclusionPhotos",
      conclusionPhotos.filter((p) => p.id !== id)
    );
  };

  const updateReviewerPhotoLabel = (id, label) => {
    setField(
      "conclusionReviewerPhotos",
      conclusionReviewerPhotos.map((p) => (p.id === id ? { ...p, label } : p))
    );
  };

  const removeReviewerPhoto = (id) => {
    setField(
      "conclusionReviewerPhotos",
      conclusionReviewerPhotos.filter((p) => p.id !== id)
    );
  };

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

      {/* Report Reviewer Photos Upload */}
      <div style={{ marginBottom: "25px", padding: "20px", background: colors.surfaceAlt, border: `2px solid ${colors.border}`, borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <h4 style={{ margin: 0, fontWeight: "600", color: colors.text }}>Report Reviewer Photos Upload</h4>
          <label
            htmlFor="reviewerPhotoUpload"
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            + Upload Photos
          </label>
          <input
            id="reviewerPhotoUpload"
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              handleReviewerPhotoUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {conclusionReviewerPhotos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            {conclusionReviewerPhotos.map((photo) => (
              <div key={photo.id} style={{ border: `1px solid ${colors.border}`, borderRadius: "6px", overflow: "hidden", background: colors.surface }}>
                <img src={photo.preview} alt={photo.fileName || "Reviewer photo"} style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "8px" }}>
                  <input
                    type="text"
                    value={photo.label || ""}
                    placeholder="Photo description"
                    onChange={(e) => updateReviewerPhotoLabel(photo.id, e.target.value)}
                    style={{
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "4px",
                      background: colors.surface,
                      color: colors.text,
                      fontSize: "11px",
                      padding: "6px",
                      boxSizing: "border-box",
                      marginBottom: "6px",
                    }}
                  />
                  <div style={{ fontSize: "10px", color: photo.error ? colors.danger : colors.success, marginBottom: "6px" }}>
                    {photo.compressedSize ? formatFileSize(photo.compressedSize) : "processing..."}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReviewerPhoto(photo.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      borderRadius: "4px",
                      background: colors.danger,
                      color: "#fff",
                      fontSize: "11px",
                      padding: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* Conclusion Photos Upload */}
      <div style={{ marginBottom: "25px", padding: "20px", background: colors.surfaceAlt, border: `2px solid ${colors.border}`, borderRadius: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <h4 style={{ margin: 0, fontWeight: "600", color: colors.text }}>Conclusion Photos (Inspector Upload)</h4>
          <label
            htmlFor="conclusionPhotoUpload"
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            + Upload Photos
          </label>
          <input
            id="conclusionPhotoUpload"
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              handleConclusionPhotoUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {conclusionPhotos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            {conclusionPhotos.map((photo) => (
              <div key={photo.id} style={{ border: `1px solid ${colors.border}`, borderRadius: "6px", overflow: "hidden", background: colors.surface }}>
                <img src={photo.preview} alt={photo.fileName || "Conclusion photo"} style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "8px" }}>
                  <input
                    type="text"
                    value={photo.label || ""}
                    placeholder="Photo description"
                    onChange={(e) => updateConclusionPhotoLabel(photo.id, e.target.value)}
                    style={{
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "4px",
                      background: colors.surface,
                      color: colors.text,
                      fontSize: "11px",
                      padding: "6px",
                      boxSizing: "border-box",
                      marginBottom: "6px",
                    }}
                  />
                  <div style={{ fontSize: "10px", color: photo.error ? colors.danger : colors.success, marginBottom: "6px" }}>
                    {photo.compressedSize ? formatFileSize(photo.compressedSize) : "processing..."}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeConclusionPhoto(photo.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      borderRadius: "4px",
                      background: colors.danger,
                      color: "#fff",
                      fontSize: "11px",
                      padding: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
