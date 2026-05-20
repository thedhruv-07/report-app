// backend/models/onboardingQuestion.model.js
const mongoose = require('mongoose');

const onboardingQuestionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: arr => arr.length === 4,
      message: 'Exactly 4 options required',
    },
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  category: {
    type: String,
    enum: ['PSI', 'CLS', 'DPI', 'General', 'Company Policy', 'Professional Conduct'],
    required: true,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('OnboardingQuestion', onboardingQuestionSchema);
