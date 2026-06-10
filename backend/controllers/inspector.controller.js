const Task = require('../models/task.model');
const Notification = require('../models/notification.model');
const notifyStaff = require('../utils/notifyStaff');

const getSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const allTasksCount = await Task.countDocuments({ assignedInspectorId: userId });
    const pendingTasksCount = await Task.countDocuments({ 
      assignedInspectorId: userId, 
      status: { $in: ['Pending Acceptance', 'Accepted'] } 
    });
    const submittedCount = await Task.countDocuments({ 
      assignedInspectorId: userId, 
      status: 'Report Submitted' 
    });
    const reviewFinalizedCount = await Task.countDocuments({ 
      assignedInspectorId: userId, 
      status: { $in: ['Under Review', 'Finalized'] } 
    });

    res.json({
      totalTasks: allTasksCount,
      pendingTasks: pendingTasksCount,
      submittedReports: submittedCount,
      reviewFinalized: reviewFinalizedCount
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const tasks = await Task.find({ assignedInspectorId: userId }).sort({ scheduledDate: 1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const acceptTask = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, assignedInspectorId: userId, status: 'Pending Acceptance' },
      { status: 'Accepted' },
      { new: true }
    );
    if (!task) return res.status(400).json({ error: "Task cannot be accepted or not found" });

    const inspectorName = req.user?.name || 'An inspector';
    const clientLabel = task.clientName || 'Unknown Client';
    const typeLabel = task.inspectionType || 'inspection';
    notifyStaff({
      title: 'Task Accepted',
      message: `${inspectorName} accepted the ${typeLabel} task for ${clientLabel}.`,
      type: 'info',
      priority: 2,
      emailSubject: `[TASK ACCEPTED] ${inspectorName} accepted ${typeLabel} — ${clientLabel}`,
      templateName: 'task-accepted.html',
      templateVars: {
        inspectorName,
        inspectionType: typeLabel,
        clientName: clientLabel,
        acceptedAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
      },
    }).catch(e => console.warn('[acceptTask] notifyStaff failed:', e.message));

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({ inspectorId: userId }).sort({ createdAt: -1 }).limit(10);
    const unreadCount = await Notification.countDocuments({ inspectorId: userId, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, inspectorId: userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await Notification.updateMany(
      { inspectorId: userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const addSectionSkipReason = async (req, res) => {
  try {
    const { step, stepLabel, reason, missingFields } = req.body;
    if (!step || !reason) return res.status(400).json({ error: 'step and reason are required' });

    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Replace existing entry for this step if re-submitted, otherwise push
    const existing = task.sectionSkipReasons.findIndex(r => r.step === step);
    const entry = { step, stepLabel: stepLabel || `Step ${step}`, missingFields: missingFields || [], reason, skippedAt: new Date() };
    if (existing >= 0) task.sectionSkipReasons[existing] = entry;
    else task.sectionSkipReasons.push(entry);

    await task.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSummary,
  getTasks,
  getTaskById,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
