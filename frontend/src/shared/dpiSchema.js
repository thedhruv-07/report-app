/**
 * DPI (During Production Inspection) Schema
 * Schema-driven form definition following the CLS pattern.
 * Used by FormBuilder components (SchemaSection, SchemaTable, SchemaPhotos, SchemaRemarks).
 */

export const dpiSchema = {
  // ─── SECTION I: GENERAL INFORMATION ─────────────────────────────────────────
  generalInfo: [
    { name: "servicePerformed", label: "Service Performed", type: "text", defaultValue: "During Production Inspection" },
    { name: "client", label: "Client", type: "text", placeholder: "e.g., FRIN" },
    { name: "supplier", label: "Supplier", type: "text", placeholder: "Enter supplier name" },
    { name: "factory", label: "Factory", type: "text", placeholder: "Enter factory name" },
    { name: "productName", label: "Product Name", type: "text", placeholder: "Enter product name" },
    { name: "po", label: "P.O. No.", type: "text", placeholder: "Enter PO number" },
    { name: "itemNo", label: "Item No.", type: "text", placeholder: "Enter Item numbers" },
    { name: "destinationCountry", label: "Destination Country", type: "text", placeholder: "e.g., India" },
    { name: "inspectionDate", label: "Inspection Date", type: "date" },
    { name: "inspectionLocation", label: "Inspection Location", type: "text", placeholder: "e.g., Jiangsu (CHINA)" },
    { name: "referenceSample", label: "Reference Sample", type: "select", options: ["Yes", "No"] },
  ],

  // ─── SECTION II: INSPECTION SUMMARY ─────────────────────────────────────────
  inspectionSummary: [
    { name: "summaryQuantity", label: "A. Quantity", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryWorkmanship", label: "B. Workmanship", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryOnSiteTests", label: "C. On-Site Tests", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryDimensions", label: "D. Product Specification", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryPacking", label: "E. Packing", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryMarkingLabeling", label: "F. Marking & Labeling", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryProductConformity", label: "G. Product Conformity", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryClientRequirement", label: "H. Client Special Requirement", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "summaryProductionSchedule", label: "I. Production Schedule (Notes)", type: "text", placeholder: "Enter production schedule notes..." },
  ],

  // Workmanship Summary (sub-table within Section II)
  workmanshipSummary: [
    { name: "wmInspectionStandard", label: "Inspection Standard", type: "text", defaultValue: "ANSI/ASQ Z1.4 (ISO 2859-1)" },
    { name: "wmSamplingPlan", label: "Sampling Plan", type: "text", defaultValue: "Fixed Sample Size" },
    { name: "wmInspectionLevel", label: "Inspection Level", type: "text", defaultValue: "Level II" },
    { name: "wmOrderQuantity", label: "Order Quantity", type: "text", placeholder: "Enter order quantity" },
    { name: "wmAvailableQuantity", label: "Available Quantity", type: "text", placeholder: "Enter available quantity" },
    { name: "wmSampleSize", label: "Sample Size", type: "text", placeholder: "e.g., 5 Sets" },
    { name: "wmAqlCritical", label: "AQL Critical", type: "text", defaultValue: "Not Allowed" },
    { name: "wmAqlMajor", label: "AQL Major", type: "text", defaultValue: "2.5" },
    { name: "wmAqlMinor", label: "AQL Minor", type: "text", defaultValue: "4.0" },
    { name: "wmAcceptedCritical", label: "Accepted Critical", type: "text", defaultValue: "0" },
    { name: "wmAcceptedMajor", label: "Accepted Major", type: "text", defaultValue: "0" },
    { name: "wmAcceptedMinor", label: "Accepted Minor", type: "text", defaultValue: "0" },
    { name: "wmFoundCritical", label: "Found Critical", type: "text", defaultValue: "0" },
    { name: "wmFoundMajor", label: "Found Major", type: "text", defaultValue: "0" },
    { name: "wmFoundMinor", label: "Found Minor", type: "text", defaultValue: "0" },
    { name: "wmResult", label: "Workmanship Result", type: "select", options: ["Passed", "Failed", "Pending"], defaultValue: "Pending" },
  ],

  // ─── SECTION IV: CONCLUSION ─────────────────────────────────────────────────
  conclusion: [
    { name: "conclusion", label: "Overall Conclusion", type: "select", options: ["PASSED", "FAILED", "PENDING"] },
    { name: "approvedByManager", label: "Approved by (Manager)", type: "text", placeholder: "Manager name" },
    { name: "approvedByReviewer", label: "Approved by (Technical Reviewer)", type: "text", placeholder: "Reviewer name" },
    { name: "inspectorName", label: "Inspector Name", type: "text", placeholder: "Inspector name" },
    { name: "inspectorSignature", label: "Inspector Signature", type: "photo" },
    { name: "reportReviewer", label: "Report Reviewer", type: "text", placeholder: "Reviewer name" },
    { name: "reviewerSignature", label: "Reviewer Signature", type: "photo" },
  ],

  // ─── SECTION A: QUANTITY ────────────────────────────────────────────────────
  quantityTable: {
    columns: [
      { key: "po", label: "P.O.", type: "text" },
      { key: "item", label: "Item", type: "text" },
      { key: "orderQty", label: "Order Qty", type: "text" },
      { key: "qtyPerCarton", label: "Qty/Carton", type: "text" },
      { key: "cartons", label: "Cartons", type: "text" },
      { key: "packed", label: "Packed", type: "text" },
      { key: "unpacked", label: "Unpacked", type: "text" },
      { key: "unfinished", label: "Unfinished", type: "text" },
      { key: "sampleSizePacked", label: "Sample Size (Packed)", type: "text" },
      { key: "sampleSizeUnpacked", label: "Sample Size (Unpacked)", type: "text" },
    ],
    metadata: [
      { name: "quantityUnit", label: "Unit", type: "text", defaultValue: "Sets" },
      { name: "selectedCartonsCount", label: "Selected Cartons Count", type: "text", placeholder: "e.g., 5" },
      { name: "quantityResult", label: "Quantity Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "quantityRemark", label: "Quantity Remark", type: "textarea", placeholder: "Enter remarks for quantity..." },
    ]
  },

  // ─── SECTION B: WORKMANSHIP ─────────────────────────────────────────────────
  workmanshipTable: {
    columns: [
      { key: "itemName", label: "Item Name", type: "text" },
      { key: "sampleSize", label: "Sample Size", type: "text" },
      { key: "description", label: "Defect Description", type: "text" },
      { key: "critical", label: "Critical", type: "text" },
      { key: "major", label: "Major", type: "text" },
      { key: "minor", label: "Minor", type: "text" },
    ],
    metadata: [
      { name: "wkInspectionStandard", label: "Inspection Standard", type: "text", defaultValue: "ANSI/ASQ Z1.4 (ISO 2859-1)" },
      { name: "wkSamplingPlan", label: "Sampling Plan", type: "text", defaultValue: "Fixed Sample Size" },
      { name: "wkInspectionLevel", label: "Inspection Level", type: "text", defaultValue: "Level II" },
      { name: "wkSampleSize", label: "Sample Size", type: "text", placeholder: "e.g., 5 Sets" },
      { name: "wkAqlCritical", label: "AQL Critical", type: "text", defaultValue: "Not Allowed" },
      { name: "wkAqlMajor", label: "AQL Major", type: "text", defaultValue: "2.5" },
      { name: "wkAqlMinor", label: "AQL Minor", type: "text", defaultValue: "4.0" },
      { name: "wkAcceptedCritical", label: "Accepted Critical", type: "text", defaultValue: "0" },
      { name: "wkAcceptedMajor", label: "Accepted Major", type: "text", defaultValue: "0" },
      { name: "wkAcceptedMinor", label: "Accepted Minor", type: "text", defaultValue: "0" },
      { name: "wkTotalFoundCritical", label: "Total Found Critical", type: "text", defaultValue: "0" },
      { name: "wkTotalFoundMajor", label: "Total Found Major", type: "text", defaultValue: "0" },
      { name: "wkTotalFoundMinor", label: "Total Found Minor", type: "text", defaultValue: "0" },
      { name: "workmanshipResult", label: "Workmanship Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "workmanshipRemark", label: "Workmanship Remark", type: "textarea", placeholder: "Enter remarks for workmanship..." },
    ]
  },

  // ─── SECTION C: ON-SITE TESTS ──────────────────────────────────────────────
  onSiteTestsTable: {
    columns: [
      { key: "srNo", label: "Sr.No", type: "text" },
      { key: "description", label: "Description", type: "text" },
      { key: "method", label: "Method", type: "text" },
      { key: "sampleSize", label: "Sample Size", type: "text" },
      { key: "resultReading", label: "Result / Reading", type: "text" },
    ],
    metadata: [
      { name: "onSiteTestResult", label: "On-Site Tests Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "onSiteTestRemark", label: "On-Site Tests Remark", type: "textarea", placeholder: "Enter remarks for on-site tests..." },
    ]
  },

  // ─── SECTION D: DIMENSIONS (PRODUCT) ───────────────────────────────────────
  dimensionsTable: {
    columns: [
      { key: "parameter", label: "Parameter", type: "text" },
      { key: "clientSpec", label: "Client's Spec", type: "text" },
      { key: "refSample", label: "Ref. Sample", type: "text" },
      { key: "sample1", label: "1# Sample", type: "text" },
      { key: "sample2", label: "2# Sample", type: "text" },
      { key: "sample3", label: "3# Sample", type: "text" },
    ],
    metadata: [
      { name: "dimensionsItemNo", label: "Item No.", type: "text", placeholder: "Enter item number" },
      { name: "dimensionsGroupName", label: "Group Name", type: "text", placeholder: "e.g., Elbow Pad" },
      { name: "dimensionsResult", label: "Dimensions Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "dimensionsRemark", label: "Dimensions Remark", type: "textarea", placeholder: "Enter remarks for dimensions..." },
    ]
  },

  // Backwards-compatible alias: productSpecificationTable is same structure as dimensionsTable
  productSpecificationTable: null, // initialized at module load below

  // ─── SECTION E: PACKING ────────────────────────────────────────────────────
  packingTable: {
    columns: [
      { key: "itemNo", label: "Item No.", type: "text" },
      { key: "qtyPerCartonMarking", label: "Qty/Carton (Marking)", type: "text" },
      { key: "qtyPerCartonActual", label: "Qty/Carton (Actual)", type: "text" },
      { key: "cartonSizeMarking", label: "Carton Size L×W×H (Marking)", type: "text" },
      { key: "cartonSizeActual", label: "Carton Size L×W×H (Actual)", type: "text" },
      { key: "grossWeightMarking", label: "Gross Weight (Marking)", type: "text" },
      { key: "grossWeightActual", label: "Gross Weight (Actual)", type: "text" },
      { key: "qtyInnerBoxMarking", label: "Qty/Inner Box (Marking)", type: "text" },
      { key: "qtyInnerBoxActual", label: "Qty/Inner Box (Actual)", type: "text" },
    ],
    metadata: [
      { name: "packFasteningMetalStaples", label: "Fastening Metal Staples", type: "text", defaultValue: "/" },
      { name: "packNylonBand", label: "Nylon Band", type: "text", defaultValue: "/" },
      { name: "packMaterial", label: "Material", type: "text", defaultValue: "/" },
      { name: "packCorrugatedPaperPlies", label: "Corrugated Paper Plies", type: "text", defaultValue: "/" },
      { name: "packPackingMethod", label: "Packing Method", type: "textarea", placeholder: "Describe packing method..." },
      { name: "packAssortment", label: "Assortment", type: "text", defaultValue: "/" },
      { name: "packingResult", label: "Packing Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "packingRemark", label: "Packing Remark", type: "textarea", placeholder: "Enter remarks for packing..." },
    ]
  },

  // ─── SECTION F: MARKING & LABELING ─────────────────────────────────────────
  markingTable: {
    columns: [
      { key: "name", label: "Name", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "result", label: "Result", type: "text" },
    ],
    metadata: [
      { name: "markingInstructionProvidedBy", label: "Instruction Provided By", type: "text", placeholder: "e.g., Client" },
      { name: "markingShippingMarks", label: "Shipping Marks (on __ side)", type: "text", placeholder: "e.g., on 2 sides" },
      { name: "markingSideMarks", label: "Side Marks (on __ side)", type: "text", defaultValue: "NA" },
      { name: "markingInnerBoxMarks", label: "Inner Box Marks (on __ side)", type: "text", defaultValue: "NA" },
      { name: "markingResult", label: "Marking & Labeling Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "markingRemark", label: "Marking & Labeling Remark", type: "textarea", placeholder: "Enter remarks for marking & labeling..." },
    ]
  },

  // ─── SECTION G: PRODUCTION LINE CHECKING ───────────────────────────────────
  productionLineTable: {
    columns: [
      { key: "process", label: "Process / Accessory", type: "text" },
      { key: "samplingSize", label: "Sampling Size (pieces)", type: "text" },
      { key: "styleColor", label: "Style & Color", type: "text" },
      { key: "problems", label: "Problems / Defectives", type: "text" },
      { key: "number", label: "Number", type: "text" },
    ],
    metadata: [
      { name: "productionLineSampleSize", label: "Fixed Sample Size (pieces)", type: "text", defaultValue: "32" },
      { name: "productionLineResult", label: "Production Line Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "N/A" },
      { name: "productionLineRemark", label: "Production Line Remark", type: "textarea", placeholder: "Enter remarks for production line checking..." },
    ]
  },

  // ─── SECTION H: CLIENT SPECIAL REQUIREMENTS ────────────────────────────────
  clientRequirementTable: {
    columns: [
      { key: "requirement", label: "Requirement", type: "text" },
      { key: "result", label: "Result", type: "text" },
    ],
    metadata: [
      { name: "clientRequirementResult", label: "Client Requirements Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Pending" },
      { name: "clientRequirementRemark", label: "Client Requirements Remark", type: "textarea", placeholder: "Enter remarks for client requirements..." },
    ]
  },

  // ─── SECTION I: PRODUCTION SCHEDULE ────────────────────────────────────────
  productionSchedule: [
    { name: "psLinesAvailable", label: "Production Lines Available for This Order", type: "text", placeholder: "e.g., 3" },
    { name: "psWorkersPerLine", label: "How Many Workers per Line?", type: "text", placeholder: "e.g., 20" },
    { name: "psOutputRatePerLine", label: "Output Rate per Line per Day", type: "text", placeholder: "e.g., 500 pcs" },
    { name: "psMaxOutputPerDay", label: "Maximum Output per Day", type: "text", placeholder: "e.g., 1500 pcs" },
    { name: "psMinOutputPerDay", label: "Minimum Output per Day", type: "text", placeholder: "e.g., 800 pcs" },
    { name: "psEstimatedPSIDate", label: "Estimated Date for PSI Inspection", type: "date" },
    { name: "psEstimatedFinishDate", label: "Estimated Date When Goods Can Be Finished & Packed", type: "date" },
  ],

  // ─── SECTION J: PHOTOS ─────────────────────────────────────────────────────
  photos: {
    groups: [
      { id: "remarkPhotos", label: "Remarks Photos" },
      { id: "defectPhotos", label: "Workmanship Defect Photos" },
      { id: "productionLinePhotos", label: "Production Line Photos" },
      { id: "dimensionPhotos", label: "Dimension / Product Photos" },
      { id: "packingPhotos", label: "Packing Photos" },
      { id: "generalPhotos", label: "General / Big Size Photos" },
    ]
  },

  // ─── REMARKS CONFIG ────────────────────────────────────────────────────────
  factoryInfo: [
    { name: "factoryCooperation", label: "Factory Cooperation", type: "select", options: ["Good — Fully cooperative, provided all required documents and access.", "Average — Somewhat cooperative but needed multiple requests.", "Poor — Uncooperative, delayed or refused access."] },
    { name: "numberOfWorkers", label: "Number of Workers", type: "select", options: ["Less than 50", "50-100", "100-500", "500-1000", "More than 1000"] },
    { name: "inspectorOpinion", label: "Inspector's Opinion on Factory", type: "select", options: ["Good — Well-organized production, clean environment, good QC system.", "Average — Acceptable conditions, some areas need improvement.", "Poor — Disorganized, quality concerns, needs significant improvement."] },
  ],

  sampleCollection: [
    { name: "productionSamplesCount", label: "Production Samples Collected", type: "text", defaultValue: "0" },
    { name: "defectiveSamplesCount", label: "Defective Samples Collected", type: "text", defaultValue: "0" },
  ],
};

// Backwards-compatibility: productSpecificationTable mirrors dimensionsTable
dpiSchema.productSpecificationTable = dpiSchema.dimensionsTable;
