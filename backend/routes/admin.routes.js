// backend/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getInspectors, deleteInspector, getUsers } = require('../controllers/admin.controller');
const Task = require('../models/task.model');

router.use(authMiddleware);
router.use(roleCheck(['admin', 'manager']));

router.get('/inspectors', getInspectors);
router.delete('/inspectors/:id', deleteInspector);
router.get('/users', getUsers);

// GET task section skip reasons for a booking
router.get('/bookings/:bookingId/task-progress', async (req, res) => {
  try {
    const task = await Task.findOne({ bookingId: req.params.bookingId })
      .select('status sectionSkipReasons updatedAt')
      .lean();
    if (!task) return res.json({ task: null });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
