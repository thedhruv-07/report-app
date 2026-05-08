const fs = require('fs');
const path = require('path');
const { Document, Packer, Header } = require('docx');
const { createFAContent, createFAHeaderTable } = require('../services/faDocx.service');

(async () => {
  try {
    const data = {
      generalInfo: { client: 'Test Client', auditDate: '2026-05-08', auditorName: 'Tester' },
      conclusion: { result: 'PASS', summary: 'All good' },
      generalPhoto: null,
      buildingOfficePhotos: [],
      relatedPictures: {},
      supplierProfile: {},
      productsMarkets: [],
      recommendations: [],
      generalOverviewRemarks: ['Sample remark 1', 'Sample remark 2'],
      clientSpecialRemarks: [],
      suggestions: [],
    };

    const doc = new Document({
      sections: [{
        headers: { default: new Header({ children: [createFAHeaderTable(data)] }) },
        children: createFAContent(data)
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const outPath = path.join(__dirname, '..', 'temp', 'test_fa_generated.docx');
    fs.writeFileSync(outPath, buffer);
    console.log('Wrote', outPath, 'size', buffer.length);

    // List zip entries
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(outPath);
    const entries = zip.getEntries().map(e => e.entryName);
    console.log('ZIP entries:', entries.slice(0, 40));
    const docXml = zip.readAsText('word/document.xml');
    console.log('document.xml length:', docXml.length);
  } catch (e) {
    console.error('Error generating test docx:', e);
    process.exit(1);
  }
})();
