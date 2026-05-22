// backend/routes/onboarding.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getStatus, completeStep, getQuestions, submitAssessment, saveVideoProgress } = require('../controllers/onboarding.controller');

router.use(authMiddleware);
router.use(roleCheck(['inspector']));

router.get('/status', getStatus);
router.post('/complete-step', completeStep);
router.post('/video-progress', saveVideoProgress);
router.get('/assessment-questions', getQuestions);
router.post('/submit-assessment', submitAssessment);

module.exports = router;
