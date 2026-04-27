import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { clsSchema } from "../../shared/formSchemas";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReportPDF from "../../pdf/ReportPDF";

import SchemaSection from "../../components/FormBuilder/SchemaSection";
import SchemaTable from "../../components/FormBuilder/SchemaTable";
import SchemaPhotos from "../../components/FormBuilder/SchemaPhotos";
import SchemaRemarks from "../../components/FormBuilder/SchemaRemarks";
import SchemaChecklist from "../../components/FormBuilder/SchemaChecklist";
import ProductConformityTable from "../../components/FormBuilder/ProductConformityTable";
import CLSPackingTable from "../../components/FormBuilder/CLSPackingTable";

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

      containerNo: "MSKU1234567",
      sealNo: "987654",
      weather: "Sunny, 28°C",

      noHoles: "true",
      doorsWorking: "true",
      clean: "true",
      watertight: "true",
      noProtrusions: "true",

      evenWeight: "true",
      loadingMethod: "Forklift and Manual",
      layersCount: "4",
      remarks_loading: "All pallets were securely positioned.",
      
      temperatureCheck: "25°C - Acceptable",
      remarks_client: "Standard temperature maintained.",
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

  const submit = async () => {
    setIsGenerating(true);
    const formData = new FormData();
    
    formData.append("serviceType", "cls");
    
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
      a.download = `CLS-Report-${new Date().toISOString().slice(0,10)}.docx`;
      a.click();
      
    } catch (error) {
      alert("Failed to generate report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = [
    { id: 1, label: "General Information", component: <SchemaSection title="1. General Information" fields={clsSchema.generalInfo} formData={form} onChange={handleChange} /> },
    { id: 2, label: "Inspection Summary", component: <SchemaSection title="2. Inspection Summary" fields={clsSchema.inspectionSummary} formData={form} onChange={handleChange} /> },
    { id: 3, label: "Remarks", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        <SchemaRemarks title="III. REMARKS - Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
        <SchemaRemarks title="III. REMARKS - General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
        <SchemaSection title="III. REMARKS - Sample Collection" fields={[{name: 'sampleCollection', label: 'Sample Collection Record', type: 'text'}]} formData={form} onChange={handleChange} />
        
        {/* Integrated Photo Upload for Remarks */}
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
    { id: 5, label: "Quantity", component: <SchemaTable title="5. Quantity Details" config={clsSchema.quantityTable} dataKey="quantityTable" formData={form} onChange={handleChange} /> },
    { id: 6, label: "Product Conformity", component: <ProductConformityTable formData={form} onChange={handleChange} /> },
    { id: 7, label: "Packing", component: <CLSPackingTable formData={form} onChange={handleChange} /> },
    { id: 8, label: "Loading Process", component: <SchemaSection title="8. Loading Process" fields={clsSchema.loadingProcess} formData={form} onChange={handleChange} /> },
    { id: 9, label: "Container Check", component: <SchemaChecklist title="9. Container Condition" fields={clsSchema.containerCheck} formData={form} onChange={handleChange} /> },
    { id: 10, label: "Loading Check", component: <SchemaSection title="10. Loading Check" fields={clsSchema.loadingCheck} formData={form} onChange={handleChange} /> },
    { id: 11, label: "Client Requirement", component: <SchemaSection title="11. Client Requirement" fields={clsSchema.clientRequirement} formData={form} onChange={handleChange} /> },
    { id: 12, label: "Photos", component: <SchemaPhotos config={clsSchema.photos} formData={form} onChange={handleChange} /> },
  ];

  const currentStep = steps.find(s => s.id === step);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", overflow: "hidden", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      
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
          
          {step < steps.length ? (
            <button onClick={next} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)" }}>
              Next Step →
            </button>
          ) : (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={submit} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: isGenerating ? colors.textMuted : colors.success, color: "#fff", cursor: isGenerating ? "not-allowed" : "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: isGenerating ? "none" : "0 4px 12px rgba(16, 185, 129, 0.25)" }}>
                {isGenerating ? "Generating DOCX..." : "Download DOCX"}
              </button>
              
              {isClient && (
                <PDFDownloadLink
                  document={<ReportPDF data={form} serviceType="cls" />}
                  fileName={`CLS-Report-${new Date().toISOString().slice(0, 10)}.pdf`}
                  style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)", textDecoration: "none", display: "inline-block", textAlign: "center" }}
                >
                  {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF")}
                </PDFDownloadLink>
              )}
            </div>
          )}
        </div>

      </div>

      {showSaveToast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", background: colors.success, color: "white", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 9999, animation: "slideUp 0.3s ease" }}>
          Draft saved successfully!
        </div>
      )}
    </div>
  );
}
