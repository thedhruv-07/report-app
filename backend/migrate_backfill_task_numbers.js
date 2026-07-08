/**
 * One-time backfill: assigns a real AV{date}{seq} taskNumber to every
 * existing Task record that currently has none, so the inspector's task
 * workspace URL stops showing the raw Mongo ObjectId.
 *
 * Only touches records missing the field — never overwrites an existing value.
 *
 * Run: node backend/migrate_backfill_task_numbers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Task = require('./models/task.model');
const { uniqueTaskNumber } = require('./utils/noticeId');

const MISSING = { $in: [null, ''] };

async function backfillTasks() {
  const tasks = await Task.find({
    $or: [{ taskNumber: { $exists: false } }, { taskNumber: MISSING }],
  }).select('_id');

  console.log(`[Task] Found ${tasks.length} task(s) with no taskNumber.`);
  for (const t of tasks) {
    const number = await uniqueTaskNumber();
    await Task.updateOne({ _id: t._id }, { $set: { taskNumber: number } });
    console.log(`  Task ${t._id} -> ${number}`);
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');
  try {
    await backfillTasks();
    console.log('Backfill complete.');
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
