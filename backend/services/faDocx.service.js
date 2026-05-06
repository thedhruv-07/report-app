const fs = require("fs");
const { 
  Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, VerticalMergeType,
  ImageRun
} = require("docx");
const { sanitizeDocxText, tableBorders, createQtyCell } = require("../utils/docx.utils");
const { LOGO_PATH } = require("../config/config");

/**
 * Factory Audit DOCX Service
 * Handles generation of the Factory Audit report document with table layouts.
 * Isolated from PSI/CLS logic.
 */

// Helper to get photo content safely
const getPhotoContent = (photoData) => {
  if (!photoData || !photoData.startsWith("data:image")) {
    return [new Paragraph({ text: "No photo uploaded", alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })];
  }
  try {
    const buffer = Buffer.from(photoData.split(",")[1], "base64");
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: buffer,
            type: "png",
            transformation: { width: 220, height: 160 },
          }),
        ],
        spacing: { before: 100, after: 100 },
      }),
    ];
  } catch (e) {
    return [new Paragraph({ text: "Error loading photo", alignment: AlignmentType.CENTER })];
  }
};

// Helper to create section headers matching PSI/CLS style
const createSectionHeader = (text) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "E9ECEF" },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    bold: true,
                    size: 22,
                    color: "1F4E79",
                  }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 80, after: 80 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
};

// Helper to create a 2nd/3rd column data table with optional photo (rowSpan)
const createDataTable = (dataArray, photoData = null) => {
  const rows = dataArray.map(([label, value], index) => {
    const cells = [
      createQtyCell(label, { 
        bold: true, 
        align: "left", 
        shaded: true, 
        width: { size: 25, type: WidthType.PERCENTAGE },
        spacing: { before: 60, after: 60 }
      }),
      createQtyCell(value || "-", { 
        align: "left", 
        width: { size: photoData ? 35 : 75, type: WidthType.PERCENTAGE },
        spacing: { before: 60, after: 60 }
      }),
    ];

    if (photoData && index === 0) {
      cells.push(
        new TableCell({
          rowSpan: dataArray.length,
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          verticalAlign: "center",
          children: getPhotoContent(photoData),
        })
      );
    }

    return new TableRow({ children: cells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows,
  });
};

// Header table matching PSI/CLS
exports.createFAHeaderTable = (data) => {
  const header = data.generalInfo || {};
  const conclusion = data.conclusion?.result || "PENDING";
  
  let logoRun = null;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const imgBuffer = fs.readFileSync(LOGO_PATH);
      logoRun = new ImageRun({ 
        data: imgBuffer, 
        type: "png", 
        transformation: { width: 140, height: 70 } 
      });
    }
  } catch (e) { }

  const createHeaderLabelCell = (text, opts = {}) => {
    return new TableCell({
      borders: tableBorders(),
      shading: { fill: "F2F2F2" },
      children: [new Paragraph({ 
        children: [new TextRun({ text, bold: true, size: 18, ...opts })], 
        alignment: opts.align || AlignmentType.LEFT 
      })],
    });
  };

  const createHeaderValueCell = (text) => {
    return new TableCell({
      borders: tableBorders(),
      children: [new Paragraph({ 
        children: [new TextRun({ text: sanitizeDocxText(text), bold: true, size: 18 })] 
      })],
    });
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ 
            width: { size: 30, type: "pct" }, 
            verticalMerge: VerticalMergeType.RESTART, 
            borders: tableBorders(),
            children: [logoRun ? new Paragraph({ children: [logoRun], alignment: AlignmentType.CENTER }) : new Paragraph({ text: "" })], 
            verticalAlign: "center" 
          }),
          createHeaderLabelCell("Client Name:"),
          createHeaderValueCell(header.client || "-"),
          createHeaderLabelCell("Conclusion", { align: AlignmentType.CENTER, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ text: "" })] }),
          createHeaderLabelCell("Audit Date:"),
          createHeaderValueCell(header.auditDate || "-"),
          new TableCell({
            verticalMerge: VerticalMergeType.RESTART,
            borders: tableBorders(),
            children: [new Paragraph({ 
              children: [new TextRun({ 
                text: conclusion.toUpperCase(), 
                bold: true, 
                size: 40, 
                color: conclusion.toUpperCase().includes("PASS") ? "008000" : "FF0000" 
              })], 
              alignment: AlignmentType.CENTER 
            })],
            verticalAlign: "center",
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ text: "" })] }),
          createHeaderLabelCell("Auditor:"),
          createHeaderValueCell(header.auditorName || "-"),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ text: "" })] }),
        ],
      }),
    ],
  });
};

