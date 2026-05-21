require('dotenv').config();
const mongoose = require('mongoose');
const FactoryAudit = require('../models/factoryAudit.model');
const factoryAuditController = require('../controllers/factoryAudit.controller');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const doc = await FactoryAudit.findOne().lean();
  if(!doc) return console.error('No FactoryAudit found');
  const id = doc._id.toString();
  console.log('Testing generateReport for id', id);

  // Mock req/res
  const req = { params: { id }, user: { id: 'test-admin-id', role: 'admin' }, query: {} };
  const res = {
    headers: {},
    setHeader(k,v){ this.headers[k]=v; },
    status(code){ this._status=code; return this; },
    json(payload){ console.log('res.json:', payload); },
    send(payload){
      if(Buffer.isBuffer(payload)){
        console.log('Received buffer of length', payload.length);
      } else {
        console.log('res.send type:', typeof payload);
      }
    }
  };

  try{
    await factoryAuditController.generateReport(req, res);
    console.log('generateReport finished');
  } catch (err){
    console.error('generateReport threw:', err);
  }
  process.exit(0);
}
run();