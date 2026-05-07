export const faSchema = {
  generalInfo: [
    { name: "client", label: "Client", type: "text", placeholder: "e.g., FRIN" },
    { name: "supplier", label: "Supplier", type: "text", placeholder: "Enter supplier name" },
    { name: "factory", label: "Factory", type: "text", placeholder: "Enter factory name" },
    { name: "factoryAddress", label: "Factory Address", type: "text", placeholder: "Enter factory address" },
    { name: "supplierAddress", label: "Supplier Address", type: "text", placeholder: "Enter supplier address" },
    { name: "contactPerson", label: "Contact Person", type: "text", placeholder: "Enter contact person" },
    { name: "email", label: "Email", type: "email", placeholder: "Enter email" },
    { name: "phone", label: "Phone", type: "text", placeholder: "Enter phone number" },
    { name: "auditDate", label: "Audit Date", type: "date" },
    { name: "auditorName", label: "Auditor Name", type: "text", placeholder: "Enter auditor name" },
  ],
  auditOverview: {
    sections: [
      { id: "profile", label: "Supplier/Factory Profile", weight: 5 },
      { id: "orgCharts", label: "Factory Organization Charts", weight: 3 },
      { id: "lines", label: "Production Lines - Capacity", weight: 5 },
      { id: "machinery", label: "Factory Facilities - machinery Conditions", weight: 5 },
      { id: "qaqc", label: "Quality Assurance & Quality Control System", weight: 5 },
      { id: "rd", label: "R&D – Sampling Capacity", weight: 3 },
      { id: "environment", label: "Environment (optional)", weight: 3 },
    ]
  },
  supplierProfile: [
    { name: "dateOfFoundation", label: "Date of foundation", type: "text" },
    { name: "legalStatus", label: "Legal status", type: "select", options: ["State owed", "Private", "Foreign Invested", "Join Venture"] },
    { name: "actualLocation", label: "Actual location", type: "textarea" },
    { name: "locationBusinessLicense", label: "Location on business license", type: "text" },
    { name: "locationExportLicense", label: "Location on export license", type: "text" },
    { name: "locationBankInfo", label: "Location on bank information", type: "text" },
    { name: "locationBusinessCard", label: "Location on business card", type: "text" },
    { name: "area", label: "Area (Sq. Ft.)", type: "text" },
    { name: "numberOfStaff", label: "Number of staff", type: "number" },
    { name: "corporateRepresentative", label: "Corporate representative", type: "text" },
    { name: "mainProducts", label: "Main products", type: "textarea" },
    { name: "mainMarket", label: "Main market", type: "textarea" },
    { name: "businessLicenseInfo", label: "Business license (Ref/Capital)", type: "text" },
    { name: "turnover2018", label: "Annual turnover 2018 (USD)", type: "text" },
    { name: "turnover2019", label: "Annual turnover 2019 (USD)", type: "text" },
    { name: "turnover2020", label: "Annual turnover 2020 (USD)", type: "text" },
    { name: "turnoverTrend", label: "Turnover Trend", type: "select", options: ["Increase", "Decrease", "Stable", "N/A"] },
  ],
  communicationInfrastructure: [
    { name: "telephoneSets", label: "Telephone sets", type: "text" },
    { name: "faxMachines", label: "Fax machines", type: "text" },
    { name: "computers", label: "Computers", type: "text" },
    { name: "emailDomain", label: "E-mail Domain", type: "text" },
  ],
  productsMarkets: {
    columns: [
      { key: "productType", label: "Product type", type: "text" },
      { key: "customerName", label: "Major customer name", type: "text" },
      { key: "marketLocation", label: "Market location", type: "text" },
      { key: "monthlyQty", label: "Monthly Order Qty (pcs)", type: "text" },
    ]
  },
  recommendations: {
    columns: [
      { key: "companyName", label: "Company name", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "contact", label: "Contact", type: "text" },
      { key: "products", label: "Products", type: "text" },
      { key: "details", label: "Details", type: "text" },
    ]
  },
  relatedPictures: {
    buildingOffice: {
      groups: [
        { id: "buildingOfficePhotos", label: "Building and office viewing" }
      ]
    },
    buildingCertificate: [
      { name: "certPhoto", label: "Certificate Photo", type: "photo" },
      { name: "certCaption", label: "Caption", type: "text" },
    ],
    licenseAccreditation: [
      { name: "licensePhoto", label: "License Photo", type: "photo" },
      { name: "licenseCertNo", label: "Certificate No", type: "text" },
      { name: "licenseDateIssued", label: "Date issued", type: "text" },
      { name: "licenseExpiration", label: "Expiration", type: "text" },
    ],
    exportLicense: [
      { name: "exportPhoto", label: "Export License Photo", type: "photo" },
      { name: "exportCertNo", label: "Certificate No", type: "text" },
      { name: "exportDateIssued", label: "Date issued", type: "text" },
    ],
    bankInfo: [
      { name: "bankPhoto", label: "Bank Info Photo", type: "photo" },
      { name: "bankCertNo", label: "Certificate No", type: "text" },
      { name: "bankDateIssued", label: "Date issued", type: "text" },
      { name: "bankAccountNumber", label: "Bank account number", type: "text" },
    ],
    score: [
      { name: "part1Score", label: "Part 1 Score (1-10)", type: "number", min: 1, max: 10 }
    ]
  },
  productionCapacity: [
    { name: "totalEmployees", label: "Total Employees", type: "number" },
    { name: "productionStaff", label: "Production Staff", type: "number" },
    { name: "qcStaff", label: "QC Staff", type: "number" },
    { name: "monthlyCapacity", label: "Monthly Capacity", type: "text" },
    { name: "weeklyCapacity", label: "Weekly Capacity", type: "text" },
    { name: "leadTime", label: "Lead Time", type: "text" },
  ],
  machineryTable: {
    columns: [
      { key: "name", label: "Machine Name", type: "text" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "condition", label: "Condition", type: "text" },
    ]
  },
  warehouse: [
    { name: "rawMaterials", label: "Raw Materials Storage", type: "textarea" },
    { name: "finishedGoods", label: "Finished Goods Storage", type: "textarea" },
    { name: "storageConditions", label: "Storage Conditions", type: "textarea" },
  ],
  qualityControl: [
    { name: "qcManagement", label: "QC Management", type: "textarea" },
    { name: "inspectionProcedures", label: "Inspection Procedures", type: "textarea" },
    { name: "equipmentCalibration", label: "Equipment Calibration", type: "textarea" },
  ],
  researchDevelopment: [
    { name: "rdStaff", label: "R&D Staff Count", type: "number" },
    { name: "rdCapabilities", label: "R&D Capabilities", type: "textarea" },
    { name: "patents", label: "Patents / Innovations", type: "textarea" },
  ],
  environment: [
    { name: "socialResponsibility", label: "Social Responsibility", type: "textarea" },
    { name: "environmentalProtection", label: "Environmental Protection", type: "textarea" },
    { name: "safetyConditions", label: "Safety Conditions", type: "textarea" },
  ],
  conclusion: [
    { name: "result", label: "Audit Result", type: "select", options: ["PASSED", "FAILED", "PENDING"] },
    { name: "summary", label: "Summary Statement", type: "textarea" },
    { name: "conclusionPhoto", label: "Signature / Summary Photo", type: "photo" },
  ],
  specialRequirements: {
    columns: [
      { key: "requirement", label: "Requirement", type: "text" },
      { key: "result", label: "Result", type: "text" },
      { key: "remark", label: "Remark", type: "text" },
    ]
  },
  photos: {
    groups: [
      { id: "generalPhotos", label: "General Photos" },
      { id: "productionPhotos", label: "Production Line Photos" },
      { id: "machineryPhotos", label: "Machinery Photos" },
      { id: "warehousePhotos", label: "Warehouse Photos" },
      { id: "qcPhotos", label: "QC Photos" },
      { id: "environmentPhotos", label: "Environment & Safety Photos" },
    ]
  },
  part2: {
    orgCharts: {
      groups: [
        { id: "orgChartPhotos", label: "Factory organization chart" }
      ]
    },
    score: [
      { name: "part2Score", label: "Part 2 Score (1-10)", type: "number", min: 1, max: 10 }
    ]
  },
  part3: {
    productionWorkflow: {
      groups: [
        { id: "productionWorkflowPhotos", label: "Production workflow chart" }
      ]
    },
    productionProcess: {
      columns: [
        { key: "operationName", label: "Operation Name", type: "text" },
        { key: "machineName", label: "Machine/Device Name", type: "text" },
        { key: "machineCount", label: "Machine count", type: "number" },
        { key: "workersNumber", label: "Workers number", type: "number" },
        { key: "outputPerHour", label: "Output (pcs/hour)", type: "number" },
        { key: "dailyCapacity", label: "Total Step Capacity (PCS/day)", type: "number" },
      ]
    },
    dailyOutputCheck: [
      { name: "runningProduction", label: "Running production during Audit?", type: "select", options: ["Yes", "No"] },
      { name: "outputCheckComments", label: "Comments", type: "textarea" },
      { name: "processLines", label: "Process lines", type: "text" },
      { name: "startTime", label: "Start time", type: "text" },
      { name: "finishedTime", label: "Finished time", type: "text" },
      { name: "totalTime", label: "Total time", type: "text" },
      { name: "finishedProductsStart", label: "Finished products (Start)", type: "number" },
      { name: "finishedProductsEnd", label: "Finished products (End)", type: "number" },
      { name: "outputPieces", label: "Output pieces", type: "number" },
    ],
    dailyOutputPhotos: {
      groups: [
        { id: "dailyOutputPhotos", label: "Daily output check photos" }
      ]
    },
    leadTimes: [
      { name: "rawMaterialCapacityFactory", label: "Raw material supply (Factory)", type: "text" },
      { name: "rawMaterialCapacityAuditor", label: "Raw material supply (Auditor check)", type: "text" },
      { name: "weeklyCapacityFactory", label: "Production weekly capacity (Factory)", type: "text" },
      { name: "weeklyCapacityAuditor", label: "Production weekly capacity (Auditor check)", type: "text" },
    ],
    bottlenecks: [
      { name: "bottleneckAuditorCheck", label: "Sensitive points / bottlenecks (Auditor check)", type: "textarea" },
      { name: "bottleneckComments", label: "Comments", type: "textarea" },
    ],
    score: [
      { name: "part3Score", label: "Part 3 Score (1-10)", type: "number", min: 1, max: 10 }
    ]
  },
  part4: {
    machineryConditions: {
      id: "machineryConditions",
      label: "Machines for production",
      columns: [
        { name: "machineName", label: "Machine Name/ Brand/Country of Origin", type: "text" },
        { name: "picture", label: "Picture", type: "photo" },
        { name: "count", label: "Count", type: "number" },
        { name: "comments", label: "Comments (conditions and age)", type: "textarea" },
      ]
    },
    warehouseCondition: [
      { name: "warehouseArea", label: "Area of Warehouse (M²)", type: "text" },
      { name: "materialsStocked", label: "Materials clearly stocked in different areas?", type: "radio", options: ["Yes", "No"] },
      { name: "labMarking", label: "Lab/Marking clearly indicated in different material?", type: "radio", options: ["Yes", "No"] },
      { name: "warehouseClean", label: "Warehouse clean and tidy?", type: "radio", options: ["Yes", "No"] },
      { name: "facilitiesAdvanced", label: "Equipment/Tools/Facilities Advanced?", type: "radio", options: ["Yes", "No"] },
      { name: "warehouseCapacity", label: "Estimated warehouse capacity", type: "text" },
    ],
    warehousePhotos: {
      rawMaterials: { id: "rawMaterialsStorage", label: "Raw Materials Storage", limit: 1 },
      finishedProducts: { id: "finishedProductsStorage", label: "Finished products storage condition", limit: 1 },
    },
    sampleRoomCondition: [
      { name: "sampleRoomClean", label: "Sample room clean and tidy?", type: "radio", options: ["Yes", "No"] },
      { name: "sampleDisposed", label: "Sample complete disposed in Sample room?", type: "radio", options: ["Yes", "No"] },
    ],
    publicPowerSupply: [
      { name: "publicPowerConnected", label: "Public power Connected?", type: "radio", options: ["Yes", "No"] },
      { name: "frequentPowerOutage", label: "Frequent Power Outage in the area?", type: "radio", options: ["Yes", "No"] },
      { name: "dieselGenerator", label: "Diesel Generator available?", type: "radio", options: ["Yes", "No"] },
      { name: "generatorCount", label: "If yes, Electric Power Generator Count:", type: "text" },
    ],
    shipmentCapabilities: [
      { name: "shippingMeetsRequirement", label: "Capacity of shipping meets requirement of buyer?", type: "radio", options: ["Yes", "No"] },
      { name: "containersLoadedTogether", label: "Over 4 containers can be loaded together?", type: "radio", options: ["Yes", "No"] },
      { name: "protectionBadWeather", label: "Protection for loading against bad weather?", type: "radio", options: ["Yes", "No"] },
      { name: "mechanicalLoadingDisposed", label: "Mechanical Loading Capacity disposed? (Fork,etc.)", type: "radio", options: ["Yes", "No"] },
    ],
    shipmentPhotos: {
      loadingPlace1: { id: "loadingPlace1", label: "Loading Place", limit: 1 },
      loadingPlace2: { id: "loadingPlace2", label: "Loading Place", limit: 1 },
    },
    score: [
      { name: "part4Score", label: "Part 4 Score (1-10)", type: "number", min: 1, max: 10 }
    ]
  },
  part5: {
    qcSystem: [
      { name: "qcSystemAvailable", label: "Quality Assurance & Quality Control system available?", type: "radio", options: ["Yes", "No"] },
      { name: "qcPersonnelIndependent", label: "QC personnel independent from production?", type: "radio", options: ["Yes", "No"] },
      { name: "rawMaterialInspection", label: "Raw material inspection conducted?", type: "radio", options: ["Yes", "No"] },
      { name: "inProcessInspection", label: "In-process quality control (IPQC) conducted?", type: "radio", options: ["Yes", "No"] },
      { name: "finalInspection", label: "Final inspection conducted before shipment?", type: "radio", options: ["Yes", "No"] },
      { name: "qcRecordsMaintained", label: "QC records maintained and retrievable?", type: "radio", options: ["Yes", "No"] },
    ],
    testingEquipment: {
      id: "testingEquipment",
      label: "Testing Equipment / Facilities",
      columns: [
        { name: "equipmentName", label: "Equipment Name", type: "text" },
        { name: "purpose", label: "Purpose / Usage", type: "text" },
        { name: "calibrationDate", label: "Last Calibration Date", type: "text" },
        { name: "status", label: "Status (Working/Not Working)", type: "text" },
      ]
    },
    qaqcPhotos: {
      qcDepartment: { id: "qcDepartment", label: "QC Department / Testing Room", limit: 1 },
      testingProcess: { id: "testingProcess", label: "Testing Process in action", limit: 1 },
    },
    score: [
      { name: "part5Score", label: "Part 5 Score (1-10)", type: "number", min: 1, max: 10 }
    ]
  }
};
