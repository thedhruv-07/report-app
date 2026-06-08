import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { faSchema } from "../../shared/faSchema";
import ReportLoader from '../../components/shared/ReportLoader';

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

import { compressImage, formatFileSize } from "../../utils/imageCompression";

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

  useEffect(() => {
    if (!prefillData) return;
    const factoryAddress = [
      prefillData.factory?.address,
      prefillData.factory?.city,
      prefillData.factory?.country,
    ].filter(Boolean).join(', ');
    setForm(prev => ({
      ...prev,
      factory:        prefillData.factory?.name   || prev.factory,
      factoryAddress: factoryAddress              || prev.factoryAddress,
      contactPerson:  prefillData.contact?.name   || prev.contactPerson,
      email:          prefillData.contact?.email  || prev.email,
      phone:          prefillData.contact?.phone  || prev.phone,
      auditDate:      prefillData.inspectionDate  || prev.auditDate,
    }));
  }, [prefillData]);

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

  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("faForm");
    return safeJsonParse(savedForm, initialFormState);
  });

  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [reportDownloaded, setReportDownloaded] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  const [reportId, setReportId] = useState(() => localStorage.getItem("faReportId") || "");

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

  const autofillDemoData = () => {
    setForm({
      // Part 1: General Info & Profile
      client: "FRIN",
      supplier: "Global Manufacturing Solutions Ltd.",
      factory: "Main Unit - Shenzhen High-Tech Park",
      factoryAddress: "Plot 45, Industrial Zone 3, Shenzhen, China",
      supplierAddress: "Room 1201, Commerce Tower, Hong Kong",
      contactPerson: "Mr. Zhang Wei",
      email: "zhang.wei@globalmfg.com",
      phone: "+86 755 8888 9999",
      auditDate: new Date().toISOString().split('T')[0],
      auditorName: "John Smith",
      generalPhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",

      dateOfFoundation: "2005-06-12",
      legalStatus: "Foreign Invested",
      actualLocation: "Covers 15,000 sqm across two wings (A & B) in the primary industrial cluster.",
      locationBusinessLicense: " Shenzhen High-Tech Park, Wing A",
      locationExportLicense: "Shenzhen High-Tech Park, Wing A",
      locationBankInfo: "HSBC Main Branch, Hong Kong",
      area: "150,000",
      numberOfStaff: 450,
      corporateRepresentative: "Li Xiaofeng",
      mainProducts: "Electronic components, Power Adapters, and PCBA assemblies.",
      mainMarket: "USA (40%), Europe (35%), SE Asia (25%)",
      businessLicenseInfo: "9144030077559231XP / USD 5,000,000",
      turnover2018: "12,500,000",
      turnover2019: "14,200,000",
      turnover2020: "13,800,000",
      turnoverTrend: "Increase",

      telephoneSets: "25",
      faxMachines: "5",
      computers: "120",
      emailDomain: "@globalmfg.com",

      productsMarkets: [
        { productType: "AC/DC Adapters", customerName: "Sony", marketLocation: "Japan", monthlyQty: "50,000" },
        { productType: "USB Chargers", customerName: "Samsung", marketLocation: "Global", monthlyQty: "100,000" }
      ],
      recommendations: [
        { companyName: "TechCorp", country: "USA", contact: "Alice Rogers", products: "Chargers", details: "Direct supplier since 2015" }
      ],
      part1Score: 9,

      // Part 2: Org Charts
      part2Score: 8,

      // Part 3: Production Capacity
      productionProcess: [
        { operationName: "SMT Assembly", machineName: "Yamaha YS24", machineCount: 4, workersNumber: 8, outputPerHour: 1200, dailyCapacity: 28800 },
        { operationName: "Reflow Soldering", machineName: "Heller 1809", machineCount: 2, workersNumber: 2, outputPerHour: 1200, dailyCapacity: 28800 }
      ],
      runningProduction: "Yes",
      outputCheckComments: "Production line 3 was observed running at 95% efficiency during audit.",
      processLines: "4 SMT Lines, 6 Manual Assembly Lines",
      startTime: "08:00 AM",
      finishedTime: "05:00 PM",
      totalTime: "9 Hours",
      finishedProductsStart: 500,
      finishedProductsEnd: 4200,
      outputPieces: 3700,
      rawMaterialCapacityFactory: "15 days stock",
      rawMaterialCapacityAuditor: "Verified 12-15 days stock on floor",
      weeklyCapacityFactory: "250,000 units",
      weeklyCapacityAuditor: "Approx 220,000 units based on current setup",
      bottleneckAuditorCheck: "Component testing phase (manual)",
      bottleneckComments: "Suggested automated AOI for testing bottleneck.",
      part3Score: 8,

      // Part 4: Machinery
      machineryConditions: [
        { machineName: "Injection Molding Machine", count: 12, comments: "Model: Nissei NEX 110, Condition: Good", picture: "" },
        { machineName: "CNC Milling Machine", count: 5, comments: "Model: Fanuc Robodrill, Condition: Excellent", picture: "" }
      ],
      part4Score: 9,

      // Part 5: QA/QC System
      iso9001Status: "Yes",
      iso9001Comment: "ISO 9001:2015 certified, valid until 2026.",
      internalQAManualStatus: "Yes",
      internalQAManualComment: "Comprehensive QA manual reviewed annually.",
      othersStatus: "No",
      othersComment: "N/A",
      qaStaffStatus: "Yes",
      qaStaffComment: "QA Manager: 1, QA Engineers: 4, QC Inspectors: 15",
      listCertificates: "ISO 9001, ISO 14001, OHSAS 18001, UL, CE",
      howOftenUpdated: "Monthly review",
      lastInspectionDate: "2024-03-15",
      qcStaffCount: 20,
      isOnlineQC: "Yes",
      onlineQCManualAvailable: "Yes",
      onlineQCTestingEquipment: "LCR Meters, Oscilloscopes, Spectrum Analyzers",
      onlineQCRecordsAvailable: "Yes",
      isFinalQC: "Yes",
      finalQCManualAvailable: "Yes",
      finalQCTestingEquipment: "Chroma Burn-in System, Hi-Pot Testers",
      finalQCRecordsAvailable: "Yes",
      finalQCLastResults: "Passed",
      isIncomingQC: "Yes",
      incomingQCManualAvailable: "Yes",
      incomingQCTestingEquipment: "Digital Calipers, X-Ray Fluorescence (XRF) for RoHS",
      incomingQCRecordsAvailable: "Yes",
      part5Score: 9,

      // Photos and missing fields
      buildingOfficePhotos: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", label: "Front Office" }],
      orgChartPhotos: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", label: "Org Chart 2024" }],
      productionWorkflowPhotos: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", label: "Main SMT Workflow" }],
      dailyOutputPhotos: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", label: "Daily Output Log" }],
      qaqcOffice: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" }],
      onlineQCRecord1: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" }],
      rawMaterialQCRecord1: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" }],
      wastewaterPhoto1: [{ preview: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" }],

      // Part 6: R&D
      rdSpecificStaffCount: 15,
      rdSpecificFacilities: "Dedicated Lab with 3D printers, PCB prototyping machines, and Thermal chambers.",
      sampleProductionProcess: "Requirement Analysis -> Schematic Design -> Prototype -> Testing -> Client Approval",
      rdRecord: "Yes",
      approvalSampleLeadTime: "14 days",
      part6Score: 9,

      // Part 7: Environment & Safety
      iso14000Status: "Yes",
      iso14000Comment: "ISO 14001:2015 certified since 2018.",
      internalEnvStatus: "Yes",
      internalEnvComment: "Managed by the EHS (Environment, Health, and Safety) department.",
      envPolicyStatus: "Yes",
      envPolicyDescription: "Commitment to waste reduction and energy efficiency.",
      envListCertificates: "ISO 14001, Green Partner Certificate",
      wastewaterStaffInCharge: "Mr. David Wong (EHS Lead)",
      envControlRecordsStatus: "Yes",
      envUpdateFrequency: "Yes",
      envItemChecked: "Industrial wastewater, Noise levels, Air filtration",
      envLastControlDate: "2024-04-10",
      envFindings: "All parameters within national permissible limits.",
      envStandard: "GB 8978-1996 Class I",
      preventiveActions: [
        { actionDescription: "Upgrade of air scrubbing system in soldering wing." },
        { actionDescription: "Biannual hearing tests for workers in high-noise zones." }
      ],
      envPhotos: [
        { caption: "Drinking Water Station - Level 2", photo: "" },
        { caption: "Fire Extinguisher & Emergency Kit - Zone B", photo: "" },
        { caption: "Wastewater Treatment Plant Overview", photo: "" }
      ],
      part7Score: 9,

      // Global Remarks & Suggestions
      generalOverviewRemarks: [
        "The factory demonstrated a high level of technical competence and organizational structure.",
        "Production capacity is well-managed with professional SMT lines.",
        "Quality control systems are robust with detailed records for incoming and final stages.",
        "Environmental compliance is taken seriously with ISO 14001 certification and active EHS monitoring."
      ],
      clientSpecialRemarks: ["Please ensure the new SMT line is prioritized for the Q4 order."],
      suggestions: [
        "Suggest increasing the frequency of internal EHS audits to monthly.",
        "Recommend adding more automated optical inspection (AOI) machines to reduce manual testing bottleneck.",
        "Suggested to implement a digital inventory management system for better raw material tracking."
      ],
      auditOverview: {
        totalScore: 85,
        percentage: 85,
        grade: "B"
      },
    });
    alert("Full Demo Data Loaded!");
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
      localStorage.removeItem("faReportId");
      setStep(1);
      setForm(initialFormState);
      setReportId("");
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
    { id: 12, label: "Finalize & Download",      component: (
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
    9:  "QA/QC",       10: "R&D",         11: "Environment", 12: "Finalize",
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
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
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
            <button onClick={autofillDemoData} style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}>⚡ Quick Fill</button>
            <button onClick={handleSaveDraft} style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}>💾 Save Draft</button>
            <button onClick={clearForm} style={{ padding: "7px 12px", background: colors.danger, color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "12px", boxShadow: "0 2px 6px rgba(239,68,68,0.15)" }}>⟲ Clear</button>
          </div>
          
          {prefillData && !prefillBannerDismissed && (
            <div style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#dbeafe",
              border: "1px solid #93c5fd",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: "600" }}>
                Auto-filled from Online Booking — review all fields before submitting
              </span>
              <button
                onClick={() => setPrefillBannerDismissed(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#1e40af",
                  fontSize: "18px",
                  lineHeight: "1",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  flexShrink: 0,
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

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
