const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");
const { User } = require("../models/user.model");
const bcrypt = require("bcryptjs");

async function createTempAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to Atlas Database");

    const email = "tempadmin@absoluteveritas.com";
    const password = "admin123";
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delete if exists
    await User.deleteOne({ email });

    const newUser = new User({
      name: "Temporary Admin",
      email: email,
      password: hashedPassword,
      role: "admin",
      provider: "local"
    });

    await newUser.save();
    console.log(`✅ SUCCESS: Created temporary admin: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
createTempAdmin();
