const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");
const { User } = require("../models/user.model");

async function listUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    const users = await User.find({}, 'name email role provider');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
listUsers();
