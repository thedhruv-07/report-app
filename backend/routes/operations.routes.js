const express = require("express");
const router = express.Router();
const operationsController = require("../controllers/operations.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// All operations routes require authentication and 'operator' or 'admin' role
router.use(authMiddleware);
router.use(authorize("operator", "admin"));

router.get("/reports", operationsController.getSubmittedReports);
router.get("/reports/:id", operationsController.getReportDetails);
router.get("/stats", operationsController.getStats);
router.put("/reports/:id/review", operationsController.reviewReport);
router.delete("/reports/bulk-delete", operationsController.bulkDeleteReports);

module.exports = router;
