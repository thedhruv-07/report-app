const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  sectionName: { type: String, required: true },
  mediaType: { type: String, enum: ["photo", "video"], default: "photo" },
  url: { type: String, default: "" }, // Placeholder for future cloud storage
  description: { type: String, default: "" },
  originalName: { type: String, default: "" },
}, { timestamps: true });

const Media = mongoose.model("Media", mediaSchema);

module.exports = { Media };
