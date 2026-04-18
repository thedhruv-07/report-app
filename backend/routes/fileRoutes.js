const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const upload = require("../middleware/upload.middleware");
const { authMiddleware } = require("../middleware/auth.middleware");

// POST /api/files/upload - Upload a file to Wasabi
router.post("/upload", authMiddleware, upload.single("file"), fileController.uploadFile);

// GET /api/files/:key - Get a signed URL for a file
// Note: Key might contain '/' so use a wildcard or handle in controller
router.get("/:key(*)", authMiddleware, fileController.getFile);

// PUT /api/files/update - Replace a file
router.put("/update", authMiddleware, upload.single("file"), fileController.updateFile);

// DELETE /api/files/delete - Delete a file
router.delete("/delete", authMiddleware, fileController.deleteFile);

module.exports = router;
