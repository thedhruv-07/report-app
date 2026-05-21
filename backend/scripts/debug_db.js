const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { Report } = require('../models/report.model');
const FactoryAudit = require('../models/factoryAudit.model');

async function checkDB() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');
  const reportCount = await Report.countDocuments({ 
    operationStatus: { $in: ['submitted', 'under_review', 'revision_required', 'approved'] } 
  });
  const auditCount = await FactoryAudit.countDocuments({ 
    operationStatus: { $in: ['submitted', 'under_review', 'revision_required', 'approved'] } 
  });
  
  const allReports = await Report.find({}, 'operationStatus');
  
  console.log('Matching Standard Reports:', reportCount);
  console.log('Matching Factory Audits:', auditCount);
  console.log('All Report Statuses:', allReports.map(r => r.operationStatus));
  const oneFA = await FactoryAudit.findOne().lean();
  if (oneFA) {
    console.log('Sample FactoryAudit id:', oneFA._id.toString());
    console.log('Sample FactoryAudit part4 snippet:', JSON.stringify(oneFA.part4 && { warehouseCondition: oneFA.part4.warehouseCondition, warehousePhotos: oneFA.part4.warehousePhotos }, null, 2));
  }
  
  process.exit(0);
}

checkDB();
