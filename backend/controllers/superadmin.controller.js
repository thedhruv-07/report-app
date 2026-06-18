const bcrypt = require("bcryptjs");
const { User } = require("../models/user.model");
const { setResetToken } = require("../models/user.model");
const { sendResetEmail } = require("../services/email.service");
const { Report } = require("../models/report.model");
const FactoryAudit = require("../models/factoryAudit.model");
const Booking = require("../models/Booking");

const ALLOWED_ROLES = ["inspector", "manager", "admin", "operator", "superadmin"];

const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email role provider isActive createdAt onboarding").lean();
    res.json({ users });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
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
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name: name.trim(), email, password: hashed, role, provider: "local" });
    await user.save();
    console.log(`[superadmin] Created user: ${user.email} (role: ${user.role}) by ${req.user.email}`);

    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: "_id name email role" }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(`[superadmin] Role updated: ${user.email} → ${role} by ${req.user.email}`);

    res.json({
      message: "Role updated",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("updateRole error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }
    if (id.toString() === req.user.id.toString()) {
      return res.status(400).json({ error: "You cannot suspend your own account" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, select: "_id name email isActive" }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(`[superadmin] Status updated: ${user.email} → isActive=${isActive} by ${req.user.email}`);

    res.json({
      message: isActive ? "Account unsuspended" : "Account suspended",
      user: { id: user._id.toString(), name: user.name, email: user.email, isActive: user.isActive },
    });
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id.toString() === req.user.id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(`[superadmin] Deleted user: ${user.email} by ${req.user.email}`);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

const forcePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.provider !== "local") {
      return res.status(400).json({ error: "Password reset is only available for local accounts" });
    }

    const token = await setResetToken(user.email);
    if (!token) return res.status(500).json({ error: "Failed to generate reset token" });

    await sendResetEmail(user.email, token);
    console.log(`[superadmin] Force password reset sent: ${user.email} by ${req.user.email}`);

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("forcePasswordReset error:", err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalReports, totalFaReports, pendingBookings, activeInspectors] = await Promise.all([
      Report.countDocuments(),
      FactoryAudit.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "inspector", isActive: true }),
    ]);

    res.json({
      totalReports: totalReports + totalFaReports,
      activeInspectors,
      pendingBookings,
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

module.exports = { listUsers, createUser, updateRole, updateStatus, deleteUser, forcePasswordReset, getStats };
