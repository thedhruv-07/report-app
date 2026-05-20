// backend/controllers/onboarding.controller.js
const { User } = require('../models/user.model');
const OnboardingQuestion = require('../models/onboardingQuestion.model');

const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('onboarding');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ onboarding: user.onboarding || {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const completeStep = async (req, res) => {
  const { step } = req.body;
  if (!['manualRead', 'videosWatched'].includes(step)) {
    return res.status(400).json({ error: 'Invalid step. Must be manualRead or videosWatched.' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { [`onboarding.${step}`]: true } },
      { new: true, select: 'onboarding' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ onboarding: user.onboarding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getQuestions = async (req, res) => {
  try {
    const questions = await OnboardingQuestion.find({ isActive: true }).select('-correctAnswer');
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const submitAssessment = async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }
  try {
    const userCheck = await User.findById(req.user.id).select('onboarding');
    if (!userCheck?.onboarding?.manualRead || !userCheck?.onboarding?.videosWatched) {
      return res.status(403).json({ error: 'Complete steps 1 and 2 before taking the assessment.' });
    }

    const questions = await OnboardingQuestion.find({ isActive: true });
    if (questions.length === 0) {
      return res.status(503).json({ error: 'Assessment unavailable. Please contact support.' });
    }
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    let correctCount = 0;
    const categoryBreakdown = {};

    for (const answer of answers) {
      const q = questionMap[answer.questionId];
      if (!q) continue;
      if (!categoryBreakdown[q.category]) categoryBreakdown[q.category] = { correct: 0, total: 0 };
      categoryBreakdown[q.category].total++;
      if (answer.selectedOption === q.correctAnswer) {
        correctCount++;
        categoryBreakdown[q.category].correct++;
      }
    }

    const totalCount = questions.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= 70;

    const update = {
      $set: {
        'onboarding.assessmentScore': score,
        'onboarding.assessmentPassed': passed,
      },
      $inc: { 'onboarding.assessmentAttempts': 1 },
    };
    if (passed) {
      update.$set['onboarding.isCompleted'] = true;
      update.$set['onboarding.completedAt'] = new Date();
    }

    const updated = await User.findByIdAndUpdate(req.user.id, update);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({ passed, score, correctCount, totalCount, categoryBreakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getStatus, completeStep, getQuestions, submitAssessment };
