import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ENDPOINTS } from "../../config/api";
import { colors } from "../../styles";
import { faSchema } from "../../shared/faSchema";
import ReportLoader from '../../components/shared/ReportLoader';

import { 
  GeneralInfo, 
  AuditOverview, 
  RemarksAndSuggestions, 
  SupplierProfile, 
  OrganizationChart, 
  ProductionLines, 
  Machinery, 
  QAQCSystem, 
  RDCapacity, 
  Environment, 
  FinalStep 
} from './components';

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
    } catch (error) {
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

  const submit = async (format = 'docx') => {
    if (!token) {
      alert("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }
    setIsGenerating(true);
    try {
      const nestedData = {
        generalPhoto: form.generalPhoto,
        generalOverviewRemarks: form.generalOverviewRemarks || [],
        clientSpecialRemarks: form.clientSpecialRemarks || [],
        suggestions: form.suggestions || [],
        
        generalInfo: {
          client: form.client,
          supplier: form.supplier,
          factory: form.factory,
          factoryAddress: form.factoryAddress,
          contactPerson: form.contactPerson,
          email: form.email,
          phone: form.phone,
          auditDate: form.auditDate,
          auditorName: form.auditorName
        },

        auditOverview: {
          totalScore: form.auditOverview?.totalScore || 0,
          percentage: form.auditOverview?.percentage || 0,
          grade: form.auditOverview?.grade || "PENDING"
        },

        supplierProfile: {
          dateOfFoundation: form.dateOfFoundation,
          legalStatus: form.legalStatus,
          actualLocation: form.actualLocation,
          locationBusinessLicense: form.locationBusinessLicense,
          locationExportLicense: form.locationExportLicense,
          locationBankInfo: form.locationBankInfo,
          area: form.area,
          numberOfStaff: form.numberOfStaff,
          corporateRepresentative: form.corporateRepresentative,
          mainProducts: form.mainProducts,
          mainMarket: form.mainMarket,
          businessLicenseInfo: form.businessLicenseInfo,
          turnover2018: form.turnover2018,
          turnover2019: form.turnover2019,
          turnover2020: form.turnover2020,
          turnoverTrend: form.turnoverTrend
        },

        communicationInfrastructure: {
          telephoneSets: form.telephoneSets,
          faxMachines: form.faxMachines,
          computers: form.computers,
          emailDomain: form.emailDomain
        },

        productsMarkets: form.productsMarkets || [],
        recommendations: form.recommendations || [],
        part1Score: form.part1Score,
        
        buildingOfficePhotos: form.buildingOfficePhotos || [],
        relatedPictures: {
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
        },

        orgChartPhotos: form.orgChartPhotos || [],
        part2Score: form.part2Score,

        productionWorkflowPhotos: form.productionWorkflowPhotos || [],
        productionProcess: form.productionProcess || [],
        dailyOutputCheck: {
          runningProduction: form.runningProduction,
          outputCheckComments: form.outputCheckComments,
          processLines: form.processLines,
          startTime: form.startTime,
          finishedTime: form.finishedTime,
          totalTime: form.totalTime,
          finishedProductsStart: form.finishedProductsStart,
          finishedProductsEnd: form.finishedProductsEnd,
          outputPieces: form.outputPieces
        },
        dailyOutputPhotos: form.dailyOutputPhotos || [],
        leadTimes: {
          rawMaterialCapacityFactory: form.rawMaterialCapacityFactory,
          rawMaterialCapacityAuditor: form.rawMaterialCapacityAuditor,
          weeklyCapacityFactory: form.weeklyCapacityFactory,
          weeklyCapacityAuditor: form.weeklyCapacityAuditor
        },
        bottlenecks: {
          bottleneckAuditorCheck: form.bottleneckAuditorCheck,
          bottleneckComments: form.bottleneckComments
        },
        part3Score: form.part3Score,

        part4: {
          machineryConditions: form.machineryConditions || [],
          warehouseCondition: {
            warehouseArea: form.warehouseArea,
            materialsStocked: form.materialsStocked,
            labMarking: form.labMarking,
            warehouseClean: form.warehouseClean,
            facilitiesAdvanced: form.facilitiesAdvanced,
            warehouseCapacity: form.warehouseCapacity
          },
          warehousePhotos: {
            rawMaterials: form.rawMaterialsStorage?.[0]?.preview || "",
            finishedProducts: form.finishedProductsStorage?.[0]?.preview || ""
          },
          sampleRoomCondition: {
            sampleRoomClean: form.sampleRoomClean,
            sampleDisposed: form.sampleDisposed
          },
          publicPowerSupply: {
            publicPowerConnected: form.publicPowerConnected,
            frequentPowerOutage: form.frequentPowerOutage,
            dieselGenerator: form.dieselGenerator,
            generatorCount: form.generatorCount
          },
          shipmentCapabilities: {
            shippingMeetsRequirement: form.shippingMeetsRequirement,
            containersLoadedTogether: form.containersLoadedTogether,
            protectionBadWeather: form.protectionBadWeather,
            mechanicalLoadingDisposed: form.mechanicalLoadingDisposed
          },
          shipmentPhotos: {
            loadingPlace1: form.loadingPlace1?.[0]?.preview || "",
            loadingPlace2: form.loadingPlace2?.[0]?.preview || ""
          },
          part4Score: form.part4Score
        },

        part5: {
          qualitySystemManagement: {
            iso9001Status: form.iso9001Status,
            iso9001Comment: form.iso9001Comment,
            internalQAManualStatus: form.internalQAManualStatus,
            internalQAManualComment: form.internalQAManualComment,
            othersStatus: form.othersStatus,
            othersComment: form.othersComment,
            qaStaffStatus: form.qaStaffStatus,
            qaStaffComment: form.qaStaffComment,
            qaqcOffice: form.qaqcOffice?.[0]?.preview || "",
            qaqcChecking: form.qaqcChecking?.[0]?.preview || "",
            listCertificates: form.listCertificates
          },
          inspectionTrackRecord: {
            howOftenUpdated: form.howOftenUpdated,
            lastInspectionDate: form.lastInspectionDate
          },
          qcStaffCount: form.qcStaffCount,
          onlineQC: {
            isOnlineQC: form.isOnlineQC,
            onlineQCManualAvailable: form.onlineQCManualAvailable,
            onlineQCTestingEquipment: form.onlineQCTestingEquipment,
            onlineQCRecordsAvailable: form.onlineQCRecordsAvailable,
            onlineQCRecord1: form.onlineQCRecord1?.[0]?.preview || "",
            onlineQCRecord2: form.onlineQCRecord2?.[0]?.preview || ""
          },
          finalQC: {
            isFinalQC: form.isFinalQC,
            finalQCManualAvailable: form.finalQCManualAvailable,
            finalQCTestingEquipment: form.finalQCTestingEquipment,
            finalQCRecordsAvailable: form.finalQCRecordsAvailable,
            finalQCLastResults: form.finalQCLastResults
          },
          incomingQC: {
            isIncomingQC: form.isIncomingQC,
            incomingQCManualAvailable: form.incomingQCManualAvailable,
            incomingQCTestingEquipment: form.incomingQCTestingEquipment,
            incomingQCRecordsAvailable: form.incomingQCRecordsAvailable,
            rawMaterialQCRecord1: form.rawMaterialQCRecord1?.[0]?.preview || "",
            rawMaterialQCRecord2: form.rawMaterialQCRecord2?.[0]?.preview || ""
          },
          testEquipmentPhotos: {
            testEquipment1: form.testEquipment1?.[0]?.preview || "",
            testEquipment2: form.testEquipment2?.[0]?.preview || ""
          },
          part5Score: form.part5Score
        },

        part6: {
          rdSpecificStaffCount: form.rdSpecificStaffCount,
          rdSpecificFacilities: form.rdSpecificFacilities,
          sampleProductionProcess: form.sampleProductionProcess,
          rdRecord: form.rdRecord,
          approvalSampleLeadTime: form.approvalSampleLeadTime,
          part6Score: form.part6Score
        },

        part7: {
          envManagement: {
            iso14000Status: form.iso14000Status,
            iso14000Comment: form.iso14000Comment,
            internalEnvStatus: form.internalEnvStatus,
            internalEnvComment: form.internalEnvComment,
            envPolicyStatus: form.envPolicyStatus,
            envPolicyDescription: form.envPolicyDescription,
            envListCertificates: form.envListCertificates
          },
          wastewaterReport: {
            wastewaterStaffInCharge: form.wastewaterStaffInCharge,
            wastewaterPhoto1: form.wastewaterPhoto1?.[0]?.preview || "",
            wastewaterPhoto2: form.wastewaterPhoto2?.[0]?.preview || ""
          },
          controlTrackRecord: {
            envControlRecordsStatus: form.envControlRecordsStatus,
            envUpdateFrequency: form.envUpdateFrequency,
            envItemChecked: form.envItemChecked,
            envLastControlDate: form.envLastControlDate,
            envFindings: form.envFindings,
            envStandard: form.envStandard
          },
          preventiveActions: form.preventiveActions || [],
          envPhotos: form.envPhotos || [],
          part7Score: form.part7Score
        }
      };

      const saveResponse = await fetch(
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
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error generating report. Please try again.");
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
    { id: 1, label: "General Information", component: (
      <GeneralInfo 
        form={formWithSchema} 
        handleChange={handleChange} 
        handleGeneralPhotoUpload={handleGeneralPhotoUpload}
        setForm={setForm}
        isPhotoProcessing={isPhotoProcessing}
        isMobile={isMobile}
      />
    ) },
    { id: 2, label: "Audit Overview", component: <AuditOverview form={formWithSchema} setForm={setForm} /> },
    { id: 3, label: "Remarks & Suggestions", component: <RemarksAndSuggestions form={formWithSchema} handleChange={handleChange} /> },
    { id: 4, label: "Part 1: Supplier Profile", component: <SupplierProfile form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 5, label: "Part 2: Organization Chart", component: <OrganizationChart form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 6, label: "Part 3: Production Lines", component: <ProductionLines form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 7, label: "Part 4: Machinery", component: <Machinery form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 8, label: "Part 5: QA/QC System", component: <QAQCSystem form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 9, label: "Part 6: R&D Capacity", component: <RDCapacity form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 10, label: "Part 7: Environment", component: <Environment form={formWithSchema} handleChange={handleChange} setForm={setForm} /> },
    { id: 11, label: "Finalize & Download", component: (
      <FinalStep 
        reportDownloaded={reportDownloaded} 
        clearFormAfterDownload={clearFormAfterDownload} 
        submit={submit} 
        isGenerating={isGenerating} 
      />
    ) },
  ];

  const currentStep = steps.find(s => s.id === step);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: "10px", display: "flex", overflowX: "auto", gap: "8px", scrollbarWidth: "none" }}>
        {steps.map(s => (
          <button 
            key={s.id} 
            onClick={() => setStep(s.id)} 
            style={{ 
              border: "none", 
              background: step === s.id ? colors.primaryLight : "transparent", 
              color: step === s.id ? colors.primary : colors.text, 
              borderRadius: "6px", padding: "8px 12px", whiteSpace: "nowrap", 
              cursor: "pointer", fontWeight: step === s.id ? "700" : "500", fontSize: "13px",
              transition: "all 0.2s"
            }}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 15px" : "40px" }}>
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontSize: isMobile ? "24px" : "36px", fontWeight: "900", color: colors.header, marginBottom: "10px", letterSpacing: "-0.5px" }}>Factory Audit Module</h1>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <span style={{ padding: "4px 12px", background: colors.primaryLight, color: colors.primary, borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>STEP {step} OF {steps.length}</span>
              <span style={{ color: colors.textMuted, fontSize: "14px", fontWeight: "500" }}>{currentStep?.label}</span>
            </div>
            <div style={{ width: "100%", height: "4px", background: colors.border, borderRadius: "2px", marginTop: "20px", overflow: "hidden" }}>
              <div style={{ width: `${(step / steps.length) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}></div>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-end", gap: "12px", marginBottom: "30px", flexWrap: "wrap" }}>
            <button onClick={autofillDemoData} style={{ padding: "10px 20px", background: colors.primary, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)", transition: "all 0.2s" }}>⚡ Autofill Demo Data</button>
            <button onClick={handleSaveDraft} style={{ padding: "10px 20px", background: colors.warning, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)", transition: "all 0.2s" }}>💾 Save Draft</button>
            <button onClick={clearForm} style={{ padding: "10px 20px", background: colors.danger, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)", transition: "all 0.2s" }}>⟲ Clear</button>
          </div>
          
          <div style={{ animation: "fadeIn 0.4s ease-out" }}>
            {currentStep?.component}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "60px", padding: "30px 0", borderTop: `1px solid ${colors.border}` }}>
            <button 
              onClick={() => setStep(s => Math.max(1, s - 1))} 
              disabled={step === 1} 
              style={{ 
                padding: "14px 28px", borderRadius: "10px", border: `1px solid ${colors.border}`, 
                background: "#fff", color: colors.text, fontWeight: "600", 
                cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? 0.5 : 1,
                transition: "all 0.2s"
              }}
            >
              ← Previous Section
            </button>
            {step < steps.length && (
              <button 
                onClick={() => setStep(s => Math.min(steps.length, s + 1))} 
                style={{ 
                  padding: "14px 32px", borderRadius: "10px", border: "none", 
                  background: colors.primary, color: "#fff", fontWeight: "700", 
                  cursor: "pointer", boxShadow: "0 4px 14px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.2s"
                }}
              >
                Next Section →
              </button>
            )}
          </div>
        </div>
      </div>
      
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
