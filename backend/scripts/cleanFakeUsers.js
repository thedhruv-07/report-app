/**
 * One-time cleanup: remove demo/fake user accounts that were seeded during development.
 * Run with: node backend/scripts/cleanFakeUsers.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User } = require('../models/user.model');

const FAKE_EMAIL_PATTERNS = [
  '@rms.com',
  'sarah.chen',
  'admin@rms',
  'test@',
  'demo@',
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const all = await User.find({}).select('name email role').lean();
  const toDelete = all.filter(u =>
    FAKE_EMAIL_PATTERNS.some(pattern => u.email?.toLowerCase().includes(pattern))
  );

  if (toDelete.length === 0) {
    console.log('No fake users found.');
  } else {
    console.log('Found fake users to delete:');
    toDelete.forEach(u => console.log(`  - ${u.name} <${u.email}> [${u.role}]`));
    const ids = toDelete.map(u => u._id);
    await User.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${toDelete.length} fake user(s).`);
  }

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
