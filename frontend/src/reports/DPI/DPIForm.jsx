import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { dpiSchema } from "../../shared/dpiSchema";
import ReportLoader from '../../components/shared/ReportLoader';

import { 
  GeneralInfo, 
  InspectionSummary, 
  Remarks, 
  Conclusion, 
  QuantityDetails, 
  Workmanship, 
  OnSiteTests, 
  Dimensions, 
  Packing, 
  Marking, 
  ProductionLine, 
  ClientRequirement, 
  ProductionSchedule, 
  Photos, 
  FinalStep 
} from './components';

import { compressImage, formatFileSize } from "../../utils/imageCompression";

const safeJsonParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export default function DuringProductionInspection() {
  const { token } = useAuth();
  const location = useLocation();
  const taskId = location.state?.task?._id ?? null;

  const [step, setStep] = useState(() => {
    const saved = localStorage.getItem("dpiStep");
    return saved ? parseInt(saved) : 1;
  });

  const [form, setForm] = useState(() => {
    return safeJsonParse(localStorage.getItem("dpiForm"), {});
  });

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  // Persist state
  useEffect(() => { localStorage.setItem("dpiStep", step.toString()); }, [step]);
  useEffect(() => {
    try { localStorage.setItem("dpiForm", JSON.stringify(form)); } catch { return; }
  }, [form]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("dpiForm", JSON.stringify(form));
      localStorage.setItem("dpiStep", step.toString());
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch { alert("Failed to save draft locally."); }
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("dpiStep");
      localStorage.removeItem("dpiForm");
      setStep(1);
      setForm({});
    }
  };

  const clearFormAfterDownload = () => {
    localStorage.removeItem("dpiStep");
    localStorage.removeItem("dpiForm");
    setStep(1);
    setForm({});
    setReportDownloaded(false);
  };

  const fillDemoData = () => {
    const demoPhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    const demoData = {
      // General Info
      servicePerformed: "During Production Inspection",
      client: "Global Sourcing Ltd.",
      supplier: "Quality Manufacturing Co.",
      factory: "Shenzhen Industrial Park",
      productName: "Ergonomic Office Chair Model X1",
      po: "PO-2024-001",
      itemNo: "CH-001, CH-002",
      destinationCountry: "Germany",
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionLocation: "Factory Floor A",
      referenceSample: "Provided by Client",
      generalPhoto: demoPhoto,
      generalPhotoMeta: { fileName: "demo_product.png", originalSize: 1024, compressedSize: 512 },

      // Inspection Summary
      summaryQuantity: "Passed",
      summaryWorkmanship: "Passed",
      summaryOnSiteTests: "Passed",
      summaryDimensions: "Passed",
      summaryPacking: "Passed",
      summaryMarkingLabeling: "Passed",
      summaryProductConformity: "Passed",
      summaryClientRequirement: "Passed",
      summaryProductionSchedule: "Production is on schedule. 80% completed.",

      // Workmanship Summary
      wmOrderQuantity: "1000 Sets",
      wmAvailableQuantity: "800 Sets",
      wmSampleSize: "80 Sets",
      wmResult: "Passed",

      // Conclusion
      conclusion: "PASSED",
      inspectorName: "John Doe",
      reportReviewer: "Alice Smith",

      // Tables
      quantityTable: [
        { po: "PO-2024-001", item: "CH-001", orderQty: "500", qtyPerCarton: "1", cartons: "500", packed: "400", unpacked: "100", unfinished: "0", sampleSizePacked: "40", sampleSizeUnpacked: "10" }
      ],
      workmanshipDefectTable: [
        { itemName: "PD-6225-1", sampleSize: "80", description: "Scratches - minor", critical: "0", major: "0", minor: "2" },
        { itemName: "PD-6225-1", sampleSize: "80", description: "Local shine", critical: "0", major: "0", minor: "1" }
      ],
      onSiteTestsTable: [
        { srNo: "1", description: "Function Test", method: "Load 100kg", sampleSize: "5", resultReading: "All Passed" }
      ],
      dimensionsTable: [
        { parameter: "Seat Height", clientSpec: "45-55cm", refSample: "50cm", sample1: "50.5cm", sample2: "49.8cm", sample3: "50.2cm" }
      ],
      // Backwards-compatible alias for new product specification naming
      productSpecificationTable: [
        { parameter: "Seat Height", clientSpec: "45-55cm", refSample: "50cm", sample1: "50.5cm", sample2: "49.8cm", sample3: "50.2cm" }
      ],
      packingTable: [
        { itemNo: "CH-001", qtyPerCartonMarking: "1", qtyPerCartonActual: "1", cartonSizeMarking: "60x60x40", cartonSizeActual: "60x60x40", grossWeightMarking: "15kg", grossWeightActual: "15.2kg" }
      ],
      markingTable: [
        { name: "Shipping Mark", location: "Two Sides", result: "Correct" }
      ],
      productionLineTable: [
        { process: "Welding", samplingSize: "32", styleColor: "Black", problems: "None", number: "32" }
      ],
      clientRequirementTable: [
        { requirement: "Special Logo Tag", result: "Verified" }
      ],

      // Production Schedule
      psLinesAvailable: "4",
      psWorkersPerLine: "15",
      psOutputRatePerLine: "50",
      psMaxOutputPerDay: "200",
      psEstimatedPSIDate: "2024-06-15",

      // Photos
      defectPhotos: [
        { id: Date.now(), preview: demoPhoto, label: "Minor scratch example" }
      ],
      productionLinePhotos: [
        { id: Date.now() + 1, preview: demoPhoto, label: "Assembly line overview" }
      ],
      remarkPhotos: [
        { id: Date.now() + 2, preview: demoPhoto, label: "Reference sample comparison" }
      ]
    };

    setForm(demoData);
    alert("Demo data filled successfully!");
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleGeneralPhotoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsPhotoProcessing(true);
    try {
      const { file: compressedFile, preview, originalSize, compressedSize } = await compressImage(file);
      setForm(prev => ({
        ...prev,
        generalPhoto: preview,
        generalPhotoMeta: { fileName: compressedFile.name, originalSize, compressedSize }
      }));
    } catch (error) {
      console.error("Photo upload failed:", error);
    } finally {
      setIsPhotoProcessing(false);
      e.target.value = "";
    }
  };

  const clearGeneralPhoto = () => {
    setForm(prev => ({ ...prev, generalPhoto: null, generalPhotoMeta: null }));
  };

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);


  const submit = async (format = 'docx', notify = false) => {
    setIsGenerating(true);
    const formData = new FormData();
    formData.append("serviceType", "dpi");
    formData.append("format", format);

    Object.keys(form).forEach((key) => {
      const value = form[key];
      if (key === "inspectorSignature" && value) {
        formData.append("conclusionPhotos", JSON.stringify([{ id: Date.now().toString() + "_insp", preview: value, label: "Inspector Signature" }]));
        return;
      }
      if (key === "reviewerSignature" && value) {
        formData.append("conclusionReviewerPhotos", JSON.stringify([{ id: Date.now().toString() + "_rev", preview: value, label: "Reviewer Signature" }]));
        return;
      }
      if (value === undefined || value === null) { formData.append(key, ""); return; }
      if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        formData.append(key, JSON.stringify(value)); return;
      }
      formData.append(key, value);
    });

    // Handle Photos
    const reportPhotoGroups = (dpiSchema.photos.groups || []).map(group => {
      const gPhotos = (form[group.id] || [])
        .filter(p => p.preview && p.preview.startsWith("data:image"))
        .map(p => ({ id: String(p.id), preview: p.preview, label: p.label || "" }));
      return { description: group.label, photos: gPhotos };
    }).filter(g => g.photos.length > 0);
    formData.append("reportPhotoGroups", JSON.stringify(reportPhotoGroups));

    if (form.quantityTable) formData.append("items", JSON.stringify(form.quantityTable));
    if (taskId) formData.append("taskId", taskId);

    try {
      const generateUrl = notify ? `${ENDPOINTS.GENERATE}?notify=true` : ENDPOINTS.GENERATE;
      const res = await fetch(generateUrl, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DPI-Report-${new Date().toISOString().slice(0,10)}.${format}`;
      a.click();
      setReportDownloaded(true);
    } catch (error) {
      alert("Failed to generate report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formWithSchema = useMemo(() => ({ ...form, schema: dpiSchema }), [form]);

  // ─── STEP DEFINITIONS ─────────────────────────────────────────────────────
  const steps = [
    { id: 1, label: "General Info", component: (
      <GeneralInfo 
        form={formWithSchema} 
        handleChange={handleChange} 
        handleGeneralPhotoUpload={handleGeneralPhotoUpload}
        clearGeneralPhoto={clearGeneralPhoto}
        isPhotoProcessing={isPhotoProcessing}
        formatFileSize={formatFileSize}
        isMobile={isMobile}
      />
    )},
    { id: 2, label: "Inspection Summary", component: <InspectionSummary form={formWithSchema} handleChange={handleChange} /> },
    { id: 3, label: "Remarks", component: <Remarks form={formWithSchema} handleChange={handleChange} /> },
    { id: 4, label: "Conclusion", component: <Conclusion form={formWithSchema} handleChange={handleChange} /> },
    { id: 5, label: "A. Quantity", component: <QuantityDetails form={formWithSchema} handleChange={handleChange} /> },
    { id: 6, label: "B. Workmanship", component: <Workmanship form={formWithSchema} handleChange={handleChange} /> },
    { id: 7, label: "C. On-Site Tests", component: <OnSiteTests form={formWithSchema} handleChange={handleChange} /> },
    { id: 8, label: "D. Product Specification", component: <Dimensions form={formWithSchema} handleChange={handleChange} /> },
    { id: 9, label: "E. Packing", component: <Packing form={formWithSchema} handleChange={handleChange} /> },
    { id: 10, label: "F. Marking", component: <Marking form={formWithSchema} handleChange={handleChange} /> },
    { id: 11, label: "G. Production Line", component: <ProductionLine form={formWithSchema} handleChange={handleChange} /> },
    { id: 12, label: "H. Client Req.", component: <ClientRequirement form={formWithSchema} handleChange={handleChange} /> },
    { id: 13, label: "I. Prod. Schedule", component: <ProductionSchedule form={formWithSchema} handleChange={handleChange} /> },
    { id: 14, label: "J. Photos", component: <Photos form={formWithSchema} handleChange={handleChange} /> },
    { id: 15, label: "Finalize", component: (
      <FinalStep 
        reportDownloaded={reportDownloaded} 
        clearFormAfterDownload={clearFormAfterDownload} 
        submit={submit} 
        isGenerating={isGenerating} 
      />
    )},
  ];

  const currentStep = steps.find(s => s.id === step);
  const totalSteps = steps.length;

  const stepShortLabels = {
    1: "General",   2: "Summary",    3: "Remarks",     4: "Conclusion",
    5: "Quantity",  6: "Workmanship", 7: "On-Site",    8: "Prod. Spec",
    9: "Packing",  10: "Marking",   11: "Prod. Line", 12: "Client Req.",
   13: "Schedule", 14: "Photos",    15: "Finalize",
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", background: "#f8fafc", fontFamily: "'Outfit', Arial, sans-serif" }}>

      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.surface, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>During Production Inspection</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {totalSteps}</span>
        </div>
        <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
          {steps.map((item) => (
            <button key={item.id} onClick={() => setStep(item.id)} style={{ border: "none", background: step === item.id ? colors.primary : colors.surfaceAlt, color: step === item.id ? "#fff" : colors.textMuted, borderRadius: "20px", padding: "4px 10px", cursor: "pointer", fontSize: "11px", fontWeight: step === item.id ? "700" : "500", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
              <span style={{ width: "15px", height: "15px", borderRadius: "50%", background: step === item.id ? "rgba(255,255,255,0.25)" : colors.border, color: step === item.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold", flexShrink: 0 }}>{item.id}</span>
              {step === item.id ? item.label : stepShortLabels[item.id]}
            </button>
          ))}
        </div>
        <div style={{ height: "3px", background: colors.border }}>
          <div style={{ width: `${(step / totalSteps) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: isMobile ? "10px 12px" : "14px 22px" }}>

        {/* Compact action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <button onClick={fillDemoData} style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}>
            ✨ Quick Fill
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>
            💾 Save Draft
          </button>
          <button onClick={clearForm} style={{ padding: "7px 12px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(239,68,68,0.15)" }}>
            ⟲ Clear
          </button>
        </div>

        {/* Render Step */}
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          {currentStep?.component}
        </div>

        {/* Step Navigation */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "40px", paddingTop: "20px", borderTop: `1px solid ${colors.border}` }}>
          {step > 1 && (
            <button onClick={prev} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 24px", borderRadius: "24px", border: "none", background: colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}>
              ← Previous
            </button>
          )}
          {step < totalSteps && (
            <button onClick={next} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 24px", borderRadius: "24px", border: "none", background: colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}>
              Next Step →
            </button>
          )}
        </div>
      </div>

      </div>{/* end flex row */}

      {isGenerating && <ReportLoader />}

      {showSaveToast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", background: colors.success, color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 9999, animation: "slideUp 0.3s ease" }}>
          ✅ Draft saved successfully!
        </div>
      )}
    </div>
  );
}
