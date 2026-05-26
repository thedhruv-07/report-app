const express = require('express');
const router = express.Router();
const { listEmails, retryEmail, sendTestEmail, sendSelfTestEmail } = require('../controllers/email.controller');
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/test-self', sendSelfTestEmail);

router.use(roleCheck(['admin']));

router.get('/', listEmails);
router.get('/:id/raw', require('../controllers/email.controller').getRawEmail);
router.post('/:id/retry', retryEmail);
router.post('/test', sendTestEmail);

module.exports = router;
