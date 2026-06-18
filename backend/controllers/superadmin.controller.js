const bcrypt = require("bcryptjs");
const { User } = require("../models/user.model");

const ALLOWED_ROLES = ["inspector", "manager", "admin", "operator", "superadmin"];

const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email role provider createdAt").lean();
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

    res.json({
      message: "Role updated",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("updateRole error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = { listUsers, createUser, updateRole, deleteUser };
