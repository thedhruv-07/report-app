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
  acceptedCritical: { type: Number, default: 0 },
  acceptedMajor: { type: Number, default: 0 },
  acceptedMinor: { type: Number, default: 0 },
  totalFoundCritical: { type: Number, default: 0 },
  totalFoundMajor: { type: Number, default: 0 },
  totalFoundMinor: { type: Number, default: 0 },
  workmanshipResult: { type: String, default: "" },
  workmanshipRemark: { type: String, default: "" },
  defects: [
    {
      itemName: String,
      description: String,
      critical: { type: Number, default: 0 },
      major: { type: Number, default: 0 },
      minor: { type: Number, default: 0 },
      sampleSize: String
    }
  ],
}, { timestamps: true });

const Workmanship = mongoose.model("Workmanship", workmanshipSchema);

module.exports = {
  workmanshipSchema,
  Workmanship,
};
