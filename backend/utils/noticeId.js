const Counter = require("../models/Counter");

// Matches our auto-generated format, e.g. AV202607040001
const AUTO_ID_PATTERN = /^AV\d{12}$/;

function formatId(dateStamp, seq) {
  return `AV${dateStamp}${String(seq).padStart(4, '0')}`;
}

function todayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Read-only preview of what the next ID would be, for display before saving.
// Does NOT consume a sequence number, so opening the "new notice" page
// repeatedly (or React StrictMode's double-effect in dev) never burns numbers
// or creates gaps.
async function peekNextNoticeId() {
  const counter = await Counter.findById("noticeId").lean();
  const seq = (counter?.seq || 0) + 1;
  return formatId(todayStamp(), seq);
}

// Atomically mints the next ID, actually consuming a sequence number.
// Only call this at the moment a notice is genuinely being created.
async function uniqueNoticeId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "noticeId" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return formatId(todayStamp(), counter.seq);
}

// Every report type (PSI/CLS/DPI via Report, Factory Audit) shows the
// auto-filled preview in its "Inspection No." field before the report is
// actually saved. If the admin/inspector left that default in place, mint a
// real, authoritative number now. If the value already belongs to a real
// record somewhere (e.g. it was carried over from an assigned Inspection
// Notice), keep it as-is so the report stays linked to that same number
// instead of consuming a fresh one.
async function claimInspectionNumber(candidate) {
  if (!candidate || !AUTO_ID_PATTERN.test(candidate)) return candidate;

  const InspectionNotice = require("../models/InspectionNotice");
  const { Report } = require("../models/report.model");
  const FactoryAudit = require("../models/factoryAudit.model");

  const [inNotice, inReport, inFA] = await Promise.all([
    InspectionNotice.exists({ noticeId: candidate }),
    Report.exists({ reportNumber: candidate }),
    FactoryAudit.exists({ "generalInfo.inspectionNo": candidate }),
  ]);

  if (inNotice || inReport || inFA) return candidate;
  return uniqueNoticeId();
}

// Tasks get their own AV-format number from a separate counter — sharing the
// notice counter would burn notice sequence numbers every time a task is
// created without a notice actually being created, making notice numbers
// jump ahead of the real notice count.
async function uniqueTaskNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "taskId" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return formatId(todayStamp(), counter.seq);
}

module.exports = { peekNextNoticeId, uniqueNoticeId, claimInspectionNumber, uniqueTaskNumber };
