const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema(
  {
    overview: { type: String, default: "" },
    issues: [{ type: String }],
    recommendations: [{ type: String }],
  },
  { _id: false }
);

const reportV2Schema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Inspection Report",
    },
    sections: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: "Photo" }],
      default: {},
    },
    summary: {
      type: summarySchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const ReportV2 = mongoose.model("ReportV2", reportV2Schema);

module.exports = { ReportV2 };
