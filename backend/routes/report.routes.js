const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");

router.post("/generate", upload.array("images"), reportController.generateReport);
router.post("/api/suggest", reportController.suggestText);

module.exports = router;
