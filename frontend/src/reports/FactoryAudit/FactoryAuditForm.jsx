import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ContactTechnicalManagerButton from '../../components/shared/ContactTechnicalManagerButton';
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { faSchema } from "../../shared/faSchema";
import ReportLoader from '../../components/shared/ReportLoader';
import PrefillToast from '../shared/components/PrefillToast';

import {
  GeneralInfo,
  AuditOverview,
  SupplierProfile,
  OrganizationChart,
  ProductionLines,
  Machinery,
  QAQCSystem,
  RDCapacity,
  Environment,
  FinalStep,
  OverallConclusionStep,
  CombinedRemarksStep,
} from './components';
import ReportReview from '../shared/components/ReportReview';

import { readImagePreview, formatFileSize } from "../../utils/fileUtils";

const safeJsonParse = (value, fallback) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};

export default function FactoryAudit() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const location = useLocation();
  const prefillData = location.state?.task?.prefillData ?? null;
  const taskId = location.state?.task?._id ?? null;

  const [prefillBannerDismissed, setPrefillBannerDismissed] = useState(false);

  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem("faStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const initialFormState = {
    generalInfo: {},
    auditOverview: {},
    supplierProfile: {},
    productionCapacity: {},
    machineryConditions: [],
    warehouse: {},
    qualityControl: {},
    researchDevelopment: {},
    environment: {},
    conclusion: {},
    comments: [],
    specialRequirements: [],
    envPhotos: [],
    preventiveActions: []
  };

  // Prefill is applied once inside the initializer — no useEffect needed,
  // so there's no setForm → new-object → effect-re-evaluates loop.
  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("faForm");
    const base = safeJsonParse(savedForm, initialFormState);
    if (!prefillData) return base;
    const factoryAddress = [
      prefillData.factory?.address,
      prefillData.factory?.city,
      prefillData.factory?.country,
    ].filter(Boolean).join(', ');
    return {
      ...base,
      factory:        prefillData.factory?.name              || base.factory,
      factoryAddress: factoryAddress                         || base.factoryAddress,
      contactPerson:  prefillData.contact?.name             || base.contactPerson,
      email:          prefillData.contact?.email            || base.email,
      phone:          prefillData.contact?.phone            || base.phone,
      auditDate:      prefillData.inspectionDate?.slice(0, 10) || base.auditDate,
      inspectionNo:   prefillData.inspectionNumber           || base.inspectionNo,
    };
  });

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [reportDownloaded, setReportDownloaded] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [reportId, setReportId] = useState(() => localStorage.getItem("faReportId") || "");

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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => { localStorage.setItem("faStep", step.toString()); }, [step]);
  useEffect(() => { localStorage.setItem("faForm", JSON.stringify(form)); }, [form]);
  useEffect(() => {
    if (reportId) {
      localStorage.setItem("faReportId", reportId);
    } else {
      localStorage.removeItem("faReportId");
    }
  }, [reportId]);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("faForm", JSON.stringify(form));
      localStorage.setItem("faStep", step.toString());
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch {
      alert("Failed to save draft locally.");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const buildNestedData = (f) => ({
    generalPhoto: f.generalPhoto,
    generalOverviewRemarks: f.generalOverviewRemarks || [],
    clientSpecialRemarks: f.clientSpecialRemarks || [],
    suggestions: f.suggestions || [],
    generalInfo: {
      client: f.client,
      supplier: f.supplier,
      factory: f.factory,
      factoryAddress: f.factoryAddress,
      supplierAddress: f.supplierAddress,
      contactPerson: f.contactPerson,
      email: f.email,
      phone: f.phone,
      auditDate: f.auditDate,
      auditorName: f.auditorName,
      inspectionNo: f.inspectionNo
    },
    auditOverview: f.auditOverview || {},
    supplierProfile: {
      dateOfFoundation: f.dateOfFoundation,
      legalStatus: f.legalStatus,
      actualLocation: f.actualLocation,
      locationBusinessLicense: f.locationBusinessLicense,
      locationExportLicense: f.locationExportLicense,
      locationBankInfo: f.locationBankInfo,
      area: f.area,
      numberOfStaff: f.numberOfStaff,
      corporateRepresentative: f.corporateRepresentative,
      mainProducts: f.mainProducts,
      mainMarket: f.mainMarket,
      businessLicenseInfo: f.businessLicenseInfo,
      turnover2018: f.turnover2018,
      turnover2019: f.turnover2019,
      turnover2020: f.turnover2020,
      turnoverTrend: f.turnoverTrend
    },
    communicationInfrastructure: {
      telephoneSets: f.telephoneSets,
      faxMachines: f.faxMachines,
      computers: f.computers,
      emailDomain: f.emailDomain
    },
    productsMarkets: f.productsMarkets || [],
    recommendations: f.recommendations || [],
    part1Score: f.part1Score,
    buildingOfficePhotos: f.buildingOfficePhotos || [],
    relatedPictures: {
      certPhoto: f.certPhoto,
      certCaption: f.certCaption,
      licensePhoto: f.licensePhoto,
      licenseCertNo: f.licenseCertNo,
      licenseDateIssued: f.licenseDateIssued,
      licenseExpiration: f.licenseExpiration,
      exportPhoto: f.exportPhoto,
      exportCertNo: f.exportCertNo,
      exportDateIssued: f.exportDateIssued,
      bankPhoto: f.bankPhoto,
      bankCertNo: f.bankCertNo,
      bankDateIssued: f.bankDateIssued,
      bankAccountNumber: f.bankAccountNumber
    },
    orgChartPhotos: f.orgChartPhotos || [],
    part2Score: f.part2Score,
    productionWorkflowPhotos: f.productionWorkflowPhotos || [],
    productionProcess: f.productionProcess || [],
    dailyOutputCheck: {
      runningProduction: f.runningProduction,
      outputCheckComments: f.outputCheckComments,
      processLines: f.processLines,
      startTime: f.startTime,
      finishedTime: f.finishedTime,
      totalTime: f.totalTime,
      finishedProductsStart: f.finishedProductsStart,
      finishedProductsEnd: f.finishedProductsEnd,
      outputPieces: f.outputPieces
    },
    dailyOutputPhotos: f.dailyOutputPhotos || [],
    leadTimes: {
      rawMaterialCapacityFactory: f.rawMaterialCapacityFactory,
      rawMaterialCapacityAuditor: f.rawMaterialCapacityAuditor,
      weeklyCapacityFactory: f.weeklyCapacityFactory,
      weeklyCapacityAuditor: f.weeklyCapacityAuditor
    },
    bottlenecks: {
      bottleneckAuditorCheck: f.bottleneckAuditorCheck,
      bottleneckComments: f.bottleneckComments
    },
    part3Score: f.part3Score,
    part4: {
      machineryConditions: f.machineryConditions || [],
      warehouseCondition: {
        warehouseArea: f.warehouseArea,
        materialsStocked: f.materialsStocked,
        labMarking: f.labMarking,
        warehouseClean: f.warehouseClean,
        facilitiesAdvanced: f.facilitiesAdvanced,
        warehouseCapacity: f.warehouseCapacity
      },
      warehousePhotos: {
        rawMaterials: f.rawMaterialsStorage?.[0]?.preview || "",
        finishedProducts: f.finishedProductsStorage?.[0]?.preview || ""
      },
      sampleRoomCondition: {
        sampleRoomClean: f.sampleRoomClean,
        sampleDisposed: f.sampleDisposed
      },
      publicPowerSupply: {
        publicPowerConnected: f.publicPowerConnected,
        frequentPowerOutage: f.frequentPowerOutage,
        dieselGenerator: f.dieselGenerator,
        generatorCount: f.generatorCount
      },
      shipmentCapabilities: {
        shippingMeetsRequirement: f.shippingMeetsRequirement,
        containersLoadedTogether: f.containersLoadedTogether,
        protectionBadWeather: f.protectionBadWeather,
        mechanicalLoadingDisposed: f.mechanicalLoadingDisposed
      },
      shipmentPhotos: {
        loadingPlace1: f.loadingPlace1?.[0]?.preview || "",
        loadingPlace2: f.loadingPlace2?.[0]?.preview || ""
      },
      part4Score: f.part4Score
    },
    part5: {
      qualitySystemManagement: {
        iso9001Status: f.iso9001Status,
        iso9001Comment: f.iso9001Comment,
        internalQAManualStatus: f.internalQAManualStatus,
        internalQAManualComment: f.internalQAManualComment,
        othersStatus: f.othersStatus,
        othersComment: f.othersComment,
        qaStaffStatus: f.qaStaffStatus,
        qaStaffComment: f.qaStaffComment,
        qaqcOffice: f.qaqcOffice?.[0]?.preview || "",
        qaqcChecking: f.qaqcChecking?.[0]?.preview || "",
        listCertificates: f.listCertificates
      },
      inspectionTrackRecord: {
        howOftenUpdated: f.howOftenUpdated,
        lastInspectionDate: f.lastInspectionDate
      },
      qcStaffCount: f.qcStaffCount,
      onlineQC: {
        isOnlineQC: f.isOnlineQC,
        onlineQCManualAvailable: f.onlineQCManualAvailable,
        onlineQCTestingEquipment: f.onlineQCTestingEquipment,
        onlineQCRecordsAvailable: f.onlineQCRecordsAvailable,
        onlineQCRecord1: f.onlineQCRecord1?.[0]?.preview || "",
        onlineQCRecord2: f.onlineQCRecord2?.[0]?.preview || ""
      },
      finalQC: {
        isFinalQC: f.isFinalQC,
        finalQCManualAvailable: f.finalQCManualAvailable,
        finalQCTestingEquipment: f.finalQCTestingEquipment,
        finalQCRecordsAvailable: f.finalQCRecordsAvailable,
        finalQCLastResults: f.finalQCLastResults
      },
      incomingQC: {
        isIncomingQC: f.isIncomingQC,
        incomingQCManualAvailable: f.incomingQCManualAvailable,
        incomingQCTestingEquipment: f.incomingQCTestingEquipment,
        incomingQCRecordsAvailable: f.incomingQCRecordsAvailable,
        rawMaterialQCRecord1: f.rawMaterialQCRecord1?.[0]?.preview || "",
        rawMaterialQCRecord2: f.rawMaterialQCRecord2?.[0]?.preview || ""
      },
      testEquipmentPhotos: {
        testEquipment1: f.testEquipment1?.[0]?.preview || "",
        testEquipment2: f.testEquipment2?.[0]?.preview || ""
      },
      part5Score: f.part5Score
    },
    part6: {
      rdSpecificStaffCount: f.rdSpecificStaffCount,
      rdSpecificFacilities: f.rdSpecificFacilities,
      sampleProductionProcess: f.sampleProductionProcess,
      rdRecord: f.rdRecord,
      approvalSampleLeadTime: f.approvalSampleLeadTime,
      part6Score: f.part6Score
    },
    part7: {
      envManagement: {
        iso14000Status: f.iso14000Status,
        iso14000Comment: f.iso14000Comment,
        internalEnvStatus: f.internalEnvStatus,
        internalEnvComment: f.internalEnvComment,
        envPolicyStatus: f.envPolicyStatus,
        envPolicyDescription: f.envPolicyDescription,
        envListCertificates: f.envListCertificates
      },
      wastewaterReport: {
        wastewaterStaffInCharge: f.wastewaterStaffInCharge,
        wastewaterPhoto1: f.wastewaterPhoto1?.[0]?.preview || "",
        wastewaterPhoto2: f.wastewaterPhoto2?.[0]?.preview || ""
      },
      controlTrackRecord: {
        envControlRecordsStatus: f.envControlRecordsStatus,
        envUpdateFrequency: f.envUpdateFrequency,
        envItemChecked: f.envItemChecked,
        envLastControlDate: f.envLastControlDate,
        envFindings: f.envFindings,
        envStandard: f.envStandard
      },
      preventiveActions: f.preventiveActions || [],
      envPhotos: f.envPhotos || [],
      part7Score: f.part7Score
    }
  });

  const submit = async (format = 'docx') => {
    if (!token) {
      alert("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }
    setGenerationError("");
    setIsGenerating(true);
    try {
      const nestedData = buildNestedData(form);

      let saveResponse = await fetch(
        reportId ? `${ENDPOINTS.BASE_URL}/api/factory-audit/${reportId}` : `${ENDPOINTS.BASE_URL}/api/factory-audit`,
        {
          method: reportId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...nestedData, status: "completed" }),
        }
      );

      if (saveResponse.status === 401) {
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      if (saveResponse.status === 404 && reportId) {
        console.warn(`⚠️ Report ID ${reportId} not found on server. Retrying as a new report creation...`);
        localStorage.removeItem("faReportId");
        setReportId("");
        
        saveResponse = await fetch(
          `${ENDPOINTS.BASE_URL}/api/factory-audit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...nestedData, status: "completed" }),
          }
        );
      }

      if (!saveResponse.ok) throw new Error("Failed to save factory audit report");

      const savedJson = await saveResponse.json();
      const savedId = savedJson?.data?._id || savedJson?.data?.id || reportId;

      if (!savedId) throw new Error("Saved report is missing an ID");
      if (savedId !== reportId) setReportId(savedId);

      const generateUrl = `${ENDPOINTS.BASE_URL}/api/factory-audit/${savedId}/generate?format=${format}`;
      console.log("📡 Generating report from:", generateUrl);

      const response = await fetch(generateUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to generate report: ${response.statusText}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `FactoryAudit-Report-${dateStr}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setReportDownloaded(true);
      setGenerationError("");
    } catch (error) {
      console.error("Submission error:", error);
      // Friendly messages for network/backend availability
      try {
        const msg = (error && error.message) ? error.message : String(error);
        if (error instanceof TypeError || /failed to fetch|networkerror|network request|connection refused/i.test(msg)) {
          setGenerationError(`Network error: Unable to reach the API at ${ENDPOINTS.BASE_URL}. Ensure the backend is running and try again.`);
        } else {
          setGenerationError(msg || 'Error generating report. Please try again.');
        }
      } catch {
          setGenerationError('Error generating report. Please try again.');
        }
    } finally {
      setIsGenerating(false);
    }
  };

  const submitForReview = async () => {
    if (!token) {
      alert("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }
    setIsGenerating(true);
    try {
      let savedId = reportId;
      if (savedId) {
        const res = await fetch(ENDPOINTS.FACTORY_AUDIT.SUBMIT(savedId), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ taskId: taskId || undefined }),
        });
        if (res.status === 401) { navigate("/login"); return; }
        if (!res.ok) throw new Error("Failed to submit for review");
      } else {
        // No saved ID yet — save the report first (createReport already emits notification)
        const nestedData = buildNestedData(form);
        const res = await fetch(ENDPOINTS.FACTORY_AUDIT.BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...nestedData, status: "submitted", taskId: taskId || undefined }),
        });
        if (res.status === 401) { navigate("/login"); return; }
        if (!res.ok) throw new Error("Failed to submit for review");
        const json = await res.json();
        const newId = json?.data?._id || json?.data?.id;
        if (newId) setReportId(newId);
      }
      alert("Report submitted for review. The technical manager has been notified.");
    } catch (error) {
      console.error("Submit for review error:", error);
      alert("Error submitting report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneralPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsPhotoProcessing(true);
    try {
      const preview = await readImagePreview(file);
      setForm(prev => ({
        ...prev,
        generalPhoto: preview,
        generalPhotoMeta: { fileName: file.name, size: formatFileSize(file.size), type: file.type }
      }));
    } catch (error) {
      console.error("Photo read error:", error);
      alert("Failed to read image.");
    } finally {
      setIsPhotoProcessing(false);
    }
  };


  const clearFormAfterDownload = () => {
    localStorage.removeItem("faStep");
    localStorage.removeItem("faForm");
    localStorage.removeItem("faReportId");
    setStep(1);
    setForm(initialFormState);
    setReportId("");
    setReportDownloaded(false);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const formWithSchema = useMemo(() => ({ ...form, schema: faSchema }), [form]);

  const steps = [
    { id: 1,  label: "General Information",          component: (
      <GeneralInfo
        form={formWithSchema}
        handleChange={handleChange}
        handleGeneralPhotoUpload={handleGeneralPhotoUpload}
        setForm={setForm}
        isPhotoProcessing={isPhotoProcessing}
        isMobile={isMobile}
      />
    ) },
    { id: 2,  label: "Audit Overview",           component: <AuditOverview form={formWithSchema} setForm={setForm} /> },
    { id: 3,  label: "Overall Conclusion",       component: <OverallConclusionStep form={formWithSchema} setForm={setForm} /> },
    { id: 4,  label: "Remarks",                  component: <CombinedRemarksStep form={formWithSchema} handleChange={handleChange} /> },
    { id: 5,  label: "Part 1: Supplier Profile", component: <SupplierProfile form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 6,  label: "Part 2: Organization Chart",component: <OrganizationChart form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 7,  label: "Part 3: Production Lines", component: <ProductionLines form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 8,  label: "Part 4: Machinery",        component: <Machinery form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 9,  label: "Part 5: QA/QC System",     component: <QAQCSystem form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 10, label: "Part 6: R&D Capacity",     component: <RDCapacity form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 11, label: "Part 7: Environment",      component: <Environment form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 12, label: "Review", component: (
      <ReportReview
        conclusion={form.auditOverview?.overallConclusion || form.overallConclusion}
        onEditStep={setStep}
        hideNav={true}
        sections={[
          {
            title: 'General Information', icon: '📋', stepIndex: 1,
            fields: [
              { label: 'Factory', value: form.factory },
              { label: 'Factory Address', value: form.factoryAddress },
              { label: 'Audit Date', value: form.auditDate },
              { label: 'Contact Person', value: form.contactPerson },
              { label: 'Email', value: form.email },
              { label: 'Phone', value: form.phone },
            ],
          },
          {
            title: 'Overall Conclusion', icon: '🏆', stepIndex: 3,
            fields: [
              { label: 'Result', value: form.auditOverview?.overallConclusion || form.overallConclusion },
            ],
          },
          {
            title: 'Supplier Profile', icon: '🏭', stepIndex: 5,
            fields: [
              { label: 'Factory Name', value: form.supplierProfile?.factoryName || form.factory },
              { label: 'Total Employees', value: form.supplierProfile?.totalEmployees },
              { label: 'Year Established', value: form.supplierProfile?.yearEstablished },
              { label: 'Main Products', value: form.supplierProfile?.mainProducts },
            ],
          },
          {
            title: 'QA/QC System', icon: '🔬', stepIndex: 9,
            fields: [
              { label: 'QC Staff', value: form.qualityControl?.qcStaff },
              { label: 'Lab Equipment', value: form.qualityControl?.labEquipment },
              { label: 'Certifications', value: form.qualityControl?.certifications },
            ],
          },
        ]}
      />
    ) },
    { id: 13, label: "Finalize & Download",      component: (
      <FinalStep
        reportDownloaded={reportDownloaded}
        clearFormAfterDownload={clearFormAfterDownload}
        submit={submit}
        isGenerating={isGenerating}
        onSubmitForReview={submitForReview}
        generationError={generationError}
        onRetry={submit}
      />
    ) },
  ];

  const currentStep = steps.find(s => s.id === step);

  const stepShortLabels = {
    1:  "General",     2:  "Overview",    3:  "Conclusion",  4:  "Remarks",
    5:  "Supplier",    6:  "Org. Chart",  7:  "Prod. Lines", 8:  "Machinery",
    9:  "QA/QC",       10: "R&D",         11: "Environment", 12: "Review",     13: "Finalize",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc", fontFamily: "'Outfit', Arial, sans-serif" }}>
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Factory Audit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ContactTechnicalManagerButton
              reportType="Factory Audit"
              sectionLabel={currentStep?.label}
              taskId={taskId}
            />
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
          </div>
        </div>
        <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              style={{ border: "none", background: step === s.id ? colors.primary : colors.surfaceAlt, color: step === s.id ? "#fff" : colors.textMuted, borderRadius: "20px", padding: "4px 10px", whiteSpace: "nowrap", cursor: "pointer", fontWeight: step === s.id ? "700" : "500", fontSize: "11px", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <span style={{ width: "15px", height: "15px", borderRadius: "50%", background: step === s.id ? "rgba(255,255,255,0.25)" : colors.border, color: step === s.id ? "#fff" : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "bold", flexShrink: 0 }}>{s.id}</span>
              {step === s.id ? s.label : stepShortLabels[s.id]}
            </button>
          ))}
        </div>
        <div style={{ height: "3px", background: colors.border }}>
          <div style={{ width: `${(step / steps.length) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
      <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", padding: isMobile ? "10px 12px" : "14px 22px" }}>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          {/* Compact action buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>💾 Save Draft</button>
          </div>
          
          <PrefillToast prefillData={prefillData} dismissed={prefillBannerDismissed} onDismiss={() => setPrefillBannerDismissed(true)} />

          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            {currentStep?.component}
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "60px", padding: "30px 0", borderTop: `1px solid ${colors.border}` }}>
            {step > 1 && (
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 24px", borderRadius: "24px", border: "none", background: colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}
              >
                ← Previous Section
              </button>
            )}
            {step < steps.length && (
              <button
                onClick={() => setStep(s => Math.min(steps.length, s + 1))}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 24px", borderRadius: "24px", border: "none", background: colors.primary, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(59,130,246,0.25)" }}
              >
                Next Section →
              </button>
            )}
          </div>
        </div>
      </div>

      </div>{/* end flex row */}

      {showSaveToast && (
        <div style={{ 
          position: "fixed", bottom: "30px", right: "30px", 
          background: colors.success, color: "#fff", padding: "14px 28px", 
          borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", 
          zIndex: 1000, fontWeight: "600", animation: "slideUp 0.3s ease" 
        }}>
          Draft saved successfully!
        </div>
      )}

      {isGenerating && <ReportLoader />}
    </div>
  );
}
