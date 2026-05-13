const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { MONGO_URI } = require('../config/config');

async function listDatabases() {
  try {
    await mongoose.connect(MONGO_URI);
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases on this cluster:');
    dbs.databases.forEach(db => console.log(` - ${db.name}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listDatabases();
