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
// 🔥 AI ROUTE (FIXED)
// ==============================
app.post("/api/ai-describe", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt || "Describe this image clearly in 1-2 lines"
        }
      ],
    });

    res.json({
      success: true,
      description: response.choices[0].message.content
    });

  } catch (error) {
    console.error("AI ERROR:", error);
    res.status(500).json({
      success: false,
      error: "AI description failed"
    });
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