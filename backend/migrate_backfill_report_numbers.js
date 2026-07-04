/**
 * One-time backfill: assigns a real AV{date}{seq} report number to every
 * existing Report / FactoryAudit record that currently has no reportNumber,
 * so the admin/manager queue view stops falling back to a random-looking
 * RPT-{id fragment} display.
 *
 * Only touches records missing the field — never overwrites an existing value.
 *
 * Run: node backend/migrate_backfill_report_numbers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { Report } = require('./models/report.model');
const FactoryAudit = require('./models/factoryAudit.model');
const { uniqueNoticeId } = require('./utils/noticeId');

const MISSING = { $in: [null, ''] };

async function backfillReports() {
  const reports = await Report.find({
    $or: [{ reportNumber: { $exists: false } }, { reportNumber: MISSING }],
  }).select('_id');

  console.log(`[Report] Found ${reports.length} report(s) with no reportNumber.`);
  for (const r of reports) {
    const number = await uniqueNoticeId();
    await Report.updateOne({ _id: r._id }, { $set: { reportNumber: number } });
    console.log(`  Report ${r._id} -> ${number}`);
  }
}

async function backfillFactoryAudits() {
  const audits = await FactoryAudit.find({
    $or: [
      { 'generalInfo.inspectionNo': { $exists: false } },
      { 'generalInfo.inspectionNo': MISSING },
    ],
  }).select('_id');

  console.log(`[FactoryAudit] Found ${audits.length} report(s) with no inspectionNo.`);
  for (const a of audits) {
    const number = await uniqueNoticeId();
    await FactoryAudit.updateOne({ _id: a._id }, { $set: { 'generalInfo.inspectionNo': number } });
    console.log(`  FactoryAudit ${a._id} -> ${number}`);
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');
  try {
    await backfillReports();
    await backfillFactoryAudits();
    console.log('Backfill complete.');
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
