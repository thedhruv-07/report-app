import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import ReportLoader from '../../components/shared/ReportLoader';
import { ENDPOINTS } from '../../config/api';
import { colors } from '../../styles';
import { ReportMetaContext } from '../../context/ReportMetaContext';
import { readImagePreview } from '../../utils/fileUtils';
import { useAuth } from '../../context/AuthContext';

const GeneralInfo = lazy(() => import('./components/SectionA_Summary'));
const InspectionSummaryTable = lazy(() => import('./components/InspectionSummaryTable'));
const RemarksStep = lazy(() => import('./components/RemarksStep'));
const QuantityDetails = lazy(() => import('./components/QuantityDetails'));
const ConclusionStep = lazy(() => import('./components/ConclusionStep'));
const WorkmanshipDefects = lazy(() => import('./components/WorkmanshipDefects'));
const OnSiteTests = lazy(() => import('./components/OnSiteTests'));
const ProductSpecification = lazy(() => import('./components/ProductSpecification'));
const Packing = lazy(() => import('./components/FinalDetails'));
const MarkingLabeling = lazy(() => import('./components/MarkingLabeling'));
const ClientSpecialRequirement = lazy(() => import('./components/ClientSpecialRequirement'));
const Photos = lazy(() => import('./components/Photos'));
const ReportReview = lazy(() => import('../shared/components/ReportReview'));
const FinalStep = lazy(() => import('./components/FinalStep'));
const SectionCompletionModal = lazy(() => import('./components/SectionCompletionModal'));

// Required fields per step — only steps with mandatory fields are listed
const STEP_LABELS = {
  1: 'General Information', 2: 'Inspection Summary', 4: 'Conclusion',
  5: 'Quantity Details', 6: 'Workmanship Defects', 7: 'On-Site Tests',
  8: 'Product Specification', 9: 'Packing', 10: 'Marking & Labeling',
  11: 'Client Special Requirements',
};
const STEP_REQUIRED = {
  1: [
    { key: 'client',            label: 'Client Name' },
    { key: 'factory',           label: 'Factory Name' },
    { key: 'productName',       label: 'Product Name' },
    { key: 'inspectionDate',    label: 'Inspection Date' },
    { key: 'inspectionLocation',label: 'Inspection Location' },
  ],
  2: [
    { key: 'inspectionLevel', label: 'Inspection Level' },
    { key: 'sampleSize',      label: 'Sample Size' },
    { key: 'acceptPoint',     label: 'Accept Point' },
    { key: 'rejectPoint',     label: 'Reject Point' },
  ],
  4:  [{ key: 'conclusionStatus',        label: 'Conclusion' }],
  6:  [{ key: 'workmanshipResult',       label: 'Workmanship Result' }],
  7:  [{ key: 'onSiteTestResult',        label: 'Overall Result' }],
  8:  [{ key: 'productResult',           label: 'Product Spec Result' }],
  9:  [{ key: 'packing_result',          label: 'Packing Result' }],
  10: [{ key: 'marking_result_final',    label: 'Marking Result' }],
  11: [{ key: 'client_requirement_result', label: 'Client Req. Result' }],
};
const getMissingFields = (step, form, items) => {
  if (step === 5) {
    return items.some(it => Number(it.orderQty) > 0) ? [] : [{ label: 'Order Quantity (at least one item)' }];
  }
  const required = STEP_REQUIRED[step];
  if (!required) return [];
  return required.filter(f => !form[f.key] || !String(form[f.key]).trim());
};

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


const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// Ensure no field in the saved form is a plain object (e.g. aql.inspectionStandard
// shipped as {critical, major, minor}). Objects cannot be rendered as React children.
const FIELD_DEFAULTS = {
  inspectionStandard:   'ANSI/ASQ Z1.4 (ISO 2859-1)',
  inspectionStandardWM: 'ANSI/ASQ Z1.4 (ISO 2859-1)',
  samplingPlan:         'Normal, Single',
  samplingPlanWM:       'Normal, Single',
  aqlCriticalWM:        'Not Allowed',
  aqlMajorWM:           '2.5',
  aqlMinorWM:           '4.0',
  inspectionLevel:      'Level II',
  inspectionLevelWM:    'Level II',
};

