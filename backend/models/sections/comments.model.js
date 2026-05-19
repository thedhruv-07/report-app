const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true,
    index: true
  },
  remarks: [{ type: String, default: "" }],
  recommendations: { type: String, default: "" },
  factoryComments: { type: String, default: "" },
  inspectorOpinion: { type: String, default: "" },
  approvedBy: { type: String, default: "" },
  inspector: { type: String, default: "" },
  reportReviewer: { type: String, default: "" },
  conclusionPhotos: [{
    id: String,
    label: String,
    fileName: String,
    preview: String,
    url: String,
    originalName: String
  }],
  conclusionReviewerPhotos: [{
    id: String,
    label: String,
    fileName: String,
    preview: String,
    url: String,
    originalName: String
  }],
}, { timestamps: true });

const Comments = mongoose.model("Comments", commentsSchema);

module.exports = { Comments };