exports.createFAContent = (data) => {
  const children = [];

  // Service Title
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "FACTORY AUDIT REPORT", bold: true, size: 28, color: "1F4E79" })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 120, after: 120 },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

  // 1. General Info
  children.push(createSectionHeader("I. GENERAL INFORMATION"));
  children.push(createDataTable([
    ["Client", data.generalInfo?.client],
    ["Supplier", data.generalInfo?.supplier],
    ["Factory", data.generalInfo?.factory],
    ["Factory Address", data.generalInfo?.factoryAddress],
    ["Contact Person", data.generalInfo?.contactPerson],
    ["Email", data.generalInfo?.email],
    ["Phone", data.generalInfo?.phone],
    ["Audit Date", data.generalInfo?.auditDate],
    ["Auditor", data.generalInfo?.auditorName],
  ], data.generalPhoto));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 2. Audit Overview
  children.push(createSectionHeader("II. AUDIT OVERVIEW"));
  children.push(createDataTable([
    ["Total Score", data.auditOverview?.totalScore?.toString()],
    ["Percentage (%)", data.auditOverview?.percentage ? `${data.auditOverview.percentage}%` : "0%"],
    ["Grade", data.auditOverview?.grade],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 3. Supplier Profile
  children.push(createSectionHeader("III. SUPPLIER PROFILE"));
  children.push(createDataTable([
    ["Legal Status", data.supplierProfile?.legalStatus],
    ["Year Established", data.supplierProfile?.yearEstablished],
    ["Business Scope", data.supplierProfile?.businessScope],
    ["Major Products", data.supplierProfile?.majorProducts],
    ["Main Markets", data.supplierProfile?.mainMarkets],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 4. Production Capacity
  children.push(createSectionHeader("IV. PRODUCTION CAPACITY"));
  children.push(createDataTable([
    ["Total Employees", data.productionCapacity?.totalEmployees?.toString()],
    ["Production Staff", data.productionCapacity?.productionStaff?.toString()],
    ["QC Staff", data.productionCapacity?.qcStaff?.toString()],
    ["Monthly Capacity", data.productionCapacity?.monthlyCapacity],
    ["Lead Time", data.productionCapacity?.leadTime],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 5. Machinery
  children.push(createSectionHeader("V. MACHINERY LIST"));
  const machineryRows = [
    new TableRow({
      children: [
        createQtyCell("Machine Name", { bold: true, shaded: true }),
        createQtyCell("Quantity", { bold: true, shaded: true }),
        createQtyCell("Condition", { bold: true, shaded: true }),
      ],
    }),
  ];

  if (data.machinery && data.machinery.length > 0) {
    data.machinery.forEach((m) => {
      machineryRows.push(
        new TableRow({
          children: [
            createQtyCell(m.name || ""),
            createQtyCell(m.quantity?.toString() || "0"),
            createQtyCell(m.condition || ""),
          ],
        })
      );
    });
  } else {
    machineryRows.push(
      new TableRow({
        children: [createQtyCell("No machinery listed", { colSpan: 3 })],
      })
    );
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: machineryRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 6. Warehouse
  children.push(createSectionHeader("VI. WAREHOUSE & STORAGE"));
  children.push(createDataTable([
    ["Raw Materials", data.warehouse?.rawMaterials],
    ["Finished Goods", data.warehouse?.finishedGoods],
    ["Storage Conditions", data.warehouse?.storageConditions],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 7. Quality Control
  children.push(createSectionHeader("VII. QUALITY CONTROL"));
  children.push(createDataTable([
    ["QC Management", data.qualityControl?.qcManagement],
    ["Inspection Procedures", data.qualityControl?.inspectionProcedures],
    ["Equipment Calibration", data.qualityControl?.equipmentCalibration],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 8. R&D
  children.push(createSectionHeader("VIII. RESEARCH & DEVELOPMENT"));
  children.push(createDataTable([
    ["R&D Staff", data.researchDevelopment?.rdStaff?.toString()],
    ["R&D Capabilities", data.researchDevelopment?.rdCapabilities],
    ["Patents", data.researchDevelopment?.patents],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 9. Environment
  children.push(createSectionHeader("IX. ENVIRONMENT & SAFETY"));
  children.push(createDataTable([
    ["Social Responsibility", data.environment?.socialResponsibility],
    ["Environmental Protection", data.environment?.environmentalProtection],
    ["Safety Conditions", data.environment?.safetyConditions],
  ]));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 10. Conclusion
  children.push(createSectionHeader("X. FINAL CONCLUSION"));
  const result = data.conclusion?.result || "PENDING";
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "AUDIT RESULT: ", bold: true, size: 24 }),
                    new TextRun({
                      text: result.toUpperCase(),
                      bold: true,
                      size: 24,
                      color: result.toUpperCase().includes("PASS") ? "228B22" : "CC0000",
                    }),
                  ],
                  spacing: { before: 100, after: 100 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: data.conclusion?.summary || "N/A" })],
                  spacing: { before: 100, after: 100 },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return children;
};
