// backend/controllers/notification.controller.js
const SystemNotification = require("../models/systemNotification.model");

// Helper: build query for "notifications visible to this user"
const buildUserQuery = (user) => {
  const now = new Date();
  return {
    isActive: true,
    $or: [
      { targetRoles: user.role },
      { targetUsers: user.id }
    ],
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }
    ]
  };
};

// GET /api/notifications/my-notifications
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = {
      ...buildUserQuery(req.user),
      "readBy.userId": { $ne: userId }
    };

    const notifications = await SystemNotification.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    res.json({ notifications });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/mark-read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ error: "notificationId is required" });
    }

    const notification = await SystemNotification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { readBy: { userId: req.user.id, readAt: new Date() } } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/mark-all-read
const markAllRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: "notificationIds array is required" });
    }

    await SystemNotification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { readBy: { userId: req.user.id, readAt: new Date() } } }
    );

    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    console.error("markAllRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/notifications/bell-count
const getBellCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = {
      ...buildUserQuery(req.user),
      "readBy.userId": { $ne: userId }
    };

    const count = await SystemNotification.countDocuments(query);
    res.json({ count });
  } catch (err) {
    console.error("getBellCount error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/create  (admin only)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, priority, targetRoles, targetUsers, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "title and message are required" });
    }

    const notification = await SystemNotification.create({
      title,
      message,
      type: type || "info",
      priority: priority || 3,
      targetRoles: targetRoles || [],
      targetUsers: targetUsers || [],
      createdBy: req.user.id,
      expiresAt: expiresAt || null
    });

    res.status(201).json({ notification });
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/notifications/:id  (admin only)
const updateNotification = async (req, res) => {
  try {
    const { title, message, type, priority, targetRoles, isActive, expiresAt } = req.body;

    const notification = await SystemNotification.findByIdAndUpdate(
      req.params.id,
      { title, message, type, priority, targetRoles, isActive, expiresAt },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (err) {
    console.error("updateNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/notifications/:id  (admin only — soft delete)
const deleteNotification = async (req, res) => {
  try {
    const notification = await SystemNotification.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deactivated" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/notifications/all  (admin only)
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await SystemNotification.find({})
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const withReadCount = notifications.map(n => ({
      ...n,
      readCount: n.readBy?.length || 0
    }));

    res.json({ notifications: withReadCount });
  } catch (err) {
    console.error("getAllNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllRead,
  getBellCount,
  createNotification,
  updateNotification,
  deleteNotification,
  getAllNotifications
};
