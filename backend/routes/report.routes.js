const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");
const { authMiddleware } = require("../middleware/auth.middleware");

router.post("/generate", authMiddleware, upload.array("images"), reportController.generateReport);
router.get("/reports", authMiddleware, reportController.getReports);
router.get("/reports/:id", authMiddleware, reportController.getReportById);
router.post("/suggest", authMiddleware, reportController.suggestText);
router.post("/api/ai-describe", authMiddleware, reportController.analyzePhoto);

module.exports = router;
