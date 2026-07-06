const express = require("express");
const router = express.Router();
const inspectorController = require("../controllers/inspector.controller");
const helpRequestController = require("../controllers/helpRequest.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
const upload = require("../middleware/upload.middleware");

// All inspector routes require auth + completed onboarding
router.use(authMiddleware);
router.use(requireOnboardingComplete);

// Dashboard Summary
router.get("/dashboard/summary", inspectorController.getSummary);

// Tasks
router.get("/tasks", inspectorController.getTasks);
router.get("/tasks/archived-count", inspectorController.getArchivedCount);
router.get("/tasks/:taskId/notice", inspectorController.getTaskNotice);
router.post("/tasks/:taskId/notice-query", inspectorController.submitNoticeQuery);
router.get("/tasks/:taskId/expense", inspectorController.getTaskExpense);
router.post("/tasks/:taskId/expense/upload", upload.single('file'), inspectorController.uploadTaskExpenseFile);
router.patch("/tasks/:taskId/expense/remarks", inspectorController.updateTaskExpenseRemarks);
router.get("/tasks/:taskId", inspectorController.getTaskById);
router.post("/tasks/:taskId/accept", inspectorController.acceptTask);
router.patch("/tasks/:taskId/section-skip", inspectorController.addSectionSkipReason);
router.post("/contact-technical-manager", helpRequestController.createHelpRequest);
router.get("/help-requests", helpRequestController.getHelpRequestsForInspector);
router.post("/help-requests/:id/reply", helpRequestController.inspectorReplyToHelpRequest);

// Notifications
router.get("/notifications", inspectorController.getNotifications);
router.put("/notifications/read-all", inspectorController.markAllNotificationsRead);
router.put("/notifications/:notificationId/read", inspectorController.markNotificationRead);

module.exports = router;
