const express = require("express");
const router = express.Router();
const factoryAuditController = require("../controllers/factoryAudit.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const roles = ["admin", "inspector"];

// All routes are protected
router.use(authMiddleware);

router.get("/", factoryAuditController.getReports);
router.post("/", roleCheck(roles), factoryAuditController.createReport);
router.get("/:id", factoryAuditController.getReportById);
router.put("/:id", roleCheck(roles), factoryAuditController.updateReport);
router.get("/:id/generate", roleCheck(roles), factoryAuditController.generateReport);
router.delete("/:id", factoryAuditController.deleteReport);

module.exports = router;
