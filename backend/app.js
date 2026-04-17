const express = require("express");
const cors = require("cors");
const path = require("path");
const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Serve static files from the frontend/dist folder
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/", reportRoutes);

// Catch-all middleware to serve the frontend for any non-API request
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

module.exports = app;
