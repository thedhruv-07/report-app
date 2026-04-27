export const clsSchema = {
  generalInfo: [
    { name: "servicePerformed", label: "Service Performed", type: "text", defaultValue: "Container Loading Supervision (CLS)" },
    { name: "client", label: "Client", type: "text", placeholder: "e.g., FRIN" },
    { name: "supplier", label: "Supplier", type: "text", placeholder: "Enter supplier name" },
    { name: "factory", label: "Factory", type: "text", placeholder: "Enter factory name" },
    { name: "productName", label: "Product Name", type: "text", placeholder: "Enter product name" },
    { name: "po", label: "P.O. No.", type: "text", placeholder: "Enter PO number" },
    { name: "itemNo", label: "Item No.", type: "text", placeholder: "Enter Item numbers" },
    { name: "destinationCountry", label: "Destination Country", type: "text", placeholder: "e.g., Gabon" },
    { name: "inspectionDate", label: "Inspection Date", type: "date" },
    { name: "location", label: "Inspection Location", type: "text", placeholder: "Enter location" },
    { name: "referenceSample", label: "Reference Sample", type: "text", placeholder: "e.g., None" },
  ],
  inspectionSummary: [
    { name: "quantity", label: "Quantity", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "productConformity", label: "Product Conformity", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "packing", label: "Packing", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "loadingProcess", label: "Loading Process", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
    { name: "clientRequirement", label: "Client Requirement", type: "select", options: ["Passed", "Failed", "Pending", "N/A"] },
  ],
  remarks: [
    { name: "problemRemarks", label: "Problem Remarks", type: "remarks_list" },
    { name: "generalRemarks", label: "General Remarks", type: "remarks_list" },
    { name: "sampleCollection", label: "Sample Collection Record", type: "text" },
  ],
  conclusion: [
    { name: "conclusion", label: "Overall Conclusion", type: "select", options: ["PASSED", "FAILED", "PENDING"] },
  ],
  quantityTable: {
    columns: [
      { key: "po", label: "P.O.", type: "text" },
      { key: "item", label: "Item", type: "text" },
      { key: "orderQtyAmount", label: "Order Qty (Quantity)", type: "text" },
      { key: "orderQtyCartons", label: "Order Qty (Cartons)", type: "text" },
      { key: "loadedQtyAmount", label: "Loaded Qty (Quantity)", type: "text" },
      { key: "loadedQtyCartons", label: "Loaded Qty (Cartons)", type: "text" },
      { key: "cartonsRemain", label: "Cartons Remain", type: "text" },
    ],
    metadata: [
      { name: "quantityUnit", label: "Unit (e.g., Kg, Pcs)", type: "text", defaultValue: "Kg" },
      { name: "packingListProvidedBy", label: "Packing List Provided by", type: "text", defaultValue: "By Factory" },
      { name: "quantityResult", label: "Quantity Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Passed" },
      { name: "quantityRemark", label: "Quantity Remark", type: "text", defaultValue: "N/A" },
    ]
  },
  productConformityDetails: [
    { name: "selectedCartons", label: "Selected Cartons", type: "text", defaultValue: "(3 carton per model)" },
    { name: "randomSelectionInfo", label: "Random Selection Info", type: "text", defaultValue: "12 Cartons were selected randomly on site. No carton number in shipping mark." },
    { name: "cartonNoInfo", label: "Carton No. Info", type: "text", defaultValue: "Carton No.: NA" },
    { name: "styleColorResult", label: "Style and Color Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "N/A" },
    { name: "workmanshipResult", label: "Workmanship Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "N/A" },
    { name: "conformityOverallResult", label: "Conformity Overall Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "N/A" },
    { name: "conformityRemark", label: "Conformity Remark", type: "text", defaultValue: "N/A" },
  ],
  loadingProcess: [
    { name: "containerNo", label: "Container No.", type: "text", placeholder: "e.g., MSKU1234567" },
    { name: "sealNo", label: "Seal No.", type: "text", placeholder: "e.g., 987654" },
    { name: "location", label: "Loading Location", type: "text", placeholder: "e.g., Factory Yard" },
    { name: "weather", label: "Weather Condition", type: "text", placeholder: "e.g., Sunny, Rainy" }
  ],
  containerCheck: [
    { name: "noHoles", label: "No holes or cracks (roof, walls, floor)", type: "checkbox" },
    { name: "doorsWorking", label: "Doors functioning properly", type: "checkbox" },
    { name: "clean", label: "Clean, dry and odor-free", type: "checkbox" },
    { name: "watertight", label: "Watertight (light test)", type: "checkbox" },
    { name: "noProtrusions", label: "No nails or protrusions", type: "checkbox" }
  ],
  loadingCheck: [
    { name: "evenWeight", label: "Even weight distribution", type: "checkbox" },
    { name: "loadingMethod", label: "Loading Method", type: "text", placeholder: "e.g., Manual, Forklift" },
    { name: "layersCount", label: "Number of Layers", type: "number", placeholder: "e.g., 5" },
    { name: "remarks_loading", label: "Remarks / Observations", type: "textarea", placeholder: "Any specific observations during loading..." }
  ],
  clientRequirement: [
    { name: "temperatureCheck", label: "Temperature Check Result", type: "text", placeholder: "e.g., 22°C" },
    { name: "remarks_client", label: "Special Requirements Remarks", type: "textarea", placeholder: "Notes regarding client specific requirements..." }
  ],
  photos: {
    groups: [
      { id: "remarkPhotos", label: "Remarks Photos" },
      { id: "temperaturePhotos", label: "Temperature & Environment Photos" },
      { id: "loadingPhotos", label: "Loading Process Photos" },
      { id: "containerPhotos", label: "Container & Seal Photos" }
    ]
  },
  clsPacking: {
    itemColumns: [
      { key: "itemName", label: "Item No.", type: "text" },
      { key: "qtyCartonMarking", label: "Qty/Carton (Marking)", type: "text" },
      { key: "qtyCartonActual", label: "Qty/Carton (Actual)", type: "text" },
      { key: "qtyInnerMarking", label: "Qty/Inner Box (Marking)", type: "text" },
      { key: "qtyInnerActual", label: "Qty/Inner Box (Actual)", type: "text" },
      { key: "weightMarking", label: "Weight (Marking)", type: "text" },
      { key: "weightActual", label: "Weight (Actual)", type: "text" },
      { key: "cartonSize", label: "Carton Size (LxWxH cm)", type: "text" },
    ],
    conditionColumns: [
      { key: "description", label: "Description", type: "text" },
      { key: "result", label: "Result", type: "text" },
    ],
    metadata: [
      { name: "cls_fastening_metal_staples", label: "Fastening Metal Staples", type: "text", defaultValue: "/" },
      { name: "cls_nylon_band", label: "Nylon Band", type: "text", defaultValue: "Yes" },
      { name: "cls_material", label: "Material", type: "text", defaultValue: "/" },
      { name: "cls_corrugated_paper_plies", label: "Corrugated Paper Plies", type: "text", defaultValue: "/" },
      { name: "cls_packing_method", label: "Packing Method", type: "text", defaultValue: "/" },
      { name: "cls_assortment_method", label: "Assortment Method", type: "text", defaultValue: "No assortment packing" },
      { name: "cls_shipping_marks_label", label: "Shipping Marks Label", type: "text", defaultValue: "Shipping Marks (on 2 Side )" },
      { name: "cls_shipping_marks_result", label: "Shipping Marks Result", type: "text", defaultValue: "Actual finding" },
      { name: "cls_side_marks_label", label: "Side Marks Label", type: "text", defaultValue: "Side Marks (on 2 Side )" },
      { name: "cls_side_marks_result", label: "Side Marks Result", type: "text", defaultValue: "Actual finding" },
      { name: "cls_inner_box_marks_label", label: "Inner Box Marks Label", type: "text", defaultValue: "Inner Box Marks (on /Side )" },
      { name: "cls_inner_box_marks_result", label: "Inner Box Marks Result", type: "text", defaultValue: "Actual finding" },
      { name: "cls_packing_result", label: "Packing Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Passed" },
      { name: "cls_packing_remark", label: "Packing Remark", type: "text", defaultValue: "" },
    ]
  }
};
