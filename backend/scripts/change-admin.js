const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");
const { User } = require("../models/user.model");
const bcrypt = require("bcryptjs");

async function changeAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database:", MONGO_URI.split('@')[1].split('/')[0]); // Log host part for safety


    const args = process.argv.slice(2);
    const targetEmail = args[0];
    const newEmail = args.find(a => a.startsWith("--new-email="))?.split("=")[1];
    const newPass = args.find(a => a.startsWith("--new-password="))?.split("=")[1];

    if (!targetEmail) {
      console.log("Usage: node scripts/change-admin.js <current_email> [--new-email=...] [--new-password=...]");
      console.log("Example: node scripts/change-admin.js old@admin.com --new-password=secret");
      process.exit(0);
    }

    const user = await User.findOne({ email: targetEmail.toLowerCase() });

    if (!user) {
      console.error(`User with email "${targetEmail}" not found.`);
      process.exit(1);
    }

    if (newEmail) {
      user.email = newEmail.toLowerCase();
      console.log(`✅ Email updated to: ${newEmail}`);
    }

    if (newPass) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPass, salt);
      user.provider = "local"; // Ensure they can login via local auth if they were Google
      console.log("✅ Password updated successfully.");
    }

    if (!newEmail && !newPass) {
      console.log("No changes specified. Use --new-email or --new-password.");
      process.exit(0);
    }

    await user.save();
    console.log("\nUser details saved successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

changeAdmin();
