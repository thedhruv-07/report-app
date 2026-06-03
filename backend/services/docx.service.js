const fs = require("fs");
const path = require("path");
const wasabiService = require("./wasabiService");
const {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  ImageRun,
  PageBreak,
  VerticalMergeType,
  WidthType,
  AlignmentType,
  VerticalAlign,
  HeadingLevel,
  UnderlineType,
  CheckBox,
  Document,
  Packer,
  SymbolRun,
  ShadingType,
  Header,
  Footer
} = require("docx");

const {
  sanitizeDocxText,
  tableBorders,
  createQtyCell
} = require("../utils/docx.utils");

// Helper: return empty string when value is missing — ensure DOCX only contains frontend data
function asVal(v) { return (v === undefined || v === null) ? "" : v; }
const san = (v) => sanitizeDocxText(asVal(v));

const { LOGO_PATH, PACKAGE_ICON_PATH } = require("../config/config");

async function createConclusionTable(data, isCls = false) {
  const legend = [
    { label: "PASSED ", desc: ": Conform to Client's Requirement" },
    { label: "PASSED (Conditional): ", desc: "The Passed results will be valid only after the client notes and accepts the issues in the remarks" },
    { label: "PENDING ", desc: ": Subject to Client's Evaluation" },
    { label: "FAILED ", desc: ": Not Conform to Client's Requirement" }
  ];

  const conclusionResult = asVal(data.reportHeader?.conclusion).toUpperCase();
  const isPass = conclusionResult.includes("PASS");

  let inspectorBuffer = null;
  if (data.conclusionPhotos?.[0]) {
    try { inspectorBuffer = await getImageBuffer(data.conclusionPhotos[0]); } catch (e) { console.warn("Missing inspector signature"); }
  }

  let reviewerBuffer = null;
  if (data.conclusionReviewerPhotos?.[0]) {
    try { reviewerBuffer = await getImageBuffer(data.conclusionReviewerPhotos[0]); } catch (e) { console.warn("Missing reviewer signature"); }
  }

  if (isCls) {
    // CLS Conclusion: Header, Large Result Box, Legend Box
    return new Table({
      width: { size: 100, type: "pct" },
      rows: [
        new TableRow({ children: [new TableCell({ columnSpan: 1, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "IV. CONCLUSION", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })] })] }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: conclusionResult,
                      bold: true,
                      size: 84,
                      font: "Arial",
                      color: isPass ? "228B22" : "CC0000"
                    })
                  ],
                  alignment: "left",
                  spacing: { before: 300, after: 300 }
                })
              ]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: legend.map(l => new Paragraph({
                children: [
                  new TextRun({ text: l.label, bold: true, size: 18 }),
                  new TextRun({ text: l.desc, size: 18 })
                ],
                spacing: { before: 40, after: 40 }
              }))
            })
          ]
        })
      ]
    });
  }

  // PSI Conclusion: Full Table with Signatures/Photos
  const conclRows = [
    new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "IV. CONCLUSION", bold: true, size: 22, color: "1F4E79" })] })] })] }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 60, type: "pct" },
          borders: tableBorders(),
          children: [
            new Paragraph({ children: [new TextRun({ text: conclusionResult, bold: true, size: 84, font: "Arial", color: isPass ? "228B22" : "CC0000" })], alignment: "left", spacing: { before: 300, after: 300 } }),
            ...legend.map(l => new Paragraph({
              children: [
                new TextRun({ text: l.label, bold: true, size: 18 }),
                new TextRun({ text: l.desc, size: 18 })
              ]
            }))
          ]
        }),
        new TableCell({
          width: { size: 40, type: "pct" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Approved by : ", bold: true, size: 18 }),
                new TextRun({ text: san(data.approvedBy), bold: true, size: 18, underline: { type: UnderlineType.SINGLE } })
              ]
            }),
          ]
        })
      ]
    }),
    new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Inspector & Report Reviewer:", bold: true })] })] })] }),

    // Photo Row
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: inspectorBuffer ? [
            new Paragraph({
              alignment: "center",
              children: [new ImageRun({
                data: inspectorBuffer,
                type: "png",
                transformation: { width: 220, height: 160 }
              })],
              spacing: { before: 100, after: 100 }
            })
          ] : [new Paragraph({ alignment: "center", children: [new TextRun({ text: "No photo uploaded", size: 14, color: "888888" })], spacing: { before: 400, after: 400 } })]
        }),
        new TableCell({
          borders: tableBorders(),
          children: reviewerBuffer ? [
            new Paragraph({
              alignment: "center",
              children: [new ImageRun({
                data: reviewerBuffer,
                type: "png",
                transformation: { width: 220, height: 160 }
              })],
              spacing: { before: 100, after: 100 }
            })
          ] : [new Paragraph({ alignment: "center", children: [new TextRun({ text: "No photo uploaded", size: 14, color: "888888" })], spacing: { before: 400, after: 400 } })]
        }),
      ]
    }),

    // Label Row
    new TableRow({
      children: [
        new TableCell({ borders: tableBorders(), shading: { fill: "F9F9F9" }, children: [new Paragraph({ alignment: "center", children: [new TextRun({ text: "Inspector(s): " + san(data.inspector).replace("Inspector: ", ""), size: 18 })] })] }),
        new TableCell({ borders: tableBorders(), shading: { fill: "F9F9F9" }, children: [new Paragraph({ alignment: "center", children: [new TextRun({ text: "Report Reviewer: " + san(data.reportReviewer).replace("Report Reviewer: ", ""), size: 18 })] })] }),
      ]
    })
  ];

  return new Table({ width: { size: 100, type: "pct" }, rows: conclRows });
}

async function createRemarksTable(data) {
  const isCls = data.serviceType === "cls";

  // Find remark photos from groups
  const remarkPhotosGroup = (data.reportPhotoGroups || []).find(g => g.id === "remarkPhotos" || g.description?.toLowerCase().includes("remark"));
  const remarkPhotos = remarkPhotosGroup ? (remarkPhotosGroup.photos || []) : [];

  // Remove remark photos from general queue so they don't print twice
  if (data.reportPhotoGroups && remarkPhotosGroup) {
    data.reportPhotoGroups = data.reportPhotoGroups.filter(g => g !== remarkPhotosGroup);
  }

  if (isCls) {
    const problemRemarks = Array.isArray(data.problemRemarks) ? data.problemRemarks : ["-"];
    const generalRemarks = Array.isArray(data.generalRemarks) ? data.generalRemarks : ["-"];
    const sampleCollection = asVal(data.sampleCollection);

    const rows = [
      // Main Header
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "III. REMARKS", bold: true, size: 22, color: "1F4E79" })] })] })] }),

      // Problem Remarks Category
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "D9D9D9" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Problem Remarks:", bold: true, size: 18 })] })] })] }),
      ...problemRemarks.map((text, i) => new TableRow({
        children: [
          new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(i + 1) + ".", size: 18 })], alignment: "center" })] }),
          new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(text), size: 18 })] })] })
        ]
      })),

      // General Remarks Category
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "D9D9D9" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "General Remarks:", bold: true, size: 18 })] })] })] }),
      ...generalRemarks.map((text, i) => new TableRow({
        children: [
          new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(i + 1 + problemRemarks.length) + ".", size: 18 })], alignment: "center" })] }),
          new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(text), size: 18 })] })] })
        ]
      })),

      // Sample Collection Category
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "D9D9D9" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Sample Collection Record:", bold: true, size: 18 })] })] })] }),
      new TableRow({
        children: [
          new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(1 + problemRemarks.length + generalRemarks.length) + ".", size: 18 })], alignment: "center" })] }),
          new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(sampleCollection), size: 18 })] })] })
        ]
      }),

      // Photos Header
      new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "D9D9D9" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Photos:", bold: true, size: 18 })] })] })] }),
    ];

    if (remarkPhotos.length > 0) {
      const photoRows = await createInlinePhotoGridRows(remarkPhotos.map(p => ({ ...p, description: p.label || "" })), { cellWidth: 320, cellHeight: 220, colSpan: 1 });
      rows.push(...photoRows);
    }

    const table = new Table({ width: { size: 100, type: "pct" }, rows });
    return [table];
  }

  // Legacy PSI Remarks Table
  const psiRemarksRows = [
    new TableRow({ children: [new TableCell({ columnSpan: 4, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "III. REMARKS", bold: true, size: 22, color: "1F4E79" })] })] })] }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 5, type: "pct" }, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [] })] }),
        new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Problem Remarks:", bold: true })] })] })
      ]
    }),
    ...(Array.isArray(data.remarks) ? data.remarks : ["-"]).map((remarkText, i) => new TableRow({
      children: [
        createQtyCell(String(i + 1), { width: { size: 5, type: "pct" } }),
        createQtyCell(remarkText, { align: "left", colSpan: 3 })
      ]
    })),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [] })] }),
        new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "General Remarks:", bold: true })] })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [] })] }),
        new TableCell({ shading: { fill: "FFFFFF" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "We had checked mold potential about warehouse:", bold: true })] })] }),
        new TableCell({ shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Yes", bold: true })], alignment: "center" })] }),
        new TableCell({ shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })], alignment: "center" })] })
      ]
    }),
    ...[
      { q: "Is there any leakage on the roofs and walls (including windows & doors)?", key: "remarkQ1" },
      { q: "Is there any special-assigned person or department to be responsible for mold control?", key: "remarkQ2" },
      { q: "Is there any record for mold control?", key: "remarkQ3" },
      { q: "Do all cartons put on plastic pallets with min. 12cm height away from the floor, and at least 1.5 meters away from windows?", key: "remarkQ4" },
      { q: "Is there anyone such as factory QC's or supervisors to verify the procedure daily?", key: "remarkQ5" },
      { q: "Are the export cartons kept dry?", key: "remarkQ6" },
      { q: "Are there any damaged or wet cartons used?", key: "remarkQ7" },
    ].map((item, i) => new TableRow({
      children: [
        createQtyCell(String(i + 1)),
        createQtyCell(item.q, { align: "left" }),
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({
            children: [
              new CheckBox({ checked: String(data[item.key] || "").toLowerCase() === "yes" }),
              new TextRun({ text: " Yes", size: 14 })
            ],
            alignment: "left"
          })]
        }),
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({
            children: [
              new CheckBox({ checked: String(data[item.key] || "").toLowerCase() === "no" }),
              new TextRun({ text: " No", size: 14 })
            ],
            alignment: "left"
          })]
        })
      ]
    })),
    new TableRow({
      children: [
        createQtyCell("6.", { bold: true }),
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [
            new Paragraph({ children: [new TextRun({ text: "Based on our finding of material/accessories/semi-finished/finished products and the observation of product line, we recommend the manufacturer to make improvement or pay attention on follow up mass production:", size: 16 })], spacing: { before: 40 } }),
            new Paragraph({ children: [new TextRun({ text: blankIfEmpty(asVal(data.recommendationText)), color: "333333" })], spacing: { after: 40 } })
          ]
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [] })] }),
        new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Factory Information:", bold: true })] })] })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("7.", { bold: true }),
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [
            new Paragraph({ children: [new TextRun({ text: "Factory cooperation:", bold: true })] }),
            new Paragraph({ children: [new CheckBox({ checked: data.factoryCooperation === "good" }), new TextRun({ text: " Good - Enough manpower to assist, and good cooperation." })] }),
            new Paragraph({ children: [new CheckBox({ checked: data.factoryCooperation === "average" }), new TextRun({ text: " AVERAGE - Enough manpower to assist." })] }),
            new Paragraph({ children: [new CheckBox({ checked: data.factoryCooperation === "poor" }), new TextRun({ text: " Poor - Manpower, equipment or document not provided timely." })] })
          ]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("8.", { bold: true }),
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [
            new Paragraph({ children: [new TextRun({ text: "Number of workers in factory:", bold: true })] }),
            new Paragraph({
              children: [
                new CheckBox({ checked: data.workerCount === "lt50" }), new TextRun({ text: " Less than 50 people,  " }),
                new CheckBox({ checked: data.workerCount === "50to100" }), new TextRun({ text: " 50-100 people,  " }),
                new CheckBox({ checked: data.workerCount === "100to500" }), new TextRun({ text: " 100-500 people,  " }),
                new CheckBox({ checked: data.workerCount === "500to1000" }), new TextRun({ text: " 50-1000 people,  " }),
                new CheckBox({ checked: data.workerCount === "gt1000" }), new TextRun({ text: " More than 1000 people." })
              ]
            })
          ]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("9.", { bold: true }),
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [
            new Paragraph({ children: [new TextRun({ text: "Inspector's opinion on the factory:", bold: true })] }),
            new Paragraph({ children: [new CheckBox({ checked: data.inspectorOpinion === "good" }), new TextRun({ text: " Good - The factory was neat and tidy. The testing equipment was well maintained and calibrated." })] }),
            new Paragraph({ children: [new CheckBox({ checked: data.inspectorOpinion === "average" }), new TextRun({ text: " AVERAGE - The factory was tidy, and the testing equipment ran normally." })] }),
            new Paragraph({ children: [new CheckBox({ checked: data.inspectorOpinion === "poor" }), new TextRun({ text: " Poor - The factory was messed, the basic testing equipment was not available / not workable." })] })
          ]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("10.", { bold: true }),
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [
            new Paragraph({ children: [new TextRun({ text: "Sample Collection Record:", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(data.sampleCollectionRecord || "-") })] }),
          ]
        })
      ]
    }),
    ...(remarkPhotos.length > 0 ? [
      new TableRow({
        children: [
          createQtyCell("11.", { bold: true }),
          new TableCell({
            columnSpan: 3,
            shading: { fill: "F2F2F2" },
            borders: tableBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: "Photos:", bold: true })] })]
          })
        ]
      })
    ] : [])
  ];

  if (remarkPhotos.length > 0) {
    const photoRows = await createInlinePhotoGridRows(remarkPhotos.map(p => ({ ...p, description: p.label || "" })), { cellWidth: 320, cellHeight: 220, colSpan: 2 });
    psiRemarksRows.push(...photoRows);
  }

  const psiRemarksTable = new Table({
    width: { size: 100, type: "pct" },
    rows: psiRemarksRows
  });

  return [psiRemarksTable];
}

