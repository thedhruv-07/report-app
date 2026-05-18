const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MONGO_URI } = require("../config/config");
const { User } = require("../models/user.model");

async function createAdminUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for admin seeding...");

    const email = "admin@rms.com";
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`User ${email} already exists in database. Updating role to 'admin'...`);
      existing.role = "admin";
      existing.name = "System Admin";
      existing.password = await bcrypt.hash("password123", 10);
      await existing.save();
      console.log("✅ User updated to admin successfully!");
    } else {
      console.log(`Creating admin user ${email}...`);
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = new User({
        name: "System Admin",
        email: email,
        password: hashedPassword,
        role: "admin",
        provider: "local"
      });
      await user.save();
      console.log("✅ Admin user created successfully!");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  }
}

createAdminUser();