const sanitizeForm = (form) => {
  if (!form || typeof form !== 'object') return {};
  const result = { ...form };
  Object.keys(FIELD_DEFAULTS).forEach(key => {
    const val = result[key];
    // Case 1: value is a plain object (e.g. {critical, major, minor}) — replace with default
    if (val !== null && val !== undefined && typeof val === 'object') {
      result[key] = FIELD_DEFAULTS[key];
    }
    // Case 2: value is a string that looks like the old wrong conversion "Critical: X, Major: Y..."
    if (typeof val === 'string' && /^Critical:/i.test(val.trim())) {
      result[key] = FIELD_DEFAULTS[key];
    }
  });
  return result;
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

// ISO 2859-1 AQL sample size lookup (Normal Inspection Level II as baseline)
const AQL_TABLE = [
  { max: 8,       size: 2   },
  { max: 15,      size: 3   },
  { max: 25,      size: 5   },
  { max: 50,      size: 8   },
  { max: 90,      size: 13  },
  { max: 150,     size: 20  },
  { max: 280,     size: 32  },
  { max: 500,     size: 50  },
  { max: 1200,    size: 80  },
  { max: 3200,    size: 125 },
  { max: 10000,   size: 200 },
  { max: 35000,   size: 315 },
  { max: 150000,  size: 500 },
  { max: 500000,  size: 800 },
  { max: Infinity,size: 1250},
];

const calcAqlSampleSize = (totalQty, inspectionLevel) => {
  if (!totalQty || totalQty <= 0) return null;
  const lvl = String(inspectionLevel || '').toUpperCase();
  let idx = AQL_TABLE.findIndex(r => totalQty <= r.max);
  if (idx < 0) idx = AQL_TABLE.length - 1;
  // Level I: one step down; Level III: one step up
  if (lvl.includes('I') && !lvl.includes('II') && !lvl.includes('III')) idx = Math.max(0, idx - 1);
  else if (lvl.includes('III')) idx = Math.min(AQL_TABLE.length - 1, idx + 1);
  return AQL_TABLE[idx].size;
};

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


  const [form, setForm] = useState(() => {
    const savedForm = localStorage.getItem("inspectionForm");
    const parsedForm = safeJsonParse(savedForm, {});
    return sanitizeForm(parsedForm);
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

  const [testRows, setTestRows] = useState(() =>
    safeJsonParse(localStorage.getItem("inspectionTestRows"), [{ id: 1 }])
  );
  const [testNextId, setTestNextId] = useState(() => {
    const rows = safeJsonParse(localStorage.getItem("inspectionTestRows"), [{ id: 1 }]);
    return Math.max(...rows.map(r => r.id), 1) + 1;
  });

  const [savedSuggestion, setSavedSuggestion] = useState(() =>
    safeJsonParse(localStorage.getItem("inspectionLastSubmittedTemplate"), null)
  );
  const [savedSuggestionDismissed, setSavedSuggestionDismissed] = useState(false);
  const [reportDownloaded, setReportDownloaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [sectionReasons, setSectionReasons] = useState({});
  const [completionModal, setCompletionModal] = useState(null); // { step, stepLabel, missing }

  const { token } = useAuth();
  const location = useLocation();
  const prefillData = location.state?.task?.prefillData ?? null;
  const taskId = location.state?.task?._id ?? null;

  // Persist the locked-AQL flag so it survives page refresh
  const [aqlLocked, setAqlLocked] = useState(() => {
    return localStorage.getItem("inspectionAqlLocked") === "true";
  });

  useEffect(() => {
    if (prefillData) {
      localStorage.setItem("inspectionAqlLocked", "true");
      setAqlLocked(true);
    }
  }, [prefillData]);

  // Fields that came from admin booking — inspector cannot edit these
  const lockedFields = useMemo(() => {
    if (!prefillData) return new Set();
    const locked = new Set();
    if (prefillData.client?.name)       locked.add('client');
    if (prefillData.factory?.name)      { locked.add('supplier'); locked.add('factory'); }
    if (prefillData.factory?.address || prefillData.factory?.city || prefillData.factory?.country) locked.add('inspectionLocation');
    if (prefillData.inspectionDate)     locked.add('inspectionDate');
    if (prefillData.product?.description) locked.add('productName');
    if (prefillData.product?.poNumber)  locked.add('po');
    if (prefillData.countryOfOrigin)    locked.add('country');
    if (prefillData.product?.quantity != null && prefillData.product?.quantity !== '') locked.add('orderQuantity');
    if (prefillData.serviceType)        locked.add('servicePerformed');
    return locked;
  }, [prefillData]);

  // Number of on-site test rows pre-filled by admin (these rows are locked for inspector)
  const lockedTestCount = prefillData?.onSiteTests?.length ?? 0;
  const lockedRequirementsCount = useMemo(() => {
    let count = 0;
    const scr = prefillData || {};
    if (scr.colorMaterialFinish) count++;
    if (scr.dimensionWeight) count++;
    if (scr.logoLabel) count++;
    if (scr.packingMaterial) count++;
    if (scr.shippingMark) count++;
    if (scr.customerSpecialRequirements) {
      count += scr.customerSpecialRequirements.split('\n').map(l => l.trim()).filter(Boolean).length;
    }
    if (scr.clientRequirements) {
      if (typeof scr.clientRequirements === 'string') {
        count += scr.clientRequirements.split('\n').map(l => l.trim()).filter(Boolean).length;
      } else if (Array.isArray(scr.clientRequirements)) {
        count += scr.clientRequirements.length;
      }
    }
    return count;
  }, [prefillData]);

  const [prefillBannerDismissed, setPrefillBannerDismissed] = useState(false);

  useEffect(() => {
    if (!prefillData) return;
    const factoryAddress = [
      prefillData.factory?.address,
      prefillData.factory?.city,
      prefillData.factory?.country,
    ].filter(Boolean).join(', ');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(prev => {
      // Build locked client requirement rows from SCR + general requirement
      const buildClientRequirements = () => {
        const scrRows = [];
        const scr = prefillData;
        // Structured SCR fields become labelled locked rows
        if (scr.colorMaterialFinish)        scrRows.push({ index: 0, requirement: `Color / Material / Finish: ${scr.colorMaterialFinish}`, result: '' });
        if (scr.dimensionWeight)            scrRows.push({ index: 0, requirement: `Dimension / Weight: ${scr.dimensionWeight}`, result: '' });
        if (scr.logoLabel)                  scrRows.push({ index: 0, requirement: `Logo / Label: ${scr.logoLabel}`, result: '' });
        if (scr.packingMaterial)            scrRows.push({ index: 0, requirement: `Packing Material: ${scr.packingMaterial}`, result: '' });
        if (scr.shippingMark)               scrRows.push({ index: 0, requirement: `Shipping Mark: ${scr.shippingMark}`, result: '' });
        if (scr.customerSpecialRequirements) scr.customerSpecialRequirements.split('\n').map(l => l.trim()).filter(Boolean).forEach(r => scrRows.push({ index: 0, requirement: r, result: '' }));

        // General requirement lines (from TM/CS instructions)
        const genRows = prefillData.clientRequirements
          ? (typeof prefillData.clientRequirements === 'string'
              ? prefillData.clientRequirements.split('\n').map(l => l.trim()).filter(Boolean).map(r => ({ index: 0, requirement: r, result: '' }))
              : Array.isArray(prefillData.clientRequirements) ? prefillData.clientRequirements : [])
          : [];

        const allRows = [...scrRows, ...genRows];
        if (allRows.length === 0) return prev.clientRequirements;
        return allRows.map((r, i) => ({ ...r, index: i + 1 }));
      };

      const update = {
        ...prev,
        servicePerformed:   prefillData.serviceType             || prev.servicePerformed || 'Pre-Shipment Inspection',
        client:             prefillData.client?.name            || prev.client,
        supplier:           prefillData.supplier?.name          || prefillData.factory?.name || prev.supplier,
        factory:            prefillData.factory?.name           || prev.factory,
        factoryContact:     prefillData.factory?.contact        || prev.factoryContact || '',
        factoryPhone:       prefillData.factory?.phone          || prefillData.factory?.mobile || prev.factoryPhone || '',
        factoryWorkingTime: prefillData.factory?.workingTime    || prev.factoryWorkingTime || '',
        inspectionLocation: factoryAddress                      || prev.inspectionLocation,
        inspectionDate:     prefillData.inspectionDate?.slice(0, 10) || prev.inspectionDate,
        inspectionDateTo:   prefillData.inspectionDateTo ? String(prefillData.inspectionDateTo).slice(0, 10) : prev.inspectionDateTo || '',
        shipmentDate:       prefillData.shipmentDate ? String(prefillData.shipmentDate).slice(0, 10) : prev.shipmentDate || '',
        productName:        prefillData.product?.description    || prev.productName,
        po:                 prefillData.product?.poNumber       || prev.po,
        itemNo:             prefillData.product?.itemNo         || prev.itemNo || '',
        country:            prefillData.country                 || prefillData.countryOfOrigin || prev.country,
        orderQuantity:      String(prefillData.product?.quantity ?? prev.orderQuantity ?? ''),
        orderRemarks:       prefillData.orderRemarks            || prev.orderRemarks || '',
        inspectionLevel:    prefillData.aql?.inspectionLevel    || prev.inspectionLevel,
        sampleSize:         String(prefillData.aql?.sampleSize ?? prefillData.aql?.sampledQuantity ?? prev.sampleSize ?? ''),
        acceptPoint:        String(prefillData.aql?.acceptPoint ?? prefillData.aql?.acceptedCritical ?? prev.acceptPoint ?? ''),
        rejectPoint:        String(prefillData.aql?.rejectPoint ?? prefillData.aql?.acceptedMajor ?? prev.rejectPoint ?? ''),
        // Mirror into WorkmanshipDefects AQL fields
        inspectionLevelWM:   prefillData.aql?.inspectionLevel || prefillData.aql?.samplingLevel || prev.inspectionLevelWM,
        sampleSizeWM:        String(prefillData.aql?.sampleSize ?? prefillData.aql?.sampledQuantity ?? prev.sampleSizeWM ?? ''),
        aqlCriticalWM:       prefillData.aql?.aqlCritical     || prev.aqlCriticalWM || 'Not Allowed',
        aqlMajorWM:          prefillData.aql?.aqlMajor        || prev.aqlMajorWM    || '2.5',
        aqlMinorWM:          prefillData.aql?.aqlMinor        || prev.aqlMinorWM    || '4.0',
        acceptedCritical:    prefillData.aql?.acceptedCritical || prev.acceptedCritical || '0',
        acceptedMajor:       prefillData.aql?.acceptedMajor   || prev.acceptedMajor   || '0',
        acceptedMinor:       prefillData.aql?.acceptedMinor   || prev.acceptedMinor   || '0',
        // Inspection standard & sampling plan — always strings (Step 2 + Step 6)
        inspectionStandard:  typeof prefillData.aql?.inspectionStandard === 'string'
          ? prefillData.aql.inspectionStandard
          : prev.inspectionStandard || 'ANSI/ASQ Z1.4 (ISO 2859-1)',
        inspectionStandardWM: typeof prefillData.aql?.inspectionStandard === 'string'
          ? prefillData.aql.inspectionStandard
          : prev.inspectionStandardWM || 'ANSI/ASQ Z1.4 (ISO 2859-1)',
        samplingPlan:        prefillData.aql?.samplingPlan    || prev.samplingPlan   || 'Normal, Single',
        samplingPlanWM:      prefillData.aql?.samplingPlan    || prev.samplingPlanWM || 'Normal, Single',
        // Client special requirements — SCR rows locked, inspector can only fill Result column
        clientRequirements: buildClientRequirements(),
        // Seed first barcode row location with the inspection site
        barcode_location_1: prev.barcode_location_1 || factoryAddress || '',
      };
      // Pre-fill On-Site Tests table rows from booking data
      if (prefillData.onSiteTests?.length) {
        prefillData.onSiteTests.forEach((t, i) => {
          update[`testDesc${i + 1}`]   = t.description || '';
          update[`testMethod${i + 1}`] = t.method      || '';
          update[`testSample${i + 1}`] = t.sampleSize  || '';
        });
      }
      return update;
    });

    // Seed quantity rows from all products in the notice
    const prefillProducts = prefillData.products?.length
      ? prefillData.products
      : prefillData.product
        ? [{ productName: prefillData.product.description || prefillData.product.name || '', quantity: prefillData.product.quantity || '', orderNo: prefillData.product.poNumber || '' }]
        : null;

    if (prefillProducts?.length) {
      const totalQty = prefillProducts.reduce((s, p) => s + Number(p.quantity || 0), 0);
      const totalPacked = prefillData.quantityPacked || 0;
      const totalFinished = prefillData.quantityFinished || 0;
      setItems(prefillProducts.map(p => {
        const qty = Number(p.quantity || 0);
        const share = totalQty > 0 ? qty / totalQty : 1;
        const packedShare  = totalPacked   ? String(Math.round(totalPacked   * share)) : '';
        const finishedShare= totalFinished ? String(Math.round(totalFinished * share)) : '';
        return {
          po:               p.orderNo || '',
          itemName:         p.productName || p.name || '',
          orderQty:         String(qty || ''),
          qtyPerCarton:     '',
          cartons:          '',
          selectedCartons:  '',
          packedBreakdown:  packedShare,
          unpackedBreakdown: '',
          unfinishedBreakdown: finishedShare
            ? String(Math.max(0, qty - Number(finishedShare)))
            : '',
          sampleSizePacked: '',
          sampleSizeUnpacked: '',
        };
      }));
    }
    // Sync test row count to match prefilled tests
    if (prefillData.onSiteTests?.length) {
      const rows = prefillData.onSiteTests.map((_, i) => ({ id: i + 1 }));
      setTestRows(rows);
      setTestNextId(rows.length + 1);
    }
  }, [prefillData]);

  // Responsiveness Support
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

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
    localStorage.setItem("inspectionItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("inspectionPhotos", JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem("inspectionPhotoGroups", JSON.stringify(photoGroups));
  }, [photoGroups]);

  useEffect(() => {
    localStorage.setItem("inspectionTestRows", JSON.stringify(testRows));
  }, [testRows]);

  // Add global styles
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      * {
        font-family: Arial, Helvetica, sans-serif;
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
    const { name, value } = e.target;
    setForm(prev => {
      const update = { ...prev, [name]: value };
      // Keep AQL params consistent between InspectionSummaryTable (step 2) and WorkmanshipDefects (step 6)
      if (name === 'inspectionLevel') update.inspectionLevelWM = value;
      if (name === 'sampleSize') update.sampleSizeWM = value;
      return update;
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);

    // When order quantity changes, recalculate AQL sample size (unless locked by booking)
    if (field === 'orderQty' && !aqlLocked) {
      const totalQty = newItems.reduce((s, it) => s + (Number(it.orderQty) || 0), 0);
      const newSize = calcAqlSampleSize(totalQty, form.inspectionLevel);
      if (newSize !== null) {
        setForm(prev => ({
          ...prev,
          orderQuantity: String(totalQty),
          sampleSize: String(newSize),
          sampleSizeWM: String(newSize),
        }));
      }
    }
  };

  const addItem = () => {
    setItems([...items, { name: "", orderQty: "", availableQty: "" }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePhotoGroupsChange = (updatedGroups) => {
    setPhotoGroups(Array.isArray(updatedGroups) ? updatedGroups : []);
  };


  const handleClientRequirementsChange = useCallback((requirements) => {
    setForm((prev) => ({
      ...prev,
      clientRequirements: Array.isArray(requirements) ? requirements : [],
    }));
  }, []);

  const handleWorkmanshipDefectsChange = useCallback((defects) => {
    setForm((prev) => ({
      ...prev,
      workmanshipDefects: Array.isArray(defects) ? defects : [],
    }));
  }, []);

  const handleWorkmanshipPhotosChange = useCallback((photos) => {
    setForm((prev) => ({
      ...prev,
      workmanshipPhotos: Array.isArray(photos) ? photos : [],
    }));
  }, []);

  const handlePhotoFileChange = async (files, description = "", existingGroupId = null) => {
    const groupId = existingGroupId || `group_${Date.now()}_${Math.random()}`;
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

      // Otherwise extract the File object
      const file = item.file || item;
      const uniqueId = item.id || `${Date.now()}_${Math.random()}_${index}`;
      photoIds.push(uniqueId);

      try {
        const preview = await readImagePreview(file);
        setPhotos(prevPhotos => [
          ...prevPhotos,
          { id: uniqueId, label: item.label || description, file, preview, originalSize: file.size, compressedSize: file.size }
        ]);
      } catch (error) {
        console.error(`Failed to read image: ${file.name}`, error);
      }
    }

    if (existingGroupId) {
      // Append photos to existing group
      setPhotoGroups(prevGroups => prevGroups.map(g =>
        g.id === existingGroupId
          ? { ...g, photoIds: [...(g.photoIds || []), ...photoIds] }
          : g
      ));
    } else {
      // Create a new group
      setPhotoGroups(prevGroups => [
        ...prevGroups,
        { id: groupId, description, photoIds },
      ]);
    }
  };

  const removePhoto = (id) => {
    const newPhotos = photos.filter(p => p.id !== id);
    setPhotos(newPhotos);
  };

  const handleUpdatePhotoLabel = (photoId, label) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, label } : p));
  };

  const handleGeneralPhotoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const preview = await readImagePreview(file);
      setForm(prev => ({ ...prev, generalPhoto: preview }));
    } catch { /* ignore */ }
  };

  const clearGeneralPhoto = () => setForm(prev => ({ ...prev, generalPhoto: null }));

  const clearFormAfterDownload = () => {
    if (!window.confirm("Start a new report? This will clear all current sections.")) return;

    localStorage.removeItem("inspectionStep");
    localStorage.removeItem("inspectionForm");
    localStorage.removeItem("inspectionItems");
    localStorage.removeItem("inspectionPhotos");
    localStorage.removeItem("inspectionPhotoGroups");
    localStorage.removeItem("inspectionGeneralPhoto");
    localStorage.removeItem("inspectionGeneralPhotoData");
    localStorage.removeItem("inspectionAqlLocked");
    localStorage.removeItem("inspectionTestRows");

    setStep(1);
    setForm({});
    setItems([{ name: "", orderQty: "", availableQty: "" }]);
    setPhotos([]);
    setPhotoGroups([]);
    setTestRows([{ id: 1 }]);
    setTestNextId(2);
    setSavedSuggestionDismissed(false);
    setReportDownloaded(false);
    setAqlLocked(false);
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

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("inspectionForm", JSON.stringify(form));
      localStorage.setItem("inspectionItems", JSON.stringify(items));
      localStorage.setItem("inspectionPhotos", JSON.stringify(photos));
      localStorage.setItem("inspectionPhotoGroups", JSON.stringify(photoGroups));
      localStorage.setItem("inspectionStep", step.toString());
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (error) {
      console.error("Draft save failed:", error);
      alert("Failed to save draft locally. Local storage might be full.");
    }
  };

  const next = () => {
    const missing = getMissingFields(step, form, items);
    if (missing.length > 0) {
      setCompletionModal({ step, stepLabel: STEP_LABELS[step] || `Step ${step}`, missing });
    } else {
      setStep(step + 1);
    }
  };

  const handleSkipConfirm = async (reason) => {
    const entry = { reason, missingFields: completionModal.missing.map(f => f.label), skippedAt: new Date().toISOString() };
    setSectionReasons(prev => ({ ...prev, [completionModal.step]: entry }));
    setCompletionModal(null);
    setStep(step + 1);
    if (taskId) {
      fetch(ENDPOINTS.INSPECTOR.SECTION_SKIP(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: completionModal.step, stepLabel: completionModal.stepLabel, reason, missingFields: entry.missingFields }),
      }).catch(() => {});
    }
  };

  const prev = () => setStep(step - 1);

  const submit = async (format = 'docx', notify = false) => {
    setIsGenerating(true);
    const formData = new FormData();
    formData.append("format", format);

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

    // Add items as JSON
    formData.append("items", JSON.stringify(items));
    if (taskId) formData.append("taskId", taskId);

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

    const generateUrl = notify ? `${ENDPOINTS.GENERATE}?notify=true` : ENDPOINTS.GENERATE;
    const res = await fetch(generateUrl, {
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
    a.download = `PSI-Report-${stamp}.${format}`;
    a.click();
    setIsGenerating(false);
  };

  const stepNavItems = [
    { id: 1,  label: "General Information",  shortLabel: "General"      },
    { id: 2,  label: "Inspection Summary",   shortLabel: "Summary"      },
    { id: 3,  label: "Remarks",              shortLabel: "Remarks"      },
    { id: 4,  label: "Conclusion",           shortLabel: "Conclusion"   },
    { id: 5,  label: "Quantity",             shortLabel: "Quantity"     },
    { id: 6,  label: "Workmanship",          shortLabel: "Workmanship"  },
    { id: 7,  label: "On-Site Tests",        shortLabel: "On-Site"      },
    { id: 8,  label: "Product Spec",         shortLabel: "Prod. Spec"   },
    { id: 9,  label: "Packing",              shortLabel: "Packing"      },
    { id: 10, label: "Marking & Labeling",   shortLabel: "Marking"      },
    { id: 11, label: "Client Requirement",   shortLabel: "Client Req."  },
    { id: 12, label: "Photos",               shortLabel: "Photos"       },
    { id: 13, label: "Finalize & Download",  shortLabel: "Finalize"     },
  ];

  const goToStep = (targetStep) => {
    if (targetStep < 1 || targetStep > 13) return;
    setStep(targetStep);
  };


  const reportMeta = useMemo(() => ({
    product:        form.productName    || '',
    client:         form.client         || '',
    factory:        form.factory        || '',
    inspectionType: form.servicePerformed || 'Pre-Shipment Inspection',
    inspectionDate: form.inspectionDate || '',
  }), [form.productName, form.client, form.factory, form.servicePerformed, form.inspectionDate]);

  return (
    <ReportMetaContext.Provider value={reportMeta}>
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      overflow: "hidden",
      background: "#f8fafc",
      fontFamily: "'Outfit', Arial, sans-serif",
      boxSizing: "border-box",
      position: "relative"
    }}>
      {/* Top Navigation Header */}
      <div style={{
        width: "100%",
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        zIndex: 10,
        flexShrink: 0
      }}>
        {/* Breadcrumb + step indicator */}
        <div style={{ padding: "7px 16px 3px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Reports</span>
            <span style={{ fontSize: "11px", color: colors.textMuted }}>›</span>
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Pre-Shipment Inspection</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of 14</span>
        </div>
        {/* Tab pills */}
        <div style={{ overflowX: "auto", padding: "3px 12px 6px", display: "flex", gap: "4px", scrollbarWidth: "none" }}>
          {stepNavItems.map((item) => {
            const isActive = step === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goToStep(item.id)}
                style={{
                  border: "none",
                  background: isActive ? colors.primary : colors.surfaceAlt,
                  color: isActive ? "#fff" : colors.textMuted,
                  borderRadius: "20px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: isActive ? "700" : "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{
                  width: "15px", height: "15px", borderRadius: "50%",
                  background: isActive ? "rgba(255,255,255,0.25)" : colors.border,
                  color: isActive ? "#fff" : colors.textMuted,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: "bold", flexShrink: 0
                }}>{item.id}</span>
                {isActive ? item.label : item.shortLabel}
              </button>
            );
          })}
        </div>
        {/* Progress bar */}
        <div style={{ height: "3px", background: colors.border }}>
          <div style={{ width: `${(step / 14) * 100}%`, height: "100%", background: colors.primary, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main Content + Photo Sidebar */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        background: "#f8fafc",
        scrollBehavior: "smooth"
      }}>

        <div style={{
          width: "100%",
          margin: "0",
          background: "#f8fafc",
          padding: isMobile ? "10px 12px" : "14px 16px 14px 22px",
          minHeight: "fit-content"
        }}>

        {/* Compact action buttons */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginBottom: "12px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={quickFillForm}
            style={{ padding: "7px 12px", background: colors.success, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(16,185,129,0.2)" }}
          >
            ⚡ Quick Fill
          </button>
          <button
            onClick={handleSaveDraft}
            style={{ padding: "7px 12px", background: colors.warning, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600", boxShadow: "0 2px 6px rgba(245,158,11,0.2)" }}
            onMouseEnter={(e) => { e.target.style.background = colors.warningHover; }}
            onMouseLeave={(e) => { e.target.style.background = colors.warning; }}
          >
            💾 Save Draft
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

        {prefillData && !prefillBannerDismissed && (
          <div style={{
            marginBottom: "16px",
            padding: "12px 16px",
            background: "#dbeafe",
            border: "1px solid #93c5fd",
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px",
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: "600" }}>
                Auto-filled from Online Booking — review all fields before submitting
              </span>
              {prefillData.specialInstructions && (
                <div style={{ marginTop: "6px", padding: "8px 10px", background: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin Instructions: </span>
                  <span style={{ fontSize: "12px", color: "#1e40af" }}>{prefillData.specialInstructions}</span>
                </div>
              )}
            </div>
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

        <Suspense fallback={<ReportLoader />}>
          {step === 1 && <GeneralInfo form={form} handleChange={handleChange} onNext={next} handleGeneralPhotoUpload={handleGeneralPhotoUpload} clearGeneralPhoto={clearGeneralPhoto} lockedFields={lockedFields} />}
          {step === 2 && <InspectionSummaryTable form={form} handleChange={handleChange} onPrev={prev} onNext={next} lockedAql={aqlLocked} lockedOrderQty={lockedFields.has('orderQuantity')} />}
          {step === 3 && <RemarksStep form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
          {step === 4 && <ConclusionStep form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
          {step === 5 && <QuantityDetails items={items} onItemChange={handleItemChange} onAddItem={addItem} onRemoveItem={removeItem} form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
          {step === 6 && <WorkmanshipDefects form={form} handleChange={handleChange} onPrev={prev} onNext={next} onWorkmanshipDefectsChange={handleWorkmanshipDefectsChange} onWorkmanshipPhotosChange={handleWorkmanshipPhotosChange} items={items} lockedAql={aqlLocked} />}
          {step === 7 && <OnSiteTests form={form} handleChange={handleChange} testRows={testRows} setTestRows={setTestRows} testNextId={testNextId} setTestNextId={setTestNextId} lockedTestCount={lockedTestCount} onPrev={prev} onNext={next} />}
          {step === 8 && <ProductSpecification form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
          {step === 9 && <Packing form={form} handleChange={handleChange} quantityItems={items} onPrev={prev} onNext={next} />}
          {step === 10 && <MarkingLabeling form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
          {step === 11 && <ClientSpecialRequirement form={form} handleChange={handleChange} onPrev={prev} onNext={next} onRequirementsChange={handleClientRequirementsChange} lockedRequirementsCount={lockedRequirementsCount} />}
          {step === 12 && <Photos photos={photos} photoGroups={photoGroups} onPhotoGroupsChange={handlePhotoGroupsChange} onPhotoFileChange={handlePhotoFileChange} onRemovePhoto={removePhoto} onUpdatePhotoLabel={handleUpdatePhotoLabel} onPrev={prev} onNext={next} />}
          {step === 13 && <ReportReview
            conclusion={form.conclusionStatus}
            onEditStep={(s) => setStep(s)}
            allPhotos={photos}
            onPrev={prev}
            onNext={next}
            sections={[
              {
                title: 'General Information', icon: '📋', stepIndex: 1,
                fields: [
                  { label: 'Service', value: form.servicePerformed },
                  { label: 'Client', value: form.client },
                  { label: 'Supplier', value: form.supplier },
                  { label: 'Factory', value: form.factory },
                  { label: 'Inspection Location', value: form.inspectionLocation },
                  { label: 'Inspection Date', value: form.inspectionDate },
                  { label: 'Product', value: form.productName },
                  { label: 'PO Number', value: form.po },
                  { label: 'Country of Origin', value: form.country },
                ],
              },
              {
                title: 'AQL & Standards', icon: '📐', stepIndex: 2,
                fields: [
                  { label: 'Inspection Level', value: form.inspectionLevel },
                  { label: 'Sample Size', value: form.sampleSize },
                  { label: 'Accept Point', value: form.acceptPoint },
                  { label: 'Reject Point', value: form.rejectPoint },
                  { label: 'Inspection Standard', value: form.inspectionStandardWM },
                  { label: 'Sampling Plan', value: form.samplingPlanWM },
                ],
              },
              {
                title: 'Quantity Details', icon: '📦', stepIndex: 5,
                type: 'items',
                items: items,
                fields: [
                  { label: 'Selected Cartons', value: form.selectedCartonsCount },
                  { label: 'Quantity Result', value: form.quantityResult },
                ],
              },
              {
                title: 'Workmanship Defects', icon: '🔍', stepIndex: 6,
                fields: [
                  { label: 'Sample Size', value: form.sampleSizeWM },
                  { label: 'Critical AQL', value: form.aqlCriticalWM },
                  { label: 'Major AQL', value: form.aqlMajorWM },
                  { label: 'Minor AQL', value: form.aqlMinorWM },
                  { label: 'Critical Found', value: form.totalFoundCritical },
                  { label: 'Major Found', value: form.totalFoundMajor },
                  { label: 'Minor Found', value: form.totalFoundMinor },
                  { label: 'Result', value: form.workmanshipResult },
                ],
              },
              {
                title: 'On-Site Tests', icon: '🧪', stepIndex: 7,
                fields: [
                  ...testRows
                    .filter(row => form[`testDesc${row.id}`])
                    .map((row, i) => ({
                      label: `Test ${i + 1}`,
                      value: [
                        form[`testDesc${row.id}`],
                        form[`testMethod${row.id}`] && `Method: ${form[`testMethod${row.id}`]}`,
                        form[`testSample${row.id}`] && `Sample: ${form[`testSample${row.id}`]}`,
                        form[`testResult${row.id}`] && `Result: ${form[`testResult${row.id}`]}`,
                      ].filter(Boolean).join(' | '),
                    })),
                  { label: 'Overall Result', value: form.onSiteTestResult },
                  { label: 'Remark', value: form.onSiteTestRemark },
                ],
              },
              {
                title: 'Packing & Marking', icon: '🏷️', stepIndex: 9,
                fields: [
                  { label: 'Packing Result', value: form.packing_result },
                  { label: 'Marking Result', value: form.marking_result_final },
                  { label: 'Client Req. Result', value: form.client_requirement_result },
                ],
              },
              {
                title: 'Remarks & Conclusion', icon: '📝', stepIndex: 3,
                fields: [
                  { label: 'Conclusion', value: form.conclusionStatus },
                  { label: 'Recommendation', value: form.recommendationText },
                  ...(Array.isArray(form.remarks) ? form.remarks.map((r, i) => ({ label: `Remark ${i + 1}`, value: r })).filter(r => r.value) : []),
                ],
              },
              {
                title: 'Photos', icon: '📷', stepIndex: 12,
                type: 'photos',
                groups: photoGroups,
              },
            ]}
          />}
          {step === 14 && <FinalStep form={form} onPrev={prev} onSubmit={submit} onClearAfterDownload={clearFormAfterDownload} hasDownloaded={reportDownloaded} isGenerating={isGenerating} onToggleLoader={setIsGenerating} />}
        </Suspense>

        </div>
      </div>


      </div>{/* end flex row */}

      {isGenerating && <ReportLoader />}

      {completionModal && (
        <Suspense fallback={null}>
          <SectionCompletionModal
            stepLabel={completionModal.stepLabel}
            missingFields={completionModal.missing.map(f => f.label)}
            onConfirm={handleSkipConfirm}
            onGoBack={() => setCompletionModal(null)}
          />
        </Suspense>
      )}
      
      {/* Save Toast Notification */}
      {showSaveToast && (
        <div style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          background: colors.text,
          color: "#fff",
          padding: "12px 24px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          zIndex: 10001,
          animation: "slideUp 0.3s ease-out",
          fontSize: "14px",
          fontWeight: "600"
        }}>
          <span style={{ fontSize: "18px" }}>✅</span>
          Draft Saved Successfully!
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
    </ReportMetaContext.Provider>
  );
}

export default App;