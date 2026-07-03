const express = require("express");
const router = express.Router();
const inspectionNoticeController = require("../controllers/inspectionNotice.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// All routes require authentication
router.use(authMiddleware);

// Admin-only routes for full CRUD, could allow managers or inspectors depending on business logic
// For now, following standard practice for an Admin Dashboard feature
router.post("/", roleCheck(["admin", "manager"]), inspectionNoticeController.createNotice);
router.get("/", inspectionNoticeController.getNotices); // Allow all authenticated (or restrict to admin/manager/inspector)
router.get("/:id", inspectionNoticeController.getNoticeById);
router.get("/:id/recent-by-factory", inspectionNoticeController.getRecentByFactory);
router.put("/:id", roleCheck(["admin", "manager"]), inspectionNoticeController.updateNotice);
router.delete("/:id", roleCheck(["admin"]), inspectionNoticeController.deleteNotice);
router.patch("/:id/status", roleCheck(["admin", "manager"]), inspectionNoticeController.updateStatus);
router.post("/:id/attachments", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadAttachment);
router.delete("/:id/attachments/:fileId", roleCheck(["admin", "manager"]), inspectionNoticeController.deleteAttachment);
router.post("/:id/report-uploads", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadReportFile);
router.post("/:id/report-uploads/:fileId/log-view", inspectionNoticeController.logReportFileView);

module.exports = router;
