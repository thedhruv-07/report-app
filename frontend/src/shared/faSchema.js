export const faSchema = {
  generalInfo: [
    { name: "client", label: "Client", type: "text", placeholder: "e.g., FRIN" },
    { name: "supplier", label: "Supplier", type: "text", placeholder: "Enter supplier name" },
    { name: "factory", label: "Factory", type: "text", placeholder: "Enter factory name" },
    { name: "factoryAddress", label: "Factory Address", type: "text", placeholder: "Enter factory address" },
    { name: "contactPerson", label: "Contact Person", type: "text", placeholder: "Enter contact person" },
    { name: "email", label: "Email", type: "email", placeholder: "Enter email" },
    { name: "phone", label: "Phone", type: "text", placeholder: "Enter phone number" },
    { name: "auditDate", label: "Audit Date", type: "date" },
    { name: "auditorName", label: "Auditor Name", type: "text", placeholder: "Enter auditor name" },
  ],
  auditOverview: [
    { name: "totalScore", label: "Total Score", type: "number" },
    { name: "percentage", label: "Percentage (%)", type: "number" },
    { name: "grade", label: "Grade", type: "select", options: ["A", "B", "C", "D"] },
  ],
  supplierProfile: [
    { name: "legalStatus", label: "Legal Status", type: "text" },
    { name: "yearEstablished", label: "Year Established", type: "text" },
    { name: "businessScope", label: "Business Scope", type: "text" },
    { name: "majorProducts", label: "Major Products", type: "text" },
    { name: "mainMarkets", label: "Main Markets", type: "text" },
  ],
  productionCapacity: [
    { name: "totalEmployees", label: "Total Employees", type: "number" },
    { name: "productionStaff", label: "Production Staff", type: "number" },
    { name: "qcStaff", label: "QC Staff", type: "number" },
    { name: "monthlyCapacity", label: "Monthly Capacity", type: "text" },
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
  ],
  photos: {
    groups: [
      { id: "generalPhotos", label: "General Photos" },
      { id: "productionPhotos", label: "Production Line Photos" },
      { id: "machineryPhotos", label: "Machinery Photos" },
      { id: "warehousePhotos", label: "Warehouse Photos" },
      { id: "qcPhotos", label: "QC Photos" },
      { id: "environmentPhotos", label: "Environment & Safety Photos" },
    ]
  }
};
