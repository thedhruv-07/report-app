const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MONGO_URI } = require("../config/config");
const { User } = require("../models/user.model");

async function createManagerUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Check if the user already exists
    const email = "sarah.chen@rms.com";
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists in database. Updating role to 'manager'...`);
      existing.role = "manager";
      existing.name = "Sarah Chen";
      existing.password = await bcrypt.hash("password123", 10);
      await existing.save();
      console.log("✅ User updated to manager successfully!");
    } else {
      console.log(`Creating user ${email}...`);
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = new User({
        name: "Sarah Chen",
        email: email,
        password: hashedPassword,
        role: "manager",
        provider: "local"
      });
      await user.save();
      console.log("✅ User created successfully!");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error creating manager user:", err);
    process.exit(1);
  }
}

createManagerUser();
