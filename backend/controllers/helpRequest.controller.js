const InspectorHelpRequest = require('../models/inspectorHelpRequest.model');
const SystemNotification = require('../models/systemNotification.model');
const { getIO } = require('../socket');
const notifyStaff = require('../utils/notifyStaff');

const createHelpRequest = async (req, res) => {
  try {
    const { reportType, sectionLabel, taskId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const context = [reportType, sectionLabel].filter(Boolean).join(' — Section: ');
    const title = 'Inspector Needs Help';
    const helpMessage = `${req.user.name} needs help${context ? ` (${context})` : ''}: "${message.trim()}"`;

    await notifyStaff({
      title,
      message: helpMessage,
      type: 'urgent',
      priority: 1,
      emailSubject: '[Absolute Veritas] Inspector Needs Help',
      templateName: 'system-alert.html',
      templateVars: { title, message: helpMessage },
    });

    const notification = await SystemNotification.findOne({ title, message: helpMessage }).sort({ createdAt: -1 });

    getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      createdAt: notification.createdAt,
    });

    await InspectorHelpRequest.create({
      inspectorId: req.user.id || req.user._id,
      inspectorName: req.user.name,
      reportType,
      sectionLabel,
      taskId: taskId || null,
      message: message.trim(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHelpRequestsForInspector = async (req, res) => {
  try {
    const helpRequests = await InspectorHelpRequest.find({ inspectorId: req.user.id || req.user._id }).sort({ createdAt: -1 });
    res.json({ helpRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHelpRequestsForManager = async (req, res) => {
  try {
    const helpRequests = await InspectorHelpRequest.find({}).sort({ createdAt: -1 }).limit(50);
    res.json({ helpRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const replyToHelpRequest = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const helpRequest = await InspectorHelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ error: 'Help request not found' });

    helpRequest.replies.push({
      message: message.trim(),
      repliedBy: req.user.id || req.user._id,
      repliedByName: req.user.name,
      repliedAt: new Date(),
    });
    await helpRequest.save();

    try {
      const { User } = require('../models/user.model');
      const { renderTemplate } = require('../services/email.service');
      const { enqueueEmail } = require('../services/email.queue');

      const inspector = await User.findById(helpRequest.inspectorId).select('email name').lean();
      if (inspector?.email) {
        const html = renderTemplate('system-alert.html', {
          title: 'Technical Manager Replied',
          message: `${req.user.name} replied to your question: "${message.trim()}"`,
          dashboardUrl: (process.env.FRONTEND_URL || 'https://absolute-veritas.netlify.app') + '/dashboard',
        });
        enqueueEmail({ recipient: inspector.email, subject: '[Absolute Veritas] Technical Manager Replied', type: 'help_request_reply', html });
      }
    } catch (emailErr) {
      console.warn('[helpRequest] Failed to email inspector about reply:', emailErr.message);
    }

    res.json({ helpRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const inspectorReplyToHelpRequest = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const helpRequest = await InspectorHelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ error: 'Help request not found' });

    const requesterId = (req.user.id || req.user._id).toString();
    if (helpRequest.inspectorId.toString() !== requesterId) {
      return res.status(403).json({ error: 'Not your help request' });
    }

    helpRequest.replies.push({
      message: message.trim(),
      repliedBy: requesterId,
      repliedByName: req.user.name,
      repliedAt: new Date(),
    });
    await helpRequest.save();

    res.json({ helpRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createHelpRequest,
  getHelpRequestsForInspector,
  getHelpRequestsForManager,
  replyToHelpRequest,
  inspectorReplyToHelpRequest,
};
