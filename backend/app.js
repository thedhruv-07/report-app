const express = require("express");
const cors = require("cors");
const path = require("path");
const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// API Health Check / Welcome
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Veritas Report API is live!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler for API
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
