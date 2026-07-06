// backend/models/systemNotification.model.js
const mongoose = require("mongoose");

const readBySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  readAt: { type: Date, default: Date.now }
}, { _id: false });

const systemNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["info", "warning", "urgent", "success"],
    default: "info"
  },
  priority: { type: Number, enum: [1, 2, 3], default: 3 },
  targetRoles: [{
    type: String,
    enum: ["admin", "manager", "inspector"]
  }],
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
  relatedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
  relatedReportId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  readBy: [readBySchema]
}, { timestamps: true });

// Index for efficient unread queries
systemNotificationSchema.index({ isActive: 1, targetRoles: 1 });
systemNotificationSchema.index({ isActive: 1, targetUsers: 1 });

module.exports = mongoose.model("SystemNotification", systemNotificationSchema);
