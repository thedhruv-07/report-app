// backend/controllers/admin.controller.js
const { User } = require('../models/user.model');
const Notification = require('../models/notification.model');

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

const deleteInspector = async (req, res) => {
  try {
    const inspector = await User.findOne({ _id: req.params.id, role: 'inspector' });
    if (!inspector) return res.status(404).json({ error: 'Inspector not found' });
    await Notification.deleteMany({ inspectorId: inspector._id });
    await inspector.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getInspectors, deleteInspector };
