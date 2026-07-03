const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repliedByName: { type: String, required: true },
  repliedAt: { type: Date, default: Date.now },
}, { _id: false });

const inspectorHelpRequestSchema = new mongoose.Schema({
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inspectorName: { type: String, required: true },
  reportType: { type: String, default: '' },
  sectionLabel: { type: String, default: '' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  message: { type: String, required: true },
  replies: [replySchema],
}, { timestamps: true });

module.exports = mongoose.model("InspectorHelpRequest", inspectorHelpRequestSchema);
