// backend/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getInspectors } = require('../controllers/admin.controller');

router.use(authMiddleware);
router.use(roleCheck(['admin', 'manager']));

router.get('/inspectors', getInspectors);

module.exports = router;
