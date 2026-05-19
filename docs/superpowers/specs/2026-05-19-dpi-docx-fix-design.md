# DPI DOCX Output Fix — Design Spec

**Date:** 2026-05-19  
**Scope:** Fix DPI report DOCX generation fidelity  
**File changed:** `backend/services/docx.service.js`

---

## Problem Statement

The DPI frontend (`DPIForm.jsx`) sends form data using field names from `dpiSchema.js` (e.g. `workmanshipDefectTable`, `onSiteTestsTable`, `packingTable`). The DOCX service was written for PSI-style flat keys (e.g. `workmanshipDefects`, `testDesc1`, `packing_item_1`). This mismatch means DPI tables render empty or with wrong data.

Additionally, DPI-specific sections G (Production Line) and I (Production Schedule) are not rendered at all, and section labels G/H are wrong.

---

## Root Cause: Field Name Mismatches

| Frontend sends | DOCX service reads | Affected section |
|---|---|---|
| `workmanshipDefectTable` | `workmanshipDefects` | Section B |
| `onSiteTestsTable` (array) | `testDesc1`, `testMethod1`, … (flat) | Section C |
| `dimensionsTable` (array) | `item_1_desc`, `blank_row_0`, … (flat) | Section D |
| `packingTable` (array) | `packing_item_1`, … (flat) | Section E |
| `markingTable` (array) | `barcode_name`, `barcode_location`, … | Section F |
| `clientRequirementTable` | `clientRequirements` | Section H |
| `productionLineTable` | — not read at all — | Section G (missing) |
| `wmInspectionStandard` | `inspectionStandardWM` | Workmanship summary |
| `wmSamplingPlan` | `samplingPlanWM` | Workmanship summary |
| `wmInspectionLevel` | `inspectionLevelWM` | Workmanship summary |
| `wmOrderQuantity` | `orderQuantityWM` / `orderQuantity` | Workmanship summary |
| `wmAvailableQuantity` | `availableQuantityWM` / `availableQuantity` | Workmanship summary |
| `wmSampleSize` | `sampleSizeWM` | Workmanship summary |
| `wmAqlCritical` | `aqlCriticalWM` | Workmanship summary + Section B |
| `wmAqlMajor` | `aqlMajorWM` | Workmanship summary + Section B |
| `wmAqlMinor` | `aqlMinorWM` | Workmanship summary + Section B |
| `wmAcceptedCritical` | `acceptedCritical` | Workmanship summary + Section B |
| `wmAcceptedMajor` | `acceptedMajor` | Workmanship summary + Section B |
| `wmAcceptedMinor` | `acceptedMinor` | Workmanship summary + Section B |
| `wmFoundCritical` | `totalFoundCritical` | Workmanship summary + Section B |
| `wmFoundMajor` | `totalFoundMajor` | Workmanship summary + Section B |
| `wmFoundMinor` | `totalFoundMinor` | Workmanship summary + Section B |

---

## Solution: Option A — Fix field reads inline

All changes are inside `createReportContent()` in `backend/services/docx.service.js`.

### Change 1 — DPI Alias Block

Add immediately after `const isDpi = data.serviceType?.toLowerCase() === "dpi"` resolves to true (inside the function, before any rendering):

