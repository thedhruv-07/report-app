import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ContactTechnicalManagerButton from '../../components/shared/ContactTechnicalManagerButton';
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { clsSchema } from "../../shared/formSchemas";
import ReportLoader from '../../components/shared/ReportLoader';
import PrefillToast from '../shared/components/PrefillToast';

import {
  GeneralInfo,
  InspectionSummary,
  Remarks,
  Conclusion,
  QuantityDetails,
  ProductConformity,
  Packing,
  LoadingProcess,
  ClientRequirement,
  FinalPhotos,
  FinalStep
} from './components';
import ReportReview from '../shared/components/ReportReview';

import { readImagePreview, formatFileSize } from "../../utils/fileUtils";

const safeJsonParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export default function ContainerLoading() {
  const { token } = useAuth();
  const location = useLocation();
  const prefillData = location.state?.task?.prefillData ?? null;
  const taskId = location.state?.task?._id ?? null;

  const [prefillBannerDismissed, setPrefillBannerDismissed] = useState(false);

  useEffect(() => {
    if (!prefillData) return;
    const factoryAddress = [
      prefillData.factory?.address,
      prefillData.factory?.city,
      prefillData.factory?.country,
    ].filter(Boolean).join(', ');
    setForm(prev => ({
      ...prev,
      client:         prefillData.client?.name                                       || prev.client,
      supplier:       prefillData.factory?.name                                      || prev.supplier,
      factory:        prefillData.factory?.name                                      || prev.factory,
      location:       factoryAddress                                                 || prev.location,
      inspectionDate: prefillData.inspectionDate?.slice(0, 10)                       || prev.inspectionDate,
      productName:    prefillData.product?.name || prefillData.product?.description  || prev.productName,
      orderQuantity:  String(prefillData.product?.quantity ?? prev.orderQuantity ?? ''),
      inspectionNo:   prefillData.inspectionNumber                                   || prev.inspectionNo,
    }));
  }, [prefillData]); // run when prefillData changes

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("clsStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("clsForm");
    return safeJsonParse(savedForm, {});
  });

  // No assigned notice/booking to carry a number over from — reserve the next
  // sequential one for display (peek only, doesn't consume it; the backend
  // mints the real one at submit time).
  useEffect(() => {
    if (prefillData?.inspectionNumber || form.inspectionNo || !token) return;
    fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/next-id`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.noticeId) setForm(prev => (prev.inspectionNo ? prev : { ...prev, inspectionNo: data.noticeId }));
      })
      .catch(() => {});
  }, [prefillData, token]);

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);
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
    } catch {
      alert("Failed to save draft locally.");
    }
  };

  const clearFormAfterDownload = () => {
    localStorage.removeItem("clsStep");
    localStorage.removeItem("clsForm");
    setStep(1);
    setForm({});
    setReportDownloaded(false);
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
      const preview = await readImagePreview(file);
      setForm(prev => ({
        ...prev,
        generalPhoto: preview,
        generalPhotoMeta: { fileName: file.name, originalSize: file.size, compressedSize: file.size }
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

  const submit = async (format = 'docx', notify = false) => {
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
      a.download = `CLS-Report-${new Date().toISOString().slice(0,10)}.${format}`;
      a.click();
      setReportDownloaded(true);
    } catch (error) {
      alert("Failed to generate report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formWithSchema = useMemo(() => ({ ...form, schema: clsSchema }), [form]);

  const steps = [
    { id: 1, label: "General Information", component: (
      <GeneralInfo 
        form={formWithSchema} 
        handleChange={handleChange} 
        handleGeneralPhotoUpload={handleGeneralPhotoUpload}
        clearGeneralPhoto={clearGeneralPhoto}
        isPhotoProcessing={isPhotoProcessing}
        formatFileSize={formatFileSize}
        isMobile={isMobile}
      />
    ) },
    { id: 2, label: "Inspection Summary", component: <InspectionSummary form={formWithSchema} handleChange={handleChange} /> },
    { id: 3, label: "Remarks", component: <Remarks form={formWithSchema} handleChange={handleChange} /> },
    { id: 4, label: "Conclusion", component: <Conclusion form={formWithSchema} handleChange={handleChange} /> },
    { id: 5, label: "Quantity", component: <QuantityDetails form={formWithSchema} handleChange={handleChange} /> },
    { id: 6, label: "Product Conformity", component: <ProductConformity form={formWithSchema} handleChange={handleChange} /> },
    { id: 7, label: "Packing", component: <Packing form={formWithSchema} handleChange={handleChange} /> },
    { id: 8, label: "Loading Process", component: <LoadingProcess form={formWithSchema} handleChange={handleChange} /> },
    { id: 9, label: "Client Requirement", component: <ClientRequirement form={formWithSchema} handleChange={handleChange} /> },
    { id: 10, label: "Final Photos", component: <FinalPhotos form={formWithSchema} handleChange={handleChange} /> },
    { id: 11, label: "Review", component: (
      <ReportReview
        conclusion={form.conclusion}
        onEditStep={setStep}
        hideNav={true}
        sections={[
          {
            title: 'General Information', icon: '📋', stepIndex: 1,
            fields: [
              { label: 'Service', value: form.servicePerformed },
              { label: 'Client', value: form.client },
              { label: 'Supplier', value: form.supplier },
              { label: 'Factory', value: form.factory },
              { label: 'Location', value: form.location },
              { label: 'Inspection Date', value: form.inspectionDate },
              { label: 'Product', value: form.productName },
              { label: 'PO Number', value: form.po },
              { label: 'Destination', value: form.destinationCountry },
            ],
          },
          {
            title: 'Inspection Results', icon: '✅', stepIndex: 2,
            fields: [
              { label: 'Quantity', value: form.quantity },
              { label: 'Product Conformity', value: form.productConformity },
              { label: 'Packing', value: form.packing },
              { label: 'Loading Process', value: form.loadingProcess },
              { label: 'Client Requirement', value: form.clientRequirement },
            ],
          },
          {
            title: 'Container Details', icon: '🚢', stepIndex: 8,
            fields: [
              { label: 'Container No.', value: form.containerNo },
              { label: 'Container Type', value: form.containerType },
              { label: 'Seal No.', value: form.sealNo },
              { label: 'AV Seal No.', value: form.avSealNo },
              { label: 'Loading Start', value: form.loadingStartTime },
              { label: 'Loading End', value: form.loadingEndTime },
            ],
          },
          {
            title: 'Conclusion', icon: '📝', stepIndex: 4,
            fields: [
              { label: 'Overall Result', value: form.conclusion },
              { label: 'Sample Collection', value: form.sampleCollection },
            ],
          },
        ]}
      />
    ) },
    { id: 12, label: "Finalize & Download", component: (
      <FinalStep
        reportDownloaded={reportDownloaded}
        clearFormAfterDownload={clearFormAfterDownload}
        submit={submit}
        isGenerating={isGenerating}
      />
    ) },
  ];

  const currentStep = steps.find(s => s.id === step);

  const stepShortLabels = {
    1: "General", 2: "Summary", 3: "Remarks", 4: "Conclusion",
    5: "Quantity", 6: "Conformity", 7: "Packing", 8: "Loading",
    9: "Client Req.", 10: "Photos", 11: "Review", 12: "Finalize",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden", background: "#f8fafc", fontFamily: "'Outfit', Arial, sans-serif" }}>
      
      {/* Top Navigation */}
      <div style={{ width: "100%", background: colors.surface, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Container Loading Supervision</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ContactTechnicalManagerButton
              reportType="Container Loading Supervision"
              sectionLabel={currentStep?.label}
              taskId={taskId}
            />
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
          </div>
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
          <div style={{ width: `${(step / steps.length) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: isMobile ? "10px 12px" : "14px 22px" }}>
        
        {/* Compact action buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>
            💾 Save Draft
          </button>
        </div>

        <PrefillToast prefillData={prefillData} dismissed={prefillBannerDismissed} onDismiss={() => setPrefillBannerDismissed(true)} />

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
          {step < steps.length && (
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
          Draft saved successfully!
        </div>
      )}
    </div>
  );
}
