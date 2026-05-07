const mongoose = require("mongoose");

const FactoryAuditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Factory Audit Report" },
  status: { type: String, enum: ["draft", "completed"], default: "draft" },
  generalPhoto: { type: String }, // Base64 or URL
  
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

  // Section 3: Remarks
  generalOverviewRemarks: [String],
  clientSpecialRemarks: [String],
  suggestions: [String],

  // Section 4: Special Requirements
  specialRequirements: [
    { requirement: String, result: String, remark: String }
  ],
  specialRequirementConclusion: String,

  // Part 1: Supplier Profile
  supplierProfile: {
    dateOfFoundation: String,
    legalStatus: String,
    actualLocation: String,
    locationBusinessLicense: String,
    locationExportLicense: String,
    locationBankInfo: String,
    locationBusinessCard: String,
    area: String,
    numberOfStaff: Number,
    corporateRepresentative: String,
    mainProducts: String,
    mainMarket: String,
    businessLicenseInfo: String,
    turnover2018: String,
    turnover2019: String,
    turnover2020: String,
    turnoverTrend: String
  },
  communicationInfrastructure: {
    telephoneSets: String,
    faxMachines: String,
    computers: String,
    emailDomain: String
  },
  productsMarkets: [
    { productType: String, customerName: String, marketLocation: String, monthlyQty: String }
  ],
  recommendations: [
    { companyName: String, country: String, contact: String, products: String, details: String }
  ],

  buildingOfficePhotos: [
    { preview: String, label: String }
  ],
  relatedPictures: {
    certPhoto: String,
    certCaption: String,
    licensePhoto: String,
    licenseCertNo: String,
    licenseDateIssued: String,
    licenseExpiration: String,
    exportPhoto: String,
    exportCertNo: String,
    exportDateIssued: String,
    bankPhoto: String,
    bankCertNo: String,
    bankDateIssued: String,
    bankAccountNumber: String
  },
  part1Score: Number,
  orgChartPhotos: [
    { preview: String, label: String }
  ],
  part2Score: Number,

  // Combined photo gallery groups for DOCX service
  reportPhotoGroups: [
    {
      id: String,
      description: String,
      photos: [{ preview: String, label: String }]
    }
  ],

  // Section 7: Production Capacity
  productionCapacity: {
    totalEmployees: Number,
    productionStaff: Number,
    qcStaff: Number,
    monthlyCapacity: String,
    weeklyCapacity: String,
    leadTime: String
  },

  // Part 3: Production lines / Capacity
  productionWorkflowPhotos: [{ preview: String, label: String }],
  productionProcess: [
    {
      operationName: String,
      machineName: String,
      machineCount: Number,
      workersNumber: Number,
      outputPerHour: Number,
      dailyCapacity: Number
    }
  ],
  dailyOutputCheck: {
    runningProduction: String,
    outputCheckComments: String,
    processLines: String,
    startTime: String,
    finishedTime: String,
    totalTime: String,
    finishedProductsStart: Number,
    finishedProductsEnd: Number,
    outputPieces: Number
  },
  dailyOutputPhotos: [{ preview: String, label: String }],
  leadTimes: {
    rawMaterialCapacityFactory: String,
    rawMaterialCapacityAuditor: String,
    weeklyCapacityFactory: String,
    weeklyCapacityAuditor: String
  },
  bottlenecks: {
    bottleneckAuditorCheck: String,
    bottleneckComments: String
  },
  part3Score: Number,

  part4: {
    machineryConditions: [{
      machineName: String,
      picture: String,
      count: Number,
      comments: String
    }],
    warehouseCondition: {
      warehouseArea: String,
      materialsStocked: String,
      labMarking: String,
      warehouseClean: String,
      facilitiesAdvanced: String,
      warehouseCapacity: String
    },
    warehousePhotos: {
      rawMaterials: String,
      finishedProducts: String
    },
    sampleRoomCondition: {
      sampleRoomClean: String,
      sampleDisposed: String
    },
    publicPowerSupply: {
      publicPowerConnected: String,
      frequentPowerOutage: String,
      dieselGenerator: String,
      generatorCount: String
    },
    shipmentCapabilities: {
      shippingMeetsRequirement: String,
      containersLoadedTogether: String,
      protectionBadWeather: String,
      mechanicalLoadingDisposed: String
    },
    shipmentPhotos: {
      loadingPlace1: String,
      loadingPlace2: String
    },
    part4Score: Number
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
