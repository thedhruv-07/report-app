const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  getBellCount,
  createNotification,
  updateNotification,
  deleteNotification,
  getAllNotifications
} = require("../controllers/notification.controller");

// All routes require authentication
router.use(authMiddleware);

// User routes (all authenticated roles)
router.get("/my-notifications", getMyNotifications);
router.post("/mark-read", markAsRead);
router.post("/mark-all-read", markAllRead);
router.get("/bell-count", getBellCount);

// Admin-only routes
router.post("/create", roleCheck(["admin"]), createNotification);
router.get("/all", roleCheck(["admin"]), getAllNotifications);
router.put("/:id", roleCheck(["admin"]), updateNotification);
router.delete("/:id", roleCheck(["admin"]), deleteNotification);

module.exports = router;
