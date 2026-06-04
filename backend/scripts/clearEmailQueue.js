require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const EmailLog = require('../models/emailLog.model');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const r = await EmailLog.deleteMany({ status: { $in: ['queued', 'sending', 'failed'] } });
  console.log('Cleared', r.deletedCount, 'old stuck emails');
  await mongoose.disconnect();
}).catch(e => { console.error(e); process.exit(1); });
