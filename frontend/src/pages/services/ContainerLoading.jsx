import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { clsSchema } from "../../shared/formSchemas";
import ReportLoader from "../../components/ReportLoader";

import SchemaSection from "../../components/FormBuilder/SchemaSection";
import SchemaTable from "../../components/FormBuilder/SchemaTable";
import SchemaPhotos from "../../components/FormBuilder/SchemaPhotos";
import SchemaRemarks from "../../components/FormBuilder/SchemaRemarks";
import SchemaChecklist from "../../components/FormBuilder/SchemaChecklist";
import SchemaChecklistTable from "../../components/FormBuilder/SchemaChecklistTable";
import ProductConformityTable from "../../components/FormBuilder/ProductConformityTable";
import CLSPackingTable from "../../components/FormBuilder/CLSPackingTable";
import LoadingProcessTable from "../../components/FormBuilder/LoadingProcessTable";
import { compressImage, formatFileSize } from "../../utils/imageCompression";

const safeJsonParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export default function ContainerLoading() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("clsStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("clsForm");
    return safeJsonParse(savedForm, {});
  });

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  // Responsiveness
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("clsStep", step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem("clsForm", JSON.stringify(form));
  }, [form]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("clsForm", JSON.stringify(form));
      localStorage.setItem("clsStep", step.toString());
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (error) {
      alert("Failed to save draft locally.");
    }
  };

  const autofillDemoData = () => {
    setForm({
      servicePerformed: "Container Loading Supervision (CLS)",
      client: "Global Logistics Inc.",
      supplier: "M/S R. Food Industries",
      factory: "M/S North Star, Noida",
      productName: "Frozen Buffalo HQ",
      po: "1500012973",
      itemNo: "Topside, Silverside, Thick Flank",
      destinationCountry: "Gabon",
      inspectionDate: "2020-12-30",
      location: "New Delhi, India",
      referenceSample: "None",
      
      quantity: "Passed",
      productConformity: "Passed",
      packing: "Passed",
      loadingProcess: "Passed",
      clientRequirement: "Passed",

      quantityTable: [
        { id: "1", item: "Solar Panel 400W", orderQuantity: 500, loadedQuantity: 500 },
        { id: "2", item: "Inverter 5kW", orderQuantity: 100, loadedQuantity: 100 }
      ],

      problemRemarks: [
        "Temperature of 12 inspected samples out of 12 were found temperature higher than -18 degree Celsius. Please refer to below pictures for more detail.",
        "For item Topside, Out of 3 inspected samples 2 cartons were found with packing damage. Please refer to below pictures for more detail."
      ],
      generalRemarks: [
        "The weighing scale and IR Gun provided by factory was with valid calibration label."
      ],
      sampleCollection: "No Sample-Inspector didn't collected any sample from Factory.",

      // Section D - Loading Process
      containerNo: "MSKU1234567",
      containerType: "40' HC REEFER",
      sealNo: "987654",
      avSealNo: "AV1234567",
      cargoBreakdown: "2500 Cartons of Frozen Meat",
      shelter: "Covered Area",
      weather: "Sunny, 28°C",
      loadingStartTime: "09:00 AM",
      loadingEndTime: "04:30 PM",

      // Checklists
      containerCheck: [
        { id: "holes", result: "Yes", finding: "No holes found" },
        { id: "doors", result: "Yes", finding: "Working smoothly" },
        { id: "clean", result: "Yes", finding: "Clean and dry" },
        { id: "watertight", result: "Yes", finding: "Tested with light" },
        { id: "protrusions", result: "Yes", finding: "None" },
        { id: "floor", result: "Yes", finding: "Solid" },
        { id: "odour", result: "Yes", finding: "No smell" },
        { id: "markings", result: "Yes", finding: "Valid CSC plate" }
      ],
      loadingCheck: [
        { id: "evenWeight", result: "Yes", finding: "Balanced loading" },
        { id: "method", result: "Yes", finding: "Manual and Forklift" },
        { id: "layers", result: "Yes", finding: "4 Layers" },
        { id: "noDamaged", result: "Yes", finding: "All cartons intact" },
        { id: "properStowage", result: "Yes", finding: "Tightly packed" },
        { id: "ventilation", result: "Yes", finding: "Maintained" },
        { id: "tempMonitor", result: "Yes", finding: "-18C maintained" },
        { id: "loadingAreaClean", result: "Yes", finding: "Cleaned before loading" },
        { id: "protection", result: "Yes", finding: "Shelter used" }
      ],
      containerSealing: [
        { id: "correctSeal", result: "Yes", finding: "Verified against docs" },
        { id: "properlyFixed", result: "Yes", finding: "Checked manually" },
        { id: "sealIntegrity", result: "Yes", finding: "Intact" },
        { id: "photoTaken", result: "Yes", finding: "Documented" }
      ],

      remarks_loading: "All pallets were securely positioned.",
      
      clientRequirementTable: [
        { requirement: "Temperature check of products", result: "22°C - Acceptable" },
        { requirement: "Check for moisture in cartons", result: "None found" }
      ],
      client_requirement_result: "Passed",
      client_requirement_remark: "Standard temperature and moisture levels maintained.",
      
      conclusion: "PASSED"
    });
    alert("Demo data has been filled!");
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("clsStep");
      localStorage.removeItem("clsForm");
      setStep(1);
      setForm({});
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

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

  const submit = async (format = 'docx') => {
    setIsGenerating(true);
    const formData = new FormData();
    
    formData.append("serviceType", "cls");
    formData.append("format", format);
    
    // Add flat data
    Object.keys(form).forEach((key) => {
      const value = form[key];
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

    // Handle Photos
    const reportPhotoGroups = (clsSchema.photos.groups || []).map(group => {
      const gPhotos = (form[group.id] || [])
        .filter(p => p.preview && p.preview.startsWith("data:image"))
        .map(p => ({ id: String(p.id), preview: p.preview, label: p.label || "" }));
      return { description: group.label, photos: gPhotos };
    }).filter(g => g.photos.length > 0);

    formData.append("reportPhotoGroups", JSON.stringify(reportPhotoGroups));
    
    // Items for quantity table
    if (form.quantityTable) {
      formData.append("items", JSON.stringify(form.quantityTable));
    }

    try {
      const res = await fetch(ENDPOINTS.GENERATE, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`Generation failed (${res.status})`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CLS-Report-${new Date().toISOString().slice(0,10)}.${format}`;
      a.click();
      
    } catch (error) {
      alert("Failed to generate report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = [
    { id: 1, label: "General Information", component: (
      <div style={{ display: "flex", gap: "30px", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ flex: 1 }}>
          <SchemaSection title="1. General Information" fields={clsSchema.generalInfo} formData={form} onChange={handleChange} ai={false} />
        </div>
        <div style={{ width: isMobile ? "100%" : "280px", flexShrink: 0 }}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600", color: colors.text }}>
              General Photo:
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleGeneralPhotoUpload}
              style={{ width: "100%", padding: "10px", background: colors.surface, color: colors.text, border: `2px solid ${colors.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "12px", boxSizing: "border-box" }}
              disabled={isPhotoProcessing}
            />
          </div>

          {form.generalPhoto ? (
            <div>
              <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `2px solid ${colors.border}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <img 
                  src={form.generalPhoto} 
                  alt="General photo preview"
                  style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
                />
                {isPhotoProcessing && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: colors.primary }}>
                    Processing...
                  </div>
                )}
              </div>
              {form.generalPhotoMeta && (
                <div style={{ marginTop: "10px", padding: "10px", background: colors.surfaceAlt, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: "11px", color: colors.text, fontWeight: "600", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {form.generalPhotoMeta.fileName}
                  </div>
                  <div style={{ fontSize: "10px", color: colors.success, fontWeight: "500" }}>
                    {formatFileSize(form.generalPhotoMeta.compressedSize)}
                    {form.generalPhotoMeta.originalSize > form.generalPhotoMeta.compressedSize && (
                      <span style={{ marginLeft: "4px", opacity: 0.8 }}>
                        (saved {formatFileSize(form.generalPhotoMeta.originalSize - form.generalPhotoMeta.compressedSize)})
                      </span>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={clearGeneralPhoto}
                style={{ marginTop: "10px", width: "100%", border: "none", borderRadius: "8px", background: "#fee2e2", color: "#ef4444", fontSize: "12px", padding: "10px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
              >
                Remove Photo
              </button>
            </div>
          ) : (
            <div style={{ width: "100%", height: "220px", border: `2px dashed ${colors.border}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: colors.textMuted, background: colors.surfaceAlt, gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>📷</span>
              <span style={{ fontSize: "12px", fontWeight: "500" }}>No photo uploaded</span>
            </div>
          )}
        </div>
      </div>
    ) },
    { id: 2, label: "Inspection Summary", component: <SchemaSection title="2. Inspection Summary" fields={clsSchema.inspectionSummary} formData={form} onChange={handleChange} /> },
    { id: 3, label: "Remarks", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        <SchemaRemarks title="III. REMARKS - Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
        <SchemaRemarks title="III. REMARKS - General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
        <SchemaSection title="III. REMARKS - Sample Collection" fields={[{name: 'sampleCollection', label: 'Sample Collection Record', type: 'text'}]} formData={form} onChange={handleChange} />
        
        <div style={{ marginTop: "10px" }}>
          <SchemaPhotos 
            config={{ groups: [{ id: "remarkPhotos", label: "Remarks Photos" }] }} 
            formData={form} 
            onChange={handleChange} 
          />
        </div>
      </div>
    ) },
    { id: 4, label: "Conclusion", component: <SchemaSection title="4. Overall Conclusion" fields={clsSchema.conclusion} formData={form} onChange={handleChange} /> },
    { id: 5, label: "Quantity", component: <SchemaTable title="5. Quantity Details" config={clsSchema.quantityTable} dataKey="quantityTable" formData={form} onChange={handleChange} ai={false} /> },
    { id: 6, label: "Product Conformity", component: <ProductConformityTable formData={form} onChange={handleChange} /> },
    { id: 7, label: "Packing", component: <CLSPackingTable formData={form} onChange={handleChange} /> },

    { id: 8, label: "Loading Process", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <LoadingProcessTable formData={form} onChange={handleChange} />

        <SchemaChecklistTable title="8.1 Empty Container Check" items={clsSchema.containerCheck} dataKey="containerCheck" formData={form} onChange={handleChange} />
        <SchemaPhotos 
          config={{ groups: [
            { id: "emptyContainerPhotos", label: "Empty Container Photos" },
            { id: "truckCheckPhotos", label: "Truck Check Photos" }
          ] }} 
          formData={form} 
          onChange={handleChange} 
        />

        <SchemaChecklistTable title="8.2 Loading Process Check" items={clsSchema.loadingCheck} dataKey="loadingCheck" formData={form} onChange={handleChange} />
        <SchemaPhotos 
          config={{ groups: [
            { id: "loadingPhotos", label: "Loading Process Photos" }
          ] }} 
          formData={form} 
          onChange={handleChange} 
        />

        <SchemaChecklistTable 
          title="8.3 Container Closing" 
          items={clsSchema.containerClosing} 
          dataKey="containerClosing" 
          formData={form} 
          onChange={handleChange}
          options={["Passed", "Actual finding", "N/A"]}
        />
        <SchemaPhotos 
          config={{ groups: [
            { id: "closingPhotos", label: "Container Closing Photos" },
            { id: "containerPhotos", label: "Container & Seal Photos" }
          ] }} 
          formData={form} 
          onChange={handleChange} 
        />
      </div>
    ) },
    { id: 9, label: "Client Requirement", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <SchemaTable title="9. Client Special Requirements" config={clsSchema.clientRequirementTable} dataKey="clientRequirementTable" formData={form} onChange={handleChange} />
        <SchemaPhotos 
          config={{ groups: [{ id: "clientRequirementPhotos", label: "Client Requirement Photos" }] }} 
          formData={form} 
          onChange={handleChange} 
        />
      </div>
    ) },
    { id: 10, label: "Final Photos", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <SchemaPhotos 
          config={{ groups: [{ id: "generalPhotos", label: "F. PHOTOS" }] }} 
          formData={form} 
          onChange={handleChange} 
        />
      </div>
    ) },
  ];

  const currentStep = steps.find(s => s.id === step);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", overflow: "hidden", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
      
      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.headerBg, borderBottom: `1px solid ${colors.border}`, display: "flex", flexDirection: isMobile ? "column" : "row", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ flex: 1, overflowX: "auto", padding: "16px", display: "flex", gap: "8px", alignItems: "center", scrollbarWidth: "none", background: colors.surface }}>
          {steps.map((item) => (
            <button key={item.id} onClick={() => setStep(item.id)} style={{ border: "none", background: step === item.id ? colors.primaryLight : "transparent", color: step === item.id ? colors.primary : colors.text, borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontSize: "13px", fontWeight: step === item.id ? "700" : "500", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: step === item.id ? colors.primary : colors.surfaceAlt, color: step === item.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>{item.id}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", background: colors.surface, padding: isMobile ? "20px 16px" : "40px" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: "800", color: colors.header, margin: "0 0 10px 0" }}>Container Loading Supervision</h1>
          <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0" }}>Step {step} of {steps.length}</p>
          <div style={{ display: "flex", height: "4px", background: colors.border, borderRadius: "2px", marginTop: "12px", overflow: "hidden" }}>
            <div style={{ width: `${(step / steps.length) * 100}%`, background: colors.primary, transition: "width 0.3s ease" }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", gap: "10px", marginBottom: "30px", flexWrap: "wrap" }}>
          <button onClick={autofillDemoData} style={{ padding: "10px 18px", background: colors.primary, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)" }}>
            ⚡ Autofill Demo Data
          </button>
          <button onClick={handleSaveDraft} style={{ padding: "10px 18px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(245, 158, 11, 0.2)" }}>
            💾 Save Draft
          </button>
          <button onClick={clearForm} style={{ padding: "10px 18px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)" }}>
            ⟲ Clear Form
          </button>
        </div>

        {/* Render Step */}
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
          {currentStep?.component}
        </div>

        {/* Step Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px", borderTop: `1px solid ${colors.border}` }}>
          <button onClick={prev} disabled={step === 1} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: step === 1 ? colors.surfaceAlt : colors.surface, color: step === 1 ? colors.textMuted : colors.text, border: `1px solid ${colors.border}`, cursor: step === 1 ? "not-allowed" : "pointer", fontWeight: "600", transition: "all 0.2s" }}>
            ← Previous
          </button>
          
          {step < 10 ? (
            <button onClick={next} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)" }}>
              Next Step →
            </button>
          ) : (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={() => submit('docx')} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: isGenerating ? colors.textMuted : colors.success, color: "#fff", cursor: isGenerating ? "not-allowed" : "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: isGenerating ? "none" : "0 4px 12px rgba(16, 185, 129, 0.25)" }}>
                {isGenerating ? "Generating DOCX..." : "Download DOCX"}
              </button>
              
              <button onClick={() => submit('pdf')} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: isGenerating ? colors.textMuted : colors.primary, color: "#fff", cursor: isGenerating ? "not-allowed" : "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: isGenerating ? "none" : "0 4px 12px rgba(59, 130, 246, 0.25)" }}>
                {isGenerating ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          )}
        </div>

      </div>

      {isGenerating && <ReportLoader />}

      {showSaveToast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", background: colors.success, color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 9999, animation: "slideUp 0.3s ease" }}>
          Draft saved successfully!
        </div>
      )}
    </div>
  );
}
