const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  assignedInspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
  factoryName: { type: String, required: true },
  factoryAddress: { type: String, required: true },
  inspectionType: { type: String, required: true, enum: ['PSI', 'CLS', 'DPI', 'Factory Audit', 'Social Audit'] },
  scheduledDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Pending Acceptance', 'Accepted', 'Report Submitted', 'Under Review', 'Correction Requested', 'Finalized'],
    default: 'Pending Acceptance'
  },
  adminInstructions: { type: String },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  correctionFeedback: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
