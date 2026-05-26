const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: false },
  recipient: { type: String, required: true, trim: true },
  subject: { type: String, required: true },
  type: { type: String, required: true },
  html: { type: String },
  attachments: [{ filename: String, contentType: String, size: Number, path: String }],
  status: { type: String, enum: ['queued','sending','sent','failed'], default: 'queued' },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  failedReason: { type: String },
  retryCount: { type: Number, default: 0 },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

emailLogSchema.index({ reportId: 1, recipient: 1, type: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
