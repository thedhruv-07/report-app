import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { faSchema } from "../../shared/faSchema";
import ReportLoader from "../../components/ReportLoader";

import SchemaSection from "../../components/FormBuilder/SchemaSection";
import SchemaTable from "../../components/FormBuilder/SchemaTable";
import SchemaPhotos from "../../components/FormBuilder/SchemaPhotos";
import SchemaRemarks from "../../components/FormBuilder/SchemaRemarks";
import { compressImage, formatFileSize } from "../../utils/imageCompression";

const safeJsonParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export default function FactoryAudit() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("faStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("faForm");
    return safeJsonParse(savedForm, {
      generalInfo: {},
      auditOverview: {},
      supplierProfile: {},
      productionCapacity: {},
      machinery: [],
      warehouse: {},
      qualityControl: {},
      researchDevelopment: {},
      environment: {},
      conclusion: {},
      comments: [],
      specialRequirements: []
    });
  });

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);

  // Responsiveness
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("faStep", step.toString());
  }, [step]);

  useEffect(() => {
    localStorage.setItem("faForm", JSON.stringify(form));
  }, [form]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("faForm", JSON.stringify(form));
      localStorage.setItem("faStep", step.toString());
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (error) {
      alert("Failed to save draft locally.");
    }
  };

  const autofillDemoData = () => {
    setForm({
      client: "Global Logistics Inc.",
      supplier: "M/S R. Food Industries",
      factory: "M/S North Star, Noida",
      factoryAddress: "Plot No. 12, Sector 58, Noida, Uttar Pradesh, India",
      contactPerson: "Mr. Rajesh Kumar",
      email: "rajesh@northstar.com",
      phone: "+91 98765 43210",
      auditDate: "2024-05-20",
      auditorName: "John Doe",
      generalPhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      
      totalScore: 85,
      percentage: 85,
      grade: "B",
      
      legalStatus: "Private Limited",
      yearEstablished: "2010",
      businessScope: "Manufacturing and Export of Frozen Foods",
      majorProducts: "Frozen Meat, Poultry, Seafood",
      mainMarkets: "Europe, Middle East, SE Asia",
      
      totalEmployees: 250,
      productionStaff: 180,
      qcStaff: 25,
      monthlyCapacity: "500 Metric Tons",
      leadTime: "25 Days",
      
      machinery: [
        { id: "1", name: "Flash Freezer", quantity: 4, condition: "Excellent" },
        { id: "2", name: "Cold Storage Unit", quantity: 2, condition: "Good" },
        { id: "3", name: "Automatic Packing Machine", quantity: 6, condition: "Excellent" }
      ],
      
      rawMaterials: "Stored in temperature-controlled warehouse at -18°C.",
      finishedGoods: "Sealed and palletized in separate deep-freeze section.",
      storageConditions: "Humidity and temperature monitored 24/7.",
      
      qcManagement: "ISO 9001:2015 certified quality management system.",
      inspectionProcedures: "Incoming, In-process, and Final inspection protocols strictly followed.",
      equipmentCalibration: "All measuring instruments calibrated annually by third party.",
      
      rdStaff: 12,
      rdCapabilities: "New product development and packaging innovation team.",
      patents: "3 active patents for eco-friendly cold chain packaging.",
      
      socialResponsibility: "Compliant with local labor laws. No child labor found.",
      environmentalProtection: "Effluent treatment plant installed and functional.",
      safetyConditions: "Fire exits clearly marked. Annual fire drills conducted.",
      
      comments: ["Factory demonstrates high commitment to hygiene standards.", "Minor maintenance needed in the loading dock area."],
      problemRemarks: ["Temperature logs for Row B were missing for two days in April."],
      generalRemarks: ["Overall a well-managed facility with robust QC systems."],
      
      result: "PASSED",
      summary: "The factory meets the quality and compliance requirements of Global Logistics Inc. Recommendation for approval as a Tier 1 supplier."
    });
    alert("Demo data has been filled!");
  };

  const handleGeneralPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsPhotoProcessing(true);
    try {
      const compressed = await compressImage(file);
      setForm(prev => ({
        ...prev,
        generalPhoto: compressed,
        generalPhotoMeta: {
          fileName: file.name,
          size: formatFileSize(file.size),
          compressedSize: formatFileSize(compressed.length * 0.75), // rough estimate
          type: file.type
        }
      }));
    } catch (error) {
      console.error("Compression error:", error);
      alert("Failed to process image.");
    } finally {
      setIsPhotoProcessing(false);
    }
  };

  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("faStep");
      localStorage.removeItem("faForm");
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

  const submit = async (format = 'docx') => {
    setIsGenerating(true);
    
    try {
      // First save the report to DB
      const saveRes = await fetch(ENDPOINTS.FACTORY_AUDIT.BASE, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...form, status: "completed" }),
      });

      if (!saveRes.ok) throw new Error("Failed to save report data");
      const savedData = await saveRes.json();
      const reportId = savedData.data._id;

      // Then trigger generation
      const genRes = await fetch(`${ENDPOINTS.FACTORY_AUDIT.GENERATE(reportId)}?format=${format}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!genRes.ok) throw new Error(`Generation failed (${genRes.status})`);

      const blob = await genRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Factory-Audit-${new Date().toISOString().slice(0,10)}.${format}`;
      a.click();
      
    } catch (error) {
      alert("Failed to generate report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = [
    { id: 1, label: "General Information", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: "30px" }}>
          <div>
            <SchemaSection title="1. General Information" fields={faSchema.generalInfo} formData={form} onChange={handleChange} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: colors.header, marginBottom: "5px" }}>General Photo</h3>
            <div style={{ position: "relative", width: "100%", height: "200px", border: `2px dashed ${colors.border}`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.surfaceAlt }}>
              {form.generalPhoto ? (
                <img src={form.generalPhoto} alt="General" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: colors.textMuted, fontSize: "12px" }}>No photo uploaded</span>
              )}
              {isPhotoProcessing && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>Processing...</div>}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleGeneralPhotoUpload} 
              disabled={isPhotoProcessing}
              style={{ width: "100%", fontSize: "12px" }}
            />
            {form.generalPhotoMeta && (
              <div style={{ fontSize: "10px", color: colors.textMuted }}>
                {form.generalPhotoMeta.fileName} ({form.generalPhotoMeta.size})
              </div>
            )}
          </div>
        </div>
      </div>
    ) },
    { id: 2, label: "Audit Overview", component: (
      <SchemaSection title="2. Audit Overview" fields={faSchema.auditOverview} formData={form} onChange={handleChange} />
    ) },
    { id: 3, label: "Supplier Profile", component: (
      <SchemaSection title="3. Supplier Profile" fields={faSchema.supplierProfile} formData={form} onChange={handleChange} />
    ) },
    { id: 4, label: "Production Capacity", component: (
      <SchemaSection title="4. Production Capacity" fields={faSchema.productionCapacity} formData={form} onChange={handleChange} />
    ) },
    { id: 5, label: "Machinery", component: (
      <SchemaTable title="5. Machinery List" config={faSchema.machineryTable} dataKey="machinery" formData={form} onChange={handleChange} />
    ) },
    { id: 6, label: "Warehouse", component: (
      <SchemaSection title="6. Warehouse & Storage" fields={faSchema.warehouse} formData={form} onChange={handleChange} />
    ) },
    { id: 7, label: "Quality Control", component: (
      <SchemaSection title="7. Quality Control" fields={faSchema.qualityControl} formData={form} onChange={handleChange} />
    ) },
    { id: 8, label: "R&D", component: (
      <SchemaSection title="8. Research & Development" fields={faSchema.researchDevelopment} formData={form} onChange={handleChange} />
    ) },
    { id: 9, label: "Environment", component: (
      <SchemaSection title="9. Environment & Safety" fields={faSchema.environment} formData={form} onChange={handleChange} />
    ) },
    { id: 10, label: "Comments & Remarks", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        <SchemaRemarks title="10.1 Comments" dataKey="comments" formData={form} onChange={handleChange} />
        <SchemaRemarks title="10.2 Problem Remarks" dataKey="problemRemarks" formData={form} onChange={handleChange} />
        <SchemaRemarks title="10.3 General Remarks" dataKey="generalRemarks" formData={form} onChange={handleChange} />
      </div>
    ) },
    { id: 11, label: "Photos", component: (
      <SchemaPhotos config={faSchema.photos} formData={form} onChange={handleChange} />
    ) },
    { id: 12, label: "Conclusion", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <SchemaSection title="12. Final Conclusion" fields={faSchema.conclusion} formData={form} onChange={handleChange} />
        <div style={{ background: colors.surfaceAlt, padding: "20px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: colors.text }}>Ready to Submit?</h3>
          <p style={{ fontSize: "14px", color: colors.textMuted, marginBottom: "20px" }}>Please review all sections before generating the final report.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={() => submit('docx')} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: colors.success, color: "#fff", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}>
              {isGenerating ? "Generating DOCX..." : "Download DOCX"}
            </button>
            <button onClick={() => submit('pdf')} disabled={isGenerating} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}>
              {isGenerating ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    ) },
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
          <h1 style={{ fontSize: isMobile ? "20px" : "28px", fontWeight: "800", color: colors.header, margin: "0 0 10px 0" }}>Factory Audit</h1>
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
          
          {step < steps.length && (
            <button onClick={next} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)" }}>
              Next Step →
            </button>
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
