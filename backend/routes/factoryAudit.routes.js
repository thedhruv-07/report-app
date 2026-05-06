const express = require("express");
const router = express.Router();
const factoryAuditController = require("../controllers/factoryAudit.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

// All routes are protected
router.use(authMiddleware);

router.get("/", factoryAuditController.getReports);
router.post("/", factoryAuditController.createReport);
router.get("/:id", factoryAuditController.getReportById);
router.put("/:id", factoryAuditController.updateReport);
router.get("/:id/generate", factoryAuditController.generateReport);

module.exports = router;
