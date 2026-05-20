// backend/routes/onboarding.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getStatus, completeStep, getQuestions, submitAssessment } = require('../controllers/onboarding.controller');

router.use(authMiddleware);
router.use(roleCheck(['inspector']));

router.get('/status', getStatus);
router.post('/complete-step', completeStep);
router.get('/assessment-questions', getQuestions);
router.post('/submit-assessment', submitAssessment);

module.exports = router;
