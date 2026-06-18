const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const app = require("./app");
const { PORT, MONGO_URI } = require("./config/config");

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  heartbeatFrequencyMS: 10000,
})
  .then(() => {
    console.log("🟢 Connected to MongoDB");
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    }); 

    // Initialize Socket.io
    const { initSocket } = require("./socket");
    initSocket(server);

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