```js
if (isDpi) {
  // Array aliases
  if (!data.workmanshipDefects && data.workmanshipDefectTable) {
    data.workmanshipDefects = data.workmanshipDefectTable;
  }
  if (!data.clientRequirements && data.clientRequirementTable) {
    data.clientRequirements = data.clientRequirementTable;
  }

  // Workmanship AQL field aliases
  data.inspectionStandardWM = data.inspectionStandardWM || data.wmInspectionStandard;
  data.samplingPlanWM       = data.samplingPlanWM       || data.wmSamplingPlan;
  data.inspectionLevelWM    = data.inspectionLevelWM    || data.wmInspectionLevel;
  data.orderQuantityWM      = data.orderQuantityWM      || data.wmOrderQuantity;
  data.availableQuantityWM  = data.availableQuantityWM  || data.wmAvailableQuantity;
  data.sampleSizeWM         = data.sampleSizeWM         || data.wmSampleSize;
  data.aqlCriticalWM        = data.aqlCriticalWM        || data.wmAqlCritical;
  data.aqlMajorWM           = data.aqlMajorWM           || data.wmAqlMajor;
  data.aqlMinorWM           = data.aqlMinorWM           || data.wmAqlMinor;
  data.acceptedCritical     = data.acceptedCritical     || data.wmAcceptedCritical;
  data.acceptedMajor        = data.acceptedMajor        || data.wmAcceptedMajor;
  data.acceptedMinor        = data.acceptedMinor        || data.wmAcceptedMinor;
  data.totalFoundCritical   = data.totalFoundCritical   || data.wmFoundCritical;
  data.totalFoundMajor      = data.totalFoundMajor      || data.wmFoundMajor;
  data.totalFoundMinor      = data.totalFoundMinor      || data.wmFoundMinor;
  data.workmanshipResult    = data.workmanshipResult    || data.wmResult;

  // On-site tests: expand array → flat keys
  (data.onSiteTestsTable || []).forEach((row, i) => {
    const n = i + 1;
    if (!data[`testDesc${n}`])   data[`testDesc${n}`]   = row.description;
    if (!data[`testMethod${n}`]) data[`testMethod${n}`] = row.method;
    if (!data[`testSample${n}`]) data[`testSample${n}`] = row.sampleSize;
    if (!data[`testResult${n}`]) data[`testResult${n}`] = row.resultReading;
  });
  if (!data.onSiteTestResult) data.onSiteTestResult = data.onSiteTestsTable?.[0]?.result || "Pending";
  if (!data.onSiteTestRemark) data.onSiteTestRemark = data.onSiteTestRemark || "";

  // Packing: expand array → flat keys
  (data.packingTable || []).forEach((row, i) => {
    const n = i + 1;
    data[`packing_item_${n}`]                 = data[`packing_item_${n}`]                 || row.itemNo;
    data[`packing_qty_carton_marking_${n}`]   = data[`packing_qty_carton_marking_${n}`]   || row.qtyPerCartonMarking;
    data[`packing_qty_carton_actual_${n}`]    = data[`packing_qty_carton_actual_${n}`]    || row.qtyPerCartonActual;
    data[`packing_carton_size_marking_${n}`]  = data[`packing_carton_size_marking_${n}`]  || row.cartonSizeMarking;
    data[`packing_carton_size_actual_${n}`]   = data[`packing_carton_size_actual_${n}`]   || row.cartonSizeActual;
    data[`packing_weight_marking_${n}`]       = data[`packing_weight_marking_${n}`]       || row.grossWeightMarking;
    data[`packing_weight_actual_${n}`]        = data[`packing_weight_actual_${n}`]        || row.grossWeightActual;
    data[`packing_qty_inner_marking_${n}`]    = data[`packing_qty_inner_marking_${n}`]    || row.qtyInnerBoxMarking;
    data[`packing_qty_inner_actual_${n}`]     = data[`packing_qty_inner_actual_${n}`]     || row.qtyInnerBoxActual;
  });
  // Packing metadata aliases
  data.fastening_metal_staples  = data.fastening_metal_staples  || data.packFasteningMetalStaples;
  data.nylon_band               = data.nylon_band               || data.packNylonBand;
  data.material                 = data.material                 || data.packMaterial;
  data.corrugated_paper_plies   = data.corrugated_paper_plies   || data.packCorrugatedPaperPlies;
  data.packing_method           = data.packing_method           || data.packPackingMethod;
  data.assortment_method        = data.assortment_method        || data.packAssortment;
  data.packing_result           = data.packing_result           || data.packingResult;
  data.packing_remark           = data.packing_remark           || data.packingRemark;

  // Marking: expand array + aliases
  if (Array.isArray(data.markingTable) && data.markingTable.length > 0) {
    const m = data.markingTable[0];
    data.barcode_name     = data.barcode_name     || m.name;
    data.barcode_location = data.barcode_location || m.location;
    data.barcode_result   = data.barcode_result   || m.result;
  }
  data.marking_result_final = data.marking_result_final || data.markingResult;
  data.marking_remark       = data.marking_remark       || data.markingRemark;
  data.shipping_marks       = data.shipping_marks       || data.markingShippingMarks;
  data.side_marks           = data.side_marks           || data.markingSideMarks;
  data.inner_box_marks      = data.inner_box_marks      || data.markingInnerBoxMarks;

  // On-site test section result/remark aliases
  data.onSiteTestResult = data.onSiteTestResult || data.onSiteTestResult;
  data.onSiteTestRemark = data.onSiteTestRemark || data.onSiteTestsRemark;

  // Client requirement aliases
  data.client_requirement_result = data.client_requirement_result || data.clientRequirementResult;
  data.client_requirement_remark = data.client_requirement_remark || data.clientRequirementRemark;

  // Dimensions: expand array → grouped format for Section D
  // dimensionsTable rows → data.dimensionsRows (consumed by new DPI D section)
  data._dpiDimensionsRows = data.dimensionsTable || [];
  data._dpiDimensionsItemNo = data.dimensionsItemNo || data.dimensionsItemNo || data.itemNo;
  data._dpiDimensionsGroupName = data.dimensionsGroupName || "";
  data.productResult = data.productResult || data.dimensionsResult;
  data.productRemark = data.productRemark || data.dimensionsRemark;
}
```