function createHeaderTable(data) {
  const header = data.reportHeader || {};
  let logoRun = null;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const imgBuffer = fs.readFileSync(LOGO_PATH);
      logoRun = new ImageRun({ data: imgBuffer, type: "png", transformation: { width: 140, height: 70 } });
    }
  } catch (e) { }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: "pct" }, verticalMerge: VerticalMergeType.RESTART, borders: { top: { style: BorderStyle.SINGLE, size: 12 }, bottom: { style: BorderStyle.SINGLE, size: 12 }, left: { style: BorderStyle.SINGLE, size: 12 }, right: { style: BorderStyle.SINGLE, size: 12 } }, children: [logoRun ? new Paragraph({ children: [logoRun], alignment: "center" }) : new Paragraph({ children: [new TextRun("")] })], verticalAlign: "center" }),
          createHeaderLabelCell("Client Name (abbr.):"),
          createHeaderValueCell(asVal(header.client)),
          createHeaderLabelCell("Conclusion", { align: "center", bold: true }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          createHeaderLabelCell("Inspection Number:"),
          createHeaderValueCell(header.inspectionNumber || "-"),
          new TableCell({
            verticalMerge: VerticalMergeType.RESTART,
            borders: { top: { style: BorderStyle.SINGLE, size: 12 }, bottom: { style: BorderStyle.SINGLE, size: 12 }, left: { style: BorderStyle.SINGLE, size: 12 }, right: { style: BorderStyle.SINGLE, size: 12 } },
            children: [new Paragraph({ children: [new TextRun({ text: san(header.conclusion), bold: true, size: 40, color: asVal(header.conclusion).toUpperCase().includes("PASS") ? "008000" : "FF0000" })], alignment: "center" })],
            verticalAlign: "center",
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          createHeaderLabelCell("Report Date:"),
          createHeaderValueCell(header.reportDate || "-"),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
        ],
      }),
    ],
  });
}

function createHeaderLabelCell(text, opts = {}) {
  return new TableCell({
    borders: { top: { style: BorderStyle.SINGLE, size: 6 }, bottom: { style: BorderStyle.SINGLE, size: 6 }, left: { style: BorderStyle.SINGLE, size: 6 }, right: { style: BorderStyle.SINGLE, size: 6 } },
    shading: { fill: "F2F2F2" },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, ...opts })], alignment: opts.align || "left" })],
  });
}

function createHeaderValueCell(text) {
  return new TableCell({
    borders: { top: { style: BorderStyle.SINGLE, size: 6 }, bottom: { style: BorderStyle.SINGLE, size: 6 }, left: { style: BorderStyle.SINGLE, size: 6 }, right: { style: BorderStyle.SINGLE, size: 6 } },
    children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(text), bold: true, size: 18 })] })],
  });
}

