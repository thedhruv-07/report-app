const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
  },
  provider: {
    type: String,
    default: "local",
    enum: ["local", "google"],
  },
  googleId: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "admin", "operator", "inspector"],
    default: "inspector",
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

// Check password
userSchema.methods.verifyPassword = async function(plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

const User = mongoose.model("User", userSchema);

// ─── Legacy Wrapper Methods for Compatibility ──────────────────────────────

const findByEmail = async (email) => {
  return typeof email === "string" ? User.findOne({ email: email.toLowerCase() }) : null;
};

const findById = async (id) => {
  return User.findById(id);
};

const createUser = async ({ name, email, password, provider = "local" }) => {
  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
  const user = new User({
    name,
    email,
    password: hashedPassword,
    provider,
  });

  await user.save();
  return { id: user._id.toString(), name: user.name, email: user.email, provider: user.provider, role: user.role };
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const setResetToken = async (email) => {
  const user = await findByEmail(email);
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetToken = hashedToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  return token;
};

const findByResetToken = async (token) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() }
  });
};

const resetPassword = async (token, newPassword) => {
  const user = await findByResetToken(token);
  if (!user) throw new Error("Invalid or expired reset token");

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  return { id: user._id.toString(), name: user.name, email: user.email };
};

const findOrCreateGoogleUser = async ({ name, email, googleId }) => {
  let user = await findByEmail(email);
  if (user) {
    return { id: user._id.toString(), name: user.name, email: user.email, provider: user.provider, role: user.role };
  }

  const newUser = new User({
    name,
    email,
    provider: "google",
    googleId,
  });

  await newUser.save();
  return { id: newUser._id.toString(), name: newUser.name, email: newUser.email, provider: newUser.provider, role: newUser.role };
};

module.exports = {
  User, // Export the model itself
  findByEmail,
  findById,
  createUser,
  verifyPassword,
  setResetToken,
  findByResetToken,
  resetPassword,
  findOrCreateGoogleUser,
};
