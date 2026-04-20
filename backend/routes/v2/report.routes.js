const express = require("express");
const router = express.Router();
const reportController = require("../../controllers/v2/report.controller");
const { authMiddleware } = require("../../middleware/auth.middleware");

// All routes are protected
router.use(authMiddleware);

router.post("/", reportController.createReport);
router.get("/", reportController.getReports);
router.get("/:id", reportController.getReportById);
router.put("/:id", reportController.updateReport);
router.delete("/:id", reportController.deleteReport);

module.exports = router;
