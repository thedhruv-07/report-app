const mongoose = require("mongoose");

const safetySchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  onSiteTestResult: { type: String, default: "" },
  onSiteTestRemark: { type: String, default: "" },
  safetyChecks: [
    {
      checkName: String,
      result: String,
      remark: String
    }
  ],
}, { timestamps: true });

const Safety = mongoose.model("Safety", safetySchema);

module.exports = { Safety };