async function createReportContent(data, uploadedFiles) {
  const children = [];

  // (helpers `asVal` and `san` are defined at module level)

  // I. GENERAL INFORMATION & Pre-Title (Unified Table)
  const generalData = [
    ["Service Performed:", data.servicePerformed],
    ["Client:", data.client],
    ["Supplier:", data.supplier],
    ["Factory:", data.factory],
    ["Product Name:", data.productName],
    ["P.O. No.:", data.po],
    ["Item No.:", data.itemNo],
    ["Destination Country:", data.country],
    ["Inspection Date:", data.inspectionDate],
    ["Inspection Location:", data.inspectionLocation],
    ["Reference Sample:", data.referenceSample],
  ];

  const isClsReport = data.serviceType?.toLowerCase() === 'cls';
  const isDpiReport = data.serviceType?.toLowerCase() === 'dpi';

  const serviceTitle = data.servicePerformed || (
    isClsReport ? "Container Loading Supervision (CLS)" :
      isDpiReport ? "During Production Inspection Report" :
        "Pre-Shipment Inspection Report"
  );

  const infoRows = [
    // Service Title Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { fill: "FFFFFF" },
          borders: tableBorders(),
          children: [new Paragraph({
            children: [new TextRun({ text: serviceTitle, bold: true, size: 28, color: "1F4E79", font: "Arial" })],
            alignment: "center",
            spacing: { before: 120, after: 120 }
          })]
        })
      ]
    }),
    // Section Header Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({
            children: [new TextRun({ text: "I. GENERAL INFORMATION", bold: true, size: 22, color: "1F4E79", font: "Arial" })],
            alignment: "left",
            spacing: { before: 80, after: 80 }
          })]
        })
      ]
    }),
    // First Data Row with Photo (verticalMerge)
    new TableRow({
      children: [
        createQtyCell(generalData[0][0], { bold: true, align: "left", shaded: true, width: { size: 25, type: "pct" }, spacing: { before: 60, after: 60 } }),
        createQtyCell(blankIfEmpty(generalData[0][1]), { align: "left", width: { size: 35, type: "pct" }, spacing: { before: 60, after: 60 } }),
        new TableCell({
          verticalMerge: VerticalMergeType.RESTART,
          width: { size: 40, type: "pct" },
          borders: tableBorders(),
          verticalAlign: "center",
          children: getPhotoContent(data.generalPhoto, uploadedFiles, data)
        })
      ]
    }),
    // Remaining Data Rows
    ...generalData.slice(1).map(([label, val]) =>
      new TableRow({
        children: [
          createQtyCell(label, { bold: true, align: "left", shaded: true, width: { size: 25, type: "pct" }, spacing: { before: 60, after: 60 } }),
          createQtyCell(blankIfEmpty(val), { align: "left", width: { size: 35, type: "pct" }, spacing: { before: 60, after: 60 } }),
          new TableCell({
            verticalMerge: VerticalMergeType.CONTINUE,
            borders: tableBorders(),
            children: []
          })
        ]
      })
    )
  ];
  children.push(new Table({ width: { size: 100, type: "pct" }, rows: infoRows }));
  children.push(new Paragraph({ children: [], spacing: { before: 100, after: 100 } }));

  // II. INSPECTION SUMMARY
  const isCls = data.serviceType?.toLowerCase() === "cls";
  const isDpi = data.serviceType?.toLowerCase() === "dpi";

  // ─── DPI FIELD ALIAS BLOCK ───────────────────────────────────────────────────
  // DPI frontend sends array-based keys (dpiSchema.js); map them to the flat
  // keys the DOCX rendering code expects.
  if (isDpi) {
    // Array aliases
    if (!data.workmanshipDefects && data.workmanshipDefectTable) {
      data.workmanshipDefects = data.workmanshipDefectTable;
    }
    if (!data.clientRequirements && data.clientRequirementTable) {
      data.clientRequirements = data.clientRequirementTable;
    }

    // Workmanship AQL field aliases (wmXxx → XxxWM / accepted / found)
    data.inspectionStandardWM = data.inspectionStandardWM || data.wmInspectionStandard;
    data.samplingPlanWM = data.samplingPlanWM || data.wmSamplingPlan;
    data.inspectionLevelWM = data.inspectionLevelWM || data.wmInspectionLevel;
    data.orderQuantityWM = data.orderQuantityWM || data.wmOrderQuantity;
    data.availableQuantityWM = data.availableQuantityWM || data.wmAvailableQuantity;
    data.sampleSizeWM = data.sampleSizeWM || data.wmSampleSize;
    data.aqlCriticalWM = data.aqlCriticalWM || data.wmAqlCritical;
    data.aqlMajorWM = data.aqlMajorWM || data.wmAqlMajor;
    data.aqlMinorWM = data.aqlMinorWM || data.wmAqlMinor;
    data.acceptedCritical = data.acceptedCritical || data.wmAcceptedCritical;
    data.acceptedMajor = data.acceptedMajor || data.wmAcceptedMajor;
    data.acceptedMinor = data.acceptedMinor || data.wmAcceptedMinor;
    data.totalFoundCritical = data.totalFoundCritical || data.wmFoundCritical;
    data.totalFoundMajor = data.totalFoundMajor || data.wmFoundMajor;
    data.totalFoundMinor = data.totalFoundMinor || data.wmFoundMinor;
    data.workmanshipResult = data.workmanshipResult || data.wmResult;

    // On-site tests: expand array → flat keys (testDescN, testMethodN, ...)
    if (Array.isArray(data.onSiteTestsTable)) {
      data.onSiteTestsTable.forEach((row, i) => {
        const n = i + 1;
        if (!data[`testDesc${n}`]) data[`testDesc${n}`] = row.description;
        if (!data[`testMethod${n}`]) data[`testMethod${n}`] = row.method;
        if (!data[`testSample${n}`]) data[`testSample${n}`] = row.sampleSize;
        if (!data[`testResult${n}`]) data[`testResult${n}`] = row.resultReading;
      });
    }
    if (!data.onSiteTestResult) data.onSiteTestResult = data.onSiteTestsTable?.[0]?.result;
    if (!data.onSiteTestRemark) data.onSiteTestRemark = data.onSiteTestsRemark || "";

    // Packing: expand array → flat keys
    if (Array.isArray(data.packingTable)) {
      data.packingTable.forEach((row, i) => {
        const n = i + 1;
        data[`packing_item_${n}`] = data[`packing_item_${n}`] || row.itemNo;
        data[`packing_qty_carton_marking_${n}`] = data[`packing_qty_carton_marking_${n}`] || row.qtyPerCartonMarking;
        data[`packing_qty_carton_actual_${n}`] = data[`packing_qty_carton_actual_${n}`] || row.qtyPerCartonActual;
        data[`packing_carton_size_marking_${n}`] = data[`packing_carton_size_marking_${n}`] || row.cartonSizeMarking;
        data[`packing_carton_size_actual_${n}`] = data[`packing_carton_size_actual_${n}`] || row.cartonSizeActual;
        data[`packing_weight_marking_${n}`] = data[`packing_weight_marking_${n}`] || row.grossWeightMarking;
        data[`packing_weight_actual_${n}`] = data[`packing_weight_actual_${n}`] || row.grossWeightActual;
        data[`packing_qty_inner_marking_${n}`] = data[`packing_qty_inner_marking_${n}`] || row.qtyInnerBoxMarking;
        data[`packing_qty_inner_actual_${n}`] = data[`packing_qty_inner_actual_${n}`] || row.qtyInnerBoxActual;
      });
    }
    data.fastening_metal_staples = data.fastening_metal_staples || data.packFasteningMetalStaples;
    data.nylon_band = data.nylon_band || data.packNylonBand;
    data.material = data.material || data.packMaterial;
    data.corrugated_paper_plies = data.corrugated_paper_plies || data.packCorrugatedPaperPlies;
    data.packing_method = data.packing_method || data.packPackingMethod;
    data.assortment_method = data.assortment_method || data.packAssortment;
    data.packing_result = data.packing_result || data.packingResult;
    data.packing_remark = data.packing_remark || data.packingRemark;

    // Marking: take first row of markingTable for the barcode/label row
    if (Array.isArray(data.markingTable) && data.markingTable.length > 0 && !data.barcode_name) {
      const m = data.markingTable[0];
      data.barcode_name = m.name;
      data.barcode_location = m.location;
      data.barcode_result = m.result;
    }
    data.marking_result_final = data.marking_result_final || data.markingResult;
    data.marking_remark = data.marking_remark || data.markingRemark;
    data.shipping_marks = data.shipping_marks || data.markingShippingMarks;
    data.side_marks = data.side_marks || data.markingSideMarks;
    data.inner_box_marks = data.inner_box_marks || data.markingInnerBoxMarks;

    // Client requirement result/remark
    data.client_requirement_result = data.client_requirement_result || data.clientRequirementResult;
    data.client_requirement_remark = data.client_requirement_remark || data.clientRequirementRemark;

    // Dimensions / Product Specification: support DPI form key `productSpecificationTable` (preferred)
    data._dpiDimensionsRows = Array.isArray(data.productSpecificationTable)
      ? data.productSpecificationTable
      : (Array.isArray(data.dimensionsTable) ? data.dimensionsTable : []);
    data._dpiDimensionsItemNo = data.dimensionsItemNo || data.productItemNo || data.itemNo || "";
    data._dpiDimensionsGroupName = data.dimensionsGroupName || data.productGroupName || "";
    data.productResult = data.productResult || data.dimensionsResult || data.productSpecificationResult;
    data.productRemark = data.productRemark || data.dimensionsRemark || data.productSpecificationRemark;
  }
  // ─────────────────────────────────────────────────────────────────────────────

  let summaryRows = [];

  if (isCls) {
    const summaryResults = [
      { label: "A. Quantity", val: data.quantity },
      { label: "B. Product Conformity", val: data.productConformity },
      { label: "C. Packing", val: data.packing },
      { label: "D. Loading Process", val: data.loadingProcess },
      { label: "E. Client Requirement", val: data.clientRequirement },
    ];

    summaryRows = [
      new TableRow({ children: [new TableCell({ columnSpan: 5, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "II. INSPECTION SUMMARY", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })] })] }),
      new TableRow({
        children: [
          createQtyCell("", { shading: { fill: "E9ECEF" }, width: { size: 30, type: "pct" } }),
          createQtyCell("Passed", { bold: true, color: "228B22", shaded: true }),
          createQtyCell("Failed", { bold: true, color: "CC0000", shaded: true }),
          createQtyCell("Pending", { bold: true, color: "F39C12", shaded: true }),
          createQtyCell("N/A", { bold: true, shaded: true })
        ]
      }),
      ...summaryResults.map(r => {
        const n = String(r.val || "").toLowerCase();
        return new TableRow({
          children: [
            createQtyCell(r.label, { align: "left" }),
            createQtyCell(n.includes("pass") ? "\u2713" : "", { color: "228B22", bold: true }),
            createQtyCell(n.includes("fail") ? "\u2713" : "", { color: "CC0000", bold: true }),
            createQtyCell(n.includes("pending") ? "\u2713" : "", { color: "F39C12", bold: true }),
            createQtyCell(!n.includes("pass") && !n.includes("fail") && !n.includes("pending") ? "\u2713" : "", { bold: true }),
          ]
        });
      })
    ];
  } else if (isDpi) {
    const summaryResults = [
      { label: "A. Quantity", val: data.summaryQuantity || data.quantity || data.quantityResult },
      { label: "B. Workmanship", val: data.summaryWorkmanship || data.workmanship || data.workmanshipResult },
      { label: "C. ON-SITE TESTS", val: data.summaryOnSiteTests || data.onSiteTests || data.onSiteTestResult },
      { label: "D. Dimensions", val: data.summaryDimensions || data.dimensions || data.dimensionsResult },
      { label: "E. Packing", val: data.summaryPacking || data.packingResult || data.packing },
      { label: "F. Marking & Labeling", val: data.summaryMarkingLabeling || data.marking_result_final || data.markingResult || data.marking },
      { label: "G. Product Conformity", val: data.summaryProductConformity || data.productConformity || data.productConformityResult },
      { label: "H. Client Special Requirement", val: data.summaryClientRequirement || data.client_requirement_result || data.clientRequirement || data.client_requirement },
    ];

    const scheduleText = data.summaryProductionSchedule || data.productionScheduleText || "9000sets have been packed (300 cartons)";

    summaryRows = [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            shading: { fill: "F2F2F2" },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "II. INSPECTION SUMMARY", bold: true, size: 22, color: "1F4E79", font: "Arial" })],
                spacing: { before: 80, after: 80 }
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("", { shading: { fill: "F2F2F2" }, width: { size: 40, type: "pct" } }),
          new TableCell({
            borders: tableBorders(),
            shading: { fill: "F2F2F2" },
            width: { size: 15, type: "pct" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Passed", bold: true, color: "228B22", size: 18, font: "Arial" }),
                  new TextRun({ text: " *", bold: true, color: "FF0000", size: 18, font: "Arial" })
                ]
              })
            ]
          }),
          new TableCell({
            borders: tableBorders(),
            shading: { fill: "F2F2F2" },
            width: { size: 15, type: "pct" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Failed", bold: true, color: "CC0000", size: 18, font: "Arial" })]
              })
            ]
          }),
          new TableCell({
            borders: tableBorders(),
            shading: { fill: "F2F2F2" },
            width: { size: 15, type: "pct" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Pending", bold: true, color: "F39C12", size: 18, font: "Arial" })]
              })
            ]
          }),
          new TableCell({
            borders: tableBorders(),
            shading: { fill: "F2F2F2" },
            width: { size: 15, type: "pct" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "N/A", bold: true, size: 18, font: "Arial" })]
              })
            ]
          })
        ]
      }),
      ...summaryResults.map(r => {
        const n = String(r.val || "").toLowerCase();
        const isPassed = n.includes("pass");
        const isFailed = n.includes("fail");
        const isPending = n.includes("pending");
        const isNa = n.includes("n/a") || n.includes("na") || (!isPassed && !isFailed && !isPending && n.trim().length > 0);

        return new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: r.label, size: 18, font: "Arial" })],
                  spacing: { before: 60, after: 60 }
                })
              ]
            }),
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: isPassed ? [new TextRun({ text: "✓", bold: true, color: "228B22", size: 22, font: "Arial" })] : [],
                  spacing: { before: 60, after: 60 }
                })
              ]
            }),
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: isFailed ? [new TextRun({ text: "✓", bold: true, color: "CC0000", size: 22, font: "Arial" })] : [],
                  spacing: { before: 60, after: 60 }
                })
              ]
            }),
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: isPending ? [new TextRun({ text: "✓", bold: true, color: "F39C12", size: 22, font: "Arial" })] : [],
                  spacing: { before: 60, after: 60 }
                })
              ]
            }),
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: isNa ? [new TextRun({ text: "✓", bold: true, color: "000000", size: 22, font: "Arial" })] : [],
                  spacing: { before: 60, after: 60 }
                })
              ]
            })
          ]
        });
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: tableBorders(),
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [new TextRun({ text: "I. Production Schedule", size: 18, font: "Arial" })],
                spacing: { before: 60, after: 60 }
              })
            ]
          }),
          new TableCell({
            columnSpan: 4,
            borders: tableBorders(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: sanitizeDocxText(scheduleText), size: 18, font: "Arial" })],
                spacing: { before: 60, after: 60 }
              })
            ]
          })
        ]
      })
    ];
  } else {
    const summaryResults = [
      { label: "A. Quantity", val: data.quantity },
      { label: "B. Workmanship", val: data.workmanship },
      { label: "C. On-Site Tests", val: data.onSiteTests },
      { label: "D. Dimensions", val: data.dimensions },
      { label: "E. Packing", val: data.packingResult },
      { label: "F. Marking & Labeling", val: data.marking_result_final },
      { label: "G. Client Special Requirement", val: data.client_requirement_result },
    ];

    summaryRows = [
      new TableRow({ children: [new TableCell({ columnSpan: 5, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "II. INSPECTION SUMMARY", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })] })] }),
      new TableRow({
        children: [
          createQtyCell("", { shading: { fill: "E9ECEF" }, width: { size: 30, type: "pct" } }),
          createQtyCell("Passed", { bold: true, color: "228B22", shaded: true }),
          createQtyCell("Failed", { bold: true, color: "CC0000", shaded: true }),
          createQtyCell("Pending", { bold: true, color: "F39C12", shaded: true }),
          createQtyCell("N/A", { bold: true, shaded: true })
        ]
      }),
      ...summaryResults.map(r => {
        const n = String(r.val || "").toLowerCase();
        return new TableRow({
          children: [
            createQtyCell(r.label, { align: "left" }),
            createQtyCell(n.includes("pass") ? "\u2713" : "", { color: "228B22", bold: true }),
            createQtyCell(n.includes("fail") ? "\u2713" : "", { color: "CC0000", bold: true }),
            createQtyCell(n.includes("pending") ? "\u2713" : "", { color: "F39C12", bold: true }),
            createQtyCell(!n.includes("pass") && !n.includes("fail") && !n.includes("pending") ? "\u2713" : "", { bold: true }),
          ]
        });
      })
    ];
  }
  children.push(new Table({ width: { size: 100, type: "pct" }, rows: summaryRows }));
  children.push(new Paragraph({ children: [], spacing: { before: 100, after: 100 } }));

  // III. REMARKS (For CLS, it goes here)
  if (isCls) {
    children.push(...(await createRemarksTable(data)));
    children.push(new Paragraph({ children: [] }));
  }

  if (isCls) {
    // For CLS, Conclusion comes right after Remarks
    children.push(await createConclusionTable(data, true));
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(createHighFidelityQuantityTable(data));
    children.push(new Paragraph({ children: [], spacing: { before: 200, after: 200 } }));
    children.push(createProductConformityTable(data));
    children.push(new Paragraph({ children: [], spacing: { before: 200, after: 200 } }));
    children.push(createCLSPackingTable(data));
    children.push(new Paragraph({ children: [], spacing: { before: 200, after: 200 } }));
    children.push(...createCLSLoadingProcessTable(data));
    children.push(new Paragraph({ children: [], spacing: { before: 200, after: 200 } }));
    children.push(...createCLSClientRequirementTable(data));
    children.push(...(await createCLSFinalPhotosSection(data)));
  } else {
    // PSI & DPI Only Sections (Workmanship, Factory Signs, etc.)
    const wmResult = String(data.workmanshipResult || "Passed");
    const wmResultText = wmResult.length > 0 ? (wmResult.charAt(0).toUpperCase() + wmResult.slice(1).toLowerCase()) : "Passed";

    let wmResultColor = "228B22"; // default green
    if (wmResultText.toUpperCase().includes("FAIL")) {
      wmResultColor = "CC0000"; // red
    } else if (wmResultText.toUpperCase().includes("PENDING")) {
      wmResultColor = "F39C12"; // orange/amber
    }

    const createWorkmanshipCell = (text, options = {}) => {
      const {
        bold = false,
        align = AlignmentType.CENTER,
        colSpan,
        shaded = false,
        color,
        fontSize = 18,
        width,
        verticalAlign = VerticalAlign.CENTER,
        spacing = { before: 60, after: 60 },
        font = "Arial",
        verticalMerge
      } = options;

      const textRunOptions = {
        text: sanitizeDocxText(text),
        bold,
        size: fontSize,
        font
      };
      if (color) {
        textRunOptions.color = color;
      }

      const paragraphOptions = {
        children: [new TextRun(textRunOptions)],
        alignment: align,
        spacing
      };

      const cellOptions = {
        children: [new Paragraph(paragraphOptions)],
        borders: tableBorders(),
        verticalAlign
      };

      if (width) {
        if (typeof width === "number") {
          cellOptions.width = { size: width, type: WidthType.PERCENTAGE };
        } else {
          cellOptions.width = width;
        }
      }
      if (shaded) {
        cellOptions.shading = { fill: "F2F2F2" };
      }

      if (typeof colSpan === "number" && colSpan > 1) {
        cellOptions.columnSpan = colSpan;
      }

      if (verticalMerge) {
        cellOptions.verticalMerge = verticalMerge;
      }

      return new TableCell(cellOptions);
    };

    const wmGridRows = [
      new TableRow({
        children: [
          createWorkmanshipCell("Workmanship Summary(based on the finished products)", {
            bold: true,
            align: AlignmentType.LEFT,
            colSpan: 6,
            shaded: true,
            fontSize: 20,
            color: "1F4E79"
          })
        ],
      }),
      new TableRow({
        children: [
          createWorkmanshipCell("Inspection Standard:", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell(data.inspectionStandardWM || "-", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell("", { width: 15 }),
          createWorkmanshipCell("Critical", { bold: true, align: AlignmentType.CENTER, width: 15, shaded: true }),
          createWorkmanshipCell("Major", { bold: true, align: AlignmentType.CENTER, width: 15, shaded: true }),
          createWorkmanshipCell("Minor", { bold: true, align: AlignmentType.CENTER, width: 15, shaded: true })
        ],
      }),
      new TableRow({
        children: [
          createWorkmanshipCell("Sampling Plan:", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell(data.samplingPlanWM || "-", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell("AQL:", { align: AlignmentType.LEFT, width: 15 }),
          createWorkmanshipCell(data.aqlCriticalWM || "Not Allowed", { align: AlignmentType.CENTER, width: 15 }),
          createWorkmanshipCell(data.aqlMajorWM || "2.5", { align: AlignmentType.CENTER, width: 15 }),
          createWorkmanshipCell(data.aqlMinorWM || "4.0", { align: AlignmentType.CENTER, width: 15 })
        ],
      }),
      new TableRow({
        children: [
          createWorkmanshipCell("Inspection Level:", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell(data.inspectionLevelWM || "-", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell("Accepted:", { align: AlignmentType.LEFT, width: 15 }),
          createWorkmanshipCell(data.acceptedCritical || "00", { align: AlignmentType.CENTER, width: 15 }),
          createWorkmanshipCell(data.acceptedMajor || "0", { align: AlignmentType.CENTER, width: 15 }),
          createWorkmanshipCell(data.acceptedMinor || "0", { align: AlignmentType.CENTER, width: 15 })
        ],
      }),
      new TableRow({
        children: [
          createWorkmanshipCell("Order Quantity:", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell(data.orderQuantity || data.orderQuantityWM || "-", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell("Found:", { align: AlignmentType.LEFT, width: 15 }),
          createWorkmanshipCell(data.totalFoundCritical || data.foundCriticalWM || "00", { align: AlignmentType.CENTER, width: 15 }),
          createWorkmanshipCell(data.totalFoundMajor || data.foundMajorWM || "0", { align: AlignmentType.CENTER, width: 15 }),
          createWorkmanshipCell(data.totalFoundMinor || data.foundMinorWM || "0", { align: AlignmentType.CENTER, width: 15 })
        ],
      }),
      new TableRow({
        children: [
          createWorkmanshipCell("Available Quantity:", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell(data.availableQuantity || data.availableQuantityWM || "-", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell("Result:", { bold: true, align: AlignmentType.LEFT, width: 15, verticalMerge: VerticalMergeType.RESTART }),
          createWorkmanshipCell(wmResultText, {
            bold: true,
            align: AlignmentType.CENTER,
            colSpan: 3,
            width: 45,
            color: wmResultColor,
            fontSize: 22,
            verticalMerge: VerticalMergeType.RESTART
          })
        ],
      }),
      new TableRow({
        children: [
          createWorkmanshipCell("Sample Size:", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell(data.sampleSizeWM || "-", { align: AlignmentType.LEFT, width: 20 }),
          createWorkmanshipCell("", { width: 15, verticalMerge: VerticalMergeType.CONTINUE }),
          createWorkmanshipCell("", { colSpan: 3, width: 45, verticalMerge: VerticalMergeType.CONTINUE })
        ]
      })
    ];
    children.push(new Table({ width: { size: 100, type: "pct" }, rows: wmGridRows }));
    children.push(new Paragraph({ children: [], spacing: { before: 100, after: 100 } }));

    // For PSI, Remarks goes right after Workmanship Summary
    children.push(...(await createRemarksTable(data)));
    children.push(new Paragraph({ children: [], spacing: { before: 100, after: 100 } }));
  }

  if (!isCls) {
    children.push(await createConclusionTable(data, false));
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Note Paragraph
    const noteText = "Note: 1. This report reflects our findings at the time and the place of inspection based on random samples selected. 2. This inspection was carried out to the best of our knowledge and abilities, and our responsibility is limited to the exercise of reasonable one. 3. This report does not relieve the sellers from their contractual obligations nor does it prejudice buyer's right for compensation for any apparent and/or hidden defects not detected during our inspection or occurring thereafter. 4. This report does not evidence shipment. 5. Our services are subject to the General Conditions of Service of Absolute Veritas, which is shown at our website and can be sent to you upon written request. 6. This report's inspection results only relate to the samples as (randomly picked) by our inspector. 7. This report is complete and its content may not be reproduced.";
    children.push(new Paragraph({
      children: [new TextRun({ text: noteText, size: 14 })],
      alignment: "left",
      spacing: { before: 200 }
    }));

    children.push(new Paragraph({
      children: [new TextRun({ text: "--------------------------------------------------------------------------------", size: 14 })],
      spacing: { before: 100 }
    }));

    children.push(new Paragraph({
      children: [new TextRun({ text: "Please find our inspection details from next page (Section A - F).", size: 16 })],
      alignment: "left",
      spacing: { before: 100 }
    }));

    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // SECTIONS A-H (MATCHING server.js Root)
  if (!isCls) {
    // A. QUANTITY (Matched to tiered header SS)
    const items = Array.isArray(data.items) ? data.items : [];
    const qRows = [
      new TableRow({ children: [new TableCell({ columnSpan: 10, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "A. QUANTITY", bold: true, size: 22, color: "1F4E79" })] })] })] }),
      new TableRow({
        children: [
          createQtyCell("Quantity", { bold: true, align: "left", colSpan: 8 }),
          createQtyCell("Unit: Sets", { bold: true, align: "right", colSpan: 2 })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "P.O.", bold: true })], alignment: "center" })] }),
          new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true })], alignment: "center" })] }),
          new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Order Qty", bold: true })], alignment: "center" })] }),
          new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Qty / Carton", bold: true })], alignment: "center" })] }),
          new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Cartons", bold: true })], alignment: "center" })] }),
          new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Quantity Breakdown", bold: true })], alignment: "center" })] }),
          new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Sample Size", bold: true })], alignment: "center" })] }),
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, children: [new Paragraph({ children: [] })] }),
          createQtyCell("Packed", { bold: true, shaded: true }),
          createQtyCell("Unpacked", { bold: true, shaded: true }),
          createQtyCell("Unfinished", { bold: true, shaded: true }),
          createQtyCell("Packed", { bold: true, shaded: true }),
          createQtyCell("Unpacked", { bold: true, shaded: true }),
        ]
      }),
      ...items.map(it => new TableRow({
        children: [
          createQtyCell(it.po),
          createQtyCell(it.itemName, { align: "left" }),
          createQtyCell(it.orderQty),
          createQtyCell(it.qtyPerCarton || "-"),
          createQtyCell(it.cartons || "-"),
          createQtyCell(it.packedBreakdown),
          createQtyCell(it.unpackedBreakdown),
          createQtyCell(it.unfinishedBreakdown, { color: it.unfinishedBreakdown > 0 ? "CC0000" : "000000" }),
          createQtyCell(it.sampleSizePacked),
          createQtyCell(it.sampleSizeUnpacked),
        ]
      })),
      // Total Row
      new TableRow({
        children: [
          createQtyCell("Total:", { bold: true, align: "right", shaded: true, colSpan: 2 }),
          createQtyCell(data.totalOrderQty || "0", { bold: true, shaded: true }),
          createQtyCell("-", { bold: true, shaded: true }),
          createQtyCell("-", { bold: true, shaded: true }),
          createQtyCell(data.totalPacked || "0", { bold: true, shaded: true }),
          createQtyCell(data.totalUnpacked || "0", { bold: true, shaded: true }),
          createQtyCell(data.totalUnfinished || "0", { bold: true, shaded: true, color: "CC0000" }),
          createQtyCell(data.totalSamplePacked || "0", { bold: true, shaded: true }),
          createQtyCell(data.totalSampleUnpacked || "0", { bold: true, shaded: true }),
        ]
      }),
      // Selected Cartons
      new TableRow({ children: [new TableCell({ columnSpan: 10, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Selected Cartons:", bold: true })] })] })] }),
      new TableRow({
        children: [
          createQtyCell(asVal(data.selectedCartonCount)),
          createQtyCell(asVal(data.selectedCartonStatement), { align: "left", colSpan: 9 })
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Carton No.:", { bold: true, shaded: true }),
          ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => createQtyCell(Array.isArray(data.cartonNos) ? (data.cartonNos[i] || "-") : "-"))
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Result:", { bold: true, shaded: true }),
          createQtyCell(asVal(data.quantityResult), { colSpan: 9, align: "left", bold: true, color: String(asVal(data.quantityResult)).toLowerCase().includes("pass") ? "228B22" : "E36C09" })
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Remark:", { bold: true, shaded: true }),
          createQtyCell(blankIfEmpty(data.quantityRemark), { colSpan: 9, align: "left" })
        ]
      })
    ];
    children.push(new Table({ width: { size: 100, type: "pct" }, rows: qRows }));
    // Standardizing gap after Section A table
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }


  // B. WORKMANSHIP (Matched to complex grid SS)
  if (!isCls) {
    const wmRes = data.workmanshipResult || "Passed";
    const bRows = [
      // Header
      new TableRow({ children: [new TableCell({ columnSpan: 7, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "B. WORKMANSHIP", bold: true, size: 22, color: "1F4E79" })] })] })] }),

      // Tiered Header Row 1
      new TableRow({
        children: [
          createQtyCell("Inspection Standard:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.inspectionStandardWM || "ANSI/ASQ Z1.4 (ISO 2859-1)", { align: "left" }),
          new TableCell({ width: { size: 10, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [] })] }),
          createQtyCell("AQL", { bold: true, shaded: true }),
          createQtyCell("Accepted", { bold: true, shaded: true }),
          createQtyCell("Total Found", { bold: true, shaded: true }),
          createQtyCell("Result", { bold: true, shaded: true }),
        ]
      }),
      // Tiered Header Row 2
      new TableRow({
        children: [
          createQtyCell("Sampling Plan:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.samplingPlanWM || "Fixed Sample Size", { align: "left" }),
          createQtyCell("Critical:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.aqlCriticalWM || "Not Allowed"),
          createQtyCell(data.acceptedCritical || "00"),
          createQtyCell(data.totalFoundCritical || "0"),
          createQtyCell(resolveResultWM(data.totalFoundCritical, data.acceptedCritical), { bold: true }),
        ]
      }),
      // Tiered Header Row 3
      new TableRow({
        children: [
          createQtyCell("Inspection Level:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.inspectionLevelWM || "Level II", { align: "left" }),
          createQtyCell("Major:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.aqlMajorWM || "2.5"),
          createQtyCell(data.acceptedMajor || "00"),
          createQtyCell(data.totalFoundMajor || "0"),
          createQtyCell(resolveResultWM(data.totalFoundMajor, data.acceptedMajor), { bold: true }),
        ]
      }),
      // Tiered Header Row 4
      new TableRow({
        children: [
          createQtyCell("Sample Size:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.sampleSizeWM || "5 Sets", { align: "left" }),
          createQtyCell("Minor:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.aqlMinorWM || "4.0"),
          createQtyCell(data.acceptedMinor || "00"),
          createQtyCell(data.totalFoundMinor || "0"),
          createQtyCell(resolveResultWM(data.totalFoundMinor, data.acceptedMinor), { bold: true }),
        ]
      }),
      // Subheader
      new TableRow({ children: [new TableCell({ columnSpan: 7, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Workmanship Defectives / Function Inspection Findings", bold: true })] })] })] }),
      // Defect Table Headers
      new TableRow({
        children: [
          createQtyCell(""), // for Number
          createQtyCell("Description", { bold: true, colSpan: 3, align: "left" }),
          createQtyCell("Critical", { bold: true }),
          createQtyCell("Major", { bold: true }),
          createQtyCell("Minor", { bold: true }),
        ]
      }),
      // Dynamic Defects (grouped by item/sample size)
      ...(() => {
        const defects = Array.isArray(data.workmanshipDefects) ? data.workmanshipDefects : [];
        const rows = [];
        let currentItemHeader = null;

        defects.forEach((defect, i) => {
          const resolvedItemName = defect.itemName || defect.itemGroup;
          const headerKey = `${resolvedItemName}_${defect.sampleSize}`;

          if (headerKey !== currentItemHeader) {
            rows.push(new TableRow({
              children: [
                createQtyCell(`For Item ${resolvedItemName || "-"}`, { align: "left", colSpan: 2 }),
                createQtyCell(`Sample size: ${defect.sampleSize || "0"} Sets`, { align: "center", colSpan: 2 }),
                createQtyCell(""),
                createQtyCell(""),
                createQtyCell(""),
              ]
            }));
            currentItemHeader = headerKey;
          }

          rows.push(new TableRow({
            children: [
              createQtyCell(String(i + 1) + "."),
              createQtyCell(defect.description || "", { align: "left", colSpan: 3 }),
              createQtyCell(defect.critical || "0"),
              createQtyCell(defect.major || "0"),
              createQtyCell(defect.minor || "0"),
            ]
          }));
        });

        return rows;
      })(),
      // Totals Section
      new TableRow({
        children: [
          createQtyCell("Total found:", { bold: true, align: "right", colSpan: 4, shaded: true }),
          createQtyCell(data.totalFoundCritical || "0", { bold: true }),
          createQtyCell(data.totalFoundMajor || "0", { bold: true }),
          createQtyCell(data.totalFoundMinor || "0", { bold: true }),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Accepted:", { bold: true, align: "right", colSpan: 4, shaded: true }),
          createQtyCell(data.acceptedCritical || "00", { bold: true }),
          createQtyCell(data.acceptedMajor || "00", { bold: true }),
          createQtyCell(data.acceptedMinor || "00", { bold: true }),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Sample size:", { bold: true, align: "right", colSpan: 4, shaded: true }),
          createQtyCell("2", { bold: true }), // Match SS hardcoding/fallback
          createQtyCell("2", { bold: true }),
          createQtyCell("2", { bold: true }),
        ]
      }),
      // Final Summary
      new TableRow({ children: [createQtyCell("Result:", { bold: true, shaded: true, align: "left" }), createQtyCell(wmRes, { colSpan: 6, align: "left", bold: true, color: wmRes === "Passed" ? "228B22" : "CC0000" })] }),
      new TableRow({ children: [createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }), createQtyCell(blankIfEmpty(data.workmanshipRemark || "No critical workmanship issues observed."), { colSpan: 6, align: "left" })] }),
      new TableRow({ children: [createQtyCell("Note:", { bold: true, shaded: true, align: "left" }), createQtyCell("A Defective is defined as a unit of product that contains one or more defects. A Defect is defined as any non-conformance of the inspected unit of product with specified requirements. A single defect is taken into account per each defective unit; only one most serious defect is taken into account per each defective unit.", { colSpan: 6, align: "left", size: 14 })] })
    ];
    // Defect Photos — extract from reportPhotoGroups and merge into B table
    const defectPhotosGroup = (data.reportPhotoGroups || []).find(g => g.id === "defectPhotos" || (g.description || "").toLowerCase().includes("defect"));
    const defectPhotos = defectPhotosGroup ? (defectPhotosGroup.photos || []) : (Array.isArray(data.workmanshipPhotos) ? data.workmanshipPhotos : []);

    // Remove from general queue to prevent duplication
    if (data.reportPhotoGroups && defectPhotosGroup) {
      data.reportPhotoGroups = data.reportPhotoGroups.filter(g => g !== defectPhotosGroup);
    }

    if (defectPhotos.length > 0) {
      bRows.push(new TableRow({ children: [new TableCell({ columnSpan: 7, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Defect photos of Item " + (data.itemNo || data.productName || "-"), bold: true })] })] })] }));

      for (let i = 0; i < defectPhotos.length; i += 2) {
        const p1 = defectPhotos[i];
        const p2 = defectPhotos[i + 1];

        // Image Row
        const p1Buffer = p1 ? await getImageBuffer(p1) : null;
        const p2Buffer = p2 ? await getImageBuffer(p2) : null;

        bRows.push(new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              borders: tableBorders(),
              children: [
                p1Buffer ? new Paragraph({
                  children: [new ImageRun({ data: p1Buffer, type: "png", transformation: { width: 340, height: 230 } })],
                  alignment: "center",
                  spacing: { before: 100, after: 100 }
                }) : new Paragraph({ children: [] })
              ]
            }),
            new TableCell({
              columnSpan: 4,
              borders: tableBorders(),
              children: [
                p2Buffer ? new Paragraph({
                  children: [new ImageRun({ data: p2Buffer, type: "png", transformation: { width: 340, height: 230 } })],
                  alignment: "center",
                  spacing: { before: 100, after: 100 }
                }) : new Paragraph({ children: [] })
              ]
            })
          ]
        }));

        // Description Row
        bRows.push(new TableRow({
          children: [
            new TableCell({ columnSpan: 3, borders: tableBorders(), shading: { fill: "F9F9F9" }, children: [new Paragraph({ alignment: "center", children: [new TextRun({ text: p1?.label || p1?.description || "Defect photo", size: 18 })] })] }),
            new TableCell({ columnSpan: 4, borders: tableBorders(), shading: { fill: "F9F9F9" }, children: [new Paragraph({ alignment: "center", children: [new TextRun({ text: p2?.label || p2?.description || (p2 ? "Defect photo" : ""), size: 18 })] })] }),
          ]
        }));
      }
    }

    children.push(new Table({ width: { size: 100, type: "pct" }, rows: bRows }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (!isCls) {
    // C. ON-SITE TESTS (Separated table with exact colors)
    const osResult = asVal(data.onSiteTestResult);
    const osRows = [
      new TableRow({ children: [new TableCell({ columnSpan: 5, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "C. ON-SITE TESTS", bold: true, size: 22, color: "1F4E79" })] })] })] }),
      new TableRow({
        children: [
          createQtyCell(""),
          createQtyCell("Description", { bold: true, shaded: true, align: "left" }),
          createQtyCell("Method", { bold: true, shaded: true, align: "left" }),
          createQtyCell("Sample Size", { bold: true, shaded: true }),
          createQtyCell("Result / Reading", { bold: true, shaded: true }),
        ]
      }),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => {
        const desc = data[`testDesc${id}`];
        if (!desc && id > 1) return null;
        return new TableRow({
          children: [
            createQtyCell(String(id)),
            createQtyCell(asVal(desc), { align: "left" }),
            createQtyCell(asVal(data[`testMethod${id}`]), { align: "left" }),
            createQtyCell(asVal(data[`testSample${id}`])),
            createQtyCell(asVal(data[`testResult${id}`]), { bold: true, color: String(asVal(data[`testResult${id}`])).toLowerCase().includes("pass") ? "228B22" : "E36C09" }),
          ]
        });
      }).filter(Boolean),
      new TableRow({ children: [createQtyCell("Result:", { bold: true, shaded: true, align: "left" }), createQtyCell(osResult, { colSpan: 4, align: "left", bold: true, color: String(osResult).toLowerCase().includes("pass") ? "228B22" : "E36C09" })] }),
      new TableRow({ children: [createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }), createQtyCell(asVal(data.onSiteTestRemark), { colSpan: 4, align: "left" })] })
    ];
    children.push(new Table({ width: { size: 100, type: "pct" }, rows: osRows }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } })); // Separator gap


    // D. DIMENSIONS / PRODUCT SPECIFICATION
    if (isDpi && data._dpiDimensionsRows && data._dpiDimensionsRows.length > 0) {
      // DPI path: render dimensionsTable array from dpiSchema
      const dpiProdRes = data.productResult || "Pending";
      const dpiSpecRows = [
        new TableRow({ children: [new TableCell({ columnSpan: 6, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "D. PRODUCT SPECIFICATION", bold: true, size: 22, color: "1F4E79" })] })] })] }),
        new TableRow({ children: [createQtyCell("Item No.:", { bold: true, shaded: true, align: "left" }), createQtyCell(data._dpiDimensionsItemNo || "-", { colSpan: 5, bold: true })] }),
        ...(data._dpiDimensionsGroupName ? [
          new TableRow({ children: [new TableCell({ columnSpan: 6, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: data._dpiDimensionsGroupName, bold: true })] })] })] })
        ] : []),
        new TableRow({
          children: [
            createQtyCell("", { shaded: true }),
            createQtyCell("Client's Spec.", { bold: true, shaded: true }),
            createQtyCell("Ref. Sample", { bold: true, shaded: true }),
            createQtyCell("1# Sample", { bold: true, shaded: true }),
            createQtyCell("2# Sample", { bold: true, shaded: true }),
            createQtyCell("3# Sample", { bold: true, shaded: true }),
          ]
        }),
        ...data._dpiDimensionsRows.map(row => new TableRow({
          children: [
            createQtyCell(row.parameter || "-", { align: "left" }),
            createQtyCell(row.clientSpec || "-"),
            createQtyCell(row.refSample || "-"),
            createQtyCell(row.sample1 || "-"),
            createQtyCell(row.sample2 || "-"),
            createQtyCell(row.sample3 || "-"),
          ]
        })),
        new TableRow({ children: [createQtyCell("Result:", { bold: true, shaded: true, align: "left" }), createQtyCell(dpiProdRes, { colSpan: 5, align: "left", bold: true, color: String(dpiProdRes).toLowerCase().includes("pass") ? "228B22" : "CC0000" })] }),
        new TableRow({ children: [createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }), createQtyCell(asVal(data.productRemark), { colSpan: 5, align: "left" })] }),
      ];
      children.push(new Table({ width: { size: 100, type: "pct" }, rows: dpiSpecRows }));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    } else {
      // PSI path: existing flat-key rendering
      const prodRes = asVal(data.productResult);
      const specItems = [
        new TableRow({ children: [new TableCell({ columnSpan: 6, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "D. PRODUCT SPECIFICATION", bold: true, size: 22, color: "1F4E79" })] })] })] }),
        new TableRow({
          children: [
            createQtyCell(""),
            createQtyCell("Client's Spec.", { bold: true, shaded: true }),
            createQtyCell("Ref. Sample", { bold: true, shaded: true }),
            createQtyCell("1# Sample", { bold: true, shaded: true }),
            createQtyCell("2# Sample", { bold: true, shaded: true }),
            createQtyCell("3# Sample", { bold: true, shaded: true }),
          ]
        }),
        new TableRow({ children: [createQtyCell("Item No.:", { bold: true, shaded: true, align: "left" }), createQtyCell(asVal(data.productDescription), { colSpan: 5, bold: true })] }),
        new TableRow({
          children: [
            createQtyCell(asVal(data.blank_row_0), { align: "left" }),
            createQtyCell(asVal(data.blank_row_c0)),
            createQtyCell(asVal(data.blank_row_c1)),
            createQtyCell(asVal(data.blank_row_c2)),
            createQtyCell(asVal(data.blank_row_c3)),
            createQtyCell(asVal(data.blank_row_c4)),
          ]
        }),
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => {
          const descKey = `item_${id}_desc`;
          if (!data[descKey] && id > 1) return null;
          return [
            new TableRow({ children: [createQtyCell("Item No.:", { bold: true, shaded: true, align: "left" }), createQtyCell(asVal(data[descKey]), { colSpan: 5, bold: true })] }),
            new TableRow({
              children: [
                createQtyCell(asVal(data[`item_${id}_name`]), { align: "left" }),
                createQtyCell(asVal(data[`item_${id}_c0`])),
                createQtyCell(asVal(data[`item_${id}_c1`])),
                createQtyCell(asVal(data[`item_${id}_c2`])),
                createQtyCell(asVal(data[`item_${id}_c3`])),
                createQtyCell(asVal(data[`item_${id}_c4`])),
              ]
            })
          ];
        }).filter(Boolean).flat(),
        new TableRow({ children: [createQtyCell("Result:", { bold: true, shaded: true, align: "left" }), createQtyCell(prodRes, { colSpan: 5, align: "left", bold: true, color: String(prodRes).toLowerCase().includes("pass") ? "228B22" : "CC0000" })] }),
        new TableRow({ children: [createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }), createQtyCell(asVal(data.productRemark), { colSpan: 5, align: "left" })] })
      ];
      children.push(new Table({ width: { size: 100, type: "pct" }, rows: specItems }));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }


    // E. PACKING (Detailed implementation matching legacy SS)
    let packageIconRun = null;
    try {
      if (fs.existsSync(PACKAGE_ICON_PATH)) {
        packageIconRun = new ImageRun({ data: fs.readFileSync(PACKAGE_ICON_PATH), type: "png", transformation: { width: 50, height: 50 } });
      }
    } catch (e) { }

    const eRows = [
      // Header
      new TableRow({ children: [new TableCell({ columnSpan: 9, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "E. PACKING", bold: true, size: 22, color: "1F4E79" })] })] })] }),
      // Logo & Subtitle
      new TableRow({
        children: [
          new TableCell({ columnSpan: 7, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Package Details:", bold: true })] })] }),
          new TableCell({ columnSpan: 2, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [packageIconRun ? new Paragraph({ children: [packageIconRun], alignment: "right" }) : new Paragraph({ children: [] })] })
        ]
      }),
      // Sub-headers Row 1
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.RESTART, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ children: [new TextRun({ text: "Item No.", bold: true, font: "Arial" })], alignment: "center" })] }),
          createQtyCell("Qty / Carton", { bold: true, colSpan: 2, shaded: true }),
          createQtyCell("Carton Size L×W×H (cm)", { bold: true, colSpan: 2, shaded: true }),
          createQtyCell("Gross Weight (KG)", { bold: true, colSpan: 2, shaded: true }),
          createQtyCell("Qty / Inner box", { bold: true, colSpan: 2, shaded: true }),
        ]
      }),
      // Sub-headers Row 2
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [] }),
          createQtyCell("Marking", { shaded: true }), createQtyCell("Actual", { shaded: true }),
          createQtyCell("Marking", { shaded: true }), createQtyCell("Actual", { shaded: true }),
          createQtyCell("Marking", { shaded: true }), createQtyCell("Actual", { shaded: true }),
          createQtyCell("Marking", { shaded: true }), createQtyCell("Actual", { shaded: true }),
        ]
      }),
      // Dynamic Packing Body
      ...[1, 2, 3].map(id => {
        const itemName = data[`packing_item_${id}`];
        if (!itemName && id > 1) return null;
        return new TableRow({
          children: [
            createQtyCell(itemName || (id === 1 ? "30B nut forming machine (Model: 30B-6S-40)" : "-"), { align: "left" }),
            createQtyCell(data[`packing_qty_carton_marking_${id}`] || "-"),
            createQtyCell(data[`packing_qty_carton_actual_${id}`] || "-"),
            createQtyCell(data[`packing_carton_size_marking_${id}`] || "-"),
            createQtyCell(data[`packing_carton_size_actual_${id}`] || "-"),
            createQtyCell(data[`packing_weight_marking_${id}`] || "-"),
            createQtyCell(data[`packing_weight_actual_${id}`] || "-"),
            createQtyCell(data[`packing_qty_inner_marking_${id}`] || "-"),
            createQtyCell(data[`packing_qty_inner_actual_${id}`] || "-"),
          ]
        });
      }).filter(Boolean),
      // Export Carton Details
      new TableRow({ children: [new TableCell({ columnSpan: 9, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Export Carton Details", bold: true })] })] })] }),
      new TableRow({
        children: [
          createQtyCell("Fastening Metal Staples", { colSpan: 3, align: "right" }),
          createQtyCell(data.fastening_metal_staples || "-", { colSpan: 2, align: "left" }),
          createQtyCell("Nylon Band", { colSpan: 2, align: "right" }),
          createQtyCell(data.nylon_band || "-", { colSpan: 2, align: "left" }),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Material", { colSpan: 3, align: "right" }),
          createQtyCell(data.material || "-", { colSpan: 2, align: "left" }),
          createQtyCell("Corrugated Paper Plies", { colSpan: 2, align: "right" }),
          createQtyCell(`${data.corrugated_paper_plies || "-"}-ply`, { colSpan: 2, align: "left" }),
        ]
      }),
      // Packing Method
      new TableRow({ children: [new TableCell({ columnSpan: 9, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Packing Method", bold: true })] })] })] }),
      new TableRow({ children: [createQtyCell(data.packing_method || "NA", { colSpan: 9, align: "left" })] }),
      // Assortment Method
      new TableRow({ children: [new TableCell({ columnSpan: 9, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Assortment Method", bold: true })] })] })] }),
      new TableRow({ children: [createQtyCell(data.assortment_method || "-", { colSpan: 9, align: "left" })] }),
      // Result & Remark
      new TableRow({ children: [createQtyCell("Result:", { bold: true, colSpan: 2, align: "left" }), createQtyCell(data.packing_result || "Passed", { colSpan: 7, align: "center", bold: true, color: String(data.packing_result).toLowerCase().includes("fail") ? "CC0000" : "228B22" })] }),
      new TableRow({ children: [createQtyCell("Remark:", { bold: true, colSpan: 2, align: "left" }), createQtyCell(data.packing_remark || "No packing", { colSpan: 7, align: "left" })] })
    ];
    children.push(new Table({ width: { size: 100, type: "pct" }, rows: eRows }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));


    // F. MARKING & LABELING (Detailed Implementation)
    const markResFinal = data.marking_result_final || "Pending";
    const fRows = [
      // Header
      new TableRow({ children: [new TableCell({ columnSpan: 3, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "F. MARKING & LABELING", bold: true, size: 22, color: "1F4E79" })] })] })] }),
      // Sub-header
      new TableRow({ children: [new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Barcode/Labeling/Printing", bold: true })] })] })] }),
      // Column Headers
      new TableRow({
        children: [
          createQtyCell("Name", { bold: true, shaded: true }),
          createQtyCell("Location", { bold: true, shaded: true }),
          createQtyCell("Result", { bold: true, shaded: true }),
        ]
      }),
      // Barcode Row
      new TableRow({
        children: [
          createQtyCell(data.barcode_name || "Rating label"),
          createQtyCell(data.barcode_location || "Unit"),
          createQtyCell(data.barcode_result || "pass"),
        ]
      }),
      // Documentation Checks
      new TableRow({
        children: [
          createQtyCell("Instruction manual and documentation check", { align: "left" }),
          createQtyCell(data.instruction_provided_by_label || "Provided By factory"),
          createQtyCell(data.instruction_provided_by || "pass"),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("No instruction manual included", { align: "left" }),
          createQtyCell(""),
          createQtyCell(data.no_instruction_result || "-"),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("No CDF was provided for comparison during inspection.", { align: "left" }),
          createQtyCell(""),
          createQtyCell(data.no_cdf_result || "-"),
        ]
      }),
      // Shipping Marks sub-header
      new TableRow({ children: [new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Shipping Marks", bold: true })] })] })] }),
      // Marks rows
      new TableRow({
        children: [
          createQtyCell("Shipping Marks (on _ side)", { colSpan: 2, align: "left" }),
          createQtyCell(data.shipping_marks || "-"),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Side Marks (on _ side)", { colSpan: 2, align: "left" }),
          createQtyCell(data.side_marks || "-"),
        ]
      }),
      new TableRow({
        children: [
          createQtyCell("Inner Box Marks (on _ side)", { colSpan: 2, align: "left" }),
          createQtyCell(data.inner_box_marks || "-"),
        ]
      }),
      // Result & Remark
      new TableRow({ children: [createQtyCell("Result:", { bold: true, colSpan: 2, align: "left" }), createQtyCell(markResFinal, { colSpan: 1, align: "center", bold: true, color: markResFinal.toLowerCase().includes("pending") ? "E36C09" : "228B22" })] }),
      new TableRow({ children: [createQtyCell("Remark:", { colSpan: 2, align: "left" }), createQtyCell(data.marking_remark || "No shipping mark, only rated label", { colSpan: 1, align: "left" })] })
    ];
    children.push(new Table({ width: { size: 100, type: "pct" }, rows: fRows }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));


    // G. PRODUCTION LINE CHECKING (DPI only)
    if (isDpi) {
      const plSampleSize = asVal(data.productionLineSampleSize);
      const plResult = asVal(data.productionLineResult);
      const plRemark = asVal(data.productionLineRemark);
      const plRowsData = Array.isArray(data.productionLineTable) ? data.productionLineTable : [];
      const plTotal = plRowsData.reduce((sum, row) => {
        const v = parseInt(row.samplingSize || row.sampleSize || 0);
        return sum + (isNaN(v) ? 0 : v);
      }, 0);

      const plRows = [
        new TableRow({ children: [new TableCell({ columnSpan: 5, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "G. PRODUCTION LINE CHECKING", bold: true, size: 22, color: "1F4E79" })] })] })] }),
        new TableRow({ children: [new TableCell({ columnSpan: 5, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Fixed Sample size: ${plSampleSize} pieces`, bold: true })] })] })] }),
        new TableRow({
          children: [
            createQtyCell("Process / Accessory", { bold: true, shaded: true, align: "left" }),
            createQtyCell("Sampling Size (pieces)", { bold: true, shaded: true }),
            createQtyCell("Style & Color", { bold: true, shaded: true }),
            createQtyCell("Problems / Defectives", { bold: true, shaded: true }),
            createQtyCell("Number", { bold: true, shaded: true }),
          ]
        }),
        ...(plRowsData.length > 0 ? plRowsData : []).map(row => new TableRow({
          children: [
            createQtyCell(asVal(row.process), { align: "left" }),
            createQtyCell(String(asVal(row.samplingSize || row.sampleSize || ""))),
            createQtyCell(asVal(row.styleColor)),
            createQtyCell(asVal(row.problems)),
            createQtyCell(String(asVal(row.number))),
          ]
        })),
        new TableRow({
          children: [
            createQtyCell("Total:", { bold: true, align: "right", shaded: true }),
            createQtyCell(String(plTotal), { bold: true, shaded: true }),
            createQtyCell("", { shaded: true }),
            createQtyCell("", { shaded: true }),
            createQtyCell("", { shaded: true }),
          ]
        }),
        new TableRow({ children: [createQtyCell("Result:", { bold: true, shaded: true, align: "left" }), createQtyCell(plResult, { colSpan: 4, bold: true, color: plResult.toLowerCase().includes("pass") ? "228B22" : plResult.toLowerCase().includes("fail") ? "CC0000" : "E36C09" })] }),
        new TableRow({ children: [createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }), createQtyCell(plRemark || "-", { colSpan: 4, align: "left" })] }),
      ];
      children.push(new Table({ width: { size: 100, type: "pct" }, rows: plRows }));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }


    // H. CLIENT SPECIAL REQUIREMENT (Single Unified Table) — was "G" pre-DPI
    const clientResult = data.client_requirement_result || "-";
    const clientReqs = Array.isArray(data.clientRequirements) ? data.clientRequirements : [];

    const gRows = [
      // Main Header
      new TableRow({ children: [new TableCell({ columnSpan: 3, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: isDpi ? "H. CLIENT SPECIAL REQUIREMENT" : "G. CLIENT SPECIAL REQUIREMENT", bold: true, size: 22, color: "1F4E79" })] })] })] }),
      // Sub-header
      new TableRow({ children: [new TableCell({ columnSpan: 3, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Client Requirements:", bold: true })] })] })] }),
      // Column Labels
      new TableRow({
        children: [
          createQtyCell(""), // for Number
          createQtyCell("Client Requirements", { bold: true, align: "center" }),
          createQtyCell("Result", { bold: true, align: "center" }),
        ]
      }),
      // Dynamic Requirements (from clientRequirements array)
      ...(clientReqs.length > 0 ? clientReqs : [{ requirement: "-", result: "-" }]).map((req, i) => new TableRow({
        children: [
          createQtyCell(`${i + 1}.`, { width: { size: 5, type: "pct" }, align: "left" }),
          createQtyCell(req.requirement || "-", { align: "left" }),
          createQtyCell(req.result || "-"),
        ]
      })),
      // Result Row
      new TableRow({
        children: [
          createQtyCell("Result:", { bold: true, align: "left" }),
          createQtyCell(clientResult, { colSpan: 2, align: "left", color: String(clientResult).toLowerCase().includes("fail") ? "CC0000" : (String(clientResult).toLowerCase().includes("pending") ? "E36C09" : "000000") }),
        ]
      }),
      // Remark Row
      new TableRow({
        children: [
          createQtyCell("Remark:", { align: "left" }),
          createQtyCell(data.client_requirement_remark || "-", { colSpan: 2, align: "left" }),
        ]
      })
    ];
    children.push(new Table({ width: { size: 100, type: "pct" }, rows: gRows }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));


    // I. PRODUCTION SCHEDULE (DPI only)
    if (isDpi) {
      const psFields = [
        ["Production Lines Available for This Order", data.psLinesAvailable],
        ["How Many Workers per Line?", data.psWorkersPerLine],
        ["Output Rate per Line per Day", data.psOutputRatePerLine],
        ["Maximum Output per Day", data.psMaxOutputPerDay],
        ["Minimum Output per Day", data.psMinOutputPerDay],
        ["Estimated Date for PSI Inspection", data.psEstimatedPSIDate || "NA"],
        ["Estimated Date When Goods Finished & Packed", data.psEstimatedFinishDate || "NA"],
      ];
      const psRows = [
        new TableRow({ children: [new TableCell({ columnSpan: 2, shading: { fill: "E8E8E8" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "I. PRODUCTION SCHEDULE", bold: true, size: 22, color: "1F4E79" })] })] })] }),
        ...psFields.map(([label, val]) => new TableRow({
          children: [
            createQtyCell(label, { bold: true, shaded: true, align: "left", width: { size: 50, type: "pct" } }),
            createQtyCell(String(val || "-"), { align: "left" }),
          ]
        })),
      ];
      children.push(new Table({ width: { size: 100, type: "pct" }, rows: psRows }));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }


    // J. PHOTOS (was H) — include all photo groups for PSI/DPI reports so none are lost
    const allPhotoGroups = Array.isArray(data.reportPhotoGroups) ? data.reportPhotoGroups : (Array.isArray(data.photoGroups) ? data.photoGroups : []);
    const finalPhotoGroups = allPhotoGroups.filter(g => {
      return true;
    });

    if (finalPhotoGroups.length > 0) {
      // 1. Header Table (Small, easily fits on any page)
      children.push(new Table({
        width: { size: 100, type: "pct" },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                shading: { fill: "E8E8E8" },
                borders: tableBorders(),
                children: [new Paragraph({ children: [new TextRun({ text: isDpi ? "J. PHOTOS" : "H. PHOTOS", bold: true, size: 22, color: "1F4E79" })] })]
              })
            ]
          })
        ]
      }));

      // 2. Individual Tables for each Group (Allows page breaks between groups)
      for (const group of finalPhotoGroups) {
        const photos = (group.photos || []).filter(p => p.preview || p.wasabiKey || p.url);
        if (photos.length === 0) continue;

        const groupRows = [];

        // Group sub-header
        if (group.description) {
          groupRows.push(new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                shading: { fill: "F2F2F2" },
                borders: tableBorders(),
                children: [new Paragraph({ children: [new TextRun({ text: `Group: ${group.description}`, bold: true })] })]
              })
            ]
          }));
        }

        for (let i = 0; i < photos.length; i += 2) {
          const p1 = photos[i];
          const p2 = photos[i + 1];

          // 🖼️ Image Row
          groupRows.push(new TableRow({
            children: [
              await createPhotoCell(p1),
              p2 ? await createPhotoCell(p2) : new TableCell({ children: [new Paragraph({ children: [] })], borders: tableBorders() })
            ]
          }));

          // 📝 Description Row
          groupRows.push(new TableRow({
            children: [
              createQtyCell(p1.label || "Inspection photo", { shaded: true, align: "center", fontSize: 18 }),
              p2 ? createQtyCell(p2.label || "Inspection photo", { shaded: true, align: "center", fontSize: 18 }) : new TableCell({ children: [], borders: tableBorders() }),
            ]
          }));
        }

        children.push(new Table({ width: { size: 100, type: "pct" }, rows: groupRows }));
        children.push(new Paragraph({ children: [], spacing: { after: 100 } })); // Tiny spacer between groups
      }
    }
  }

  // END OF REPORT SECTION
  children.push(...createEndOfReportSection());

  return children;
}

// HELPER: Resolve Result for WM Summary
function resolveResultWM(found, accepted) {
  const f = parseInt(found || 0);
  const a = parseInt(accepted || 0);
  return f <= a ? "Pass" : "Fail";
}

// HELPER: Create Workmanship Defect Photo Grid (Matched to high-fidelity grid)
function createDefectPhotoGrid(photos) {
  const rows = [];
  for (let i = 0; i < photos.length; i += 2) {
    const p1 = photos[i];
    const p2 = photos[i + 1];

    // 1. Image Row
    rows.push(new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [
            p1 && p1.preview ? new Paragraph({
              children: [new ImageRun({ data: Buffer.from(p1.preview.split(",")[1], "base64"), type: "png", transformation: { width: 340, height: 230 } })],
              alignment: "center",
              spacing: { before: 100, after: 100 }
            }) : new Paragraph({ children: [] })
          ]
        }),
        new TableCell({
          borders: tableBorders(),
          children: [
            p2 && p2.preview ? new Paragraph({
              children: [new ImageRun({ data: Buffer.from(p2.preview.split(",")[1], "base64"), type: "png", transformation: { width: 340, height: 230 } })],
              alignment: "center",
              spacing: { before: 100, after: 100 }
            }) : new Paragraph({ children: [] })
          ]
        })
      ]
    }));

    // 2. Description Row
    rows.push(new TableRow({
      children: [
        p1 ? createQtyCell(p1.description || "Defect details", { bold: true, shaded: true }) : new TableCell({ children: [] }),
        p2 ? createQtyCell(p2.description || "Defect details", { bold: true, shaded: true }) : new TableCell({ children: [] }),
      ]
    }));
  }
  return new Table({ width: { size: 100, type: "pct" }, rows });
}

function createHighFidelityQuantityTable(data) {
  const qtyTable = Array.isArray(data.quantityTable) ? data.quantityTable : [];
  const unit = data.quantityUnit || "Kg";
  const packingProvided = data.packingListProvidedBy || "By Factory";
  const result = data.quantityResult || "Passed";
  const remark = data.quantityRemark || "N/A";

  // Calculate Totals (attempting to sum values, but preserving "/" if no valid numbers)
  const calculateTotal = (key) => {
    let sum = 0;
    let hasValid = false;
    qtyTable.forEach(row => {
      const val = parseFloat(row[key]);
      if (!isNaN(val)) {
        sum += val;
        hasValid = true;
      }
    });
    return hasValid ? String(sum) : "/";
  };

  const totalOrderQtyAmount = calculateTotal("orderQtyAmount");
  const totalOrderQtyCartons = calculateTotal("orderQtyCartons");
  const totalLoadedQtyAmount = calculateTotal("loadedQtyAmount");
  const totalLoadedQtyCartons = calculateTotal("loadedQtyCartons");
  const totalCartonsRemain = calculateTotal("cartonsRemain") === "/" ? "00" : calculateTotal("cartonsRemain");

  const rows = [
    // Header Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "A. QUANTITY", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })]
        }),
        new TableCell({
          columnSpan: 5,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: `Unit: ${unit}`, bold: true, size: 18 })], alignment: "right" })]
        })
      ]
    }),
    // Sub-header Row 1 (Main categories)
    new TableRow({
      children: [
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "P.O.", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Order Quantity", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Loaded Quantity", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Cartons Remain (After Loading)", bold: true, font: "Arial" })], alignment: "center" })] }),
      ]
    }),
    // Sub-header Row 2 (Sub categories)
    new TableRow({
      children: [
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: tableBorders(), children: [] }),
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: tableBorders(), children: [] }),
        createQtyCell("Quantity", { bold: true, shaded: true }),
        createQtyCell("Cartons", { bold: true, shaded: true }),
        createQtyCell("Quantity", { bold: true, shaded: true }),
        createQtyCell("Cartons", { bold: true, shaded: true }),
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: tableBorders(), children: [] }),
      ]
    }),
    // Data Rows
    ...qtyTable.map(row => new TableRow({
      children: [
        createQtyCell(row.po || "/"),
        createQtyCell(row.item || "/", { align: "left" }),
        createQtyCell(row.orderQtyAmount || "/"),
        createQtyCell(row.orderQtyCartons || "/"),
        createQtyCell(row.loadedQtyAmount || "/"),
        createQtyCell(row.loadedQtyCartons || "/"),
        createQtyCell(row.cartonsRemain || "00"),
      ]
    })),
    // Total Row
    new TableRow({
      children: [
        createQtyCell("Total:", { bold: true, colSpan: 2, align: "right" }),
        createQtyCell(totalOrderQtyAmount, { bold: true }),
        createQtyCell(totalOrderQtyCartons, { bold: true }),
        createQtyCell(totalLoadedQtyAmount, { bold: true }),
        createQtyCell(totalLoadedQtyCartons, { bold: true }),
        createQtyCell(totalCartonsRemain, { bold: true }),
      ]
    }),
    // Metadata Rows
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 7,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Packing List Provided by : ", bold: true }), new TextRun({ text: packingProvided })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, align: "left", width: { size: 15, type: "pct" } }),
        createQtyCell(result, { colSpan: 6, align: "left", bold: true, color: result.toLowerCase().includes("pass") ? "228B22" : "CC0000" })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left", width: { size: 15, type: "pct" } }),
        createQtyCell(remark, { colSpan: 6, align: "left" })
      ]
    })
  ];

  return new Table({ width: { size: 100, type: "pct" }, rows });
}



/**
 * Returns a Buffer of the image. 
 * Prioritizes cloud storage (Wasabi) if a key or url is present.
 */
async function getImageBuffer(photoData) {
  if (!photoData) return null;

  // If photoData is a string, check if it's a base64 or URL directly
  if (typeof photoData === "string") {
    if (photoData.startsWith("data:image")) {
      try {
        const base64 = photoData.split(",")[1];
        return Buffer.from(base64, "base64");
      } catch (e) {
        return null;
      }
    }
    if (photoData.startsWith("http")) {
      try {
        console.log(`🌐 Fetching image from HTTP URL string: ${photoData}`);
        const res = await fetch(photoData);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (e) {
        console.warn(`HTTP string fetch failed for ${photoData}`, e.message);
      }
    }
    return null;
  }

  // 1. Try fetching from URL first if it starts with http
  if (photoData.url && typeof photoData.url === "string" && photoData.url.startsWith("http")) {
    try {
      console.log(`🌐 Fetching image from HTTP URL: ${photoData.url}`);
      const res = await fetch(photoData.url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      console.warn(`HTTP fetch failed for ${photoData.url} with status: ${res.status}`);
    } catch (error) {
      console.warn(`HTTP fetch failed for ${photoData.url}`, error.message);
    }
  }

  // 2. Try Wasabi Cloud Storage if key is present
  const wasabiKey = photoData.wasabiKey || (photoData.url && typeof photoData.url === "string" && photoData.url.includes("wasabisys.com/") ? photoData.url.split("wasabisys.com/")[1] : null);
  if (wasabiKey) {
    try {
      console.log(`☁️ Fetching image from Wasabi: ${wasabiKey}`);
      const params = {
        Bucket: wasabiService.bucket,
        Key: wasabiKey,
      };

      const { Body } = await wasabiService.s3.send(new (require("@aws-sdk/client-s3").GetObjectCommand)(params));

      // Convert stream to Buffer
      const chunks = [];
      for await (const chunk of Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.warn(`Wasabi fetch failed for ${wasabiKey}, falling back to local preview.`, error.message);
    }
  }

  // 3. Fallback to local base64 preview
  if (photoData.preview && typeof photoData.preview === "string" && photoData.preview.includes(",")) {
    try {
      const base64 = photoData.preview.split(",")[1];
      return Buffer.from(base64, "base64");
    } catch (e) {
      console.warn("Failed to parse local base64 preview.");
    }
  }

  return null;
}

function getPhotoContent(photoData, uploadedFiles, allData = {}) {
  let preview = "";

  if (typeof photoData === "string" && photoData.startsWith("data:image")) {
    preview = photoData;
  } else if (uploadedFiles && uploadedFiles[0]?.path) {
    preview = `data:image/png;base64,${fs.readFileSync(uploadedFiles[0].path).toString("base64")}`;
  } else if (allData.reportPhotoGroups && allData.reportPhotoGroups.length > 0) {
    // Try to find first photo in containerPhotos group or first group
    const containerGroup = allData.reportPhotoGroups.find(g => g.id === "containerPhotos") || allData.reportPhotoGroups[0];
    if (containerGroup && containerGroup.photos && containerGroup.photos.length > 0) {
      preview = containerGroup.photos[0].preview || "";
    }
  }

  if (!preview || !preview.startsWith("data:image")) {
    return [new Paragraph({ children: [new TextRun({ text: "[No Container Photo]", italics: true, color: "888888" })], alignment: "center" })];
  }

  try {
    const base64 = preview.split(",")[1];
    return [new Paragraph({
      children: [new ImageRun({ data: Buffer.from(base64, "base64"), type: "png", transformation: { width: 320, height: 260 } })],
      alignment: "center",
      spacing: { before: 0, after: 0 }
    })];
  } catch (e) {
    return [new Paragraph({ children: [new TextRun({ text: "[Photo Error]" })], alignment: "center", spacing: { before: 0, after: 0 } })];
  }
}

function getGroupedPhotoGridParagraphs(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return [];
  const children = [new Paragraph({ children: [new TextRun({ text: "H. PHOTOS", bold: true, size: 22, color: "1F4E79" })] })];
  groups.forEach(g => {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Group: " + (g.description || "-"), bold: true })],
      spacing: { before: 200, after: 100 }
    }));
    const photos = (g.photos || []).filter(p => p.preview);
    for (let i = 0; i < photos.length; i += 2) {
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({
          children: [
            createPhotoCell(photos[i]),
            photos[i + 1] ? createPhotoCell(photos[i + 1]) : new TableCell({ children: [new Paragraph({ children: [] })] })
          ]
        })]
      }));
    }
  });
  return children;
}

async function createPhotoCell(p) {
  try {
    const imgBuffer = await getImageBuffer(p);
    if (!imgBuffer) throw new Error("No image data");

    return new TableCell({
      borders: tableBorders(),
      children: [
        new Paragraph({
          children: [new ImageRun({ data: imgBuffer, type: "png", transformation: { width: 340, height: 230 } })],
          alignment: "center",
          spacing: { before: 100, after: 100 }
        })
      ]
    });
  } catch (e) { return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Error loading photo" })] })] }); }
}

async function createInlinePhotoGridRows(photos, opts = { cellWidth: 320, cellHeight: 220 }) {
  const tableRows = [];
  for (let i = 0; i < photos.length; i += 2) {
    tableRows.push(new TableRow({
      children: [
        await createInlinePhotoCell(photos[i], opts),
        photos[i + 1] ? await createInlinePhotoCell(photos[i + 1], opts) : new TableCell({ children: [new Paragraph({ children: [] })], borders: tableBorders(), columnSpan: opts.colSpan || 1 })
      ]
    }));
  }
  return tableRows;
}

async function createInlinePhotoGridTable(photos, opts = { cellWidth: 320, cellHeight: 220 }) {
  const tableRows = await createInlinePhotoGridRows(photos, opts);
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}

async function createInlinePhotoCell(p, opts) {
  try {
    const imgBuffer = await getImageBuffer(p);
    if (!imgBuffer) throw new Error("No image buffer");

    return new TableCell({
      borders: tableBorders(),
      columnSpan: opts.colSpan || 1,
      children: [
        new Paragraph({ children: [new ImageRun({ data: imgBuffer, type: "png", transformation: { width: opts.cellWidth, height: opts.cellHeight } })], alignment: "center" }),
        new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(p.label || ""), size: 18 })], alignment: "center" })
      ]
    });
  } catch (e) { return new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Error loading photo" })] })], borders: tableBorders(), columnSpan: opts.colSpan || 1 }); }
}

// HELPER: Blank if empty
function blankIfEmpty(val) {
  if (val === undefined || val === null || val === "") return "-";
  return sanitizeDocxText(val);
}

function createProductConformityTable(data) {
  const tableRows = [
    // Header
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({
            children: [new TextRun({ text: "B. PRODUCT CONFORMITY", bold: true, size: 22, color: "1F4E79", font: "Arial" })],
            alignment: "left"
          })]
        })
      ]
    }),
    // Selected Cartons
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          borders: tableBorders(),
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Selected Cartons : ", bold: true }),
              new TextRun({ text: data.selectedCartons || "(3 carton per model)" })
            ]
          })]
        })
      ]
    }),
    // Random Info
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.randomSelectionInfo || "12 Cartons were selected randomly on site. No carton number in shipping mark.", underline: { type: UnderlineType.SINGLE } })] })]
        })
      ]
    }),
    // Carton No
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.cartonNoInfo || "Carton No.: NA" })] })]
        })
      ]
    }),
    // Small Grid Row
    new TableRow({
      children: [
        createQtyCell(asVal(data.productName), { width: { size: 25, type: "pct" } }),
        ...Array(9).fill(0).map(() => createQtyCell("/", { align: "center", width: { size: 8, type: "pct" } }))
      ]
    }),
    // Check Contents Subheader
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Check Contents Inside Packaging", bold: true })] })]
        })
      ]
    }),
    // 1. Style and Color
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "1. Style and Color", bold: true })] })]
        })
      ]
    }),
    // Style and Color Table Header
    new TableRow({
      children: [
        createQtyCell("Description", { bold: true, align: "center", width: { size: 80, type: "pct" }, colSpan: 9 }),
        createQtyCell("Result", { bold: true, align: "center", width: { size: 20, type: "pct" } })
      ]
    }),
    // Style and Color Rows
    ...[
      data.styleColorDesc1 || " - Conform to product specification (Including color, accessories, hangtag/labels, logo/markings)",
      data.styleColorDesc2 || " - Conform to reference sample",
      data.styleColorDesc3 || " - Conform to product digital photo",
      data.styleColorDesc4 || " - Others"
    ].map((desc, i) => new TableRow({
      children: [
        createQtyCell(desc, { align: "left", colSpan: 9 }),
        createQtyCell(i < 3 ? (data.styleColorResult || "N/A") : "", { align: "center" })
      ]
    })),
    // 2. Workmanship
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "2. Workmanship & Function Check (2 units per model, but no more than 20 units)", bold: true })] })]
        })
      ]
    }),
    // Workmanship Table Header
    new TableRow({
      children: [
        createQtyCell("Description", { bold: true, align: "center", width: { size: 80, type: "pct" }, colSpan: 9 }),
        createQtyCell("Result", { bold: true, align: "center", width: { size: 20, type: "pct" } })
      ]
    }),
    ...[
      data.workmanshipDesc1 || " - Obvious visual defects (appearance, artwork, logo)",
      data.workmanshipDesc2 || " - Base function check (no need to use equipment to check)"
    ].map(desc => new TableRow({
      children: [
        createQtyCell(desc, { align: "left", colSpan: 9 }),
        createQtyCell(data.workmanshipResult || "N/A", { align: "center" })
      ]
    })),
    // Final Result Row
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, width: { size: 20, type: "pct" }, shaded: true }),
        createQtyCell(data.conformityOverallResult || "N/A", { align: "left", colSpan: 9 })
      ]
    }),
    // Remark Row
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, width: { size: 20, type: "pct" }, shaded: true }),
        createQtyCell(data.conformityRemark || "N/A", { align: "left", colSpan: 9 })
      ]
    })
  ];

  return new Table({ width: { size: 100, type: "pct" }, rows: tableRows });
}

function createCLSPackingTable(data) {
  // Package icon
  let packageIconRun = null;
  try {
    if (fs.existsSync(PACKAGE_ICON_PATH)) {
      packageIconRun = new ImageRun({ data: fs.readFileSync(PACKAGE_ICON_PATH), type: "png", transformation: { width: 50, height: 50 } });
    }
  } catch (e) { }

  const packingItems = Array.isArray(data.clsPackingItems) ? data.clsPackingItems : [];

  const rows = [
    // Header
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 8,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "C. PACKING", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })]
        })
      ]
    }),
    // Package Details + Icon
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 6,
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Package Details", bold: true, font: "Arial" })] })]
        }),
        new TableCell({
          columnSpan: 2,
          borders: tableBorders(),
          children: [packageIconRun ? new Paragraph({ children: [packageIconRun], alignment: "right" }) : new Paragraph({ children: [] })]
        })
      ]
    }),
    // Sub-headers Row 1
    new TableRow({
      children: [
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Item No.", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Qty / Carton", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Qty / Inner Box", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Gross Weight (KG)", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Carton Size\n(L x W x H, cm)", bold: true, font: "Arial" })], alignment: "center" })] }),
      ]
    }),
    // Sub-headers Row 2
    new TableRow({
      children: [
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [] }),
        createQtyCell("Marking", { bold: true, shaded: true }),
        createQtyCell("Actual", { bold: true, shaded: true }),
        createQtyCell("Marking", { bold: true, shaded: true }),
        createQtyCell("Actual", { bold: true, shaded: true }),
        createQtyCell("Marking", { bold: true, shaded: true }),
        createQtyCell("Actual", { bold: true, shaded: true }),
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [] }),
      ]
    }),
    // Dynamic packing items
    ...packingItems.map(item => new TableRow({
      children: [
        createQtyCell(item.itemName || "/", { align: "left" }),
        createQtyCell(item.qtyCartonMarking || "/"),
        createQtyCell(item.qtyCartonActual || "/"),
        createQtyCell(item.qtyInnerMarking || "/"),
        createQtyCell(item.qtyInnerActual || "/"),
        createQtyCell(item.weightMarking || "/"),
        createQtyCell(item.weightActual || "/"),
        createQtyCell(item.cartonSize || "/"),
      ]
    })),
    // Condition of Carton
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 8,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Condition of Carton", bold: true })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Description", { bold: true, colSpan: 6, shaded: true }),
        createQtyCell("Result", { bold: true, colSpan: 2, shaded: true }),
      ]
    }),
    // Dynamic condition rows
    ...(Array.isArray(data.clsCartonConditions) ? data.clsCartonConditions : [{ description: "/", result: "/" }]).map(c => new TableRow({
      children: [
        createQtyCell(c.description || "/", { align: "left", colSpan: 6 }),
        createQtyCell(c.result || "/", { colSpan: 2 }),
      ]
    })),
    // Export Carton Details
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 8,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Export Carton Details", bold: true })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Fastening Metal Staples", { colSpan: 2, align: "left" }),
        createQtyCell(data.cls_fastening_metal_staples || "/", { colSpan: 2, align: "left" }),
        createQtyCell("Nylon Band", { colSpan: 2, align: "left" }),
        createQtyCell(data.cls_nylon_band || "Yes", { colSpan: 2, align: "left" }),
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Material", { colSpan: 2, align: "left" }),
        createQtyCell(data.cls_material || "/", { colSpan: 2, align: "left" }),
        createQtyCell("Corrugated Paper Plies", { colSpan: 2, align: "left" }),
        createQtyCell(data.cls_corrugated_paper_plies || "/", { colSpan: 2, align: "left" }),
      ]
    }),
    // Packing Method
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 8,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Packing Method", bold: true })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(data.cls_packing_method || "/", { colSpan: 8, align: "left" })
      ]
    }),
    // Assortment Method
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 8,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Assortment Method", bold: true })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(data.cls_assortment_method || "No assortment packing", { colSpan: 8, align: "left" })
      ]
    }),
    // Shipping Marks
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 8,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Shipping Marks", bold: true })] })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(data.cls_shipping_marks_label || "Shipping Marks (on 2 Side )", { colSpan: 5, align: "left" }),
        createQtyCell(data.cls_shipping_marks_result || "Actual finding", { colSpan: 3 }),
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(data.cls_side_marks_label || "Side Marks (on 2 Side )", { colSpan: 5, align: "left" }),
        createQtyCell(data.cls_side_marks_result || "Actual finding", { colSpan: 3 }),
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(data.cls_inner_box_marks_label || "Inner Box Marks (on /Side )", { colSpan: 5, align: "left" }),
        createQtyCell(data.cls_inner_box_marks_result || "Actual finding", { colSpan: 3 }),
      ]
    }),
    // Result
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, shaded: true, width: { size: 15, type: "pct" } }),
        createQtyCell(data.cls_packing_result || "Passed", { colSpan: 7, align: "left", bold: true, color: String(data.cls_packing_result || "Passed").toLowerCase().includes("fail") ? "CC0000" : "228B22" }),
      ]
    }),
    // Remark
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, shaded: true, width: { size: 15, type: "pct" } }),
        createQtyCell(data.cls_packing_remark || "", { colSpan: 7, align: "left" }),
      ]
    }),
  ];

  return new Table({ width: { size: 100, type: "pct" }, rows });
}

function createCLSLoadingProcessTable(data) {
  const containerCheck = Array.isArray(data.containerCheck) ? data.containerCheck : [];
  const loadingCheck = Array.isArray(data.loadingCheck) ? data.loadingCheck : [];
  const containerClosing = Array.isArray(data.containerClosing) ? data.containerClosing : [];

  const rows = [
    // 1. Section Header
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 6,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "D. LOADING PROCESS", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })]
        })
      ]
    }),

    // 2. Container Sub-section
    new TableRow({
      children: [
        new TableCell({ columnSpan: 6, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Container:", bold: true, font: "Arial" })] })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Container Type", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Container No.", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Seal No.", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ verticalMerge: VerticalMergeType.RESTART, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Seal No. (AV) If used", bold: true, font: "Arial" })], alignment: "center" })] }),
        new TableCell({ columnSpan: 2, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Loaded Cargo", bold: true, font: "Arial" })], alignment: "center" })] }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [] }),
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [] }),
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [] }),
        new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [] }),
        createQtyCell("Item No.", { bold: true, shaded: true }),
        createQtyCell("Loaded Carton", { bold: true, shaded: true }),
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(data.containerType || "/"),
        createQtyCell(data.containerNo || "/"),
        createQtyCell(data.sealNo || "/"),
        createQtyCell(data.avSealNo || "/"),
        createQtyCell(data.cargoBreakdown || "/"),
        createQtyCell(data.loadedCarton || "/"),
      ]
    }),

    // 3. Loading Condition Sub-section
    new TableRow({
      children: [
        new TableCell({ columnSpan: 6, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Loading Condition", bold: true, font: "Arial" })] })] })
      ]
    }),
    ...[
      ["Loading Location:", data.location],
      ["Weather:", data.weather],
      ["Sheltered:", data.shelter],
      ["Start Time:", data.loadingStartTime],
      ["End Time:", data.loadingEndTime]
    ].map(([l, v]) => new TableRow({
      children: [
        createQtyCell(l, { bold: true, align: "right", colSpan: 2 }),
        createQtyCell(blankIfEmpty(v), { align: "left", colSpan: 4 })
      ]
    })),

    // 4. Empty Container Check Sub-section
    new TableRow({
      children: [
        new TableCell({ columnSpan: 6, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Empty Container Check", bold: true, font: "Arial" })] })] })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("No.", { bold: true, shaded: true }),
        createQtyCell("Requirement conditions", { bold: true, shaded: true, colSpan: 4 }),
        createQtyCell("Result", { bold: true, shaded: true }),
      ]
    }),
    ...containerCheck.map((c, i) => new TableRow({
      children: [
        createQtyCell(String(i + 1)),
        createQtyCell(c.label || "/", { align: "left", colSpan: 4 }),
        createQtyCell(c.result || "N/A", { color: String(c.result || "").toLowerCase().includes("pass") || String(c.result || "").toLowerCase() === "yes" ? "228B22" : "CC0000" })
      ]
    })),

    // 5. Loading Check Sub-section
    new TableRow({
      children: [
        new TableCell({ columnSpan: 6, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Loading Check - 1/4 Full, 1/2 Full, 3/4 Full, Full container", bold: true, font: "Arial" })] })] })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("No.", { bold: true, shaded: true }),
        createQtyCell("Condition", { bold: true, shaded: true, colSpan: 3 }),
        createQtyCell("Result", { bold: true, shaded: true }),
        createQtyCell("Findings and comments", { bold: true, shaded: true }),
      ]
    }),
    ...loadingCheck.map((c, i) => new TableRow({
      children: [
        createQtyCell(String(i + 1)),
        createQtyCell(c.label || "/", { align: "left", colSpan: 3 }),
        createQtyCell(c.result || "N/A", { color: String(c.result || "").toLowerCase().includes("pass") || String(c.result || "").toLowerCase() === "yes" ? "228B22" : "CC0000" }),
        createQtyCell(c.finding || "/")
      ]
    })),

    // 6. Container Closing Sub-section
    new TableRow({
      children: [
        new TableCell({ columnSpan: 6, shading: { fill: "F2F2F2" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Container Closing:", bold: true, font: "Arial" })] })] })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("No.", { bold: true, shaded: true }),
        createQtyCell("Condition", { bold: true, shaded: true, colSpan: 3 }),
        createQtyCell("Result", { bold: true, shaded: true }),
        createQtyCell("Findings and comments", { bold: true, shaded: true }),
      ]
    }),
    ...containerClosing.map((c, i) => new TableRow({
      children: [
        createQtyCell(String(i + 1)),
        createQtyCell(c.label || "/", { align: "left", colSpan: 3 }),
        createQtyCell(c.result || "N/A", { color: String(c.result || "").toLowerCase().includes("pass") || String(c.result || "").toLowerCase() === "yes" ? "228B22" : "CC0000" }),
        createQtyCell(c.finding || "/")
      ]
    })),

    // 7. Result & Remark Sub-section
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, colSpan: 2, shaded: true }),
        createQtyCell(data.loadingProcessResult || "Passed", { align: "left", bold: true, colSpan: 4, color: String(data.loadingProcessResult || "").toLowerCase().includes("fail") ? "CC0000" : "228B22" })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, colSpan: 2, shaded: true }),
        createQtyCell(data.remarks_loading || "N/A", { align: "left", colSpan: 4 })
      ]
    })
  ];

  return [new Table({ width: { size: 100, type: "pct" }, rows })];
}

function createCLSClientRequirementTable(data) {
  const reqTable = Array.isArray(data.clientRequirementTable) ? data.clientRequirementTable : [];
  const clientPhotos = (data.reportPhotoGroups || []).find(g => g.description?.toLowerCase().includes("client requirement"))?.photos || [];

  const children = [
    new Table({
      width: { size: 100, type: "pct" },
      rows: [
        // Main Header
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "E. CLIENT SPECIAL REQUIREMENT", bold: true, size: 22, color: "1F4E79", font: "Arial" })] })]
            })
          ]
        }),
        // Table Header
        new TableRow({
          children: [
            createQtyCell("No.", { bold: true, shaded: true, width: { size: 10, type: "pct" } }),
            createQtyCell("Client Requirements", { bold: true, shaded: true, width: { size: 65, type: "pct" } }),
            createQtyCell("Result", { bold: true, shaded: true, width: { size: 25, type: "pct" } }),
          ]
        }),
        // Data Rows
        ...reqTable.map((row, i) => new TableRow({
          children: [
            createQtyCell(String(i + 1) + "."),
            createQtyCell(row.requirement || "/", { align: "left" }),
            createQtyCell(row.result || "Actual finding")
          ]
        })),
        // If no rows
        ...(reqTable.length === 0 ? [new TableRow({ children: [createQtyCell("1."), createQtyCell("/", { align: "left" }), createQtyCell("Actual finding")] })] : []),
        // Overall Result Row
        new TableRow({
          children: [
            createQtyCell("Result:", { bold: true, width: { size: 15, type: "pct" }, shaded: true }),
            createQtyCell(data.client_requirement_result || "Passed", {
              colSpan: 2,
              align: "left",
              bold: true,
              color: String(data.client_requirement_result || "").toLowerCase().includes("fail") ? "CC0000" : "228B22"
            })
          ]
        }),
        // Remark Row
        new TableRow({
          children: [
            createQtyCell("Remark:", { bold: true, width: { size: 15, type: "pct" }, shaded: true }),
            createQtyCell(data.client_requirement_remark || "N/A", { colSpan: 2, align: "left" })
          ]
        })
      ]
    }),
    new Paragraph({ children: [], spacing: { before: 100 } }),
  ];

  return children;
}

async function createCLSFinalPhotosSection(data) {
  const photoGroups = (data.reportPhotoGroups || []).filter(g => {
    const desc = (g.description || "").toLowerCase();
    // Exclude remark photos group only since it is already rendered in the remarks table to avoid duplication
    return g.id !== "remarkPhotos" && !desc.includes("remark");
  });

  const rows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "F. PHOTOS", bold: true, size: 22, color: "1F4E79", font: "Arial" })
              ]
            })
          ]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("No.", { bold: true, shaded: true, width: { size: 10, type: "pct" } }),
        createQtyCell("Description", { bold: true, shaded: true, width: { size: 90, type: "pct" } }),
      ]
    })
  ];

  for (let i = 0; i < photoGroups.length; i++) {
    const g = photoGroups[i];
    const photos = (g.photos || []).filter(p => p.preview || p.wasabiKey || p.url);

    rows.push(new TableRow({
      children: [
        createQtyCell(String(i + 1)),
        createQtyCell(g.description || "Inspection Photos", { align: "left" })
      ]
    }));

    rows.push(new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: g.description || "Photos", bold: true, font: "Arial" })] })]
        })
      ]
    }));

    if (photos.length > 0) {
      const photoRows = await createInlinePhotoGridRows(photos, { cellWidth: 320, cellHeight: 220, colSpan: 1 });
      for (const row of photoRows) rows.push(row);
    } else {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [] })], borders: tableBorders() }),
          new TableCell({ children: [new Paragraph({ children: [] })], borders: tableBorders() })
        ]
      }));
    }
  }

  return [
    new Table({ width: { size: 100, type: "pct" }, rows })
  ];
}

function createEndOfReportSection() {
  return [
    new Paragraph({ children: [], spacing: { before: 400 } }),
    new Table({
      width: { size: 100, type: "pct" },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: "single", size: 12, color: "1F4E79" },
                bottom: { style: "single", size: 12, color: "1F4E79" },
                left: { style: "none" },
                right: { style: "none" }
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "END OF REPORT", bold: true, size: 28, color: "1F4E79", font: "Arial" })],
                  alignment: "center",
                  spacing: { before: 200, after: 200 }
                })
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({ children: [], spacing: { before: 300 } }),
    new Paragraph({
      children: [new TextRun({ text: "Important Note:", bold: true, size: 24, color: "1F4E79" })],
      alignment: "left",
      spacing: { after: 200 }
    }),
    ...[
      "1. THIS REPORT REFLECTS ABSOLUTE VERITAS FINDINGS AT THE TIME AND PLACE OF INSPECTION.",
      "2. THIS REPORT DOES NOT RELEASE THE BUYER OR SELLER FROM CONTRACTUAL RESPONSIBILITIES, NOR DOES IT PREJUDICE THE BUYER'S RIGHT OF CLAIM TOWARD THE SELLER/SUPPLIER FOR COMPENSATION FOR ANY APPARENT AND/OR HIDDEN DEFECTS NOT DETECTED DURING INSPECTION OR OCCURRING ANYTIME THEREAFTER.",
      "3. THIS REPORT DOES NOT PROVE SHIPMENT.",
      "4. RESULTS ARE RELATED TO ONLY THE SAMPLE TESTED.",
      "5. THE INSPECTION SCOPE IS BASED ON AGREEMENT BETWEEN ABSOLUTE VERITAS AND BUYER, ABSOLUTE VERITAS RESPONSIBILITY IS ONLY LIMITED TO REQUESTED CHECKING POINTS."
    ].map(text => new Paragraph({
      children: [new TextRun({ text, size: 18 })],
      alignment: "left",
      spacing: { before: 100, after: 100 },
      indent: { left: 440, hanging: 440 }
    }))
  ];
}

module.exports = {
  createHeaderTable,
  createReportContent
};
