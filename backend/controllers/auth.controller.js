const UserModel = require("../models/user.model");
const { generateToken, verifyToken } = require("../middleware/auth.middleware");
const { sendResetEmail } = require("../services/email.service");
const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID } = require("../config/config");

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─── Signup ────────────────────────────────────────────────────────────────────
const signup = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const decoded = authToken ? verifyToken(authToken) : null;
    if (!decoded || decoded.role !== "superadmin") {
      console.warn(`Unauthorized signup attempt — token: ${authToken ? "present" : "missing"}, role: ${decoded?.role || "none"}`);
      return res.status(403).json({ error: "Account creation is restricted to administrators" });
    }

    const { name, email: rawEmail, password } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await UserModel.createUser({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({
      message: "Account created successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ error: error.message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.provider === "google" && !user.password) {
      return res.status(401).json({
        error: "This account uses Google Sign-In. Please log in with Google.",
      });
    }

    const isValid = await UserModel.verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await UserModel.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }

    const token = await UserModel.setResetToken(email);
    if (token) {
      const result = await sendResetEmail(email, token);
      if (result.previewUrl) {
        console.log("📧 Preview reset email at:", result.previewUrl);
      }
    }

    res.json({
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to send reset email. Please try again." });
  }
};

// ─── Reset Password ──────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await UserModel.resetPassword(token, password);
    const authToken = generateToken(user);

    res.json({
      message: "Password reset successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: authToken,
    });
  } catch (error) {
    if (error.message.includes("Invalid or expired")) {
      return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
    }
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// ─── Google OAuth ──────────────────────────────────────────────────────────────
const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    // Verify the Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !name) {
      return res.status(400).json({ error: "Google account missing email or name" });
    }

    const user = await UserModel.findOrCreateGoogleUser({ name, email, googleId, picture });
    const token = generateToken(user);

    res.json({
      message: "Google authentication successful",
      user: { id: user.id, name: user.name, email: user.email, picture, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Google authentication failed. Please try again." });
  }
};

// ─── Get Current User (protected) ──────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await UserModel.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: { id: user._id.toString(), name: user.name, email: user.email, provider: user.provider, role: user.role, notificationPreferences: user.notificationPreferences },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
};

// ─── Update Profile (protected) ──────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, email, password, notificationPreferences } = req.body;
    const user = await UserModel.User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (email) {
      const existingUser = await UserModel.User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
      user.email = email.toLowerCase();
    }
    if (password) {
      const bcrypt = require("bcryptjs");
      user.password = await bcrypt.hash(password, 10);
      user.provider = "local";
    }
    if (notificationPreferences && typeof notificationPreferences === 'object') {
      user.notificationPreferences = {
        ...(user.notificationPreferences || {}),
        ...notificationPreferences,
      };
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, notificationPreferences: user.notificationPreferences }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  googleAuth,
  getMe,
  updateProfile,
};
