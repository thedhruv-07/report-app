const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['task', 'correction', 'approval', 'system', 'task_assigned'], default: 'system' },
  isRead: { type: Boolean, default: false },
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  relatedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
