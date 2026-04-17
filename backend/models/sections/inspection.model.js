const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  quantityResult: { type: String, default: "" },
  workmanshipResult: { type: String, default: "" },
  onSiteTestsResult: { type: String, default: "" },
  dimensionsResult: { type: String, default: "" },
  packingResult: { type: String, default: "" },
  markingResult: { type: String, default: "" },
  clientRequirementResult: { type: String, default: "" },
}, { timestamps: true });

const Inspection = mongoose.model("Inspection", inspectionSchema);

module.exports = { Inspection };
