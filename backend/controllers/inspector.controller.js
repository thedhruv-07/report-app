const Task = require('../models/task.model');
const Notification = require('../models/notification.model');

const generateMockTasksIfNeeded = async (userId) => {
  const count = await Task.countDocuments({ assignedInspectorId: userId });
  if (count === 0) {
    const tasks = [
      {
        assignedInspectorId: userId,
        clientName: "Global Sourcing Ltd.",
        factoryName: "Shenzhen Industrial Park",
        factoryAddress: "123 Manufacturing Blvd, Shenzhen, China",
        inspectionType: "PSI",
        scheduledDate: new Date(Date.now() + 86400000 * 2),
        status: "Pending Acceptance",
        adminInstructions: "Please check the packaging carefully, previous shipment had issues.",
      },
      {
        assignedInspectorId: userId,
        clientName: "TechCorp Inc.",
        factoryName: "Dongguan Electronics Co.",
        factoryAddress: "456 Tech Park, Dongguan, China",
        inspectionType: "DPI",
        scheduledDate: new Date(Date.now() + 86400000 * 3), 
        status: "Accepted",
      },
      {
        assignedInspectorId: userId,
        clientName: "HomeGoods LLC",
        factoryName: "Guangzhou Furniture Ltd.",
        factoryAddress: "789 Wood Street, Guangzhou, China",
        inspectionType: "CLS",
        scheduledDate: new Date(Date.now() - 86400000 * 1), 
        status: "Correction Requested",
        correctionFeedback: "Please provide clearer photos of the container seal.",
      },
      {
        assignedInspectorId: userId,
        clientName: "AutoParts Co.",
        factoryName: "Ningbo Metal Works",
        factoryAddress: "321 Industry Rd, Ningbo, China",
        inspectionType: "Factory Audit",
        scheduledDate: new Date(Date.now() - 86400000 * 5), 
        status: "Finalized",
      }
    ];
    await Task.insertMany(tasks);
    
    const notifications = [
      {
        inspectorId: userId,
        title: "New inspection task assigned",
        message: "Global Sourcing Ltd. on " + new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
        type: "task",
        isRead: false
      },
      {
        inspectorId: userId,
        title: "Correction requested",
        message: "HomeGoods LLC report requires updates. Review feedback.",
        type: "correction",
        isRead: false
      },
      {
        inspectorId: userId,
        title: "Report Finalized",
        message: "Your AutoParts Co. report has been finalized.",
        type: "approval",
        isRead: true
      }
    ];
    await Notification.insertMany(notifications);
  }
};

const getSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    await generateMockTasksIfNeeded(userId); 

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
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notifications = await Notification.find({ inspectorId: userId }).sort({ createdAt: -1 }).limit(50);
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

module.exports = {
  getSummary,
  getTasks,
  getTaskById,
  acceptTask,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
