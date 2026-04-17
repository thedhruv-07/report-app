const path = require("path");
const fs = require("fs");

const MEMORY_PATH = path.join(__dirname, "..", "data", "memory.json");
if (!fs.existsSync(path.dirname(MEMORY_PATH))) {
  fs.mkdirSync(path.dirname(MEMORY_PATH), { recursive: true });
}
if (!fs.existsSync(MEMORY_PATH)) {
  fs.writeFileSync(MEMORY_PATH, JSON.stringify([]));
}

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/report-app",
  MEMORY_PATH,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  LOGO_PATH: process.env.NODE_ENV === "production" 
    ? path.join(__dirname, "..", "..", "frontend", "dist", "company-logo.png")
    : path.join(__dirname, "..", "..", "frontend", "public", "company-logo.png"),
  PACKAGE_ICON_PATH: process.env.NODE_ENV === "production"
    ? path.join(__dirname, "..", "..", "frontend", "dist", "package.png")
    : path.join(__dirname, "..", "..", "frontend", "public", "package.png"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
};
