const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
  noticeId: { type: String, default: null },
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{
    fileName: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  remarks: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
