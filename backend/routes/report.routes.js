const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const roles = ["admin", "inspector"];

router.post("/generate", authMiddleware, roleCheck(roles), upload.array("images"), reportController.generateReport);
router.get("/", authMiddleware, reportController.getReports);
router.get("/stats", authMiddleware, roleCheck(roles), reportController.getStats);
router.get("/:id", authMiddleware, reportController.getReportById);
router.delete("/:id", authMiddleware, reportController.deleteReport);

module.exports = router;
