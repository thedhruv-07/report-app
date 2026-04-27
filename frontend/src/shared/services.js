/**
 * Service Registry — Single Source of Truth
 *
 * Add new inspection services here. The Dashboard and routing
 * automatically pick them up. Do NOT hardcode services elsewhere.
 */

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
];
