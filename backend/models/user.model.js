const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const USERS_PATH = path.join(__dirname, "..", "data", "users.json");

// Ensure data directory and users file exist
const dataDir = path.dirname(USERS_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(USERS_PATH)) {
  fs.writeFileSync(USERS_PATH, JSON.stringify([]));
}

const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
};

const findByEmail = (email) => {
  const users = readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

const findById = (id) => {
  const users = readUsers();
  return users.find((u) => u.id === id) || null;
};

const createUser = async ({ name, email, password, provider = "local" }) => {
  const users = readUsers();

  if (findByEmail(email)) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    provider,
    createdAt: new Date().toISOString(),
    resetToken: null,
    resetTokenExpiry: null,
  };

  users.push(user);
  writeUsers(users);

  return { id: user.id, name: user.name, email: user.email, provider: user.provider };
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const setResetToken = (email) => {
  const users = readUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return null;

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  users[idx].resetToken = hashedToken;
  users[idx].resetTokenExpiry = Date.now() + 3600000; // 1 hour
  writeUsers(users);

  return token; // Return unhashed token for the email link
};

const findByResetToken = (token) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const users = readUsers();
  return users.find(
    (u) => u.resetToken === hashedToken && u.resetTokenExpiry > Date.now()
  ) || null;
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const users = readUsers();
  const idx = users.findIndex(
    (u) => u.resetToken === hashedToken && u.resetTokenExpiry > Date.now()
  );

  if (idx === -1) throw new Error("Invalid or expired reset token");

  users[idx].password = await bcrypt.hash(newPassword, 12);
  users[idx].resetToken = null;
  users[idx].resetTokenExpiry = null;
  writeUsers(users);

  return { id: users[idx].id, name: users[idx].name, email: users[idx].email };
};

const findOrCreateGoogleUser = async ({ name, email, googleId }) => {
  let user = findByEmail(email);

  if (user) {
    return { id: user.id, name: user.name, email: user.email, provider: user.provider };
  }

  const users = readUsers();
  const newUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: null,
    provider: "google",
    googleId,
    createdAt: new Date().toISOString(),
    resetToken: null,
    resetTokenExpiry: null,
  };

  users.push(newUser);
  writeUsers(users);

  return { id: newUser.id, name: newUser.name, email: newUser.email, provider: newUser.provider };
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  verifyPassword,
  setResetToken,
  findByResetToken,
  resetPassword,
  findOrCreateGoogleUser,
};
