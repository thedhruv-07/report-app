import { useState, useEffect } from "react";
import GeneralInfo from "./components/GeneralInfo";
import InspectionSummaryTable from "./components/InspectionSummaryTable";
import RemarksStep from "./components/RemarksStep";
import QuantityDetails from "./components/QuantityDetails";
import ConclusionStep from "./components/ConclusionStep";
import WorkmanshipDefects from "./components/WorkmanshipDefects";
import OnSiteTests from "./components/OnSiteTests";
import ProductSpecification from "./components/ProductSpecification";
import Packing from "./components/FinalDetails";
import MarkingLabeling from "./components/MarkingLabeling";
import ClientSpecialRequirement from "./components/ClientSpecialRequirement";
import Photos from "./components/Photos";
import FinalStep from "./components/FinalStep";
import { colors } from "./styles";
import { compressImage, formatFileSize } from "./utils/imageCompression";

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const stripLargeImageFieldsForStorage = (obj) => {
  const result = { ...obj };

  Object.keys(result).forEach((key) => {
    const value = result[key];
    if (typeof value === "string" && value.startsWith("data:image")) {
      // Keep runtime state in memory, but avoid blowing localStorage quota.
      result[key] = "";
    }
  });

  return result;
};

const sanitizeSavedPhotos = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image")
  );
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((v) => hasMeaningfulValue(v));
  if (typeof value === "object") return Object.values(value).some((v) => hasMeaningfulValue(v));
  return true;
};

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const buildQuickFillData = () => ({
  servicePerformed: "Pre-Shipment Inspection",
  client: "FRIN",
  supplier: "JUFENG",
  factory: "JUFENG",
  productName: "Nut Forming Machine & Moulds",
  po: "PO-QUICK-001",
  itemNo: "30B nut forming machine (Model: 30B-6S-40)",
  country: "India",
  inspectionDate: getTodayIsoDate(),
  inspectionLocation: "Jiangsu (CHINA)",
  referenceSample: "Yes",
  quantity: "Passed",
  workmanship: "Passed",
  onSiteTests: "Passed",
  dimensions: "Passed",
  packingResult: "Passed",
  marking_result_final: "Passed",
  client_requirement_result: "Passed",
  quantityResult: "Passed",
  quantityRemark: "Quantity verified against packing list.",
  selectedCartonsCount: "2",
  cartonNo1: "A-01",
  cartonNo2: "A-02",
  inspectionStandardWM: "ANSI/ASQ Z1.4 (ISO 2859-1)",
  samplingPlanWM: "Fixed Sample Size",
  inspectionLevelWM: "Level II",
  sampleSizeWM: "5 Sets",
  aqlCriticalWM: "Not Allowed",
  aqlMajorWM: "2.5",
  aqlMinorWM: "4.0",
  acceptedCritical: "0",
  acceptedMajor: "0",
  acceptedMinor: "0",
  totalFoundCritical: "0",
  totalFoundMajor: "0",
  totalFoundMinor: "0",
  workmanshipResult: "Passed",
  workmanshipRemark: "No critical workmanship issues observed.",
  onSiteTestResult: "Passed",
  onSiteTestRemark: "Function and safety checks passed.",
  conclusion: "PASSED",
  factoryComments: "Production and packing conditions were acceptable during inspection.",
  remarks: ["", "", "", "", "", "", "", "", ""],
  recommendationText: "Continue to maintain current quality controls for mass production.",
});

const buildQuickFillItems = () => [
  {
    po: "PO-QUICK-001",
    itemName: "30B nut forming machine (Model: 30B-6S-40)",
    orderQty: "10",
    qtyPerCarton: "1",
    cartons: "10",
    packedBreakdown: "10",
    unpackedBreakdown: "0",
    unfinishedBreakdown: "0",
    sampleSizePacked: "5",
    sampleSizeUnpacked: "0",
  },
];

