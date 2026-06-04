// backend/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getInspectors, deleteInspector } = require('../controllers/admin.controller');

router.use(authMiddleware);
router.use(roleCheck(['admin']));

router.get('/inspectors', getInspectors);
router.delete('/inspectors/:id', deleteInspector);

module.exports = router;
