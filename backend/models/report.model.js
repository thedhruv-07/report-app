const mongoose = require("mongoose");

const embeddedOnSiteTestSchema = new mongoose.Schema({
  onSiteTestResult: { type: String, default: "" },
  onSiteTestRemark: { type: String, default: "" },
}, { _id: false });

const embeddedPackingSchema = new mongoose.Schema({
  packingResult: { type: String, default: "" },
  marking_result_final: { type: String, default: "" },
  client_requirement_result: { type: String, default: "" },
}, { _id: false });

const embeddedConclusionSchema = new mongoose.Schema({
  conclusion: { type: String, default: "" },
  factoryComments: { type: String, default: "" },
  recommendationText: { type: String, default: "" },
  remarks: [{ type: String, default: "" }],
}, { _id: false });

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  reportNumber: { type: String, index: true },
  title: { type: String, default: "Inspection Report" },
  status: {
    type: String,
    enum: ["draft", "completed"],
    default: "completed", // Setting to completed directly since we have the generate workflow
  },
  generalInfo: { type: mongoose.Schema.Types.ObjectId, ref: "GeneralInfo" },
  quantityDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Quantity" },
  workmanship: { type: mongoose.Schema.Types.ObjectId, ref: "Workmanship" },
  inspection: { type: mongoose.Schema.Types.ObjectId, ref: "Inspection" },
  materials: { type: mongoose.Schema.Types.ObjectId, ref: "Materials" },
  safety: { type: mongoose.Schema.Types.ObjectId, ref: "Safety" },
  comments: { type: mongoose.Schema.Types.ObjectId, ref: "Comments" },
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: "Media" }],
  sectionStatuses: [{ type: mongoose.Schema.Types.ObjectId, ref: "SectionStatus" }],
  
  // Operations Workflow
  operationStatus: {
    type: String,
    enum: ["draft", "submitted", "under_review", "approved", "rejected", "revision_required"],
    default: "draft"
  },
  operationComment: { type: String, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  assignedTM: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedAt: { type: Date },
  
  // Technical Manager Review Fields
  revisionRound: { type: Number, default: 1 },
  correctionFeedback: [{
    section: String,
    comment: String,
    priority: { type: String, enum: ["critical", "advisory"] },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    addedAt: { type: Date, default: Date.now }
  }],
  tmRemarks: [{
    text: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    addedAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

module.exports = {
  Report,
};
