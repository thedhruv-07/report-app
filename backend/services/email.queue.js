const mongoose = require('mongoose');
const EmailLog = require('../models/emailLog.model');
const { findByEmail } = require('../models/user.model');
const { sendImmediateEmail } = require('./email.service');

// Simple in-process queue worker. For production we recommend Redis-backed queue (Bull/Queue).
const CONCURRENCY = parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '3', 10);
const MAX_RETRIES = parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10);
const RETRY_DELAY_MS = parseInt(process.env.EMAIL_RETRY_DELAY_MS || String(30 * 1000), 10);

let isWorkerRunning = false;
let workerTimer = null;

const isDbReady = () => mongoose.connection && mongoose.connection.readyState === 1;

const preferenceKeyForType = (type = '') => {
  const map = {
    report_submitted: 'reportSubmitted',
    report_approved: 'reportApproved',
    report_rejected: 'reportRejected',
    delivery_completed: 'deliveryCompleted',
    report_updated: 'reportUpdated',
    critical_alert: 'criticalAlerts',
  };
  return map[type] || null;
};

const isRecipientEnabled = async (recipient, type) => {
  const key = preferenceKeyForType(type);
  if (!key) return true;
  const user = await findByEmail(recipient);
  if (!user) return true;
  const prefs = user.notificationPreferences || {};
  if (prefs.enabled === false) return false;
  if (prefs[key] === false) return false;
  return true;
};

const enqueueEmail = async ({ reportId, recipient, subject, type, html, attachments = [], metadata = {}, priority = 3 }) => {
  if (!isDbReady()) {
    throw new Error('Email queue unavailable until MongoDB is connected');
  }
  const allowed = await isRecipientEnabled(recipient, type);
  if (!allowed) {
    return { skipped: true, recipient, type, reason: 'notification preference disabled' };
  }
  // Prevent duplicate sends for same report/recipient/type within short window
  const recent = await EmailLog.findOne({ reportId, recipient, type, createdAt: { $gt: new Date(Date.now() - 1000 * 60 * 5) } });
  if (recent && recent.status !== 'failed') {
    return recent;
  }

  const log = await EmailLog.create({ reportId, recipient, subject, type, html, attachments, metadata, status: 'queued' });
  // Kick worker
  process.nextTick(() => { runWorker().catch(err => console.error('Email worker error:', err)); });
  return log;
};

const sendWithRetry = async (log) => {
  try {
    await EmailLog.findByIdAndUpdate(log._id, { status: 'sending' });
    const info = await sendImmediateEmail({ to: log.recipient, subject: log.subject, html: log.html, attachments: log.attachments });
    await EmailLog.findByIdAndUpdate(log._id, {
      status: 'sent',
      sentAt: new Date(),
      deliveredAt: new Date(),
      $inc: { retryCount: 0 },
      metadata: { ...(log.metadata || {}), ...info }
    });
    return info;
  } catch (err) {
    const retryCount = (log.retryCount || 0) + 1;
    const failedReason = err && err.message ? err.message : String(err);
    await EmailLog.findByIdAndUpdate(log._id, { status: 'failed', failedReason, retryCount });
    if (retryCount < MAX_RETRIES) {
      // schedule retry
      setTimeout(async () => {
        const fresh = await EmailLog.findById(log._id).lean();
        if (fresh && fresh.status !== 'sent') {
          await EmailLog.findByIdAndUpdate(log._id, { status: 'queued' });
          process.nextTick(() => runWorker().catch(e => console.error('Email worker retry error:', e)));
        }
      }, RETRY_DELAY_MS * retryCount);
    }
    throw err;
  }
};

const runWorker = async () => {
  if (!isDbReady()) return;
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  try {
    const pending = await EmailLog.find({ status: { $in: ['queued','failed'] } }).sort({ createdAt: 1 }).limit(100).lean();
    if (!pending || pending.length === 0) return;
    const batch = pending.slice(0, CONCURRENCY);
    await Promise.all(batch.map(async (item) => {
      try {
        const fresh = await EmailLog.findById(item._id).lean();
        if (!fresh) return;
        // If already sent, skip
        if (fresh.status === 'sent') return;
        await sendWithRetry(fresh);
      } catch (err) {
        console.error('Failed to send queued email', item._id, err && err.message ? err.message : err);
      }
    }));
  } finally {
    isWorkerRunning = false;
  }
};

const startWorkerLoop = () => {
  if (workerTimer || !isDbReady()) return;
  workerTimer = setInterval(() => {
    runWorker().catch(e => console.error('Email worker periodic error:', e));
  }, 15 * 1000);
};

mongoose.connection.once('connected', () => {
  startWorkerLoop();
  runWorker().catch(e => console.error('Email worker startup error:', e));
});

module.exports = { enqueueEmail, runWorker, startWorkerLoop };
