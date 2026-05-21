const { Document, Packer, Header, Footer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require("docx");
const { createFAContent, createFAHeaderTable } = require("./backend/services/faDocx.service");

const demoData = {
  generalPhoto: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
  generalInfo: { client: "FRIN", supplier: "Test", factory: "Test Factory", auditDate: "2026-01-01", auditorName: "John" },
  auditOverview: { totalScore: 85, percentage: 85, grade: "B" },
  supplierProfile: { dateOfFoundation: "2005", legalStatus: "Foreign", area: "15000", numberOfStaff: 450 },
  communicationInfrastructure: { telephoneSets: "25", faxMachines: "5", computers: "120" },
  productsMarkets: [{ productType: "Adapters", customerName: "Sony", marketLocation: "Japan", monthlyQty: "50000" }],
  recommendations: [{ companyName: "TechCorp", country: "USA", contact: "Alice", products: "Chargers", details: "Since 2015" }],
  part1Score: 9,
  buildingOfficePhotos: [],
  relatedPictures: {},
  orgChartPhotos: [],
  part2Score: 8,
  productionWorkflowPhotos: [],
  productionProcess: [{ operationName: "SMT", machineName: "Yamaha", machineCount: 4, workersNumber: 8, outputPerHour: 1200, dailyCapacity: 28800 }],
  dailyOutputCheck: { runningProduction: "Yes", processLines: "4 SMT Lines" },
  dailyOutputPhotos: [],
  leadTimes: { rawMaterialCapacityFactory: "15 days" },
  bottlenecks: { bottleneckAuditorCheck: "Testing" },
  part3Score: 8,
  part4: {
    machineryConditions: [{ machineName: "CNC", count: 5, comments: "Good" }],
    warehouseCondition: {},
    warehousePhotos: {},
    sampleRoomCondition: {},
    publicPowerSupply: {},
    shipmentCapabilities: {},
    shipmentPhotos: {},
    part4Score: 9
  },
  part5: {
    qualitySystemManagement: { iso9001Status: "Yes" },
    inspectionTrackRecord: {},
    qcStaffCount: 20,
    onlineQC: {},
    finalQC: {},
    incomingQC: {},
    testEquipmentPhotos: {},
    part5Score: 9
  },
  part6: { rdSpecificStaffCount: 15, part6Score: 9 },
  part7: {
    envManagement: {},
    wastewaterReport: {},
    controlTrackRecord: {},
    preventiveActions: [],
    envPhotos: [],
    part7Score: 9
  },
  generalOverviewRemarks: ["Good factory"],
  clientSpecialRemarks: ["Priority order"],
  suggestions: ["Add AOI machines"],
  comments: []
};

async function test() {
  try {
    console.log("1. Testing createFAHeaderTable...");
    const headerTable = createFAHeaderTable(demoData);
    console.log("   OK - header table created");

    console.log("2. Testing createFAContent...");
    const children = createFAContent(demoData);
    console.log("   OK - children count:", children.length);

    console.log("3. Testing full Document assembly...");
    const doc = new Document({
      styles: { default: { document: { run: { font: "Calibri", size: 20, color: "000000" } } } },
      sections: [{
        properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
        headers: { default: new Header({ children: [headerTable] }) },
        footers: { default: new Footer({ children: [new Paragraph({ text: "Footer" })] }) },
        children: children
      }]
    });
    console.log("   OK - Document created");

    console.log("4. Testing Packer.toBuffer...");
    const buffer = await Packer.toBuffer(doc);
    console.log("   OK - Buffer size:", buffer.length, "bytes");
    console.log("\n✅ ALL TESTS PASSED - Report generates successfully!");
  } catch (e) {
    console.error("\n❌ ERROR:", e.message);
    console.error("STACK:", e.stack);
  }
}

test();
