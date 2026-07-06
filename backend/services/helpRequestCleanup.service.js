// Deletes inspector <-> Technical Manager help-request chat threads that have
// had no activity (no new message/reply) for 3+ days. Uses updatedAt (not
// createdAt) so a thread with recent replies is never deleted mid-conversation
// — only ones that have gone quiet for 3 days are cleaned up.
const mongoose = require('mongoose');
const InspectorHelpRequest = require('../models/inspectorHelpRequest.model');

const RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // check hourly

const isDbReady = () => mongoose.connection.readyState === 1;

const cleanupOldHelpRequests = async () => {
  try {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    const result = await InspectorHelpRequest.deleteMany({ updatedAt: { $lt: cutoff } });
    if (result.deletedCount > 0) {
      console.log(`[help-request-cleanup] Deleted ${result.deletedCount} inspector/TM chat thread(s) inactive for 3+ days`);
    }
  } catch (e) {
    console.error('[help-request-cleanup] Cleanup failed:', e.message);
  }
};

let cleanupTimer = null;
const startCleanupLoop = () => {
  if (cleanupTimer || !isDbReady()) return;
  cleanupTimer = setInterval(() => {
    cleanupOldHelpRequests();
  }, CHECK_INTERVAL_MS);
};

const initHelpRequestCleanup = () => {
  startCleanupLoop();
  cleanupOldHelpRequests();
};

if (isDbReady()) {
  initHelpRequestCleanup();
} else {
  mongoose.connection.once('connected', initHelpRequestCleanup);
}

module.exports = { cleanupOldHelpRequests, startCleanupLoop };
