const Task = require('../models/task.model');
const Notification = require('../models/notification.model');
const notifyStaff = require('../utils/notifyStaff');
const InspectionNotice = require('../models/InspectionNotice');
const wasabiService = require('../services/wasabiService');

const NOTICE_SUMMARY_FIELDS = 'basicInfo teamAssignment productInfo aql inspectionRequirements specialClientRequirements customerSamples inspectionInfo attachments inspectionTools onSiteTests defectClassifications supplierInfo factoryInfo noticeId';

async function resolveNoticeDocUrls(notice) {
  const resolve = async (entry) => {
    if (!entry || !entry.url) return entry;
    try {
      const key = wasabiService.extractKey(entry.url);
      const signedUrl = await wasabiService.getSignedUrl(key);
      return { ...entry, url: signedUrl };
    } catch (err) {
      console.error('[getTaskNotice] Failed to resolve signed URL:', err.message);
      return { ...entry, url: null };
    }
  };

  const info = notice.inspectionInfo || {};
  const att = notice.attachments || {};

  const [onlineWI, onlineCustomerClaimForm, reportTemplate, clientFiles, supplierFiles] = await Promise.all([
    resolve(info.onlineWI),
    resolve(info.onlineCustomerClaimForm),
    Promise.all((info.reportTemplate || []).map(resolve)),
    Promise.all((att.clientFiles || []).map(resolve)),
    Promise.all((att.supplierFiles || []).map(resolve)),
  ]);

  return {
    ...notice.toObject(),
    inspectionInfo: { ...info, onlineWI, onlineCustomerClaimForm, reportTemplate },
    attachments: { ...att, clientFiles, supplierFiles },
  };
}

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

const ARCHIVABLE_STATUSES = ['Report Submitted', 'Under Review', 'Finalized'];
const ARCHIVE_WINDOW_MS = 72 * 60 * 60 * 1000;

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const cutoff = new Date(Date.now() - ARCHIVE_WINDOW_MS);
    const tasks = await Task.find({
      assignedInspectorId: userId,
      $or: [
        { status: { $nin: ARCHIVABLE_STATUSES } },  // not yet submitted, or Correction Requested — always visible
        { reportSubmittedAt: { $gt: cutoff } },      // submitted, still within the 72h window
        { reportSubmittedAt: null },                 // legacy data safety net — never hide if we don't know when it was submitted
      ],
    }).sort({ scheduledDate: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const getArchivedCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { month, year, date } = req.query;

    let start, end;
    if (date) {
      start = new Date(`${date}T00:00:00.000Z`);
      end = new Date(`${date}T23:59:59.999Z`);
      if (!isNaN(start.getTime()) && start.toISOString().slice(0, 10) !== date) {
        return res.status(400).json({ error: 'Provide either date, or month and year' });
      }
    } else if (month && year) {
      const monthNum = Number(month);
      if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: 'Provide either date, or month and year' });
      }
      start = new Date(Date.UTC(Number(year), monthNum - 1, 1));
      end = new Date(Date.UTC(Number(year), monthNum, 0, 23, 59, 59, 999));
    } else {
      return res.status(400).json({ error: 'Provide either date, or month and year' });
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Provide either date, or month and year' });
    }

    const count = await Task.countDocuments({
      assignedInspectorId: userId,
      status: { $in: ['Report Submitted', 'Under Review', 'Finalized', 'Correction Requested'] },
      reportSubmittedAt: { $gte: start, $lte: end },
    });

    res.json({ count });
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

const getTaskNotice = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const noticeId = task.prefillData?.noticeId;
    if (!noticeId) return res.json({ notice: null });

    const notice = await InspectionNotice.findOne({ noticeId }).select(NOTICE_SUMMARY_FIELDS + ' inspectorQueries');
    if (!notice) return res.json({ notice: null });

    const resolved = await resolveNoticeDocUrls(notice);
    res.json({ notice: resolved });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const submitNoticeQuery = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: "message is required" });

    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const noticeId = task.prefillData?.noticeId;
    if (!noticeId) return res.status(400).json({ error: "This task has no linked notice" });

    const notice = await InspectionNotice.findOneAndUpdate(
      { noticeId },
      { $push: { inspectorQueries: { inspectorId: userId, inspectorName: req.user.name, message: message.trim(), raisedAt: new Date() } } },
      { new: true }
    ).select('inspectorQueries');
    if (!notice) return res.status(404).json({ error: "Notice not found" });

    res.json({ inspectorQueries: notice.inspectorQueries });
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
  getArchivedCount,
  getTaskById,
  getTaskNotice,
  submitNoticeQuery,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
