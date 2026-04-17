const mongoose = require("mongoose");

const sectionStatusSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  sectionName: { type: String, required: true },
  status: { type: String, enum: ["draft", "completed", "n_a"], default: "draft" },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const SectionStatus = mongoose.model("SectionStatus", sectionStatusSchema);

module.exports = { SectionStatus };
