const mongoose = require("mongoose");

const quantityItemSchema = new mongoose.Schema({
  po: { type: String, default: "" },
  itemName: { type: String, default: "" },
  orderQty: { type: String, default: "" },
  qtyPerCarton: { type: String, default: "" },
  cartons: { type: String, default: "" },
  packedBreakdown: { type: String, default: "" },
  unpackedBreakdown: { type: String, default: "" },
  unfinishedBreakdown: { type: String, default: "" },
  sampleSizePacked: { type: String, default: "" },
  sampleSizeUnpacked: { type: String, default: "" },
}, { _id: false });

const quantitySchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  items: [quantityItemSchema],
  quantityResult: { type: String, default: "" },
  quantityRemark: { type: String, default: "" },
  selectedCartonsCount: { type: String, default: "" },
  cartonNo1: { type: String, default: "" },
  cartonNo2: { type: String, default: "" },
}, { timestamps: true });

const Quantity = mongoose.model("Quantity", quantitySchema);

module.exports = {
  quantityItemSchema,
  quantitySchema,
  Quantity,
};
