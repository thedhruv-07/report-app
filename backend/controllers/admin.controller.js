// backend/controllers/admin.controller.js
const { User } = require('../models/user.model');

const getInspectors = async (req, res) => {
  try {
    const inspectors = await User.find({ role: 'inspector' })
      .select('name email createdAt onboarding')
      .sort({ createdAt: -1 });
    res.json({ inspectors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getInspectors };
