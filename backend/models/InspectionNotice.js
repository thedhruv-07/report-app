const mongoose = require("mongoose");

const InspectionNoticeSchema = new mongoose.Schema({
  // Basic info
  noticeId: { type: String, required: true, unique: true }, // e.g., AV202607043841
  status: { type: String, enum: ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sourceBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }, // auto-created from booking
  clientCode: { type: String, default: '' },

  // SECTION 1: Basic Information
  basicInfo: {
    serviceType: { type: String, enum: ['Pre-Shipment Inspection', 'Container Loading Supervision', 'Factory Audit', 'During Production Inspection', 'Others'] },
    serviceTypeOther: { type: String, default: '' }, // free-text description when serviceType is "Others"
    sameDayReport: { type: Boolean, default: false },
    onlineReport: { type: Boolean, default: false },
    offlineReport: { type: Boolean, default: false },
    inspectionDateFrom: { type: Date },
    inspectionDateTo: { type: Date },
    inspectionLocation: { type: String },
    customerName: { type: String },
    productCategory: { type: String },
    productCategoryOther: { type: String, default: '' }, // free-text description when productCategory is "Others"
    attentiveOrder: { type: Boolean, default: false },
    csSatisfactionBonus: { type: Boolean, default: false },
    externalBookingRef: { type: String, default: '' }, // booking website reference ID
  },

  // SECTION 2: Team Assignment
  teamAssignment: {
    cs: { name: String, phone: String, mobile: String },
    cse: { name: String, phone: String, mobile: String },
    previewManager: { name: String, phone: String, mobile: String },
    scheduler: { name: String, phone: String, mobile: String },
    inspectors: [{
      inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      name: String,
      email: { type: String, default: '' }, // used to notify third-party inspectors with no platform account
      dateFrom: Date,
      dateTo: Date,
      mobile: String,
      manDays: Number,
      role: { type: String, enum: ['Leader', 'Member'] }
    }]
  },

  // SECTION 3: Product Information
  productInfo: {
    products: [{
      orderNo: String,
      productName: String,
      itemNo: String,
      quantity: Number,
      unit: { type: String, enum: ['pcs', 'sets', 'pairs', 'kg'] }
    }],
    totalQuantity: { type: Number },
    quantityFinished: { type: Number },
    quantityPacked: { type: Number },
    orderRemarks: { type: String },
    destination: { type: String },
    shipmentDate: { type: Date },
  },

  // SECTION 4: AQL (Acceptance Quality Limit)
  aql: {
    samplingLevel: { type: String, enum: ['Level I', 'Level II', 'Level III'] },
    sampledQuantity: { type: Number },
    inspectionStandard: {
      critical: { type: String, enum: ['Not Allowed', '0.065', '0.10', '0.15', '0.25', '0.40', '0.65', '1.0', '1.5', '2.5', '4.0', '6.5'] },
      major: { type: Number },
      minor: { type: Number },
    },
    acceptedQuantity: {
      critical: { type: Number },
      major: { type: Number },
      minor: { type: Number },
    },
    remarks: { type: String }
  },

  // SECTION 5: Inspection Requirements
  inspectionRequirements: {
    customerGeneralRequirement: { type: String },
    technicalManagerRemarks: { type: String },
    customerServiceRemarks: { type: String },
    organizerRemarks: { type: String }
  },

  // SECTION 6: Special Client Requirements
  specialClientRequirements: {
    customerSpecialRequirements: { type: String },
    colorMaterialFinish: { type: String },
    dimensionWeight: { type: String },
    logoLabel: { type: String },
    packingMaterial: { type: String },
    shippingMark: { type: String },
    additionalComments: { type: String }
  },

  // SECTION 7: Customer Samples
  customerSamples: {
    remarks: { type: String },
    samples: [{
      serialNo: String,
      itemNo: String,
      name: String,
      quantity: Number,
      storageLocation: String,
      remarks: String,
      status: String
    }]
  },

  // SECTION 8: Inspection Information
  inspectionInfo: {
    technicalManagerReviewed: { type: Boolean, default: false },
    generalWorkInstructions: [{ type: String }],
    operationalWorkInstructions: [{ type: String }],
    onlineWI: { fileName: String, url: String },
    reportTemplate: [{ fileName: String, uploadDate: Date, url: String }],
    customerClaimForm: { type: String },
    onlineCustomerClaimForm: { fileName: String, url: String },
    clientGeneralMaterials: { type: String }
  },

  // SECTION 9: Attachments
  attachments: {
    clientFiles: [{ fileName: String, size: String, uploadDate: Date, url: String }],
    supplierFiles: [{ fileName: String, size: String, uploadDate: Date, url: String }]
  },

  // SECTION 10: Inspection Tools & Equipment
  inspectionTools: {
    tools: [{ type: String }],
    equipment: [{ type: String }],
    trainingMaterials: [{ courseName: String }]
  },

  // SECTION 11: On-Site Tests
  onSiteTests: [{
    description: String,
    method: String,
    criteria: String,
    sampleSize: String,
    include: Boolean
  }],

  // SECTION 12: Defect Classification List
  defectClassifications: [{
    description: String,
    critical: Boolean,
    major: Boolean,
    minor: Boolean,
    photoRequired: Boolean
  }],

  // SECTION 13: Supplier Information
  supplierInfo: {
    supplierName: String,
    englishName: String,
    statusEntries: [{ content: String, label: String, submitDate: Date }]
  },

  // SECTION 14: Factory Information
  factoryInfo: {
    factoryName: String,
    englishName: String,
    address: String,
    googleMapsLink: String,
    mainContactPerson: String,
    otherContactPersons: String,
    phone: String,
    mobile: String,
    fax: String,
    equipmentInstruments: String,
    communicationEquipment: String,
    inspectionEnvironment: String,
    workingTimeStart: String,
    workingTimeEnd: String,
    transportationRoute: String,
    accommodationNearFactory: String,
    notesOnFactoryDisagreements: String,
    inspectionNotes: String,
    abnormalStatusEntries: [{ content: String, label: String, submitDate: Date }]
  },

  // SECTION 15: Recent Inspection Records
  recentRecords: [{
    inspectionDate: Date,
    inspectorName: String
  }],

  // SECTION 16: Instructional Letters Reading Record — logs each time the
  // notice is actually submitted (status set to 'scheduled'), not page views.
  submissionRecords: [{
    submittedBy: String,
    timeSubmitted: Date
  }],

  // REPORT (ONLINE) TAB
  // SECTION 17: Inspection Execution Info
  reportExecutionInfo: {
    timeClockRecords: [{
      inspector: String,
      date: Date,
      arrivalTimeFactory: String,
      arrivalLocation: String,
      arrivalDistance: String,
      departureTime: String,
      leaveLocation: String,
      leaveDistance: String,
      photos: [String]
    }],
    inspectionDates: [{
      date: Date,
      departureOffice: String,
      arrivalFactory: String,
      departureFactory: String
    }],
    actualInspectedQuantity: Number,
    workmanshipFound: {
      critical: Number,
      major: Number,
      minor: Number
    },
    problemRemark: String,
    generalRemark: String,
    overallConclusion: { type: String, enum: ['Pass', 'Fail', 'Pending'] },
    sampleSelected: { type: String, enum: ['Yes', 'No'] },
    calledCS: { type: String, enum: ['Yes', 'No'] },
    csConfirmedCall: { type: Boolean },
    clientRepOnSite: { present: Boolean, details: String },
    specialAttention: String,
    factoryRepSignedDraft: { type: String, enum: ['Yes', 'No', 'Refused'] },
    additionalRemarks: String,
    receivedPhoneCall: {
      cs: Boolean,
      tm: Boolean,
      none: Boolean,
      na: Boolean
    },
    workSupervisionRating: {
      materialsGuidance: { rating: Number, remarks: String },
      csSupportLevel: { rating: Number, remarks: String },
      tmWorkSatisfaction: { rating: Number, remarks: String }
    }
  },

  // SECTION 18: Upload & Report
  reportUploads: {
    inspectorUploads: [{ fileName: String, size: String, uploadTime: Date, uploadedBy: String, timeViewed: Date, viewedBy: String, url: String }],
    auditorUploads: [{ fileName: String, size: String, uploadTime: Date, uploadedBy: String, timeViewed: Date, viewedBy: String, url: String }],
    inspectorReports: [{ reportNo: String, creationDate: Date, finishDate: Date, confirmationTime: Date, url: String }],
    tmReports: [{ reportNo: String, creationDate: Date, finishDate: Date, confirmationTime: Date, url: String }]
  },


}, { timestamps: true });

module.exports = mongoose.model("InspectionNotice", InspectionNoticeSchema);
