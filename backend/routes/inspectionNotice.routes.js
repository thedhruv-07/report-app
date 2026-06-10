const express = require("express");
const router = express.Router();
const inspectionNoticeController = require("../controllers/inspectionNotice.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authMiddleware);

// Admin-only routes for full CRUD, could allow managers or inspectors depending on business logic
// For now, following standard practice for an Admin Dashboard feature
router.post("/", roleCheck(["admin", "manager"]), inspectionNoticeController.createNotice);
router.get("/", inspectionNoticeController.getNotices); // Allow all authenticated (or restrict to admin/manager/inspector)
router.get("/:id", inspectionNoticeController.getNoticeById);
router.put("/:id", roleCheck(["admin", "manager"]), inspectionNoticeController.updateNotice);
router.delete("/:id", roleCheck(["admin"]), inspectionNoticeController.deleteNotice);
router.patch("/:id/status", roleCheck(["admin", "manager"]), inspectionNoticeController.updateStatus);

module.exports = router;
