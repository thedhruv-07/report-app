const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['task', 'correction', 'approval', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
