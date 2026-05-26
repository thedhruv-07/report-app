const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

const User = require('../models/user.model').User;

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'id-cs@absoluteveritas.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Absolute@89';
const ADMIN_NAME = (process.env.ADMIN_NAME || 'Absolute Veritas Admin').trim();

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set');
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existingByEmail = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existingByEmail) {
    existingByEmail.name = ADMIN_NAME;
    existingByEmail.password = hashedPassword;
    existingByEmail.provider = 'local';
    existingByEmail.role = 'admin';
    existingByEmail.googleId = undefined;
    await existingByEmail.save();
    console.log(`Updated admin user: ${ADMIN_EMAIL}`);
  } else {
    const existingAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (existingAdmin) {
      existingAdmin.name = ADMIN_NAME;
      existingAdmin.email = ADMIN_EMAIL.toLowerCase();
      existingAdmin.password = hashedPassword;
      existingAdmin.provider = 'local';
      existingAdmin.role = 'admin';
      existingAdmin.googleId = undefined;
      await existingAdmin.save();
      console.log(`Reassigned existing admin to: ${ADMIN_EMAIL}`);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        password: hashedPassword,
        provider: 'local',
        role: 'admin',
      });
      console.log(`Created admin user: ${ADMIN_EMAIL}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Failed to set admin credentials:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
