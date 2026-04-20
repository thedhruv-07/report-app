const express = require("express");
const cors = require("cors");
const { authMiddleware } = require("./middleware/auth.middleware");
const reportController = require("./controllers/report.controller");

const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

// CORS
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parser
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Veritas Report API is live!" });
});

// AI Routes (called directly by frontend, not via /api/reports prefix)
app.post("/api/ai-describe", authMiddleware, reportController.analyzePhoto);
app.post("/api/suggest", authMiddleware, reportController.suggestText);

// Main Route Groups
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reports", reportRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;