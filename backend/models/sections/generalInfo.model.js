const mongoose = require("mongoose");

const generalInfoSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  servicePerformed: { type: String, default: "" },
  client: { type: String, default: "" },
  supplier: { type: String, default: "" },
  factory: { type: String, default: "" },
  productName: { type: String, default: "" },
  po: { type: String, default: "" },
  itemNo: { type: String, default: "" },
  country: { type: String, default: "" },
  inspectionDate: { type: String, default: "" },
  inspectionLocation: { type: String, default: "" },
  referenceSample: { type: String, default: "" },
}, { timestamps: true });

const GeneralInfo = mongoose.model("GeneralInfo", generalInfoSchema);

module.exports = {
  generalInfoSchema,
  GeneralInfo,
};
