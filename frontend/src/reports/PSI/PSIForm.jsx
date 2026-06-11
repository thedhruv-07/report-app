import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import ReportLoader from '../../components/shared/ReportLoader';
import { ENDPOINTS } from '../../config/api';
import { colors } from '../../styles';
import { ReportMetaContext } from '../../context/ReportMetaContext';
import { readImagePreview } from '../../utils/fileUtils';
import { useAuth } from '../../context/AuthContext';
import PrefillToast from '../shared/components/PrefillToast';

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
  1: 'General Information', 2: 'Inspection Summary', 3: 'Remarks',
  4: 'Conclusion', 5: 'Quantity Details', 6: 'Workmanship Defects',
  7: 'On-Site Tests', 8: 'Product Specification', 9: 'Packing',
  10: 'Marking & Labeling', 11: 'Client Special Requirements',
};
const STEP_REQUIRED = {
  1: [
    { key: 'client', label: 'Client Name' },
    { key: 'factory', label: 'Factory Name' },
    { key: 'productName', label: 'Product Name' },
    { key: 'inspectionDate', label: 'Inspection Date' },
    { key: 'inspectionLocation', label: 'Inspection Location' },
  ],
  2: [
    { key: 'sampleSize', label: 'Sample Size' },
    { key: 'overallResult', label: 'Overall Result' },
  ],
  4: [{ key: 'conclusionStatus', label: 'Conclusion' }],
  6: [{ key: 'workmanshipResult', label: 'Workmanship Result' }],
  7: [{ key: 'onSiteTestResult', label: 'Overall Result' }],
  8: [{ key: 'productResult', label: 'Product Spec Result' }],
  9: [{ key: 'packing_result', label: 'Packing Result' }],
  10: [{ key: 'marking_result_final', label: 'Marking Result' }],
  11: [{ key: 'client_requirement_result', label: 'Client Req. Result' }],
};
const getMissingFields = (step, form, items) => {
  if (step === 3) {
    const remarks = Array.isArray(form.remarks) ? form.remarks : [];
    return remarks.some(r => String(r || '').trim()) ? [] : [{ label: 'At least one Remark' }];
  }
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
      fetch(ENDPOINTS.HEALTH).catch(() => { });
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
  inspectionStandard: 'ANSI/ASQ Z1.4 (ISO 2859-1)',
  inspectionStandardWM: 'ANSI/ASQ Z1.4 (ISO 2859-1)',
  samplingPlan: 'Normal, Single',
  samplingPlanWM: 'Normal, Single',
  aqlCriticalWM: 'Not Allowed',
  aqlMajorWM: '2.5',
  aqlMinorWM: '4.0',
  inspectionLevel: 'Level II',
  inspectionLevelWM: 'Level II',
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
  { max: 8, size: 2 },
  { max: 15, size: 3 },
  { max: 25, size: 5 },
  { max: 50, size: 8 },
  { max: 90, size: 13 },
  { max: 150, size: 20 },
  { max: 280, size: 32 },
  { max: 500, size: 50 },
  { max: 1200, size: 80 },
  { max: 3200, size: 125 },
  { max: 10000, size: 200 },
  { max: 35000, size: 315 },
  { max: 150000, size: 500 },
  { max: 500000, size: 800 },
  { max: Infinity, size: 1250 },
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
    const lsSaved = localStorage.getItem("inspectionPhotos");
    if (lsSaved) {
      const parsed = safeJsonParse(lsSaved, []);
      return sanitizeSavedPhotos(parsed);
    }
    return [];
  });
  const [photosLoaded, setPhotosLoaded] = useState(false);

  useEffect(() => {
    import('../../utils/idb').then(({ idbGet, idbSet }) => {
      const lsSaved = localStorage.getItem("inspectionPhotos");
      if (lsSaved) {
        idbSet("inspectionPhotos", photos).then(() => {
          localStorage.removeItem("inspectionPhotos");
          setPhotosLoaded(true);
        }).catch(() => setPhotosLoaded(true));
      } else {
        idbGet("inspectionPhotos", []).then(saved => {
          setPhotos(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPhotos = sanitizeSavedPhotos(saved).filter(p => !existingIds.has(p.id));
            return [...newPhotos, ...prev];
          });
          setPhotosLoaded(true);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const [completionModal, setCompletionModal] = useState(null); // { step, stepLabel, missing }
  const [lastSaved, setLastSaved] = useState(null); // Date of last auto-save
  const [resumeBanner, setResumeBanner] = useState(null); // step number restored from localStorage

  const { token } = useAuth();
  const location = useLocation();
  const prefillData = location.state?.task?.prefillData ?? null;
  const taskId = location.state?.task?._id ?? null;
  const taskClientCode = location.state?.task?.clientCode ?? null;

  // Persist the locked-AQL flag so it survives page refresh
  const [aqlLocked, setAqlLocked] = useState(() => {
    return localStorage.getItem("inspectionAqlLocked") === "true";
  });

  // Fields that came from admin booking — inspector cannot edit these
  const lockedFields = useMemo(() => {
    if (!prefillData) return new Set();
    const locked = new Set();
    if (prefillData.client?.name) locked.add('client');
    if (prefillData.factory?.name) { locked.add('supplier'); locked.add('factory'); }
    if (prefillData.factory?.address || prefillData.factory?.city || prefillData.factory?.country) locked.add('inspectionLocation');
    // inspectionDate intentionally not locked — inspector may need to adjust it on site
    if (prefillData.product?.description) locked.add('productName');
    if (prefillData.product?.poNumber) locked.add('po');
    if (prefillData.country || prefillData.countryOfOrigin) locked.add('country');
    if (prefillData.product?.quantity != null && prefillData.product?.quantity !== '') locked.add('orderQuantity');
    if (prefillData.quantityFinished || prefillData.quantityPacked) locked.add('availableQuantity');
    if (prefillData.serviceType) locked.add('servicePerformed');
    if (prefillData.inspectionNumber) locked.add('inspectionNumber');
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

    // If this is a different task than the last saved session, wipe stale form data
    // so the inspector starts clean instead of seeing a previous inspection's values.
    const savedTaskId = localStorage.getItem('inspectionTaskId');
    const isNewTask = !!taskId && savedTaskId !== taskId;

    // Returning to same task — localStorage already has all progress.
    // However, always sync the client code since it's a locked field and the
    // cached value may be a stale full name instead of the short clientCode badge.
    if (!isNewTask) {
      if (taskClientCode) {
        setForm(prev => prev.client !== taskClientCode ? { ...prev, client: taskClientCode } : prev);
      }
      return;
    }

    ['inspectionForm', 'inspectionItems', 'inspectionPhotoGroups',
      'inspectionAqlLocked', 'inspectionTestRows', 'inspectionStep'].forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("inspectionPhotos");
    import('../../utils/idb').then(({ idbRemove }) => idbRemove("inspectionPhotos"));
    localStorage.setItem('inspectionTaskId', taskId);
    localStorage.setItem("inspectionAqlLocked", "true");
    /* eslint-disable react-hooks/set-state-in-effect */
    setItems([{ name: '', orderQty: '', availableQty: '' }]);
    setPhotos([]);
    setPhotoGroups([]);
    setTestRows([{ id: 1 }]);
    setTestNextId(2);
    setStep(1);
    setAqlLocked(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    const factoryAddress = [
      prefillData.factory?.address,
      prefillData.factory?.city,
      prefillData.factory?.country,
    ].filter(Boolean).join(', ');
    // Build the prefill form object eagerly (outside setForm) so we can
    // immediately persist it to localStorage. This protects against the
    // race where the user navigates away before React's re-render completes.
    const _buildPrefillForm = () => {
      const base = {};
      // Build locked client requirement rows from SCR + general requirement
      const buildClientRequirements = () => {
        const scrRows = [];
        const scr = prefillData;
        // Structured SCR fields become labelled locked rows
        if (scr.colorMaterialFinish) scrRows.push({ index: 0, requirement: `Color / Material / Finish: ${scr.colorMaterialFinish}`, result: '' });
        if (scr.dimensionWeight) scrRows.push({ index: 0, requirement: `Dimension / Weight: ${scr.dimensionWeight}`, result: '' });
        if (scr.logoLabel) scrRows.push({ index: 0, requirement: `Logo / Label: ${scr.logoLabel}`, result: '' });
        if (scr.packingMaterial) scrRows.push({ index: 0, requirement: `Packing Material: ${scr.packingMaterial}`, result: '' });
        if (scr.shippingMark) scrRows.push({ index: 0, requirement: `Shipping Mark: ${scr.shippingMark}`, result: '' });
        if (scr.customerSpecialRequirements) scr.customerSpecialRequirements.split('\n').map(l => l.trim()).filter(Boolean).forEach(r => scrRows.push({ index: 0, requirement: r, result: '' }));

        // General requirement lines (from TM/CS instructions)
        const genRows = prefillData.clientRequirements
          ? (typeof prefillData.clientRequirements === 'string'
            ? prefillData.clientRequirements.split('\n').map(l => l.trim()).filter(Boolean).map(r => ({ index: 0, requirement: r, result: '' }))
            : Array.isArray(prefillData.clientRequirements) ? prefillData.clientRequirements : [])
          : [];

        const allRows = [...scrRows, ...genRows];
        if (allRows.length === 0) return [];
        return allRows.map((r, i) => ({ ...r, index: i + 1 }));
      };

      const update = {
        ...base,
        servicePerformed: prefillData.serviceType || base.servicePerformed || 'Pre-Shipment Inspection',
        client: taskClientCode || prefillData.client?.name || base.client,
        supplier: prefillData.supplier?.name || prefillData.factory?.name || base.supplier,
        factory: prefillData.factory?.name || base.factory,
        factoryContact: prefillData.factory?.contact || base.factoryContact || '',
        factoryPhone: prefillData.factory?.phone || prefillData.factory?.mobile || base.factoryPhone || '',
        factoryWorkingTime: prefillData.factory?.workingTime || base.factoryWorkingTime || '',
        inspectionLocation: factoryAddress || base.inspectionLocation,
        inspectionDate: prefillData.inspectionDate?.slice(0, 10) || base.inspectionDate,
        inspectionDateTo: prefillData.inspectionDateTo ? String(prefillData.inspectionDateTo).slice(0, 10) : base.inspectionDateTo || '',
        shipmentDate: prefillData.shipmentDate ? String(prefillData.shipmentDate).slice(0, 10) : base.shipmentDate || '',
        productName: prefillData.product?.description || base.productName,
        po: prefillData.product?.poNumber || base.po,
        inspectionNumber: prefillData.inspectionNumber || base.inspectionNumber || '',
        itemNo: prefillData.product?.itemNo || base.itemNo || '',
        country: prefillData.country || prefillData.countryOfOrigin || base.country,
        orderQuantity: String(prefillData.product?.quantity ?? base.orderQuantity ?? ''),
        orderRemarks: prefillData.orderRemarks || base.orderRemarks || '',
        inspectionLevel: prefillData.aql?.inspectionLevel || base.inspectionLevel,
        sampleSize: String(prefillData.aql?.sampleSize ?? prefillData.aql?.sampledQuantity ?? base.sampleSize ?? ''),
        acceptPoint: String(prefillData.aql?.acceptPoint ?? prefillData.aql?.acceptedCritical ?? base.acceptPoint ?? ''),
        rejectPoint: String(prefillData.aql?.rejectPoint ?? prefillData.aql?.acceptedMajor ?? base.rejectPoint ?? ''),
        // Mirror into WorkmanshipDefects AQL fields
        inspectionLevelWM: prefillData.aql?.inspectionLevel || prefillData.aql?.samplingLevel || base.inspectionLevelWM,
        sampleSizeWM: String(prefillData.aql?.sampleSize ?? prefillData.aql?.sampledQuantity ?? base.sampleSizeWM ?? ''),
        aqlCriticalWM: prefillData.aql?.aqlCritical || base.aqlCriticalWM || 'Not Allowed',
        aqlMajorWM: prefillData.aql?.aqlMajor || base.aqlMajorWM || '2.5',
        aqlMinorWM: prefillData.aql?.aqlMinor || base.aqlMinorWM || '4.0',
        acceptedCritical: prefillData.aql?.acceptedCritical || base.acceptedCritical || '0',
        acceptedMajor: prefillData.aql?.acceptedMajor || base.acceptedMajor || '0',
        acceptedMinor: prefillData.aql?.acceptedMinor || base.acceptedMinor || '0',
        // Inspection standard & sampling plan — always strings (Step 2 + Step 6)
        inspectionStandard: typeof prefillData.aql?.inspectionStandard === 'string'
          ? prefillData.aql.inspectionStandard
          : base.inspectionStandard || 'ANSI/ASQ Z1.4 (ISO 2859-1)',
        inspectionStandardWM: typeof prefillData.aql?.inspectionStandard === 'string'
          ? prefillData.aql.inspectionStandard
          : base.inspectionStandardWM || 'ANSI/ASQ Z1.4 (ISO 2859-1)',
        samplingPlan: prefillData.aql?.samplingPlan || base.samplingPlan || 'Normal, Single',
        samplingPlanWM: prefillData.aql?.samplingPlan || base.samplingPlanWM || 'Normal, Single',
        availableQuantity: String(prefillData.quantityFinished || prefillData.quantityPacked || base.availableQuantity || ''),
        // Client special requirements — SCR rows locked, inspector can only fill Result column
        clientRequirements: buildClientRequirements(),
        // Seed first barcode row location with the inspection site
        barcode_location_1: base.barcode_location_1 || factoryAddress || '',
      };
      // Pre-fill On-Site Tests table rows from booking data
      if (prefillData.onSiteTests?.length) {
        prefillData.onSiteTests.forEach((t, i) => {
          update[`testDesc${i + 1}`] = t.description || '';
          update[`testMethod${i + 1}`] = t.method || '';
          update[`testSample${i + 1}`] = t.sampleSize || '';
        });
      }
      // Seed Step 8 (Product Specification) and Step 9 (Packing) item rows
      const allProds = prefillData.products?.length
        ? prefillData.products
        : prefillData.product
          ? [{ productName: prefillData.product.description || '', itemNo: prefillData.product.itemNo || '', orderNo: prefillData.product.poNumber || '' }]
          : [];
      if (allProds.length > 0) {
        update.productDescription = allProds[0].productName || prefillData.product?.description || '';
        update['item_0_no'] = allProds[0].itemNo || allProds[0].orderNo || prefillData.product?.itemNo || '';
        allProds.slice(1).forEach((p, i) => {
          update[`item_${i + 1}_desc`] = p.productName || '';
          update[`item_${i + 1}_no`]   = p.itemNo || p.orderNo || '';
        });
        allProds.forEach((p, i) => {
          update[`packing_item_${i + 1}`] = p.productName || '';
        });
      }
      return update;
    };
    const prefillFormData = _buildPrefillForm();
    // Eagerly persist so a browser-back before React's re-render doesn't lose prefill data
    try { localStorage.setItem("inspectionForm", JSON.stringify(prefillFormData)); } catch { }
    setForm(() => prefillFormData);

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
        const packedShare = totalPacked ? String(Math.round(totalPacked * share)) : '';
        const finishedShare = totalFinished ? String(Math.round(totalFinished * share)) : '';
        return {
          po: p.orderNo || '',
          itemName: p.productName || p.name || '',
          orderQty: String(qty || ''),
          qtyPerCarton: '',
          cartons: '',
          selectedCartons: '',
          packedBreakdown: packedShare,
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
  }, [prefillData, taskId]);

  // Sync Step 2 AQL fields → Step 6 WM fields whenever the main values change
  useEffect(() => {
    setForm(prev => {
      const changed = {};
      if (prev.inspectionStandard !== undefined && prev.inspectionStandard !== prev.inspectionStandardWM) changed.inspectionStandardWM = prev.inspectionStandard;
      if (prev.samplingPlan !== undefined && prev.samplingPlan !== prev.samplingPlanWM) changed.samplingPlanWM = prev.samplingPlan;
      if (prev.inspectionLevel !== undefined && prev.inspectionLevel !== prev.inspectionLevelWM) changed.inspectionLevelWM = prev.inspectionLevel;
      if (prev.sampleSize !== undefined && prev.sampleSize !== prev.sampleSizeWM) changed.sampleSizeWM = prev.sampleSize;
      if (prev.aqlCritical !== undefined && prev.aqlCritical !== prev.aqlCriticalWM) changed.aqlCriticalWM = prev.aqlCritical;
      if (prev.aqlMajor !== undefined && prev.aqlMajor !== prev.aqlMajorWM) changed.aqlMajorWM = prev.aqlMajor;
      if (prev.aqlMinor !== undefined && prev.aqlMinor !== prev.aqlMinorWM) changed.aqlMinorWM = prev.aqlMinor;
      return Object.keys(changed).length ? { ...prev, ...changed } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.inspectionStandard, form.samplingPlan, form.inspectionLevel, form.sampleSize, form.aqlCritical, form.aqlMajor, form.aqlMinor]);

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
      setLastSaved(new Date());
    } catch {
      try {
        const trimmed = stripLargeImageFieldsForStorage(form);
        localStorage.setItem("inspectionForm", JSON.stringify(trimmed));
        setLastSaved(new Date());
      } catch {
        // Keep form in runtime state even if persistence fails.
      }
    }
  }, [form]);

  // On mount: if inspector is returning mid-report show a resume banner
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem("inspectionStep") || "1", 10);
    if (savedStep > 1) {
      setResumeBanner(savedStep);
      const t = setTimeout(() => setResumeBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("inspectionItems", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (photosLoaded) {
      import('../../utils/idb').then(({ idbSet }) => {
        idbSet("inspectionPhotos", photos).catch(console.error);
      });
    }
  }, [photos, photosLoaded]);

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
      if (name === 'inspectionLevelWM') update.inspectionLevel = value;
      if (name === 'sampleSize') update.sampleSizeWM = value;
      if (name === 'sampleSizeWM') update.sampleSize = value;
      if (name === 'aqlCritical') update.aqlCriticalWM = value;
      if (name === 'aqlCriticalWM') update.aqlCritical = value;
      if (name === 'aqlMajor') update.aqlMajorWM = value;
      if (name === 'aqlMajorWM') update.aqlMajor = value;
      if (name === 'aqlMinor') update.aqlMinorWM = value;
      if (name === 'aqlMinorWM') update.aqlMinor = value;
      if (name === 'inspectionStandard') update.inspectionStandardWM = value;
      if (name === 'inspectionStandardWM') update.inspectionStandard = value;
      if (name === 'samplingPlan') update.samplingPlanWM = value;
      if (name === 'samplingPlanWM') update.samplingPlan = value;
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
    import('../../utils/idb').then(({ idbRemove }) => idbRemove("inspectionPhotos"));
    localStorage.removeItem("inspectionPhotoGroups");
    localStorage.removeItem("inspectionGeneralPhoto");
    localStorage.removeItem("inspectionGeneralPhotoData");
    localStorage.removeItem("inspectionAqlLocked");
    localStorage.removeItem("inspectionTestRows");
    localStorage.removeItem("inspectionTaskId");

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
    setCompletionModal(null);
    setStep(step + 1);
    if (taskId) {
      fetch(ENDPOINTS.INSPECTOR.SECTION_SKIP(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: completionModal.step, stepLabel: completionModal.stepLabel, reason, missingFields: entry.missingFields }),
      }).catch(() => { });
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
    { id: 1, label: "General Information", shortLabel: "General" },
    { id: 2, label: "Inspection Summary", shortLabel: "Summary" },
    { id: 3, label: "Remarks", shortLabel: "Remarks" },
    { id: 4, label: "Conclusion", shortLabel: "Conclusion" },
    { id: 5, label: "Quantity", shortLabel: "Quantity" },
    { id: 6, label: "Workmanship", shortLabel: "Workmanship" },
    { id: 7, label: "On-Site Tests", shortLabel: "On-Site" },
    { id: 8, label: "Product Spec", shortLabel: "Prod. Spec" },
    { id: 9, label: "Packing", shortLabel: "Packing" },
    { id: 10, label: "Marking & Labeling", shortLabel: "Marking" },
    { id: 11, label: "Client Requirement", shortLabel: "Client Req." },
    { id: 12, label: "Photos", shortLabel: "Photos" },
    { id: 13, label: "Finalize & Download", shortLabel: "Finalize" },
  ];

  const goToStep = (targetStep) => {
    if (targetStep < 1 || targetStep > 13) return;
    // Jumping forward — enforce the same check as the Next button
    if (targetStep > step) {
      const missing = getMissingFields(step, form, items);
      if (missing.length > 0) {
        setCompletionModal({ step, stepLabel: STEP_LABELS[step] || `Step ${step}`, missing });
        return;
      }
    }
    setStep(targetStep);
  };


  const reportMeta = useMemo(() => ({
    product: form.productName || '',
    client: form.client || '',
    factory: form.factory || '',
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {lastSaved && (
                <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of 14</span>
            </div>
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

              <PrefillToast prefillData={prefillData} dismissed={prefillBannerDismissed} onDismiss={() => setPrefillBannerDismissed(true)} />

              <Suspense fallback={<ReportLoader />}>
                {step === 1 && <GeneralInfo form={form} handleChange={handleChange} onNext={next} handleGeneralPhotoUpload={handleGeneralPhotoUpload} clearGeneralPhoto={clearGeneralPhoto} lockedFields={lockedFields} />}
                {step === 2 && <InspectionSummaryTable form={form} handleChange={handleChange} onPrev={prev} onNext={next} lockedAql={aqlLocked} lockedOrderQty={lockedFields.has('orderQuantity')} lockedAvailableQty={lockedFields.has('availableQuantity')} />}
                {step === 3 && <RemarksStep form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
                {step === 4 && <ConclusionStep form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
                {step === 5 && <QuantityDetails items={items} onItemChange={handleItemChange} onAddItem={addItem} onRemoveItem={removeItem} form={form} handleChange={handleChange} onPrev={prev} onNext={next} />}
                {step === 6 && <WorkmanshipDefects form={form} handleChange={handleChange} onPrev={prev} onNext={next} onWorkmanshipDefectsChange={handleWorkmanshipDefectsChange} onWorkmanshipPhotosChange={handleWorkmanshipPhotosChange} items={items} lockedAql={aqlLocked} />}
                {step === 7 && <OnSiteTests form={form} handleChange={handleChange} testRows={testRows} setTestRows={setTestRows} testNextId={testNextId} setTestNextId={setTestNextId} lockedTestCount={lockedTestCount} onPrev={prev} onNext={next} />}
                {step === 8 && <ProductSpecification form={form} handleChange={handleChange} onPrev={prev} onNext={next} quantityItems={items} />}
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

        {/* Resume banner — shown when inspector returns to a partially-filled report */}
        {resumeBanner && (
          <div style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1e3a5f",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            zIndex: 10002,
            fontSize: "13px",
            fontWeight: "600",
            animation: "slideUp 0.35s ease-out",
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: "16px" }}>📋</span>
            Resuming from Step {resumeBanner} — your progress was auto-saved
            <button
              onClick={() => setResumeBanner(null)}
              style={{ marginLeft: "6px", background: "transparent", border: "none", color: "#93c5fd", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
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