const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReportV2",
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Photo = mongoose.model("Photo", photoSchema);

module.exports = { Photo };
