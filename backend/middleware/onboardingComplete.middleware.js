const { User } = require('../models/user.model');

const requireOnboardingComplete = async (req, res, next) => {
  try {
    if (req.user?.role !== 'inspector') return next();
    const user = await User.findById(req.user.id).select('onboarding');
    if (!user?.onboarding?.isCompleted) {
      return res.status(403).json({ error: 'Complete onboarding before accessing reports.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { requireOnboardingComplete };
