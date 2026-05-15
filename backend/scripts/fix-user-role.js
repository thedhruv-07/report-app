const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");
const { User } = require("../models/user.model");

async function fixUser() {
  try {
    await mongoose.connect(MONGO_URI);
    const email = "dhruvkumar200420@gmail.com";
    const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
    if (user) {
      console.log(`✅ SUCCESS: Updated ${email} to role: admin`);
    } else {
      console.log(`❌ FAILED: User ${email} not found`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixUser();