function App() {
  // Load initial state from localStorage
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("inspectionStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("inspectionForm");
    const parsedForm = safeJsonParse(savedForm, {});
    const savedGeneralPhoto = localStorage.getItem("inspectionGeneralPhoto") || "";

    if (
      (!parsedForm.generalPhoto || typeof parsedForm.generalPhoto !== "string") &&
      typeof savedGeneralPhoto === "string" &&
      savedGeneralPhoto.startsWith("data:image")
    ) {
      parsedForm.generalPhoto = savedGeneralPhoto;
    }

    return parsedForm;
  });

  const [generalPhoto, setGeneralPhoto] = useState(() => {
    const saved = localStorage.getItem("inspectionGeneralPhoto") || "";
    return typeof saved === "string" && saved.startsWith("data:image") ? saved : "";
  });

  const [generalPhotoData, setGeneralPhotoData] = useState(() => {
    const saved = safeJsonParse(localStorage.getItem("inspectionGeneralPhotoData"), null);
    if (saved && typeof saved.preview === "string" && saved.preview.startsWith("data:image")) {
      return saved;
    }

    const fallback = localStorage.getItem("inspectionGeneralPhoto") || "";
    if (typeof fallback === "string" && fallback.startsWith("data:image")) {
      return {
        id: "general_fallback",
        label: "",
        fileName: "General photo",
        preview: fallback,
        originalSize: 0,
        compressedSize: 0,
      };
    }

    return null;
  });

  const [items, setItems] = useState(() => {
    const savedItems = localStorage.getItem("inspectionItems");
    return safeJsonParse(savedItems, [{ name: "", orderQty: "", availableQty: "" }]);
  });

  const [photos, setPhotos] = useState(() => {
    const savedPhotos = localStorage.getItem("inspectionPhotos");
    const parsed = safeJsonParse(savedPhotos, []);
    return sanitizeSavedPhotos(parsed);
  });

<<<<<<< HEAD
  const [photoGroups, setPhotoGroups] = useState(() => {
    const savedGroups = localStorage.getItem("inspectionPhotoGroups");
    return safeJsonParse(savedGroups, []);
  });

