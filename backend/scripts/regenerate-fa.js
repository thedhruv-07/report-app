const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/config');
const FactoryAudit = require('../models/factoryAudit.model');
const { Document, Packer, Header, Footer } = require('docx');
const { createFAHeaderTable, createFAContent } = require('../services/faDocx.service');

const id = process.argv[2] || '6a1e851a58562f588d109b52';

(async function(){
  try{
    await mongoose.connect(process.env.MONGO_URI || config.MONGO_URI);
    console.log('Connected to MongoDB');
    const reportDoc = await FactoryAudit.findById(id).lean();
    if (!reportDoc) return console.error('Report not found:', id);

    // Use controller's preloadReportPhotos logic by requiring controller and calling internal function is not possible,
    // so replicate minimal preload by calling the generate flow used in controller file.
    const { preloadReportPhotos } = require('../controllers/factoryAudit.controller');
    if (typeof preloadReportPhotos === 'function') {
      await preloadReportPhotos(reportDoc);
    } else {
      console.warn('preloadReportPhotos not exported; proceeding without additional preload');
    }

    const doc = new Document({
      sections: [{ headers: { default: new Header({ children: [createFAHeaderTable(reportDoc)] }) }, footers: { default: new Footer({ children: [] }) }, children: createFAContent(reportDoc) }]
    });

    const buffer = await Packer.toBuffer(doc);

    const out = path.join(__dirname, '..', 'temp', `fa_regenerated_${id}.docx`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buffer);
    console.log('Wrote', out, 'size', buffer.length);
    process.exit(0);
  }catch(e){
    console.error('Error:', e);
    process.exit(1);
  }
})();