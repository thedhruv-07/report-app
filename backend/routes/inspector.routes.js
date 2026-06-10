const express = require("express");
const router = express.Router();
const inspectorController = require("../controllers/inspector.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");

// All inspector routes require auth + completed onboarding
router.use(authMiddleware);
router.use(requireOnboardingComplete);

// Dashboard Summary
router.get("/dashboard/summary", inspectorController.getSummary);

// Tasks
router.get("/tasks", inspectorController.getTasks);
router.get("/tasks/:taskId", inspectorController.getTaskById);
router.post("/tasks/:taskId/accept", inspectorController.acceptTask);
router.patch("/tasks/:taskId/section-skip", inspectorController.addSectionSkipReason);

// Notifications
router.get("/notifications", inspectorController.getNotifications);
router.put("/notifications/read-all", inspectorController.markAllNotificationsRead);
router.put("/notifications/:notificationId/read", inspectorController.markNotificationRead);

module.exports = router;
