const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const { authMiddleware } = require("./middleware/auth.middleware");
const reportController = require("./controllers/report.controller");
const { sendSelfTestEmail } = require("./controllers/email.controller");

const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/fileRoutes");
const bookingRoutes = require("./routes/bookings");
const webhookRoutes = require("./routes/webhooks.routes");

// V2 Routes
const reportV2Routes = require("./routes/v2/report.routes");
const photoV2Routes = require("./routes/v2/photo.routes");
const factoryAuditRoutes = require("./routes/factoryAudit.routes");


const app = express();

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP if it interferes with frontend loading
}));
app.use(compression());
app.use(morgan("dev"));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:4174",
  "https://absolute-veritas.netlify.app",
  process.env.FRONTEND_URL
].filter(Boolean);


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// Body parser - Reduced from 500mb to 50mb for security (prevents DoS)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


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
app.use("/api/bookings", bookingRoutes);
app.use("/api/webhooks", webhookRoutes);

// V2 Route Groups
app.use("/api/v2/reports", reportV2Routes);
app.use("/api/v2/photos", photoV2Routes);
app.use("/api/factory-audit", factoryAuditRoutes);

// Onboarding Routes (must be mounted before /api/inspector to take priority)
const onboardingRoutes = require('./routes/onboarding.routes');
app.use('/api/inspector/onboarding', onboardingRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Inspector Routes
const inspectorRoutes = require("./routes/inspector.routes");
app.use("/api/inspector", inspectorRoutes);

// Manager Routes
const managerRoutes = require("./routes/manager.routes");
app.use("/api/manager", managerRoutes);

// Notification Routes
const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);

// Email self-test route: any authenticated user can verify delivery to their own mailbox
app.post('/api/emails/test-self', authMiddleware, sendSelfTestEmail);

// Email logs & admin controls
const emailRoutes = require('./routes/email.routes');
app.use('/api/emails', emailRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;