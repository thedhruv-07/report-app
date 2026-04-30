const express = require("express");
const cors = require("cors");
const { authMiddleware } = require("./middleware/auth.middleware");
const reportController = require("./controllers/report.controller");

const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/fileRoutes");

// V2 Routes
const reportV2Routes = require("./routes/v2/report.routes");
const photoV2Routes = require("./routes/v2/photo.routes");

const app = express();

// CORS
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
console.log("🛠️ CORS Origin:", frontendUrl);
app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Body parser
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Veritas Report API is live!" });
});

// AI Routes (called directly by frontend, not via /api/reports prefix)
app.post("/api/ai-describe", reportController.analyzePhoto);
app.post("/api/suggest", reportController.suggestText);

// Legacy Route Compatibility (Fixes 404 on generation)
const upload = require("./middleware/upload.middleware");
app.post("/api/generate", authMiddleware, upload.array("images"), reportController.generateReport);
app.post("/generate", authMiddleware, upload.array("images"), reportController.generateReport);

// Main Route Groups
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reports", reportRoutes);

// V2 Route Groups
app.use("/api/v2/reports", reportV2Routes);
app.use("/api/v2/photos", photoV2Routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;