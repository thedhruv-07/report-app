const mongoose = require("mongoose");

const FactoryAuditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Factory Audit Report" },
  status: { type: String, enum: ["draft", "completed"], default: "draft" },
  
  // Section 1: General Info
  generalInfo: {
    client: String,
    supplier: String,
    factory: String,
    factoryAddress: String,
    contactPerson: String,
    email: String,
    phone: String,
    auditDate: String,
    auditorName: String,
    servicePerformed: { type: String, default: "Factory Audit" }
  },

  // Section 2: Audit Overview (Scores/Weightage)
  auditOverview: {
    totalScore: Number,
    percentage: Number,
    grade: String,
    scores: [
      { section: String, score: Number, maxScore: Number, weight: Number }
    ]
  },

  // Section 3: Comments
  comments: [String],

  // Section 4: Special Requirements
  specialRequirements: [
    { requirement: String, result: String, remark: String }
  ],

  // Section 5: Remarks
  remarks: {
    problemRemarks: [String],
    generalRemarks: [String]
  },

  // Section 6: Supplier Profile
  supplierProfile: {
    legalStatus: String,
    yearEstablished: String,
    businessScope: String,
    majorProducts: String,
    mainMarkets: String
  },

  // Section 7: Production Capacity
  productionCapacity: {
    totalEmployees: Number,
    productionStaff: Number,
    qcStaff: Number,
    monthlyCapacity: String,
    leadTime: String
  },

  // Section 8: Machinery
  machinery: [
    { name: String, quantity: Number, condition: String }
  ],

  // Section 9: Warehouse
  warehouse: {
    rawMaterials: String,
    finishedGoods: String,
    storageConditions: String
  },

  // Section 10: Quality Control
  qualityControl: {
    qcManagement: String,
    inspectionProcedures: String,
    equipmentCalibration: String
  },

  // Section 11: R&D
  researchDevelopment: {
    rdStaff: Number,
    rdCapabilities: String,
    patents: String
  },

  // Section 12: Environment
  environment: {
    socialResponsibility: String,
    environmentalProtection: String,
    safetyConditions: String
  },

  // Section 13: Final Conclusion
  conclusion: {
    result: { type: String, enum: ["PASSED", "FAILED", "PENDING"], default: "PENDING" },
    summary: String
  },

  // Photos
  photos: [
    {
      id: String,
      url: String,
      key: String,
      section: String,
      caption: String
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("FactoryAudit", FactoryAuditSchema);
