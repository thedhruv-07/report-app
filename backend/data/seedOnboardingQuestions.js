// backend/data/seedOnboardingQuestions.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const OnboardingQuestion = require('../models/onboardingQuestion.model');
const { User } = require('../models/user.model');

const QUESTIONS = [
  // PSI — 3 questions
  {
    question: 'What does PSI stand for in inspection terminology?',
    options: ['Pre-Shipment Inspection', 'Post-Shipment Inspection', 'Product Safety Inspection', 'Primary Supplier Inspection'],
    correctAnswer: 0,
    category: 'PSI',
  },
  {
    question: 'During a PSI, at what minimum production completion percentage should goods be packed before the inspection begins?',
    options: ['50%', '80%', '100% production, 80% packed', '100% production, 100% packed'],
    correctAnswer: 2,
    category: 'PSI',
  },
  {
    question: 'Which document must an inspector review before starting a Pre-Shipment Inspection?',
    options: ['The shipping bill of lading', 'The purchase order and product specification sheet', "The factory's ISO certification", 'The customs declaration form'],
    correctAnswer: 1,
    category: 'PSI',
  },
  // CLS — 3 questions
  {
    question: 'What does CLS stand for?',
    options: ['Container Loading Survey', 'Cargo Logistics System', 'Client Loading Specification', 'Consolidated Load Statement'],
    correctAnswer: 0,
    category: 'CLS',
  },
  {
    question: 'During a Container Loading Survey, an inspector must primarily verify:',
    options: ["The factory's production capacity", 'The quantity, condition, and loading pattern of goods', "The supplier's financial records", "The shipping company's license"],
    correctAnswer: 1,
    category: 'CLS',
  },
  {
    question: 'What should an inspector do if they observe significantly damaged cartons during a CLS?',
    options: ['Proceed with loading and note it in the report later', 'Stop loading, photograph the damage, and report to supervisor immediately', 'Ask the factory to repack only the visibly damaged cartons', 'Accept loading if total damaged cartons are below 5%'],
    correctAnswer: 1,
    category: 'CLS',
  },
  // DPI — 2 questions
  {
    question: 'What does DPI stand for?',
    options: ['During Production Inspection', 'Delivered Product Inspection', 'Daily Process Index', 'Default Production Indicator'],
    correctAnswer: 0,
    category: 'DPI',
  },
  {
    question: 'At what production stage is a DPI typically conducted?',
    options: ['Before any production begins', 'After 100% of goods are produced', 'When approximately 20–40% of production is complete', 'During final shipment packaging only'],
    correctAnswer: 2,
    category: 'DPI',
  },
  // General — 2 questions
  {
    question: 'What is the primary purpose of an AQL sampling plan?',
    options: ['To inspect every single unit in a shipment', 'To estimate the overall quality of a lot by inspecting a representative sample', 'To set pricing based on defect rates', 'To determine the inspection fee'],
    correctAnswer: 1,
    category: 'General',
  },
  {
    question: 'Which type of defect would cause an immediate inspection failure regardless of AQL level?',
    options: ['A minor cosmetic scratch on the product surface', 'A label that is 1mm off-center', 'A product that poses a safety risk to end users', 'Slight colour variation within the approved tolerance'],
    correctAnswer: 2,
    category: 'General',
  },
  // Company Policy — 3 questions
  {
    question: 'According to company policy, within how many hours must an inspector submit their final report after completing an inspection?',
    options: ['48 hours', '24 hours', '72 hours', '12 hours'],
    correctAnswer: 1,
    category: 'Company Policy',
  },
  {
    question: 'If a supplier offers gifts or hospitality to an inspector, what is the correct action?',
    options: ['Accept gifts valued under $50', 'Accept meals during working hours only', 'Politely decline and report the offer to their manager', 'Accept and disclose in the inspection report'],
    correctAnswer: 2,
    category: 'Company Policy',
  },
  {
    question: 'When is an inspector permitted to share inspection results directly with the factory?',
    options: ['Immediately after completing the inspection', 'Only after the client has reviewed the report', 'Never — all communication goes through the company', 'Only if the factory requests it in writing'],
    correctAnswer: 2,
    category: 'Company Policy',
  },
  // Professional Conduct — 2 questions
  {
    question: 'What is the correct action if an inspector is unsure about a product specification during an inspection?',
    options: ['Make a best-guess judgment and proceed', 'Stop and contact the supervisor or client for clarification', 'Mark the item as a defect to be safe', 'Ask the factory representative for their interpretation'],
    correctAnswer: 1,
    category: 'Professional Conduct',
  },
  {
    question: 'An inspector notices a fellow inspector falsifying a report. What should they do?',
    options: ['Ignore it to avoid workplace conflict', 'Cover for their colleague out of loyalty', 'Confront the colleague privately and ask them to self-report', 'Report the misconduct to management immediately'],
    correctAnswer: 3,
    category: 'Professional Conduct',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await OnboardingQuestion.countDocuments();
  if (existing === 0) {
    await OnboardingQuestion.insertMany(QUESTIONS);
    console.log(`Inserted ${QUESTIONS.length} onboarding questions`);
  } else {
    console.log(`Skipped question insert: ${existing} questions already exist`);
  }

  // Mark all existing inspectors as onboarding complete so they are not retroactively gated
  const result = await User.updateMany(
    { role: 'inspector', 'onboarding.isCompleted': { $ne: true } },
    { $set: { 'onboarding.isCompleted': true, 'onboarding.completedAt': new Date() } }
  );
  console.log(`Migrated ${result.modifiedCount} existing inspector(s) → onboarding.isCompleted = true`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => { console.error(err); process.exit(1); });
