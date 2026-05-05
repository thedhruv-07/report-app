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
    { name: "containerType", label: "Container Type", type: "text", defaultValue: "40' HQ" },
    { name: "containerNo", label: "Container No.", type: "text", placeholder: "e.g., SUDU9201319" },
    { name: "sealNo", label: "Seal No.", type: "text", placeholder: "e.g., BOLTD1715318" },
    { name: "avSealNo", label: "Seal No. (AV) If Used", type: "text", defaultValue: "/" },
    { name: "cargoBreakdown", label: "Item No.", type: "text", placeholder: "e.g., Topside, Silverside..." },
    { name: "loadedCarton", label: "Loaded Carton", type: "text", placeholder: "e.g., 1425" },
    { name: "shelter", label: "Shelter / Loading Area", type: "text", placeholder: "e.g., Covered Area" },
    { name: "weather", label: "Weather Condition", type: "text", placeholder: "e.g., Sunny" },
    { name: "loadingStartTime", label: "Loading Start Time", type: "text", placeholder: "e.g., 09:00 AM" },
    { name: "loadingEndTime", label: "Loading End Time", type: "text", placeholder: "e.g., 04:30 PM" },
    { name: "loadingProcessResult", label: "Loading Process Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Passed" },
    { name: "remarks_loading", label: "Loading Process Remark", type: "textarea", placeholder: "Overall remarks for loading process..." }
  ],
  containerCheck: [
    { id: "holes", label: "No holes, cracks or deformations present in container walls or roof.", result: "Passed" },
    { id: "doors", label: "Doors operate properly and closing devices operate properly.", result: "Passed" },
    { id: "clean", label: "Container interior is absolutely dry, clean, free of cargo residues and neutral in odor.", result: "Passed" },
    { id: "watertight", label: "Container is watertight (light test).", result: "Passed" },
    { id: "protrusions", label: "No nails or other protrusions found which could damage the cargo.", result: "Passed" },
    { id: "floor", label: "Container floor is solid and in good condition.", result: "Passed" },
    { id: "odour", label: "No strong odors or moisture found.", result: "Passed" },
    { id: "markings", label: "Container markings match documentation.", result: "Passed" }
  ],
  loadingCheck: [
    { id: "evenWeight", label: "The weight is evenly distributed in the container.", result: "Passed" },
    { id: "method", label: "Cargoes are properly put into the container by using appropriate loading equipment.", result: "Passed" },
    { id: "layers", label: "Maximum number of layers of the cargo inside the container.", result: "Passed" },
    { id: "noDamaged", label: "No damaged or wet cartons loaded.", result: "Passed" },
    { id: "properStowage", label: "Proper stowage and cargo securing inside the container.", result: "Passed" },
    { id: "ventilation", label: "Ventilation/Airflow is not blocked (for reefer).", result: "Passed" },
    { id: "tempMonitor", label: "Temperature is monitored and recorded during loading.", result: "Passed" },
    { id: "loadingAreaClean", label: "Loading area is clean and suitable.", result: "Passed" },
    { id: "protection", label: "Protection against rain/sun during loading.", result: "Passed" }
  ],
  containerClosing: [
    { id: "doorsClosed", label: "The doors and (if applicable) roof covering have been carefully closed.", result: "Passed" },
    { id: "containerFull", label: "Is the container completely full? If no, describe how carton are tied together.", result: "Actual finding" },
    { id: "reeferTemp", label: "For refrigerated containers with a refrigeration unit and heat able tank containers: the correct temperature has been set. For refrigerated containers, the temperature recorder is running and the temperature is displayed.", result: "N/A" },
    { id: "cargoWeight", label: "How much do the cargoes weigh? (if there is a weighbridge) Method 1 : total weight a = weight of empty container + weight of truck, total weight b = weight of empty container + weight of truck + gross weight of products. The gross weight of product c = b-a. This method is applicable for the scenario that the same truck is used to carry the container before and after loading. Method 2 : a=Weight of truck which would carry the container after loading; b= weight of truck which would carry the container after loading + weight of empty container + gross weight of product; the gross weight of product = b - a - claimed weight of empty container. This method is applicable for the scenario that the container was carried by different truck before and after loading, specially when the loading happens at the dock, or big logistic area.", result: "Actual finding" }
  ],
  clientRequirementTable: {
    columns: [
      { key: "requirement", label: "Client Requirements", type: "text" },
      { key: "result", label: "Result (Actual Finding)", type: "text" },
    ],
    metadata: [
      { name: "client_requirement_result", label: "Overall Result", type: "select", options: ["Passed", "Failed", "Pending", "N/A"], defaultValue: "Passed" },
      { name: "client_requirement_remark", label: "Remark", type: "textarea", placeholder: "General remarks for client requirements..." },
    ]
  },
  photos: {
    groups: [
      { id: "remarkPhotos", label: "Remarks Photos" },
      { id: "loadingAreaPhotos", label: "Loading Area Photos" },
      { id: "warehousePhotos", label: "Warehouse Photos" },
      { id: "emptyContainerPhotos", label: "Empty Container Photos" },
      { id: "truckCheckPhotos", label: "Truck Check Photos" },
      { id: "loadingPhotos", label: "Loading Process Photos" },
      { id: "closingPhotos", label: "Container Closing Photos" },
      { id: "containerPhotos", label: "Container & Seal Photos" },
      { id: "clientRequirementPhotos", label: "Client Requirement Photos" },
      { id: "generalPhotos", label: "General Photos" }
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
