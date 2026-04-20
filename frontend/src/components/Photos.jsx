import React, { useState, useRef, useEffect } from "react";
import { colors, buttonStyle } from "../styles";
import { formatFileSize } from "../utils/imageCompression";
import SmartTextarea from "./SmartTextarea";
import { ENDPOINTS } from "../config/api";

const Photos = ({ photos, photoGroups, onPhotoGroupsChange, onPhotoFileChange, onRemovePhoto, onPrev, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // files staged for grouping
  const [pendingPreviews, setPendingPreviews] = useState([]); // previews of staged files
  const [selectedPending, setSelectedPending] = useState(new Set()); // toggled for selection
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingIndividual, setIsAnalyzingIndividual] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [groupDescription, setGroupDescription] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]); // AI description suggestions panel

  // ─── LOCAL STORAGE PERSISTENCE ──────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("stagedPhotos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPendingFiles(parsed);
          setPendingPreviews(parsed);
          // Auto-select them
          setSelectedPending(new Set(parsed.map(p => p.id)));
        }
      } catch (e) {
        console.error("Failed to load staged photos", e);
      }
    }
  }, []);

  useEffect(() => {
    if (pendingFiles.length > 0) {
      // Just save metadata and previews (Files can't be serialized)
      const toSave = pendingFiles.map(p => ({
        id: p.id,
        preview: p.preview,
        fileName: p.fileName,
        size: p.size
      }));
      localStorage.setItem("stagedPhotos", JSON.stringify(toSave));
    } else {
      localStorage.removeItem("stagedPhotos");
    }
  }, [pendingFiles]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [selectedUngrouped, setSelectedUngrouped] = useState(new Set());
  const [ungroupedDescription, setUngroupedDescription] = useState("");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

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
      stageFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFiles(e.target.files);
      e.target.value = ""; // Reset input for re-uploads
    }
  };

  // Stage files for preview & grouping (don't add to report yet)
  const stageFiles = async (fileList) => {
    // Filter to only include valid images (skip directories or hidden files)
    const newFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/') && file.size > 0
    );

    if (newFiles.length === 0) return;

    for (const file of newFiles) {
      const reader = new FileReader();
      const readPromise = new Promise((resolve) => {
        reader.onloadend = () => {
          const item = {
            id: `pending_${Date.now()}_${Math.random()}`,
            file,
            preview: reader.result,
            fileName: file.name,
            size: file.size,
          };
          // Update incrementally for better feedback
          setPendingFiles((prev) => [...prev, item]);
          setPendingPreviews((prev) => [...prev, item]);
          setSelectedPending((prev) => new Set(prev).add(item.id));
          resolve();
        };
        reader.onerror = () => {
          console.warn(`Skipping unreadable file: ${file.name}`);
          resolve(); // Resolve anyway to continue with next files
        };
        reader.readAsDataURL(file);
      });
      await readPromise;
    }
  };

  // Toggle selection of a pending photo
  const togglePendingSelection = (id) => {
    setSelectedPending((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Select all pending
  const selectAllPending = () => {
    const allIds = pendingFiles.map((p) => p.id);
    setSelectedPending(new Set(allIds));
  };

  // Deselect all pending
  const deselectAllPending = () => {
    setSelectedPending(new Set());
  };

  // Helper to shrink images for AI analysis (removes 400 errors from huge photos)
  const compressImageForAI = (base64Str, maxWidth = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.6)); // 60% quality is plenty for AI
      };
      img.onerror = () => resolve(base64Str); // Fallback to original if error
    });
  };

  const handleIndividualAutoDescribe = async () => {
    const selected = pendingFiles.filter((p) => selectedPending.has(p.id));
    if (selected.length === 0) return;

    setIsAnalyzingIndividual(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("reportToken");
      
      // Compress each image sequentially for AI analysis
      const imagesWithMeta = await Promise.all(selected.map(async (p) => {
         const compressed = await compressImageForAI(p.preview);
         return { 
           data: compressed, 
           fileName: p.fileName 
         };
      }));

      const response = await fetch(ENDPOINTS.AI_DESCRIBE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          images: imagesWithMeta, // Send data + metadata
          mode: 'individual'
        })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const suggestions = data.suggestions || [];
      
      if (suggestions.length > 0) {
        // Update each photo's label based on its index
        setPendingFiles(prev => prev.map(p => {
          const idx = selected.findIndex(sel => sel.id === p.id);
          if (idx !== -1 && suggestions[idx]) {
            return { ...p, label: suggestions[idx] };
          }
          return p;
        }));
        
        // Also update previews to keep labels synced
        setPendingPreviews(prev => prev.map(p => {
          const idx = selected.findIndex(sel => sel.id === p.id);
          if (idx !== -1 && suggestions[idx]) {
            return { ...p, label: suggestions[idx] };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error("Individual AI Analysis Failed:", error);
      alert("Failed to get individual descriptions. Please try again.");
    } finally {
      setIsAnalyzingIndividual(false);
    }
  };

  const handleAutoDescribe = async () => {
    const selected = pendingFiles.filter((p) => selectedPending.has(p.id));
    if (selected.length === 0) return;

    setIsAnalyzing(true);
    setAiSuggestions([]);

    try {
      // Send just the count of images — backend generates text-based suggestions
      const token = localStorage.getItem("token") || localStorage.getItem("reportToken");
      const response = await fetch(ENDPOINTS.AI_DESCRIBE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // Send minimal stub previews (just the count matters for text generation)
        body: JSON.stringify({ images: selected.map(() => "stub") })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const suggestions = data.suggestions || data.descriptions || [];
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions);
      } else {
        setAiSuggestions(["No suggestions returned — try again."]);
      }
    } catch (error) {
      console.error("AI Suggestions Failed:", error);
      setAiSuggestions(["Failed to get suggestions. Please try again."]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissAiSuggestions = () => setAiSuggestions([]);

  // Add selected pending photos as a group with description (Integrated with Wasabi)
  const addSelectedAsGroup = async () => {
    const selected = pendingFiles.filter((p) => selectedPending.has(p.id));
    if (selected.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selected.length });

    const uploadedPhotos = [];
    const token = localStorage.getItem("token") || localStorage.getItem("reportToken");

    try {
      for (let i = 0; i < selected.length; i++) {
        const photo = selected[i];
        
        // Only upload if it has a File object and hasn't been uploaded yet
        if (photo.file && !photo.wasabiKey) {
          const formData = new FormData();
          formData.append("file", photo.file);

          const response = await fetch(ENDPOINTS.FILES.UPLOAD, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            uploadedPhotos.push({
              ...photo,
              wasabiKey: data.key,
              wasabiUrl: data.url
            });
          } else {
            console.warn(`Failed to upload photo ${i+1} to cloud. Falling back to local.`);
            uploadedPhotos.push(photo);
          }
        } else {
          uploadedPhotos.push(photo);
        }
        
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      }

      const description = groupDescription.trim() || "";

      // Pass enriched objects to the report
      onPhotoFileChange(uploadedPhotos, description);

      // Remove the staged files that were added successfully
      const remaining = pendingFiles.filter((p) => !selectedPending.has(p.id));
      setPendingFiles(remaining);
      setPendingPreviews(remaining);
      setSelectedPending(new Set());
      setGroupDescription("");
    } catch (error) {
      console.error("Cloud Upload Failed:", error);
      alert("Failed to upload some photos to the cloud. They will still be added locally.");
      
      // Fallback: Add them locally anyway to avoid hindering the user
      onPhotoFileChange(selected, groupDescription.trim());
      const remaining = pendingFiles.filter((p) => !selectedPending.has(p.id));
      setPendingFiles(remaining);
      setPendingPreviews(remaining);
      setSelectedPending(new Set());
    } finally {
      setIsUploading(false);
    }
  };

  // Remove a pending staged photo
  const removePendingPhoto = (id) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
    setPendingPreviews((prev) => prev.filter((p) => p.id !== id));
    setSelectedPending((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };

  // Clear all pending
  const clearAllPending = () => {
    setPendingFiles([]);
    setPendingPreviews([]);
    setSelectedPending(new Set());
    setGroupDescription("");
    setAiSuggestions([]);
  };

  // Update individual pending label
  const updatePendingLabel = (id, label) => {
    setPendingFiles(prev => prev.map(p => p.id === id ? { ...p, label } : p));
  };

  // Start editing a group description
  const startEditGroup = (groupId, currentDesc) => {
    setEditingGroupId(groupId);
    setEditingDescription(currentDesc);
  };

  // Save edited group description
  const saveGroupDescription = () => {
    if (editingGroupId == null || !photoGroups) return;
    const updated = photoGroups.map((g) =>
      g.id === editingGroupId ? { ...g, description: editingDescription } : g
    );
    onPhotoGroupsChange(updated);
    setEditingGroupId(null);
    setEditingDescription("");
  };

  // Delete an entire group
  const deleteGroup = (groupId) => {
    if (!photoGroups) return;
    const group = photoGroups.find((g) => g.id === groupId);
    if (!group) return;
    
    // Remove all photos in this group
    group.photoIds.forEach((pid) => onRemovePhoto(pid));
    
    // Remove the group itself
    const updated = photoGroups.filter((g) => g.id !== groupId);
    onPhotoGroupsChange(updated);
  };

  // Remove a single photo from a group
  const removePhotoFromGroup = (groupId, photoId) => {
    onRemovePhoto(photoId);
    if (!photoGroups) return;
    const updated = photoGroups.map((g) => {
      if (g.id !== groupId) return g;
      return { ...g, photoIds: g.photoIds.filter((pid) => pid !== photoId) };
    }).filter((g) => g.photoIds.length > 0); // remove empty groups
    onPhotoGroupsChange(updated);
  };

  // Get the photos that belong to a group
  const getGroupPhotos = (group) => {
    return group.photoIds
      .map((pid) => photos.find((p) => p.id === pid))
      .filter(Boolean);
  };

  // Get ungrouped photos (photos not belonging to any group)
  const getUngroupedPhotos = () => {
    if (!photoGroups || photoGroups.length === 0) return photos;
    const groupedIds = new Set(photoGroups.flatMap((g) => g.photoIds));
    return photos.filter((p) => !groupedIds.has(p.id));
  };

  const ungroupedPhotos = getUngroupedPhotos();
  const groups = photoGroups || [];

  // Toggle selection of an ungrouped photo
  const toggleUngroupedSelection = (id) => {
    setSelectedUngrouped((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Group selected ungrouped photos with a description
  const groupUngroupedPhotos = () => {
    if (selectedUngrouped.size === 0) return;
    const description = ungroupedDescription.trim() || "";
    const groupId = `group_${Date.now()}_${Math.random()}`;
    const newGroup = {
      id: groupId,
      description: description,
      photoIds: Array.from(selectedUngrouped),
    };
    onPhotoGroupsChange([...(photoGroups || []), newGroup]);
    setSelectedUngrouped(new Set());
    setUngroupedDescription("");
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
          borderRadius: "10px",
          padding: "28px 20px",
          background: dragActive ? "rgba(59, 130, 246, 0.05)" : colors.surfaceAlt,
          textAlign: "center",
          marginBottom: "20px",
          transition: "all 0.3s ease",
          cursor: "pointer"
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <h3 style={{ color: colors.text, margin: "0 0 8px 0", fontSize: "15px", fontWeight: "700" }}>
            📸 Drag & Drop Images Here
          </h3>
          <p style={{ color: colors.textMuted, margin: "0 0 10px 0", fontSize: "12px" }}>
            Upload multiple photos, then select and group them with descriptions
          </p>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          id="photoFileInput"
          ref={fileInputRef}
        />

        <label
          htmlFor="photoFileInput"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: `linear-gradient(135deg, ${colors.primary}, #1d4ed8)`,
            color: "#fff",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "700",
            transition: "all 0.3s ease",
            border: "none",
            boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
            marginRight: "10px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.25)";
          }}
        >
          📷 Choose Photos
        </label>

        <input
          type="file"
          webkitdirectory="true"
          directory="true"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
          id="folderFileInput"
          ref={folderInputRef}
        />

        <label
          htmlFor="folderFileInput"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: `linear-gradient(135deg, ${colors.surfaceAlt}, ${colors.border})`,
            color: colors.text,
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "700",
            transition: "all 0.3s ease",
            border: `1px solid ${colors.border}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          📁 Upload Folder
        </label>
      </div>

      {/* Pending Staging Area */}
      {pendingFiles.length > 0 && (
        <div
          style={{
            marginBottom: "24px",
            border: `2px solid ${colors.warning}`,
            borderRadius: "10px",
            overflow: "hidden",
            background: colors.surface,
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.1)",
          }}
        >
          {/* Uploading Overlay */}
      {isUploading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            padding: "30px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div className="spinner" style={{ marginBottom: "15px" }}></div>
            <h3 style={{ margin: "0 0 10px 0", color: "#1F4E79" }}>Uploading to Cloud...</h3>
            <p style={{ margin: 0, color: "#666" }}>
              Processing photo {uploadProgress.current} of {uploadProgress.total}
            </p>
            <div style={{
              width: "200px",
              height: "6px",
              backgroundColor: "#eee",
              borderRadius: "3px",
              marginTop: "15px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                height: "100%",
                backgroundColor: colors.primary,
                transition: "width 0.3s ease"
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing Overlay */}
          {/* Staging Header */}
          <div
            style={{
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${colors.warning}15, ${colors.warning}08)`,
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ fontWeight: "700", fontSize: "14px", color: colors.text }}>
                ⚠️ Photos Without Description
              </span>
              <span style={{ color: colors.textMuted, fontSize: "12px", marginLeft: "8px" }}>
                {pendingFiles.length} photo{pendingFiles.length !== 1 ? "s" : ""} uploaded •{" "}
                {selectedPending.size} selected
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={selectAllPending}
                style={{
                  padding: "5px 10px",
                  background: colors.surfaceAlt,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Select All
              </button>
              <button
                onClick={deselectAllPending}
                style={{
                  padding: "5px 10px",
                  background: colors.surfaceAlt,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Deselect All
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete all staged photos?")) {
                    clearAllPending();
                  }
                }}
                style={{
                  padding: "5px 12px",
                  background: colors.danger,
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)"
                }}
              >
                Delete All
              </button>
            </div>
          </div>

          {/* Pending Photos Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "10px",
              padding: "14px",
            }}
          >
            {pendingFiles.map((photo) => {
              const isSelected = selectedPending.has(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => togglePendingSelection(photo.id)}
                  style={{
                    border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: isSelected ? `${colors.primary}08` : colors.surface,
                    position: "relative",
                    boxShadow: isSelected ? `0 0 0 1px ${colors.primary}40` : "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Selection Checkbox Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      background: isSelected ? colors.primary : "rgba(255,255,255,0.85)",
                      border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      color: "#fff",
                      zIndex: 2,
                      backdropFilter: "blur(4px)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isSelected ? "✓" : ""}
                  </div>

                  {/* Remove from staging */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePendingPhoto(photo.id);
                    }}
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.9)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>

                  <div
                    style={{
                      width: "100%",
                      height: "100px",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={photo.preview}
                      alt={photo.fileName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: isSelected ? 1 : 0.8,
                        transition: "opacity 0.2s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "5px 8px 2px",
                      fontSize: "10px",
                      color: colors.textMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {photo.fileName}
                  </div>
                  <input
                    type="text"
                    placeholder="Auto or manual label..."
                    value={photo.label || ""}
                    onChange={(e) => updatePendingLabel(photo.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent toggling selection
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "11px",
                      border: "none",
                      borderTop: `1px solid ${colors.border}`,
                      background: colors.surfaceAlt,
                      color: colors.text,
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* AI Suggestions Panel */}
          {aiSuggestions.length > 0 && (
            <div
              style={{
                margin: "0",
                padding: "14px 16px",
                borderTop: `1px solid ${colors.border}`,
                background: `linear-gradient(135deg, #6366f108, #8b5cf608)`,
                borderLeft: `3px solid #6366f1`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontWeight: "700", fontSize: "13px", color: "#6366f1" }}>
                  ✨ AI Suggestions — click one to use it
                </span>
                <button
                  onClick={dismissAiSuggestions}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: colors.textMuted,
                    fontSize: "16px",
                    lineHeight: 1,
                    padding: "0 4px",
                  }}
                  title="Dismiss suggestions"
                >
                  ×
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {aiSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setGroupDescription(s);
                      setAiSuggestions([]);
                    }}
                    title={s}
                    style={{
                      padding: "7px 14px",
                      background: "rgba(99,102,241,0.08)",
                      border: "1.5px solid #6366f140",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#4f46e5",
                      fontWeight: "500",
                      maxWidth: "320px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#6366f1";
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "#6366f1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                      e.currentTarget.style.color = "#4f46e5";
                      e.currentTarget.style.borderColor = "#6366f140";
                    }}
                  >
                    {idx + 1}. {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description + Add Group */}
          <div
            style={{
              padding: "14px 16px",
              borderTop: `1px solid ${colors.border}`,
              background: `linear-gradient(135deg, ${colors.primary}08, ${colors.primary}03)`,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Group description input */}
            <SmartTextarea
              placeholder="Type or pick an AI suggestion for the group description..."
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              context="inspection photo group description"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                fontSize: "13px",
                color: colors.text,
                background: colors.surface,
                boxSizing: "border-box",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={addSelectedAsGroup}
              disabled={selectedPending.size === 0}
              style={{
                padding: "10px 18px",
                background: selectedPending.size > 0 ? `linear-gradient(135deg, ${colors.success}, #059669)` : colors.surfaceAlt,
                color: selectedPending.size > 0 ? "#fff" : colors.textMuted,
                border: "none",
                borderRadius: "8px",
                cursor: selectedPending.size > 0 ? "pointer" : "not-allowed",
                fontSize: "13px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                boxShadow: selectedPending.size > 0 ? "0 2px 8px rgba(16,185,129,0.25)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              ✓ Add {selectedPending.size > 0 ? `${selectedPending.size} Photo${selectedPending.size > 1 ? "s" : ""}` : "Photos"} to Report
            </button>
            
            <button
              onClick={handleAutoDescribe}
              disabled={selectedPending.size === 0 || isAnalyzing || isAnalyzingIndividual}
              title="Get AI group description suggestions"
              style={{
                padding: "10px 16px",
                background: selectedPending.size > 0 && !isAnalyzing ? `linear-gradient(135deg, #6366f1, #8b5cf6)` : colors.surfaceAlt,
                color: selectedPending.size > 0 && !isAnalyzing ? "#fff" : colors.textMuted,
                border: "none",
                borderRadius: "8px",
                cursor: selectedPending.size > 0 && !isAnalyzing ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              {isAnalyzing ? "⏳ Thinking..." : "✨ Group Suggestions"}
            </button>

            <button
              onClick={handleIndividualAutoDescribe}
              disabled={selectedPending.size === 0 || isAnalyzing || isAnalyzingIndividual}
              title="AI describes each photo based on its content"
              style={{
                padding: "10px 16px",
                background: selectedPending.size > 0 && !isAnalyzingIndividual ? `linear-gradient(135deg, #ec4899, #8b5cf6)` : colors.surfaceAlt,
                color: selectedPending.size > 0 && !isAnalyzingIndividual ? "#fff" : colors.textMuted,
                border: "none",
                borderRadius: "8px",
                cursor: selectedPending.size > 0 && !isAnalyzingIndividual ? "pointer" : "not-allowed",
                fontSize: "12px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                boxShadow: selectedPending.size > 0 && !isAnalyzingIndividual ? "0 4px 12px rgba(236,72,153,0.3)" : "none",
              }}
            >
              {isAnalyzingIndividual ? "⏳ Analyzing Photos..." : "✨ Auto-Describe Each"}
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Groups Display */}
      {groups.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ color: colors.text, marginBottom: "14px", fontSize: "14px", fontWeight: "700" }}>
            📷 Photo Groups ({groups.length})
          </h3>

          {groups.map((group, gIdx) => {
            const groupPhotos = getGroupPhotos(group);
            if (groupPhotos.length === 0) return null;
            const isEditing = editingGroupId === group.id;

            return (
              <div
                key={group.id}
                style={{
                  marginBottom: "16px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: colors.surface,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Group Header */}
                <div
                  style={{
                    padding: "12px 16px",
                    background: colors.surfaceAlt,
                    borderBottom: `1px solid ${colors.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "200px" }}>
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: colors.primary,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "800",
                        flexShrink: 0,
                      }}
                    >
                      {gIdx + 1}
                    </span>

                    {isEditing ? (
                      <div style={{ display: "flex", gap: "6px", flex: 1 }}>
                        <SmartTextarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveGroupDescription();
                            if (e.key === "Escape") setEditingGroupId(null);
                          }}
                          autoFocus
                          context="photo group description refinement"
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            border: `1px solid ${colors.primary}`,
                            borderRadius: "6px",
                            fontSize: "13px",
                            color: colors.text,
                            background: colors.surface,
                            fontFamily: "inherit",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={saveGroupDescription}
                          style={{
                            padding: "6px 12px",
                            background: colors.success,
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingGroupId(null)}
                          style={{
                            padding: "6px 10px",
                            background: colors.surfaceAlt,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "13px",
                            color: group.description ? colors.text : colors.textMuted,
                            fontStyle: group.description ? "normal" : "italic",
                          }}
                        >
                          {group.description || `Photo Batch ${gIdx + 1}`}
                        </div>
                        <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                          {groupPhotos.length} photo{groupPhotos.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => startEditGroup(group.id, group.description || "")}
                        style={{
                          padding: "6px 12px",
                          background: colors.primary,
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        style={{
                          padding: "6px 12px",
                          background: colors.danger,
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        🗑 Delete Group
                      </button>
                    </div>
                  )}
                </div>

                {/* Group Photos Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
                    gap: "10px",
                    padding: "14px",
                  }}
                >
                  {groupPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      style={{
                        border: `1px solid ${colors.border}`,
                        borderRadius: "6px",
                        overflow: "hidden",
                        background: colors.surface,
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "110px",
                          background: colors.surfaceAlt,
                          overflow: "hidden",
                        }}
                      >
                        {photo.preview ? (
                          <img
                            src={photo.preview}
                            alt="photo"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: colors.textMuted,
                              fontSize: "11px",
                            }}
                          >
                            Loading...
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "8px" }}>
                        {/* Individual Photo Label */}
                        <div
                          style={{
                            fontSize: "11px",
                            color: photo.label ? colors.text : colors.textMuted,
                            marginBottom: "8px",
                            lineHeight: "1.3",
                            fontStyle: photo.label ? "normal" : "italic",
                            display: "-webkit-box",
                            WebkitLineClamp: "3",
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {photo.label || "No individual label"}
                        </div>

                        {/* File Size Info */}
                        {photo.compressedSize && (
                          <div
                            style={{
                              fontSize: "9px",
                              color: photo.error ? colors.danger : colors.success,
                              marginBottom: "6px",
                              padding: "3px 5px",
                              background: "rgba(0,0,0,0.02)",
                              borderRadius: "3px",
                            }}
                          >
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

                        <button
                          onClick={() => removePhotoFromGroup(group.id, photo.id)}
                          style={{
                            width: "100%",
                            padding: "5px",
                            background: colors.danger,
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px",
                            fontWeight: "600",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ungrouped Photos — select & add description */}
      {ungroupedPhotos.length > 0 && (
        <div
          style={{
            marginBottom: "24px",
            border: `2px solid #f59e0b`,
            borderRadius: "10px",
            overflow: "hidden",
            background: colors.surface,
            boxShadow: "0 4px 15px rgba(245,158,11,0.1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ fontWeight: "700", fontSize: "14px", color: colors.text }}>
                ⚠️ Photos Without Description
              </span>
              <span style={{ color: colors.textMuted, fontSize: "12px", marginLeft: "8px" }}>
                {ungroupedPhotos.length} photo{ungroupedPhotos.length !== 1 ? "s" : ""} •{" "}
                {selectedUngrouped.size} selected
              </span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setSelectedUngrouped(new Set(ungroupedPhotos.map((p) => p.id)));
                }}
                style={{
                  padding: "5px 10px",
                  background: colors.surfaceAlt,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedUngrouped(new Set())}
                style={{
                  padding: "5px 10px",
                  background: colors.surfaceAlt,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Photos Grid with selection */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "10px",
              padding: "14px",
            }}
          >
            {ungroupedPhotos.map((photo) => {
              const isSelected = selectedUngrouped.has(photo.id);
              return (
                <div
                  key={photo.id}
                  onClick={() => toggleUngroupedSelection(photo.id)}
                  style={{
                    border: `2px solid ${isSelected ? "#f59e0b" : colors.border}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: isSelected ? "rgba(245,158,11,0.05)" : colors.surface,
                    position: "relative",
                    boxShadow: isSelected ? "0 0 0 1px rgba(245,158,11,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      left: "6px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      background: isSelected ? "#f59e0b" : "rgba(255,255,255,0.85)",
                      border: `2px solid ${isSelected ? "#f59e0b" : colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      color: "#fff",
                      zIndex: 2,
                      backdropFilter: "blur(4px)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isSelected ? "✓" : ""}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePhoto(photo.id);
                      setSelectedUngrouped((prev) => {
                        const updated = new Set(prev);
                        updated.delete(photo.id);
                        return updated;
                      });
                    }}
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.9)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>

                  <div style={{ width: "100%", height: "100px", overflow: "hidden" }}>
                    {photo.preview ? (
                      <img
                        src={photo.preview}
                        alt="ungrouped"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: isSelected ? 1 : 0.8,
                          transition: "opacity 0.2s ease",
                        }}
                      />
                    ) : (
                      <div style={{ color: colors.textMuted, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>Loading...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Description + Group button */}
          <div
            style={{
              padding: "14px 16px",
              borderTop: `1px solid ${colors.border}`,
              background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <SmartTextarea
                placeholder="Enter description for selected photos..."
                value={ungroupedDescription}
                onChange={(e) => setUngroupedDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedUngrouped.size > 0) groupUngroupedPhotos();
                }}
                context="untagged inspection photo description"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: colors.text,
                  background: colors.surface,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>
            <button
              onClick={groupUngroupedPhotos}
              disabled={selectedUngrouped.size === 0}
              style={{
                padding: "10px 18px",
                background: selectedUngrouped.size > 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : colors.surfaceAlt,
                color: selectedUngrouped.size > 0 ? "#fff" : colors.textMuted,
                border: "none",
                borderRadius: "8px",
                cursor: selectedUngrouped.size > 0 ? "pointer" : "not-allowed",
                fontSize: "13px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                boxShadow: selectedUngrouped.size > 0 ? "0 2px 8px rgba(245,158,11,0.25)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              ✓ Add Description to {selectedUngrouped.size > 0 ? `${selectedUngrouped.size} Photo${selectedUngrouped.size > 1 ? "s" : ""}` : "Photos"}
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{ marginBottom: "20px", padding: "14px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "8px", fontSize: "12px", color: colors.textMuted }}>
        <strong style={{ color: colors.text }}>💡 How it works:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "18px", lineHeight: "1.8" }}>
          <li>Upload photos — they appear in the <strong>Staging Area</strong></li>
          <li>Select photos you want to group (click to select/deselect)</li>
          <li>Add a description and click <strong>"Add Photos to Report"</strong></li>
          <li>One description can apply to one or multiple photos</li>
          <li>You can edit group descriptions anytime</li>
        </ul>
      </div>

      {/* Auto-Compression Info */}
      <div style={{ marginBottom: "20px", padding: "12px", background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: "6px", fontSize: "11px", color: colors.textMuted }}>
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
