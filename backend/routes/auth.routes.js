const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/google", authController.googleAuth);
router.get("/me", authMiddleware, authController.getMe);
router.patch("/update-profile", authMiddleware, authController.updateProfile);

module.exports = router;
