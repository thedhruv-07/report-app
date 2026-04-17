require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const { PORT, MONGO_URI } = require("./config/config");

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("🟢 Connected to MongoDB");
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Increase timeout for large file processing
    server.timeout = 300000; 
    server.keepAliveTimeout = 300000;
  })
  .catch((err) => {
    console.error("🔴 Failed to connect to MongoDB", err);
    process.exit(1);
  });



process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
