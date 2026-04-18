const wasabiService = require("../services/wasabiService");
const fs = require("fs");

/**
 * Uploads a single file to Wasabi
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await wasabiService.uploadFile(req.file);

    // Clean up local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(201).json({
      message: "File uploaded successfully",
      ...result
    });
  } catch (error) {
    console.error("Controller Upload Error:", error);
    res.status(500).json({ error: "Failed to upload file to Wasabi", details: error.message });
  }
};

/**
 * Gets a signed URL for a file
 */
exports.getFile = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    if (!key) {
      return res.status(400).json({ error: "File key is required" });
    }

    const signedUrl = await wasabiService.getSignedUrl(key);
    res.json({ url: signedUrl });
  } catch (error) {
    console.error("Controller Get Error:", error);
    res.status(500).json({ error: "Failed to get signed URL", details: error.message });
  }
};

/**
 * Updates/Replaces a file
 */
exports.updateFile = async (req, res) => {
  try {
    const { oldKey } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: "New file is required" });
    }

    // 1. Delete old file if key is provided
    if (oldKey) {
      const cleanKey = wasabiService.extractKey(oldKey);
      await wasabiService.deleteFile(cleanKey);
    }

    // 2. Upload new file
    const result = await wasabiService.uploadFile(req.file);

    // 3. Clean up local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.json({
      message: "File updated successfully",
      ...result
    });
  } catch (error) {
    console.error("Controller Update Error:", error);
    res.status(500).json({ error: "Failed to update file", details: error.message });
  }
};

/**
 * Deletes a file
 */
exports.deleteFile = async (req, res) => {
  try {
    let { key } = req.body;
    if (!key) {
      return res.status(400).json({ error: "File key or URL is required" });
    }

    const cleanKey = wasabiService.extractKey(key);
    await wasabiService.deleteFile(cleanKey);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Controller Delete Error:", error);
    res.status(500).json({ error: "Failed to delete file", details: error.message });
  }
};
