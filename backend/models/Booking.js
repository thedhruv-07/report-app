const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  adminId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName:           { type: String, required: true },
  clientEmail:          { type: String, required: true },
  clientPhone:          { type: String },
  inspectionType:       { type: String, enum: ['PSI', 'CLS', 'DPI', 'factory_audit', 'social_audit'], required: true },
  factoryName:          { type: String },
  factoryAddress:       { type: String },
  scheduledDate:        { type: Date },
  scheduledTime:        { type: String },
  productDescription:   { type: String },
  orderQuantity:        { type: Number },
  specialInstructions:  { type: String },
  paymentInfo:          { type: mongoose.Schema.Types.Mixed },
  assignedInspectorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['new', 'assigned', 'viewed', 'accepted', 'in_progress', 'submitted', 'under_review', 'correction_requested', 'finalized', 'delivered'],
    default: 'new',
  },
  poNumber:             { type: String },
  countryOfOrigin:      { type: String },
  aqlInspectionLevel:    { type: String },
  aqlSampleSize:         { type: Number },
  aqlAcceptPoint:        { type: Number },
  aqlRejectPoint:        { type: Number },
  aqlInspectionStandard: { type: String },
  aqlSamplingPlan:       { type: String },
  adminNotes:           { type: String },
  clientRequirements:   { type: String },
  onlineBookingId:      { type: String, default: null },
  prefillData:          { type: mongoose.Schema.Types.Mixed, default: null },
  onSiteTests: [{
    description: { type: String, default: '' },
    method:      { type: String, default: '' },
    sampleSize:  { type: String, default: '' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
