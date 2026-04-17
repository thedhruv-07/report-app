require("dotenv").config();
const app = require("./app");
const { PORT } = require("./config/config");

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Increase timeout for large file processing
server.timeout = 300000; 
server.keepAliveTimeout = 300000;

process.on("uncaughtException", (err) => {
  console.error("FATAL ERROR:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
