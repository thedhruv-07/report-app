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
import { ENDPOINTS } from "./config/api";
import { colors } from "./styles";
import { compressImage, formatFileSize } from "./utils/imageCompression";

// --- BACKEND KEEP-ALIVE ---
function useBackendKeepAlive() {
  useEffect(() => {
    // Initial warmup ping
    const ping = () => {
      fetch(ENDPOINTS.HEALTH).catch(() => {});
    };
    
    ping();
    
    // Ping every 14 minutes (Render sleeps after 15)
    // Using 14 to be safe
    const interval = setInterval(ping, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

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
  useBackendKeepAlive();

  // Load initial state from localStorage
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("inspectionStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const [photoGroups, setPhotoGroups] = useState(() => {
    const savedGroups = localStorage.getItem("inspectionPhotoGroups");
    return safeJsonParse(savedGroups, []);
  });

  const [savedSuggestion, setSavedSuggestion] = useState(() =>
    safeJsonParse(localStorage.getItem("inspectionLastSubmittedTemplate"), null)
  );
  const [savedSuggestionDismissed, setSavedSuggestionDismissed] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ─── AUTH STATE ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => safeJsonParse(localStorage.getItem("reportUser"), null));
  const [token, setToken] = useState(() => localStorage.getItem("reportToken") || "");
  const [authPage, setAuthPage] = useState("login"); // login | signup | forgot | reset

  // Check for reset token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === "reset-password") {
      setAuthPage("reset");
    }
  }, []);

  const handleAuthSuccess = (user, token) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("reportUser", JSON.stringify(user));
    localStorage.setItem("reportToken", token);
    // Remove reset token from URL if present
    const url = new URL(window.location);
    url.searchParams.delete("page");
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("reportUser");
    localStorage.removeItem("reportToken");
    setAuthPage("login");
    setShowLogoutModal(false);
  };
  // ────────────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    localStorage.setItem("inspectionPhotoGroups", JSON.stringify(photoGroups));
  }, [photoGroups]);

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

  const handlePhotoGroupsChange = (updatedGroups) => {
    setPhotoGroups(Array.isArray(updatedGroups) ? updatedGroups : []);
  };

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

  const handlePhotoFileChange = async (files, description = "") => {
    // Generate group entry for the batch
    const groupId = `group_${Date.now()}_${Math.random()}`;
    const photoIds = [];
    const itemsArray = Array.from(files).filter(item => item !== null && item !== undefined);

    // Sequential processing to avoid browser lag with large batches
    for (let index = 0; index < itemsArray.length; index++) {
      const item = itemsArray[index];
      
      // If it's already a processed object (restored from localStorage)
      if (item && item.preview && !item.file) {
        setPhotos(prevPhotos => [
          ...prevPhotos,
          {
            id: item.id,
            label: item.label || description,
            file: null,
            preview: item.preview,
            originalSize: item.size || 0,
            compressedSize: item.size || 0
          }
        ]);
        photoIds.push(item.id);
        continue;
      }

      // Otherwise extract the File object (it might be nested if coming from Staging Area)
      const file = item.file || item;
      const uniqueId = item.id || `${Date.now()}_${Math.random()}_${index}`;
      photoIds.push(uniqueId);
      
      try {
        const result = await compressImage(file);
        setPhotos(prevPhotos => [
          ...prevPhotos,
          { 
            id: uniqueId, 
            label: item.label || description, 
            file: result.file, 
            preview: result.preview,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize
          }
        ]);
      } catch (error) {
        console.error(`Failed to compress image: ${file.name}`, error);
        // Fallback: Read as data URL without compression if compression fails
        const reader = new FileReader();
        const fallbackPromise = new Promise((resolve) => {
          reader.onloadend = () => {
            setPhotos(prevPhotos => [
              ...prevPhotos,
              { 
                id: uniqueId, 
                label: item.label || description, 
                file: file, 
                preview: reader.result,
                originalSize: file.size,
                compressedSize: file.size,
                error: true
              }
            ]);
            resolve();
          };
          reader.readAsDataURL(file);
        });
        await fallbackPromise;
      }
    }

    // Create the group entry
    setPhotoGroups(prevGroups => [
      ...prevGroups,
      {
        id: groupId,
        description: description,
        photoIds: photoIds,
      }
    ]);
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
      localStorage.removeItem("inspectionPhotoGroups");
      localStorage.removeItem("inspectionGeneralPhoto");
      localStorage.removeItem("inspectionGeneralPhotoData");
      setStep(1);
      setForm({});
      setGeneralPhoto("");
      setGeneralPhotoData(null);
      setItems([{ name: "", orderQty: "", availableQty: "" }]);
      setPhotos([]);
      setPhotoGroups([]);
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
    localStorage.removeItem("inspectionPhotoGroups");
    localStorage.removeItem("inspectionGeneralPhoto");
    localStorage.removeItem("inspectionGeneralPhotoData");

    setStep(1);
    setForm({});
    setGeneralPhoto("");
    setGeneralPhotoData(null);
    setItems([{ name: "", orderQty: "", availableQty: "" }]);
    setPhotos([]);
    setPhotoGroups([]);
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
    setIsGenerating(true);
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
          return { id: String(p.id), preview: p.preview, label: p.label || "" };
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
        photos: ungrouped.map((p) => ({ id: String(p.id), preview: p.preview, label: p.label || "" })),
      });
    }

    // Also send flat reportPhotos for backward-compat with existing getPhotoGridParagraphs
    const reportPhotos = validPhotos.map((p) => {
      const group = (photoGroups || []).find((g) => g.photoIds.includes(p.id));
      return {
        id: String(p.id || ""),
        label: p.label || (group ? (group.description || "") : ""),
        preview: p.preview,
      };
    });
    formData.append("reportPhotos", JSON.stringify(reportPhotos));
    formData.append("reportPhotoGroups", JSON.stringify(reportPhotoGroups));

    const res = await fetch(ENDPOINTS.GENERATE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
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
      setIsGenerating(false);
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
    setIsGenerating(false);
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

  if (!user) {
    if (authPage === "signup") return <Signup onSignup={handleAuthSuccess} onSwitch={() => setAuthPage("login")} />;
    if (authPage === "forgot") return <ForgotPassword onBack={() => setAuthPage("login")} />;
    if (authPage === "reset") return <ResetPassword onReset={handleAuthSuccess} />;
    return <Login onLogin={handleAuthSuccess} onSwitch={() => setAuthPage("signup")} onForgot={() => setAuthPage("forgot")} />;
  }

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100%",
      overflow: "hidden",
      background: "#f8fafc",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      boxSizing: "border-box",
      position: "relative"
    }}>
      {/* Top Navigation Header */}
      <div style={{
        width: "100%",
        background: colors.headerBg,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "stretch",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        zIndex: 999,
        flexShrink: 0
      }}>
        {/* Brand Area */}
          <div style={{ 
            padding: "16px 24px", 
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRight: isMobile ? "none" : `1px solid ${colors.border}`,
            borderBottom: isMobile ? `1px solid ${colors.border}` : "none",
            minWidth: "max-content",
            background: colors.headerBg
          }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: colors.primary, letterSpacing: "-0.02em" }}>
                VERITAS REPORT
              </div>
              <div style={{ fontSize: "11px", fontWeight: "600", color: colors.textMuted, marginTop: "4px", textTransform: "uppercase" }}>
                Inspection Portal v2.0
              </div>
            </div>
            {user && isMobile && (
              <button onClick={handleLogout} style={{ border: `1px solid ${colors.danger}`, color: colors.danger, background: "transparent", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", fontWeight: "600" }}>
                Logout
              </button>
            )}
          </div>

        {/* Horizontal Navigation Area */}
        <div style={{ 
          flex: 1, 
          overflowX: "auto", 
          padding: "16px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          scrollbarWidth: "none", 
          background: colors.surface
        }}
        >
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
                  borderRadius: "8px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: isActive ? "700" : "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ 
                  width: "20px", 
                  height: "20px", 
                  borderRadius: "5px", 
                  background: isActive ? colors.primary : colors.surfaceAlt, 
                  color: isActive ? "#fff" : colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold"
                }}>{item.id}</span>
                {item.label}
              </button>
            );
          })}
        </div>

        {user && !isMobile && (
          <div style={{ padding: "0 24px", display: "flex", alignItems: "center", gap: "12px", borderLeft: `1px solid ${colors.border}` }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: colors.text }}>{user.name}</div>
              <div style={{ fontSize: "11px", color: colors.textMuted }}>{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 14px",
                border: `1px solid ${colors.danger}`,
                borderRadius: "8px",
                background: "transparent",
                color: colors.danger,
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area - Scrollable */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        background: colors.surface,
        scrollBehavior: "smooth"
      }}>

        <div style={{
          width: "100%",
          margin: "0",
          background: colors.surface,
          padding: isMobile ? "20px 16px" : "40px",
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
        {step === 12 && <Photos photos={photos} photoGroups={photoGroups} onPhotoGroupsChange={handlePhotoGroupsChange} onPhotoFileChange={handlePhotoFileChange} onRemovePhoto={removePhoto} onPrev={prev} onNext={next} />}
        {step === 13 && <FinalStep onPrev={prev} onSubmit={submit} onClearAfterDownload={clearFormAfterDownload} hasDownloaded={reportDownloaded} isGenerating={isGenerating} />}
        
        </div>
      </div>

      {/* Premium Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            width: "90%",
            maxWidth: "400px",
            background: colors.surface,
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            border: `1px solid ${colors.border}`,
            textAlign: "center"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: colors.danger,
              fontSize: "24px"
            }}>
              🚪
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: colors.header, marginBottom: "12px" }}>
              Confirm Logout
            </h3>
            <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "32px", lineHeight: "1.5" }}>
              Are you sure you want to log out? Your current session and unsaved changes will be lost.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surfaceAlt,
                  color: colors.text,
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: colors.danger,
                  color: "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  transition: "all 0.2s"
                }}
              >
                Logout
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default App;