require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Task = require('./models/task.model');

const ARCHIVABLE_STATUSES = ['Report Submitted', 'Under Review', 'Finalized'];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const candidates = await Task.find({
    status: { $in: ARCHIVABLE_STATUSES },
    reportSubmittedAt: null,
  });

  console.log(`Found ${candidates.length} task(s) missing reportSubmittedAt.`);

  for (const task of candidates) {
    task.reportSubmittedAt = task.updatedAt;
    await task.save();
    console.log(`  ${task._id} (${task.status}) -> reportSubmittedAt = ${task.updatedAt.toISOString()}`);
  }

  console.log('Backfill complete.');
  process.exit(0);
})();
