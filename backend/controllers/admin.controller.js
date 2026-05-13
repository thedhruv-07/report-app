const { User } = require("../models/user.model");
const { Report } = require("../models/report.model");
const FactoryAudit = require("../models/factoryAudit.model");

// Get all users with stats
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!["admin", "operator", "inspector"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update role" });
  }
};

// Get global system stats
exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const totalAudits = await FactoryAudit.countDocuments();
    
    // Role distribution
    const admins = await User.countDocuments({ role: "admin" });
    const operators = await User.countDocuments({ role: "operator" });
    const inspectors = await User.countDocuments({ role: "inspector" });

    res.json({
      users: { total: totalUsers, admins, operators, inspectors },
      reports: { total: totalReports + totalAudits, standard: totalReports, audits: totalAudits }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
};
// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own administrative account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
