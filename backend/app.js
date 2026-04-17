const express = require("express");
const cors = require("cors");
const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/", reportRoutes);

module.exports = app;
