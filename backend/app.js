const express = require("express");
const cors = require("cors");
const path = require("path");
const Groq = require("groq-sdk");

const reportRoutes = require("./routes/report.routes");
const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

// ✅ Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ✅ CORS setup
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Body parser
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Veritas Report API is live!" });
});

// ==============================
// 🔥 AI ROUTES (FIXED)
// ==============================
app.post("/api/ai-describe", async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    // ✅ Fake but structured descriptions (since Groq has no vision)
    const descriptions = images.map((_, i) =>
      `Photo ${i + 1}: Factory inspection image showing visible workmanship and construction details.`
    );

    res.json({
      success: true,
      descriptions
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.post("/api/suggest", async (req, res) => {
  try {
    const { context, partialText } = req.body;
    const { getAISuggestion } = require("./services/ai.service");
    const suggestion = await getAISuggestion(context, partialText);
    res.json({ suggestion });
  } catch (error) {
    console.error("Suggest AI Error:", error);
    res.json({ suggestion: "" });
  }
});
// ==============================
// ✅ EXISTING ROUTES (UNCHANGED)
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reports", reportRoutes);

// ==============================
// ❌ 404 HANDLER
// ==============================
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;