=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
  const [savedSuggestion, setSavedSuggestion] = useState(() =>
    safeJsonParse(localStorage.getItem("inspectionLastSubmittedTemplate"), null)
  );
  const [savedSuggestionDismissed, setSavedSuggestionDismissed] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);

  // Responsiveness Support
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Save to localStorage whenever step, form, or items change
  useEffect(() => {
    localStorage.setItem("inspectionStep", step.toString());
  }, [step]);

  useEffect(() => {
    try {
      localStorage.setItem("inspectionForm", JSON.stringify(form));
    } catch {
      try {
        const trimmed = stripLargeImageFieldsForStorage(form);
        localStorage.setItem("inspectionForm", JSON.stringify(trimmed));
      } catch {
        // Keep form in runtime state even if persistence fails.
      }
    }
  }, [form]);

  useEffect(() => {
    try {
      if (typeof form.generalPhoto === "string" && form.generalPhoto.startsWith("data:image")) {
        localStorage.setItem("inspectionGeneralPhoto", form.generalPhoto);
      }
    } catch {
      // Ignore storage failures; runtime state still keeps the image.
    }
  }, [form.generalPhoto]);

  useEffect(() => {
    try {
      if (typeof generalPhoto === "string" && generalPhoto.startsWith("data:image")) {
        localStorage.setItem("inspectionGeneralPhoto", generalPhoto);
      }
    } catch {
      // Keep runtime state even if persistence fails.
    }
  }, [generalPhoto]);

  useEffect(() => {
    try {
      if (generalPhotoData && typeof generalPhotoData.preview === "string" && generalPhotoData.preview.startsWith("data:image")) {
        localStorage.setItem("inspectionGeneralPhotoData", JSON.stringify(generalPhotoData));
      }
    } catch {
      // Keep runtime state even if persistence fails.
    }
  }, [generalPhotoData]);

  useEffect(() => {
    localStorage.setItem("inspectionItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("inspectionPhotos", JSON.stringify(photos));
  }, [photos]);

<<<<<<< HEAD
  useEffect(() => {
    localStorage.setItem("inspectionPhotoGroups", JSON.stringify(photoGroups));
  }, [photoGroups]);

=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
  // Add global styles
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      * {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      body {
        margin: 0;
        padding: 0;
        background: ${colors.background};
      }

      input[type="text"],
      input[type="date"],
      input[type="email"],
      textarea {
        transition: all 0.3s ease;
      }

      input[type="text"]:focus,
      input[type="date"]:focus,
      input[type="email"]:focus,
      textarea:focus {
        border-color: ${colors.borderFocus} !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }

      button {
        transition: all 0.3s ease;
      }

      button:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      button:active:not(:disabled) {
        transform: translateY(0);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      table {
        font-size: 14px;
      }

      table td, table th {
        transition: all 0.2s ease;
      }

      input[type="radio"],
      input[type="checkbox"] {
        cursor: pointer;
        accent-color: ${colors.primary};
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const handleChange = (e) => {
    console.log("handleChange fired:", e.target.name, "=", e.target.value);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGeneralPhotoChange = (photo) => {
    const preview =
      typeof photo === "string"
        ? photo
        : photo && typeof photo.preview === "string"
        ? photo.preview
        : "";

    setGeneralPhoto(preview || "");
    setGeneralPhotoData(
      photo && typeof photo === "object"
        ? photo
        : preview
        ? {
            id: "general_runtime",
            label: "",
            fileName: "General photo",
            preview,
            originalSize: 0,
            compressedSize: 0,
          }
        : null
    );
    setForm((prev) => ({ ...prev, generalPhoto: preview || "" }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", orderQty: "", availableQty: "" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePhotoLabelChange = (id, label) => {
    const newPhotos = photos.map(p => p.id === id ? { ...p, label } : p);
    setPhotos(newPhotos);
  };

<<<<<<< HEAD
  const handlePhotoGroupsChange = (updatedGroups) => {
    setPhotoGroups(Array.isArray(updatedGroups) ? updatedGroups : []);
  };

=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
  const handleClientRequirementsChange = (requirements) => {
    setForm((prev) => ({
      ...prev,
      clientRequirements: Array.isArray(requirements) ? requirements : [],
    }));
  };

  const handleWorkmanshipDefectsChange = (defects) => {
    setForm((prev) => ({
      ...prev,
      workmanshipDefects: Array.isArray(defects) ? defects : [],
    }));
  };

  const handleWorkmanshipPhotosChange = (photos) => {
    setForm((prev) => ({
      ...prev,
      workmanshipPhotos: Array.isArray(photos) ? photos : [],
    }));
  };

<<<<<<< HEAD
  const handlePhotoFileChange = (files, description = "") => {
    // Generate group entry for the batch
    const groupId = `group_${Date.now()}_${Math.random()}`;
    const photoIds = [];

    // Process each file with compression (non-blocking)
    const fileArray = Array.from(files);
    fileArray.forEach((file, index) => {
      // Generate truly unique ID for each file
      const uniqueId = `${Date.now()}_${Math.random()}_${index}`;
      photoIds.push(uniqueId);
=======
  const handlePhotoFileChange = (files) => {
    // Process each file with compression (non-blocking)
    Array.from(files).forEach((file, index) => {
      // Generate truly unique ID for each file
      const uniqueId = `${Date.now()}_${Math.random()}_${index}`;
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
      
      compressImage(file).then(({ file: compressedFile, preview, originalSize, compressedSize }) => {
        console.log(
          `Image compressed: ${file.name}`,
          `Original: ${formatFileSize(originalSize)}, Compressed: ${formatFileSize(compressedSize)}`
        );
        
        // Add compressed photo to state
        setPhotos(prevPhotos => [
          ...prevPhotos,
          { 
            id: uniqueId, 
<<<<<<< HEAD
            label: description, 
=======
            label: "", 
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
            file: compressedFile, 
            preview: preview,
            originalSize: originalSize,
            compressedSize: compressedSize
          }
        ]);
      }).catch(error => {
        console.error(`Failed to compress image: ${file.name}`, error);
        // Fallback: add uncompressed
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prevPhotos => [
            ...prevPhotos,
            { 
              id: uniqueId, 
<<<<<<< HEAD
              label: description, 
=======
              label: "", 
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
              file: file, 
              preview: reader.result,
              originalSize: file.size,
              compressedSize: file.size,
              error: true
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    });
<<<<<<< HEAD

    // Create the group entry
    setPhotoGroups(prevGroups => [
      ...prevGroups,
      {
        id: groupId,
        description: description,
        photoIds: photoIds,
      }
    ]);
=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
  };

  const removePhoto = (id) => {
    const newPhotos = photos.filter(p => p.id !== id);
    setPhotos(newPhotos);
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("inspectionStep");
      localStorage.removeItem("inspectionForm");
      localStorage.removeItem("inspectionItems");
      localStorage.removeItem("inspectionPhotos");
<<<<<<< HEAD
      localStorage.removeItem("inspectionPhotoGroups");
=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
      localStorage.removeItem("inspectionGeneralPhoto");
      localStorage.removeItem("inspectionGeneralPhotoData");
      setStep(1);
      setForm({});
      setGeneralPhoto("");
      setGeneralPhotoData(null);
      setItems([{ name: "", orderQty: "", availableQty: "" }]);
      setPhotos([]);
<<<<<<< HEAD
      setPhotoGroups([]);
=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
      setSavedSuggestionDismissed(false);
      setReportDownloaded(false);
    }
  };

  const clearFormAfterDownload = () => {
    if (!window.confirm("Start a new report? This will clear all current sections.")) return;

    localStorage.removeItem("inspectionStep");
    localStorage.removeItem("inspectionForm");
    localStorage.removeItem("inspectionItems");
    localStorage.removeItem("inspectionPhotos");
<<<<<<< HEAD
    localStorage.removeItem("inspectionPhotoGroups");
=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
    localStorage.removeItem("inspectionGeneralPhoto");
    localStorage.removeItem("inspectionGeneralPhotoData");

    setStep(1);
    setForm({});
    setGeneralPhoto("");
    setGeneralPhotoData(null);
    setItems([{ name: "", orderQty: "", availableQty: "" }]);
    setPhotos([]);
<<<<<<< HEAD
    setPhotoGroups([]);
=======
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
    setSavedSuggestionDismissed(false);
    setReportDownloaded(false);
  };

  const quickFillForm = () => {
    const shouldProceed = window.confirm(
      "Apply quick-fill template data? This will overwrite current text fields but keep uploaded photos."
    );
    if (!shouldProceed) return;

    const quickData = buildQuickFillData();
    setForm((prev) => ({
      ...prev,
      ...quickData,
    }));
    setItems(buildQuickFillItems());
  };

  const applySavedSuggestion = () => {
    if (!savedSuggestion || typeof savedSuggestion !== "object") return;

    const templateForm = savedSuggestion.form && typeof savedSuggestion.form === "object"
      ? savedSuggestion.form
      : {};
    const templateItems = Array.isArray(savedSuggestion.items)
      ? savedSuggestion.items
      : [{ name: "", orderQty: "", availableQty: "" }];

    setForm((prev) => ({ ...prev, ...templateForm }));
    setItems(templateItems);
    setSavedSuggestionDismissed(true);
  };

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const submit = async () => {
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      const value = form[key];

      if (key === "images" && value) {
        for (let i = 0; i < value.length; i++) {
          formData.append("images", value[i]);
        }
        return;
      }

      if (value === undefined || value === null) {
        formData.append(key, "");
        return;
      }

      if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      formData.append(key, value);
    });

    const generalPreview =
      generalPhotoData && typeof generalPhotoData.preview === "string"
        ? generalPhotoData.preview
        : generalPhoto;

    if (typeof generalPreview === "string" && generalPreview.startsWith("data:image")) {
      formData.set("generalPhoto", generalPreview);
    }

    // Add items as JSON
    formData.append("items", JSON.stringify(items));

    // Include Step 12 photos (preview + label) for report rendering.
<<<<<<< HEAD
    // Build grouped photo data: photos are organized by their group descriptions
    const validPhotos = photos
      .filter((p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image"));

    // Build report photos with group descriptions
    const groupedIds = new Set();
    const reportPhotoGroups = (photoGroups || []).map((group) => {
      const groupPhotos = group.photoIds
        .map((pid) => validPhotos.find((p) => String(p.id) === String(pid)))
        .filter(Boolean)
        .map((p) => {
          groupedIds.add(String(p.id));
          return { id: String(p.id), preview: p.preview };
        });
      return {
        description: group.description || "",
        photos: groupPhotos,
      };
    }).filter((g) => g.photos.length > 0);

    // Any ungrouped photos go into a default group
    const ungrouped = validPhotos.filter((p) => !groupedIds.has(String(p.id)));
    if (ungrouped.length > 0) {
      reportPhotoGroups.push({
        description: "",
        photos: ungrouped.map((p) => ({ id: String(p.id), preview: p.preview })),
      });
    }

    // Also send flat reportPhotos for backward-compat with existing getPhotoGridParagraphs
    const reportPhotos = validPhotos.map((p) => {
      // Find group description for this photo
      const group = (photoGroups || []).find((g) => g.photoIds.includes(p.id));
      return {
        id: String(p.id || ""),
        label: group ? (group.description || "") : (p.label || ""),
        preview: p.preview,
      };
    });
    formData.append("reportPhotos", JSON.stringify(reportPhotos));
    formData.append("reportPhotoGroups", JSON.stringify(reportPhotoGroups));
=======
    const reportPhotos = photos
      .filter((p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image"))
      .map((p) => ({
        id: String(p.id || ""),
        label: p.label || "",
        preview: p.preview,
      }));
    formData.append("reportPhotos", JSON.stringify(reportPhotos));
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42

    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = `Report generation failed (${res.status})`;
      try {
        const errJson = await res.json();
        errorMessage = errJson?.detail ? `${errorMessage}: ${errJson.detail}` : errorMessage;
      } catch {
        try {
          const errText = await res.text();
          if (errText) errorMessage = `${errorMessage}: ${errText}`;
        } catch {
          // Keep existing message when response body cannot be parsed.
        }
      }
      alert(errorMessage);
      return;
    }

    const lastTemplate = {
      savedAt: new Date().toISOString(),
      form: stripLargeImageFieldsForStorage(form),
      items,
    };
    localStorage.setItem("inspectionLastSubmittedTemplate", JSON.stringify(lastTemplate));
    setSavedSuggestion(lastTemplate);
    setSavedSuggestionDismissed(true);
    setReportDownloaded(true);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `report-${stamp}.docx`;
    a.click();
  };

  const stepNavItems = [
    { id: 1, label: "General Information" },
    { id: 2, label: "Inspection Summary" },
    { id: 3, label: "Remarks" },
    { id: 4, label: "Conclusion" },
    { id: 5, label: "Quantity" },
    { id: 6, label: "Workmanship" },
    { id: 7, label: "On-Site Tests" },
    { id: 8, label: "Product Spec" },
    { id: 9, label: "Packing" },
    { id: 10, label: "Marking & Labeling" },
    { id: 11, label: "Client Requirement" },
    { id: 12, label: "Photos" },
    { id: 13, label: "Submit" },
  ];

  const goToStep = (targetStep) => {
    if (targetStep < 1 || targetStep > 13) return;
    setStep(targetStep);
    setMobileSidebarOpen(false);
  };

  return (
    <div style={{ 
      display: "flex",
      height: "100vh",
      width: "100%",
      overflow: "hidden",
      background: "#f8fafc",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      boxSizing: "border-box",
      position: "relative"
    }}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 998,
            backdropFilter: "blur(2px)"
          }}
        />
      )}

      {/* Sidebar - Fixed on Desktop, Drawer on Mobile */}
      <div style={{
        width: "260px",
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxShadow: isMobile ? "10px 0 30px rgba(0,0,0,0.1)" : "4px 0 15px rgba(0,0,0,0.03)",
        zIndex: 999,
        position: isMobile ? "fixed" : "static",
        transform: isMobile && !mobileSidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        left: 0,
        top: 0
      }}>
        <div style={{ 
          padding: "24px", 
          borderBottom: `1px solid ${colors.border}`, 
          background: colors.headerBg,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: colors.primary, letterSpacing: "-0.02em" }}>
              VERITAS REPORT
            </div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: colors.textMuted, marginTop: "4px", textTransform: "uppercase" }}>
              Inspection Portal v2.0
            </div>
          </div>
          {isMobile && (
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              style={{ background: "transparent", border: "none", fontSize: "20px", color: colors.text, cursor: "pointer" }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, marginBottom: "8px", paddingLeft: "8px", textTransform: "uppercase" }}>
            Jump To Step
          </div>
          {stepNavItems.map((item) => {
            const isActive = step === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goToStep(item.id)}
                style={{
                  border: "none",
                  background: isActive ? colors.primaryLight : "transparent",
                  color: isActive ? colors.primary : colors.text,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <span style={{ 
                  width: "24px", 
                  height: "24px", 
                  borderRadius: "6px", 
                  background: isActive ? colors.primary : colors.surfaceAlt, 
                  color: isActive ? "#fff" : colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "bold"
                }}>{item.id}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div style={{
        flex: 1,
        height: "100%",
        overflowY: "auto",
        background: "#f8fafc",
        padding: isMobile ? "16px" : "40px",
        scrollBehavior: "smooth"
      }}>
        {/* Mobile Header with Hamburger */}
        {isMobile && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: "20px",
            background: colors.surface,
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`
          }}>
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: colors.primary
              }}
            >
              ☰
            </button>
            <div style={{ fontWeight: "800", color: colors.header, fontSize: "14px" }}>
              VERITAS PORTAL
            </div>
            <div style={{ width: "24px" }}></div> {/* Spacer */}
          </div>
        )}

        <div style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: colors.surface,
          padding: isMobile ? "20px" : "40px",
          borderRadius: isMobile ? "12px" : "16px",
          boxShadow: "0 4px 25px rgba(0,0,0,0.05)",
          border: `1px solid ${colors.border}`,
          minHeight: "fit-content"
        }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? "20px" : "40px" }}>
          <h1 style={{ 
            fontSize: isMobile ? "20px" : "clamp(24px, 2.4vw, 30px)", 
            fontWeight: "800", 
            color: colors.header,
            margin: "0 0 10px 0"
          }}>
            Pre-Shipment Inspection Report
          </h1>
          <p style={{ 
            fontSize: "13px", 
            color: colors.textMuted,
            margin: "0"
          }}>
            Step {step} of 13
          </p>
          <div style={{
            display: "flex",
            height: "4px",
            background: colors.border,
            borderRadius: "2px",
            marginTop: "12px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${(step / 13) * 100}%`,
              background: colors.primary,
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* Clear Form Button */}
        <div style={{ 
          display: "flex", 
          justifyContent: isMobile ? "center" : "flex-end", 
          gap: "10px", 
          marginBottom: isMobile ? "20px" : "30px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={quickFillForm}
            style={{
              padding: isMobile ? "8px 14px" : "10px 18px",
              background: colors.success,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: isMobile ? "11px" : "13px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)"
            }}
          >
            ⚡ Quick Fill Template
          </button>
          <button
            onClick={clearForm}
            style={{
              padding: isMobile ? "8px 14px" : "10px 18px",
              background: colors.danger,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: isMobile ? "11px" : "13px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)"
            }}
          >
            ⟲ Clear Form & Restart
          </button>
        </div>

        {!savedSuggestionDismissed && savedSuggestion && step === 1 && !hasMeaningfulValue(form) && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              background: colors.surfaceAlt,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: "12px", color: colors.text }}>
              Apply previous report from {new Date(savedSuggestion.savedAt).toLocaleDateString()}?
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={applySavedSuggestion} style={{ border: "none", borderRadius: "8px", padding: "6px 10px", background: colors.primary, color: "#fff", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Apply</button>
              <button onClick={() => setSavedSuggestionDismissed(true)} style={{ border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "6px 10px", background: colors.surface, color: colors.text, cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>Dismiss</button>
            </div>
          </div>
        )}

        {step === 1 && <GeneralInfo form={form} handleChange={handleChange} onNext={next} generalPhoto={generalPhoto} generalPhotoData={generalPhotoData} onGeneralPhotoChange={handleGeneralPhotoChange} />}
        {step === 2 && <InspectionSummaryTable form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 3 && <RemarksStep form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 4 && <ConclusionStep form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 5 && <QuantityDetails items={items} onItemChange={handleItemChange} onAddItem={addItem} onRemoveItem={removeItem} form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 6 && <WorkmanshipDefects form={form} handleChange={handleChange} onPrev={prev} onNext={next} onWorkmanshipDefectsChange={handleWorkmanshipDefectsChange} onWorkmanshipPhotosChange={handleWorkmanshipPhotosChange} items={items} />}
        {step === 7 && <OnSiteTests form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 8 && <ProductSpecification form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 9 && <Packing form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 10 && <MarkingLabeling form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
        {step === 11 && <ClientSpecialRequirement form={form} handleChange={handleChange} onPrev={prev} onNext={next} onRequirementsChange={handleClientRequirementsChange} />}
<<<<<<< HEAD
        {step === 12 && <Photos photos={photos} photoGroups={photoGroups} onPhotoGroupsChange={handlePhotoGroupsChange} onPhotoFileChange={handlePhotoFileChange} onRemovePhoto={removePhoto} onPrev={prev} onNext={next} />}
=======
        {step === 12 && <Photos photos={photos} onPhotoLabelChange={handlePhotoLabelChange} onPhotoFileChange={handlePhotoFileChange} onRemovePhoto={removePhoto} onPrev={prev} onNext={next} />}
>>>>>>> 8cfa71b6e153655bb4d3668bfe0d78484eb9fd42
        {step === 13 && <FinalStep onPrev={prev} onSubmit={submit} onClearAfterDownload={clearFormAfterDownload} hasDownloaded={reportDownloaded} />}
        
        </div>
      </div>
    </div>
  );
}

export default App;