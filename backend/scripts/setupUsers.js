require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/user.model');

const DELETE_EMAILS = [
  'operator@absoluteveritas.com',
  'factorytester@example.com',
  'id-cs@absoluteveritas.com',
  'denver@company.com',
  'revwithdhruv@gmail.com',
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  // 1. Update dhruvsingh200420@gmail.com → manager + new password
  const hashedPassword = await bcrypt.hash('dhruv123', 10);
  const updated = await User.findOneAndUpdate(
    { email: 'dhruvsingh200420@gmail.com' },
    { role: 'manager', password: hashedPassword, name: 'Technical Manager' },
    { new: true }
  );
  if (updated) {
    console.log(`✅ Updated: ${updated.email} → role: manager`);
  } else {
    console.log('⚠️  dhruvsingh200420@gmail.com not found');
  }

  // 2. Delete old accounts
  const deleted = await User.deleteMany({ email: { $in: DELETE_EMAILS } });
  console.log(`🗑️  Deleted ${deleted.deletedCount} old account(s):`);
  DELETE_EMAILS.forEach(e => console.log(`   - ${e}`));

  // 3. Show remaining users
  console.log('\n📋 Remaining users:');
  const remaining = await User.find({}).select('name email role').lean();
  remaining.forEach(u => console.log(`   ${u.role.padEnd(12)} ${u.email.padEnd(35)} ${u.name}`));

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