### Change 2 — Section G: Production Line (new table)

Insert after Section F table push, before the current "G. CLIENT SPECIAL REQUIREMENT" block:

**Table structure (5 columns):**
- Header row: "G. PRODUCTION LINE CHECKING" spanning all columns
- Sub-header: "Fixed Sample size: [productionLineSampleSize] pieces"  
- Column headers: Process/Accessory | Sampling Size (pieces) | Style & Color | Problems/Defectives | Number
- Dynamic rows from `data.productionLineTable` array
- Total row: auto-sum of `samplingSize` column
- Result row: `data.productionLineResult`
- Remark row: `data.productionLineRemark`

### Change 3 — Section H: Client Special Requirement (relabeled)

Change header text from `"G. CLIENT SPECIAL REQUIREMENT"` → `"H. CLIENT SPECIAL REQUIREMENT"`.

### Change 4 — Section I: Production Schedule (new table)

Insert after Section H (Client Req), before photos:

**Table structure (label-value pairs):**
- Header: "I. PRODUCTION SCHEDULE"
- Rows (label | value):
  - Production Lines Available for This Order | `data.psLinesAvailable`
  - How Many Workers per Line? | `data.psWorkersPerLine`
  - Output Rate per Line per Day | `data.psOutputRatePerLine`
  - Maximum Output per Day | `data.psMaxOutputPerDay`
  - Minimum Output per Day | `data.psMinOutputPerDay`
  - Estimated Date for PSI Inspection | `data.psEstimatedPSIDate`
  - Estimated Date When Goods Finished & Packed | `data.psEstimatedFinishDate`

### Change 5 — Section J: Photos (relabeled)

Change header text from `"H. PHOTOS"` → `"J. PHOTOS"`.

---

## Section Mapping: Before vs After

| Label in DOCX | Before | After |
|---|---|---|
| Section A | Quantity | Quantity (field fixes) |
| Section B | Workmanship | Workmanship (field fixes) |
| Section C | On-Site Tests | On-Site Tests (array → flat fix) |
| Section D | Product Specification | Product Specification (array fix) |
| Section E | Packing | Packing (array → flat fix) |
| Section F | Marking & Labeling | Marking & Labeling (field fixes) |
| Section G | Client Special Req | **Production Line (new)** |
| Section H | Photos | **Client Special Req (relabeled)** |
| Section I | — | **Production Schedule (new)** |
| Section J | — | **Photos (relabeled)** |

---

## Out of Scope

- Dimension red-highlight logic for out-of-spec values (form-level, not DOCX)
- AQL auto-FAIL logic on form (frontend concern)
- Database persistence schema changes
- Frontend form changes
