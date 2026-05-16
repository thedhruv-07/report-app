const mongoose = require("mongoose");

const materialsSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  productSpec: { type: String, default: "" },
  dimensionsData: { type: mongoose.Schema.Types.Mixed, default: {} },
  materialsUsed: { type: String, default: "" },
  referenceSampleMatch: { type: String, default: "" },
  specifications: [
    {
      description: String,
      requirement: String,
      finding: String,
      result: String
    }
  ]
}, { timestamps: true });

const Materials = mongoose.model("Materials", materialsSchema);

module.exports = { Materials };
