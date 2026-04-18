const mongoose = require("mongoose");

const quantityItemSchema = new mongoose.Schema({
  po: { type: String, default: "" },
  itemName: { type: String, default: "" },
  orderQty: { type: Number, default: 0 },
  qtyPerCarton: { type: Number, default: 0 },
  cartons: { type: Number, default: 0 },
  packedBreakdown: { type: Number, default: 0 },
  unpackedBreakdown: { type: Number, default: 0 },
  unfinishedBreakdown: { type: Number, default: 0 },
  sampleSizePacked: { type: Number, default: 0 },
  sampleSizeUnpacked: { type: Number, default: 0 },
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
  selectedCartonsCount: { type: Number, default: 0 },
  cartonNo1: { type: String, default: "" },
  cartonNo2: { type: String, default: "" },
}, { timestamps: true });

const Quantity = mongoose.model("Quantity", quantitySchema);

module.exports = {
  quantityItemSchema,
  quantitySchema,
  Quantity,
};
