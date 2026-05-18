import { buttonStyle, colors, tableLabelStyle } from '../../../styles';
import { useState } from "react";
import { compressImage, formatFileSize } from '../../../utils/imageCompression';

export default function GeneralInfo({ form, handleChange, onNext, generalPhoto, generalPhotoData, onGeneralPhotoChange }) {
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  const photoPreview =
    generalPhotoData && typeof generalPhotoData.preview === "string" && generalPhotoData.preview.startsWith("data:image")
      ? generalPhotoData.preview
      : typeof generalPhoto === "string" && generalPhoto.startsWith("data:image")
      ? generalPhoto
      : null;

  const handleGeneralPhotoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setIsPhotoProcessing(true);

    try {
      const { file: compressedFile, preview, originalSize, compressedSize } = await compressImage(file);
      onGeneralPhotoChange({
        id: `general_${Date.now()}`,
        label: "",
        fileName: compressedFile.name,
        preview,
        originalSize,
        compressedSize,
      });
      setIsPhotoProcessing(false);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        onGeneralPhotoChange({
          id: `general_${Date.now()}`,
          label: "",
          fileName: file.name,
          preview: reader.result,
          originalSize: file.size,
          compressedSize: file.size,
          error: true,
        });
        setIsPhotoProcessing(false);
      };
      reader.onerror = () => {
        setIsPhotoProcessing(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  const clearGeneralPhoto = () => {
    onGeneralPhotoChange("");
    setIsPhotoProcessing(false);
  };

  const photoMetaText =
    generalPhotoData && generalPhotoData.compressedSize
      ? `${formatFileSize(generalPhotoData.compressedSize)}${
          generalPhotoData.originalSize > generalPhotoData.compressedSize
            ? ` (saved ${formatFileSize(generalPhotoData.originalSize - generalPhotoData.compressedSize)})`
            : ""
        }`
      : "";

  const photoMetaColor = generalPhotoData?.error ? colors.danger : colors.success;

  const handlePhotoChange = (e) => {
    handleGeneralPhotoUpload(e).catch(() => {
      setIsPhotoProcessing(false);
    });
  };

  return (
    <div style={{ display: "flex", gap: "30px" }}>
      {/* Left side - Information Table */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "20px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>I. GENERAL INFORMATION</h3>
        
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}` }}>
          <tbody>
            <tr>
              <td style={{ ...tableLabelStyle }}>Service Performed:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="servicePerformed" placeholder="Pre-Shipment Inspection"
                  value={form.servicePerformed || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Client:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="client" placeholder="FRIN"
                  value={form.client || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Supplier:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="supplier" placeholder="JUFENG"
                  value={form.supplier || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Factory:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="factory" placeholder="JUFENG"
                  value={form.factory || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Product Name:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="productName" placeholder="Nut Forming Machine & Moulds"
                  value={form.productName || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>P.O. No.:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="po" placeholder="8092023"
                  value={form.po || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Item No.:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="itemNo" placeholder="30B nut forming machine (Model: 30B-6S-40), Mould M8, Mould M10, Mould M12, Mould M14"
                  value={form.itemNo || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Destination Country:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="country" placeholder="India"
                  value={form.country || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Inspection Date:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="inspectionDate" placeholder="20240516"
                  value={form.inspectionDate || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Inspection Location:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="inspectionLocation" placeholder="Jiangsu (CHINA)"
                  value={form.inspectionLocation || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
            <tr>
              <td style={{ ...tableLabelStyle }}>Reference Sample:</td>
              <td style={{ padding: "12px 14px", border: `1px solid ${colors.border}`, background: colors.surface }}>
                <input name="referenceSample" placeholder="Yes/No"
                  value={form.referenceSample || ""} onChange={handleChange} style={{ width: "100%", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, padding: "8px", borderRadius: "6px", boxSizing: "border-box", fontSize: "14px" }} />
              </td>
            </tr>
          </tbody>
        </table>

        <button 
          onClick={onNext} 
          style={{ 
            ...buttonStyle, 
            marginTop: "25px",
            width: "100%",
            opacity: isPhotoProcessing ? 0.6 : 1,
            cursor: isPhotoProcessing ? "not-allowed" : "pointer"
          }}
          disabled={isPhotoProcessing}
          onMouseEnter={(e) => {
            if (isPhotoProcessing) return;
            e.target.style.background = colors.primaryHover;
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.25)";
          }}
          onMouseLeave={(e) => {
            if (isPhotoProcessing) return;
            e.target.style.background = colors.primary;
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.15)";
          }}
        >
          {isPhotoProcessing ? "Processing photo..." : "Next Step →"}
        </button>
      </div>

      {/* Right side - Photo Section */}
      <div style={{ width: "280px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: colors.text }}>
            General Photo:
          </label>
          <input 
            type="file" 
            name="generalPhoto"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ width: "100%", padding: "10px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", boxSizing: "border-box", transition: "all 0.3s ease" }}
          />
        </div>

        {photoPreview ? (
          <div>
            <img 
              src={photoPreview} 
              alt="General photo preview"
              style={{
                width: "100%",
                border: `2px solid ${colors.border}`,
                borderRadius: "8px",
                objectFit: "cover",
                height: "220px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
              }}
            />

            <div style={{ marginTop: "8px", fontSize: "11px", color: colors.textMuted }}>
              {generalPhotoData?.fileName || "Uploaded image"}
            </div>

            {photoMetaText && (
              <div style={{ marginTop: "4px", fontSize: "11px", color: photoMetaColor }}>
                {photoMetaText}
              </div>
            )}

            <button
              type="button"
              onClick={clearGeneralPhoto}
              style={{
                marginTop: "8px",
                width: "100%",
                border: "none",
                borderRadius: "6px",
                background: colors.danger,
                color: "#fff",
                fontSize: "12px",
                padding: "8px",
                cursor: "pointer",
              }}
            >
              Remove Photo
            </button>
          </div>
        ) : (
          <div style={{
            width: "100%",
            height: "220px",
            border: `2px dashed ${colors.border}`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textMuted,
            fontSize: "12px",
            background: colors.surfaceAlt
          }}>
            📷 No photo uploaded
          </div>
        )}
      </div>
    </div>
  );
}
