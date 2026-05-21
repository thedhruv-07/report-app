const express = require("express");
const router = express.Router();
const factoryAuditController = require("../controllers/factoryAudit.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
const roles = ["admin", "inspector"];

// All routes are protected
router.use(authMiddleware);

router.get("/", factoryAuditController.getReports);
router.post("/", requireOnboardingComplete, roleCheck(roles), factoryAuditController.createReport);
router.get("/:id", factoryAuditController.getReportById);
router.put("/:id", requireOnboardingComplete, roleCheck(roles), factoryAuditController.updateReport);
router.post("/:id/submit", requireOnboardingComplete, roleCheck(roles), factoryAuditController.submitForReview);
router.get("/:id/generate", requireOnboardingComplete, roleCheck(roles), factoryAuditController.generateReport);
router.delete("/:id", factoryAuditController.deleteReport);

module.exports = router;
