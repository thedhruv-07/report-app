// backend/scripts/seedNotifications.js
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const { User } = require("../models/user.model");
const SystemNotification = require("../models/systemNotification.model");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Find an admin user to set as createdBy
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("No admin user found. Create an admin account first.");
    process.exit(1);
  }

  // Clear existing seed notifications to avoid duplicates
  await SystemNotification.deleteMany({ createdBy: admin._id });

  const seeds = [
    // --- ADMIN ---
    {
      title: "System Ready",
      message: "IRMS is fully operational. All inspector accounts are active.",
      type: "info",
      priority: 3,
      targetRoles: ["admin"],
      createdBy: admin._id
    },
    {
      title: "Pending Report Reviews",
      message: "You have inspection reports awaiting your review and approval. Please check the reports section.",
      type: "warning",
      priority: 1,
      targetRoles: ["admin"],
      createdBy: admin._id
    },
    // --- TECHNICAL MANAGER (role: "manager") ---
    {
      title: "Reports Assigned to You",
      message: "Several inspection reports have been submitted and are awaiting technical review. Please prioritize these today.",
      type: "urgent",
      priority: 1,
      targetRoles: ["manager"],
      createdBy: admin._id
    },
    {
      title: "Inspector Onboarding Pending",
      message: "2 inspectors have not completed their onboarding assessment. Follow up with them.",
      type: "warning",
      priority: 2,
      targetRoles: ["manager"],
      createdBy: admin._id
    },
    // --- INSPECTOR ---
    {
      title: "Complete Your Onboarding",
      message: "You have not completed your onboarding process. Please finish the User Manual, Training Videos, and Assessment to unlock full access.",
      type: "urgent",
      priority: 1,
      targetRoles: ["inspector"],
      createdBy: admin._id
    },
    {
      title: "New Assignment",
      message: "You have been assigned a new inspection job. Check your dashboard for details.",
      type: "info",
      priority: 2,
      targetRoles: ["inspector"],
      createdBy: admin._id
    }
  ];

  await SystemNotification.insertMany(seeds);
  console.log(`Seeded ${seeds.length} notifications`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
