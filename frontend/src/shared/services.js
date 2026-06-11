/**
 * Service Registry — Single Source of Truth
 *
 * Add new inspection services here. The Dashboard and routing
 * automatically pick them up. Do NOT hardcode services elsewhere.
 */

const FORM_STORAGE_KEYS = {
  '/dashboard/pre-shipment':    ['inspectionStep','inspectionForm','inspectionItems','inspectionPhotos','inspectionPhotoGroups','inspectionGeneralPhoto','inspectionGeneralPhotoData','inspectionLastSubmittedTemplate','inspectionTaskId','inspectionAqlLocked','inspectionTestRows'],
  '/dashboard/container-loading': ['clsStep','clsForm'],
  '/dashboard/during-production': ['dpiStep','dpiForm'],
  '/dashboard/factory-audit':   ['faStep','faForm','faReportId'],
  '/dashboard/social-audit':    [],
};

export const clearFormStorage = (route) => {
  (FORM_STORAGE_KEYS[route] || []).forEach(k => localStorage.removeItem(k));
  if (route === '/dashboard/pre-shipment') {
    import('../utils/idb.js').then(({ idbRemove }) => idbRemove("inspectionPhotos"));
  }
};

export const services = [
  {
    id: "psi",
    name: "Pre-Shipment Inspection",
    slug: "pre-shipment",
    description:
      "Complete pre-shipment inspection reports with photos, defect tracking, and automated document generation.",
    icon: "📋",
    route: "/dashboard/pre-shipment",
  },
  {
    id: "cls",
    name: "Container Loading Supervision",
    slug: "container-loading",
    description:
      "Monitor and document container loading processes with real-time tracking and verification.",
    icon: "📦",
    route: "/dashboard/container-loading",
  },
  {
    id: "fa",
    name: "Factory Audit",
    slug: "factory-audit",
    description:
      "Conduct detailed factory audits including production capacity, quality systems, and compliance evaluation.",
    icon: "🏭",
    route: "/dashboard/factory-audit",
  },
  {
    id: "dpi",
    name: "During Production Inspection",
    slug: "during-production",
    description:
      "Track in-progress production quality with workmanship checks, on-site tests, dimension verification, and production line monitoring.",
    icon: "🔍",
    route: "/dashboard/during-production",
  },
];
