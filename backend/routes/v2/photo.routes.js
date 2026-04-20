const express = require("express");
const router = express.Router();
const photoController = require("../../controllers/v2/photo.controller");
const upload = require("../../middleware/upload.middleware");
const { authMiddleware } = require("../../middleware/auth.middleware");

// All routes are protected
router.use(authMiddleware);

// Make sure to use multer middleware for the file
router.post("/", upload.single("file"), photoController.uploadPhoto);
router.put("/:id", photoController.updatePhoto);
router.delete("/:id", photoController.deletePhoto);

module.exports = router;
