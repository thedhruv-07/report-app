const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskNumber: { type: String, unique: true, sparse: true },
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
  clientCode: { type: String, default: '' },
  prefillData: { type: mongoose.Schema.Types.Mixed, default: null },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  reportSubmittedAt: { type: Date, default: null },
  correctionFeedback: { type: String },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  sectionSkipReasons: [{
    step:          { type: Number },
    stepLabel:     { type: String },
    missingFields: [{ type: String }],
    reason:        { type: String },
    skippedAt:     { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
