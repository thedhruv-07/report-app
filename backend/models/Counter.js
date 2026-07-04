const mongoose = require("mongoose");

// Generic atomic-increment counter, keyed by name (e.g. "noticeId")
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", CounterSchema);
