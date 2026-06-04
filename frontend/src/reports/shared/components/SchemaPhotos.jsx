import { colors } from '../../../styles';
import { compressImage, formatFileSize } from '../../../utils/imageCompression';
import { UploadCloud, FolderUp, X, Camera, Sparkles, CheckSquare, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import { ENDPOINTS } from '../../../config/api';

export default function SchemaPhotos({ config, formData, onChange }) {
  const [processingGroups, setProcessingGroups] = useState({});
  const [selectedPhotos, setSelectedPhotos] = useState({});

  const toggleSelectPhoto = (photoId) => {
    setSelectedPhotos(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };

  const toggleSelectAll = (groupId, photos) => {
    const allSelected = photos.length > 0 && photos.every(p => selectedPhotos[p.id]);
    const newSelected = { ...selectedPhotos };
    photos.forEach(p => {
      newSelected[p.id] = !allSelected;
    });
    setSelectedPhotos(newSelected);
  };

  const deleteSelected = (groupId) => {
    const currentPhotos = formData[groupId] || [];
    const updatedPhotos = currentPhotos.filter(p => !selectedPhotos[p.id]);
    onChange({ target: { name: groupId, value: updatedPhotos } });
    
    const newSelected = { ...selectedPhotos };
    currentPhotos.forEach(p => {
      delete newSelected[p.id];
    });
    setSelectedPhotos(newSelected);
  };

  const generateAutoDescriptions = async (groupId) => {
    const photos = formData[groupId] || [];
    if (photos.length === 0) return;

    setProcessingGroups(prev => ({ ...prev, [groupId]: true }));
    try {
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("reportToken");
      const res = await fetch(ENDPOINTS.AI_DESCRIBE, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ 
          mode: "individual",
          images: photos.map(p => ({ data: p.preview, fileName: p.fileName }))
        }),
      });

      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const updatedPhotos = photos.map((p, i) => ({
          ...p,
          label: data.suggestions[i] || p.label
        }));
        onChange({ target: { name: groupId, value: updatedPhotos } });
      }
    } catch (error) {
      console.error("AI Description Error:", error);
    } finally {
      setProcessingGroups(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const handlePhotosUpload = async (groupId, files) => {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) return;

    setProcessingGroups(prev => ({ ...prev, [groupId]: true }));

    const processedPhotos = [];
    // Sequential processing to avoid browser lag with large batches
    for (let index = 0; index < selectedFiles.length; index++) {
      const file = selectedFiles[index];
      const uniqueId = `${groupId}_${Date.now()}_${Math.random()}_${index}`;
      try {
        const { file: compressedFile, preview, originalSize, compressedSize } = await compressImage(file);
        processedPhotos.push({ id: uniqueId, label: "", fileName: compressedFile.name, preview, originalSize, compressedSize });
      } catch {
        const preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        processedPhotos.push({ id: uniqueId, label: "", fileName: file.name, preview, originalSize: file.size, compressedSize: file.size, error: true });
      }
    }

    const currentPhotos = formData[groupId] || [];
    onChange({ target: { name: groupId, value: [...currentPhotos, ...processedPhotos] } });
    
    setProcessingGroups(prev => ({ ...prev, [groupId]: false }));
  };

  const updatePhotoLabel = (groupId, photoId, label) => {
    const currentPhotos = formData[groupId] || [];
    const updatedPhotos = currentPhotos.map(p => p.id === photoId ? { ...p, label } : p);
    onChange({ target: { name: groupId, value: updatedPhotos } });
  };

  const removePhoto = (groupId, photoId) => {
    const currentPhotos = formData[groupId] || [];
    const updatedPhotos = currentPhotos.filter(p => p.id !== photoId);
    onChange({ target: { name: groupId, value: updatedPhotos } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {config.groups.map(group => {
        const photos = formData[group.id] || [];
        const isProcessing = processingGroups[group.id];

        return (
          <div key={group.id} style={{ border: `1px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ padding: "16px 20px", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Camera size={18} color={colors.primary} />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: colors.text, margin: 0 }}>
                  {group.label}
                </h3>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {photos.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(group.id, photos)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "8px",
                        background: colors.surfaceAlt,
                        color: colors.text,
                        cursor: "pointer",
                        fontSize: "13px", fontWeight: "600", transition: "all 0.2s",
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      {photos.length > 0 && photos.every(p => selectedPhotos[p.id]) ? <CheckSquare size={16} /> : <Square size={16} />}
                      Select All
                    </button>
                    
                    {photos.some(p => selectedPhotos[p.id]) && (
                      <button
                        type="button"
                        onClick={() => deleteSelected(group.id)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "8px 16px", borderRadius: "8px",
                          background: "#fee2e2",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "13px", fontWeight: "600", transition: "all 0.2s",
                          border: "1px solid #fca5a5"
                        }}
                      >
                        <Trash2 size={16} />
                        Delete Selected
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => generateAutoDescriptions(group.id)}
                  disabled={photos.length === 0 || isProcessing}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", borderRadius: "8px",
                    background: (photos.length === 0 || isProcessing) ? colors.surfaceAlt : colors.primary,
                    color: "#fff",
                    cursor: (photos.length === 0 || isProcessing) ? "not-allowed" : "pointer",
                    fontSize: "13px", fontWeight: "600", transition: "all 0.2s",
                    border: "none"
                  }}
                >
                  <Sparkles size={16} />
                  {isProcessing ? "Analyzing..." : "Magic Auto-Describe"}
                </button>

                <label style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "8px",
                  background: isProcessing ? colors.surfaceAlt : colors.primaryLight,
                  color: isProcessing ? colors.textMuted : colors.primary,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  fontSize: "13px", fontWeight: "600", transition: "all 0.2s"
                }}>
                  <UploadCloud size={16} />
                  {isProcessing ? "Processing..." : "Upload Photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    disabled={isProcessing}
                    onChange={(e) => {
                      handlePhotosUpload(group.id, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>

                <label style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "8px",
                  background: isProcessing ? colors.surfaceAlt : colors.primaryLight,
                  color: isProcessing ? colors.textMuted : colors.primary,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  fontSize: "13px", fontWeight: "600", transition: "all 0.2s"
                }}>
                  <FolderUp size={16} />
                  {isProcessing ? "Processing..." : "Upload Folder"}
                  <input
                    type="file"
                    accept="image/*"
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    style={{ display: "none" }}
                    disabled={isProcessing}
                    onChange={(e) => {
                      // Filter for images only just in case a folder contains non-image files
                      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
                      handlePhotosUpload(group.id, files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <div style={{ padding: "20px", background: colors.surface }}>
              {photos.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", border: `2px dashed ${colors.border}`, borderRadius: "8px", background: colors.surfaceAlt }}>
                  <p style={{ margin: 0, color: colors.textMuted, fontSize: "14px" }}>No photos uploaded for this section yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {photos.map(photo => (
                    <div key={photo.id} style={{ 
                      border: `1px solid ${selectedPhotos[photo.id] ? colors.primary : colors.border}`, 
                      borderRadius: "8px", 
                      overflow: "hidden", 
                      background: colors.surface, 
                      position: "relative",
                      transition: "all 0.2s",
                      boxShadow: selectedPhotos[photo.id] ? `0 0 0 2px ${colors.primary}20` : "none",
                      transform: selectedPhotos[photo.id] ? "translateY(-2px)" : "none"
                    }}>
                      <button
                        type="button"
                        onClick={() => toggleSelectPhoto(photo.id)}
                        style={{ position: "absolute", top: "8px", left: "8px", background: selectedPhotos[photo.id] ? colors.primary : "rgba(255, 255, 255, 0.9)", color: selectedPhotos[photo.id] ? "white" : colors.textMuted, border: `1px solid ${selectedPhotos[photo.id] ? colors.primary : colors.border}`, borderRadius: "4px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, transition: "all 0.2s" }}
                      >
                        {selectedPhotos[photo.id] ? <CheckSquare size={14} /> : <Square size={14} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => removePhoto(group.id, photo.id)}
                        style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
                      >
                        <X size={14} />
                      </button>
                      
                      <img 
                        src={photo.preview} 
                        alt={photo.fileName} 
                        style={{ 
                          width: "100%", 
                          height: "150px", 
                          objectFit: "cover", 
                          display: "block",
                          cursor: "pointer",
                          opacity: selectedPhotos[photo.id] ? 0.8 : 1
                        }} 
                        onClick={() => toggleSelectPhoto(photo.id)}
                      />
                      <div style={{ padding: "10px" }}>
                        <textarea
                          value={photo.label || ""}
                          onChange={(e) => updatePhotoLabel(group.id, photo.id, e.target.value)}
                          placeholder="Photo description"
                          style={{ width: "100%", height: "60px", padding: "8px", borderRadius: "6px", border: `1px solid ${colors.border}`, fontSize: "12px", boxSizing: "border-box", marginBottom: "6px", resize: "none", background: "transparent" }}
                        />
                        <div style={{ fontSize: "10px", color: colors.success, fontWeight: "500" }}>
                          {photo.compressedSize ? (
                            <>
                              {formatFileSize(photo.compressedSize)}
                              {photo.originalSize > photo.compressedSize && (
                                <span style={{ marginLeft: "4px", opacity: 0.8 }}>
                                  (saved {formatFileSize(photo.originalSize - photo.compressedSize)})
                                </span>
                              )}
                            </>
                          ) : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Auto-Compression Info */}
            <div style={{ margin: "20px", padding: "12px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "6px", fontSize: "11px", color: colors.textMuted }}>
              <strong style={{ color: colors.text }}>✓ Auto-Compression:</strong> Images larger than 7.5KB are automatically compressed to maintain your report file size.
            </div>
          </div>
        );
      })}
    </div>
  );
}
