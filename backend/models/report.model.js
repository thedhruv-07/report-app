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
  
  onSiteTests: { type: embeddedOnSiteTestSchema, default: () => ({}) },
  packing: { type: embeddedPackingSchema, default: () => ({}) },
  conclusionDetails: { type: embeddedConclusionSchema, default: () => ({}) },

}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

module.exports = {
  Report,
};
