const mongoose = require("mongoose");

const workmanshipSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  inspectionStandardWM: { type: String, default: "" },
  samplingPlanWM: { type: String, default: "" },
  inspectionLevelWM: { type: String, default: "" },
  sampleSizeWM: { type: String, default: "" },
  aqlCriticalWM: { type: String, default: "" },
  aqlMajorWM: { type: String, default: "" },
  aqlMinorWM: { type: String, default: "" },
  acceptedCritical: { type: String, default: "" },
  acceptedMajor: { type: String, default: "" },
  acceptedMinor: { type: String, default: "" },
  totalFoundCritical: { type: String, default: "" },
  totalFoundMajor: { type: String, default: "" },
  totalFoundMinor: { type: String, default: "" },
  workmanshipResult: { type: String, default: "" },
  workmanshipRemark: { type: String, default: "" },
}, { timestamps: true });

const Workmanship = mongoose.model("Workmanship", workmanshipSchema);

module.exports = {
  workmanshipSchema,
  Workmanship,
};
