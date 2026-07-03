const express = require("express");
const router = express.Router();
const managerController = require("../controllers/manager.controller");
const helpRequestController = require("../controllers/helpRequest.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");

// Require auth and specific roles (manager or admin) for all routes in this file
router.use(authMiddleware);
router.use(roleCheck(["manager", "admin"]));

// Dashboard & Queue Routes
router.get("/queue", managerController.getQueue);
router.get("/reports/:id", managerController.getReportDetails);

// Workflow Action Routes
router.patch("/reports/:id/status", managerController.updateStatus);
router.post("/reports/:id/correction", managerController.requestCorrection);
router.post("/reports/:id/finalize", managerController.finalizeReport);
router.post("/reports/:id/deliver", managerController.deliverReport);
router.post("/reports/:id/remarks", managerController.addRemarks);

// Inspector help requests
router.get("/help-requests", helpRequestController.getHelpRequestsForManager);
router.post("/help-requests/:id/reply", helpRequestController.replyToHelpRequest);

module.exports = router;
