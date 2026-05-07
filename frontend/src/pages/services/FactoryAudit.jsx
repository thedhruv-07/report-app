import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors, tableHeaderStyle, tableCellStyle } from "../../styles";
import { faSchema } from "../../shared/faSchema";
import ReportLoader from "../../components/ReportLoader";
import { UploadCloud, X } from "lucide-react";

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
      supplierAddress: "456, Industrial Area, Phase II, New Delhi, India",
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
      
      generalOverviewRemarks: [
        "This factory manufactures Stainless Steel Utensils & engineering fabricated products since 2009.",
        "Factory has 2 own unit at 04 & 05 Dewan & Sons Industrial Estate of size total 3500 sq. ft. and 2 rental units at B9, B16 & C/10 at Oswal Industrial Estate of size total 4000 sq. ft.",
        "Manufacturing processes available in the factory were: Cutting, Bending, Welding, Polishing, Buffing, Plating, Cleaning & Packaging",
        "Except Powder Coating, all the production processes were performed in the factory.",
        "The audit address shown on business license is same as the actual business scope",
        "There were 34 employees working in the factory on the audit date. All the workers are directly hired by factory.",
        "The production was running on the audit day & overall working condition acceptable."
      ],
      clientSpecialRemarks: ["-"],
      suggestions: [
        "It is suggested to put labels on raw material & intermediate goods",
        "All tools are required with numbers particularly sharp tools & suggested to note the issuance / receipt",
        "There was no power generator in factory, it is suggested to have a power generator in factory to avoid production losses during unavoidable power outages",
        "It is suggested to get the ISO 9001, ISO 140001 certification for the factory",
        "There was no quality manual, it is suggested to make quality manual and use AQL standards for quality checks",
        "There was no environment policy, it is suggested to make environmental policy and get the certification done from local Pollution Control Board authorities",
        "There was no checks done for water, air, sound pollution. It is suggested to regularly check water, air & sound pollution."
      ],
      specialRequirements: [
        { requirement: "Check factory fire safety compliance", result: "OK", remark: "All fire exits operational" },
        { requirement: "Verify ISO certification", result: "Pending", remark: "Application in progress" }
      ],
      specialRequirementConclusion: "Partially compliant - ISO pending",
      result: "PASSED",
      summary: "The factory meets the quality and compliance requirements of Global Logistics Inc. Recommendation for approval as a Tier 1 supplier.",
      auditOverview: {
        profile: 10,
        orgCharts: 8,
        lines: 8,
        machinery: 5,
        qaqc: 3,
        rd: 8,
        environment: 1
      }
    });
    alert("Demo data has been filled!");
  };

  const handleGeneralPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsPhotoProcessing(true);
    try {
      const { preview, originalSize, compressedSize } = await compressImage(file);
      setForm(prev => ({
        ...prev,
        generalPhoto: preview,
        generalPhotoMeta: {
          fileName: file.name,
          size: formatFileSize(originalSize),
          compressedSize: formatFileSize(compressedSize),
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
      // Map flat form data to nested structure expected by backend model
      const nestedData = {
        generalPhoto: form.generalPhoto,
        generalInfo: {},
        supplierProfile: {},
        communicationInfrastructure: {},
        productionCapacity: {},
        warehouse: {},
        qualityControl: {},
        researchDevelopment: {},
        environment: {},
        conclusion: {
          result: form.conclusion?.result || "PENDING",
          summary: form.conclusion?.summary || "",
          conclusionPhoto: form.conclusion?.conclusionPhoto || ""
        },
        // Direct arrays/objects
        auditOverview: form.auditOverview,
        productsMarkets: form.productsMarkets,
        recommendations: form.recommendations,
        machinery: form.machinery,
        specialRequirements: form.specialRequirements,
        part1Score: form.part1Score,
        part2Score: form.part2Score,
      };

      // Fill nested objects based on schema definitions
      faSchema.generalInfo.forEach(f => { if (form[f.name] !== undefined) nestedData.generalInfo[f.name] = form[f.name]; });
      faSchema.supplierProfile.forEach(f => { if (form[f.name] !== undefined) nestedData.supplierProfile[f.name] = form[f.name]; });
      faSchema.communicationInfrastructure.forEach(f => { if (form[f.name] !== undefined) nestedData.communicationInfrastructure[f.name] = form[f.name]; });
      faSchema.productionCapacity.forEach(f => { if (form[f.name] !== undefined) nestedData.productionCapacity[f.name] = form[f.name]; });
      faSchema.warehouse.forEach(f => { if (form[f.name] !== undefined) nestedData.warehouse[f.name] = form[f.name]; });
      faSchema.qualityControl.forEach(f => { if (form[f.name] !== undefined) nestedData.qualityControl[f.name] = form[f.name]; });
      faSchema.researchDevelopment.forEach(f => { if (form[f.name] !== undefined) nestedData.researchDevelopment[f.name] = form[f.name]; });
      faSchema.environment.forEach(f => { if (form[f.name] !== undefined) nestedData.environment[f.name] = form[f.name]; });

      // Handle photos section groups for the DOCX service gallery
      nestedData.reportPhotoGroups = faSchema.photos.groups.map(group => ({
        id: group.id,
        description: group.label,
        photos: form[group.id] || []
      })).filter(g => g.photos.length > 0);

      // Preserve original group IDs at root if needed (though nestedData.reportPhotoGroups is primary)
      faSchema.photos.groups.forEach(group => {
        if (form[group.id]) nestedData[group.id] = form[group.id];
      });

      if (form.orgChartPhotos) nestedData.orgChartPhotos = form.orgChartPhotos;
      if (form.buildingOfficePhotos) nestedData.buildingOfficePhotos = form.buildingOfficePhotos;

      // Part 3: Production lines / Capacity
      nestedData.productionWorkflowPhotos = form.productionWorkflowPhotos || [];
      nestedData.productionProcess = form.productionProcess || [];
      nestedData.dailyOutputCheck = {
        runningProduction: form.runningProduction,
        outputCheckComments: form.outputCheckComments,
        processLines: form.processLines,
        startTime: form.startTime,
        finishedTime: form.finishedTime,
        totalTime: form.totalTime,
        finishedProductsStart: form.finishedProductsStart,
        finishedProductsEnd: form.finishedProductsEnd,
        outputPieces: form.outputPieces
      };
      nestedData.dailyOutputPhotos = form.dailyOutputPhotos || [];
      nestedData.leadTimes = {
        rawMaterialCapacityFactory: form.rawMaterialCapacityFactory,
        rawMaterialCapacityAuditor: form.rawMaterialCapacityAuditor,
        weeklyCapacityFactory: form.weeklyCapacityFactory,
        weeklyCapacityAuditor: form.weeklyCapacityAuditor
      };
      nestedData.bottlenecks = {
        bottleneckAuditorCheck: form.bottleneckAuditorCheck,
        bottleneckComments: form.bottleneckComments
      };
      nestedData.part3Score = form.part3Score;

      // Handle individual certificate photos in relatedPictures
      nestedData.relatedPictures = {
        certPhoto: form.certPhoto,
        certCaption: form.certCaption,
        licensePhoto: form.licensePhoto,
        licenseCertNo: form.licenseCertNo,
        licenseDateIssued: form.licenseDateIssued,
        licenseExpiration: form.licenseExpiration,
        exportPhoto: form.exportPhoto,
        exportCertNo: form.exportCertNo,
        exportDateIssued: form.exportDateIssued,
        bankPhoto: form.bankPhoto,
        bankCertNo: form.bankCertNo,
        bankDateIssued: form.bankDateIssued,
        bankAccountNumber: form.bankAccountNumber
      };

      const saveRes = await fetch(ENDPOINTS.FACTORY_AUDIT.BASE, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...nestedData, status: "completed" }),
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
          <div style={{ padding: "20px", border: `1px solid ${colors.border}`, borderRadius: "16px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h4 style={{ margin: "0 0 15px 0", color: colors.header, fontSize: "14px", fontWeight: "700", borderBottom: `2px solid ${colors.surfaceAlt}`, paddingBottom: "8px" }}>General Photo</h4>
            <div style={{ position: "relative", width: "100%", height: "220px", border: `2px dashed ${form.generalPhoto ? colors.success : colors.border}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.surfaceAlt, transition: "all 0.3s ease" }}>
              {form.generalPhoto ? (
                <>
                  <img src={form.generalPhoto} alt="General" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, generalPhoto: "" }))}
                    style={{ position: "absolute", top: "10px", right: "10px", background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <UploadCloud size={40} color={colors.textMuted} style={{ marginBottom: "10px", opacity: 0.5 }} />
                  <span style={{ color: colors.textMuted, fontSize: "12px", display: "block" }}>No photo uploaded</span>
                </div>
              )}
              {isPhotoProcessing && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: colors.primary }}>Processing...</div>}
            </div>
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              marginTop: "15px", padding: "10px", borderRadius: "8px",
              background: isPhotoProcessing ? colors.surfaceAlt : colors.primaryLight,
              color: isPhotoProcessing ? colors.textMuted : colors.primary,
              cursor: isPhotoProcessing ? "not-allowed" : "pointer",
              fontSize: "13px", fontWeight: "600", border: `1px solid ${colors.primary}40`
            }}>
              <UploadCloud size={16} />
              {form.generalPhoto ? "Change Photo" : "Upload Photo"}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleGeneralPhotoUpload} 
                disabled={isPhotoProcessing}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
      </div>
    ) },
    { id: 2, label: "Audit Overview", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "10px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>
          2. General overview of audit
        </h3>
        
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${colors.border}`, fontSize: "14px" }}>
          <thead>
            <tr style={{ background: colors.headerBg }}>
              <th style={{ ...tableHeaderStyle, width: "50px" }}>#</th>
              <th style={{ ...tableHeaderStyle, textAlign: "left" }}>Fields</th>
              <th style={{ ...tableHeaderStyle, width: "100px" }}>Score /10</th>
              <th style={{ ...tableHeaderStyle, width: "100px" }}>Weight /5</th>
              <th style={{ ...tableHeaderStyle, width: "120px" }}>Weighted score</th>
            </tr>
          </thead>
          <tbody>
            {faSchema.auditOverview.sections.map((sec, idx) => {
              const score = form.auditOverview?.[sec.id] || 0;
              const weighted = score * sec.weight;
              return (
                <tr key={sec.id}>
                  <td style={{ ...tableCellStyle, textAlign: "center" }}>{idx + 1}</td>
                  <td style={tableCellStyle}>{sec.label}</td>
                  <td style={{ ...tableCellStyle, padding: "5px" }}>
                    <input 
                      type="number" 
                      min="0" max="10" 
                      value={score} 
                      onChange={(e) => {
                        const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                        setForm(prev => ({
                          ...prev,
                          auditOverview: { ...prev.auditOverview, [sec.id]: val }
                        }));
                      }}
                      style={{ width: "100%", border: "none", textAlign: "center", outline: "none", background: "transparent", fontWeight: "600" }}
                    />
                  </td>
                  <td style={{ ...tableCellStyle, padding: "5px", background: colors.surfaceAlt }}>
                    <input 
                      type="number" 
                      min="0" max="10" 
                      value={form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setForm(prev => ({
                          ...prev,
                          auditOverview: { ...prev.auditOverview, [`${sec.id}_weight`]: val }
                        }));
                      }}
                      style={{ width: "100%", border: "none", textAlign: "center", outline: "none", background: "transparent", fontWeight: "600" }}
                    />
                  </td>
                  <td style={{ ...tableCellStyle, padding: "5px" }}>
                    <input 
                      type="number" 
                      value={form.auditOverview?.[`${sec.id}_weighted`] ?? (score * (form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight))} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setForm(prev => ({
                          ...prev,
                          auditOverview: { ...prev.auditOverview, [`${sec.id}_weighted`]: val }
                        }));
                      }}
                      style={{ width: "100%", border: "none", textAlign: "center", outline: "none", background: "transparent", fontWeight: "700" }}
                    />
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: colors.surfaceAlt }}>
              <td colSpan="3" style={{ ...tableCellStyle, textAlign: "right", fontWeight: "bold" }}>Total:</td>
              <td style={{ ...tableCellStyle, textAlign: "center", fontWeight: "bold" }}>
                {faSchema.auditOverview.sections.reduce((acc, sec) => acc + (form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight), 0)}
              </td>
              <td style={{ ...tableCellStyle, textAlign: "center", fontWeight: "bold" }}>
                {faSchema.auditOverview.sections.reduce((acc, sec) => {
                  const s = form.auditOverview?.[sec.id] || 0;
                  const w = form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight;
                  const weighted = form.auditOverview?.[`${sec.id}_weighted`] ?? (s * w);
                  return acc + weighted;
                }, 0)}
              </td>
            </tr>
            <tr>
              <td colSpan="4" style={{ ...tableCellStyle, fontWeight: "bold", background: colors.surfaceAlt }}>General Overview Conclusion</td>
              <td style={{ ...tableCellStyle, textAlign: "center", fontWeight: "900", color: "#cc0000", fontSize: "16px" }}>
                {(() => {
                  const totalWeight = faSchema.auditOverview.sections.reduce((acc, sec) => acc + (form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight), 0);
                  const totalWeighted = faSchema.auditOverview.sections.reduce((acc, sec) => {
                    const s = form.auditOverview?.[sec.id] || 0;
                    const w = form.auditOverview?.[`${sec.id}_weight`] ?? sec.weight;
                    const weighted = form.auditOverview?.[`${sec.id}_weighted`] ?? (s * w);
                    return acc + weighted;
                  }, 0);
                  return totalWeight > 0 ? (totalWeighted / totalWeight).toFixed(2) : "0.00";
                })()}/ 10
              </td>
            </tr>
          </tbody>
        </table>

        {/* Grading Legend */}
        <div style={{ marginTop: "15px", fontSize: "12px", color: colors.textLight, padding: "15px", background: colors.surfaceAlt, borderRadius: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "5px", marginBottom: "5px" }}>
            <span style={{ fontWeight: "700", color: colors.success }}>PASSED:</span>
            <span>The general overview conclusion is minimum 8</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "5px", marginBottom: "5px" }}>
            <span style={{ fontWeight: "700", color: colors.warning }}>PENDING:</span>
            <span>The general overview conclusion is less than 8 and minimum 6</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "5px" }}>
            <span style={{ fontWeight: "700", color: colors.danger }}>FAILED:</span>
            <span>The general overview conclusion is less than 6</span>
          </div>
        </div>
      </div>
    ) },
    { id: 3, label: "Remarks", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "10px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>
          3. Remarks
        </h3>
        <SchemaRemarks title="General Overview:" dataKey="generalOverviewRemarks" formData={form} onChange={handleChange} />
        <SchemaRemarks title="Client's special requirement" dataKey="clientSpecialRemarks" formData={form} onChange={handleChange} />
        <SchemaRemarks title="Suggestion:" dataKey="suggestions" formData={form} onChange={handleChange} />
      </div>
    ) },
    { id: 4, label: "Special Requirements", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "10px", borderBottom: `3px solid ${colors.primary}`, padding: "12px", backgroundColor: colors.surfaceAlt }}>
          4. Client's special requirement of audit
        </h3>
        <SchemaTable title="Requirements List" config={faSchema.specialRequirements} dataKey="specialRequirements" formData={form} onChange={handleChange} />
        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>Special Requirement Conclusion:</label>
          <input 
            type="text" 
            value={form.specialRequirementConclusion || ""} 
            onChange={(e) => setForm(prev => ({ ...prev, specialRequirementConclusion: e.target.value }))}
            placeholder="Enter conclusion for special requirements"
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: `2px solid ${colors.border}`, fontSize: "14px" }}
          />
        </div>
      </div>
    ) },
    { id: 5, label: "Supplier Profile", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center", marginBottom: "5px" }}>
          Part 1
        </h3>
        <h4 style={{ fontSize: "17px", fontWeight: "700", color: colors.header, textAlign: "center", marginBottom: "10px" }}>
          A: Supplier profile
        </h4>

        <SchemaSection title="General information" fields={faSchema.supplierProfile} formData={form} onChange={handleChange} />
        <SchemaSection title="Communication infrastructures" fields={faSchema.communicationInfrastructure} formData={form} onChange={handleChange} />
        <SchemaTable title="Products / markets" config={faSchema.productsMarkets} dataKey="productsMarkets" formData={form} onChange={handleChange} />
        <SchemaTable title="Recommendations / credentials" config={faSchema.recommendations} dataKey="recommendations" formData={form} onChange={handleChange} />

        <div style={{ display: "flex", flexDirection: "column", gap: "25px", border: `2px solid ${colors.primary}`, padding: "20px", borderRadius: "12px", backgroundColor: colors.surfaceAlt }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "15px", textTransform: "uppercase" }}>
            Related pictures:
          </h3>

          <SchemaPhotos config={faSchema.relatedPictures.buildingOffice} formData={form} onChange={handleChange} />
          <SchemaSection title="Building Certificate" fields={faSchema.relatedPictures.buildingCertificate} formData={form} onChange={handleChange} />
          <SchemaSection title="License accreditation" fields={faSchema.relatedPictures.licenseAccreditation} formData={form} onChange={handleChange} />
          <SchemaSection title="Export license" fields={faSchema.relatedPictures.exportLicense} formData={form} onChange={handleChange} />
          <SchemaSection title="Bank information" fields={faSchema.relatedPictures.bankInfo} formData={form} onChange={handleChange} />
          
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 1 Score</h4>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, part1Score: num }))}
                  style={{
                    width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`,
                    backgroundColor: form.part1Score === num ? colors.danger : colors.surfaceAlt,
                    color: form.part1Score === num ? "#fff" : colors.text,
                    fontWeight: "bold", cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) },
    { id: 6, label: "Part 2: Factory Organization", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: colors.header, marginBottom: "15px", textTransform: "uppercase" }}>
            Part 2: Factory Organization
          </h3>

          <SchemaPhotos config={faSchema.part2.orgCharts} formData={form} onChange={handleChange} />
          
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 2 Score</h4>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, part2Score: num }))}
                  style={{
                    width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`,
                    backgroundColor: form.part2Score === num ? colors.danger : colors.surfaceAlt,
                    color: form.part2Score === num ? "#fff" : colors.text,
                    fontWeight: "bold", cursor: "pointer", transition: "all 0.2s"
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) },
    { id: 7, label: "Part 3: Production Lines / Capacity", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "800", color: colors.header, textAlign: "center", marginBottom: "5px" }}>
          Part 3
        </h3>
        <h4 style={{ fontSize: "17px", fontWeight: "700", color: colors.header, textAlign: "center", marginBottom: "10px" }}>
          Production lines / Capacity
        </h4>

        <SchemaPhotos config={faSchema.part3.productionWorkflow} formData={form} onChange={handleChange} />
        <SchemaTable title="Production process" config={faSchema.part3.productionProcess} dataKey="productionProcess" formData={form} onChange={handleChange} />
        
        <div style={{ background: colors.surfaceAlt, padding: "20px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
          <SchemaSection title="Daily output check" fields={faSchema.part3.dailyOutputCheck} formData={form} onChange={handleChange} />
          <div style={{ marginTop: "20px" }}>
             <SchemaPhotos config={faSchema.part3.dailyOutputPhotos} formData={form} onChange={handleChange} />
          </div>
        </div>

        <SchemaSection title="Lead times for client’s production" fields={faSchema.part3.leadTimes} formData={form} onChange={handleChange} />
        <SchemaSection title="Sensitive points / bottlenecks" fields={faSchema.part3.bottlenecks} formData={form} onChange={handleChange} />

        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: colors.surface, borderRadius: "8px", border: `1px solid ${colors.border}` }}>
          <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.danger, marginBottom: "15px", textAlign: "center" }}>Part 3 Score</h4>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, part3Score: num }))}
                style={{
                  width: "40px", height: "40px", borderRadius: "4px", border: `1px solid ${colors.border}`,
                  backgroundColor: form.part3Score === num ? colors.danger : colors.surfaceAlt,
                  color: form.part3Score === num ? "#fff" : colors.text,
                  fontWeight: "bold", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    ) },
    { id: 8, label: "Machinery", component: (
      <SchemaTable title="Machinery List" config={faSchema.machineryTable} dataKey="machinery" formData={form} onChange={handleChange} />
    ) },
    { id: 9, label: "Warehouse", component: (
      <SchemaSection title="Warehouse & Storage" fields={faSchema.warehouse} formData={form} onChange={handleChange} />
    ) },
    { id: 10, label: "Quality Control", component: (
      <SchemaSection title="Quality Control" fields={faSchema.qualityControl} formData={form} onChange={handleChange} />
    ) },
    { id: 11, label: "R&D", component: (
      <SchemaSection title="Research & Development" fields={faSchema.researchDevelopment} formData={form} onChange={handleChange} />
    ) },
    { id: 12, label: "Environment", component: (
      <SchemaSection title="Environment & Safety" fields={faSchema.environment} formData={form} onChange={handleChange} />
    ) },
    { id: 13, label: "Photos", component: (
      <SchemaPhotos config={faSchema.photos} formData={form} onChange={handleChange} />
    ) },
    { id: 14, label: "Conclusion", component: (
      <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
        <SchemaSection title="Conclusion" fields={faSchema.conclusion} formData={form} onChange={handleChange} />
        
        <div style={{ marginTop: "20px", border: `3px solid ${colors.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: colors.surfaceAlt }}>
            <div style={{ padding: "25px", borderRight: `3px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "900", color: colors.header, textTransform: "uppercase" }}>Overall Conclusion</h2>
            </div>
            <div style={{ padding: "25px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: "32px", 
                fontWeight: "900", 
                color: form.conclusion?.result === "PASSED" ? colors.success : (form.conclusion?.result === "FAILED" ? colors.danger : colors.warning)
              }}>
                {form.conclusion?.result || "PENDING"}
              </h2>
            </div>
          </div>
        </div>

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
