  const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  WidthType,
  BorderStyle,
  ImageRun,
  PageBreak,
  convertInchesToTwip,
} = require("docx");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/generate", upload.array("images"), async (req, res) => {
  const data = enrichReportHeaderData(normalizePayload(req.body));

  try {
    const doc = new Document({
      creator: "Report App",
      lastModifiedBy: "Report App",
      title: "Inspection Report",
      description: "Generated pre-shipment inspection report",
      revision: 1,
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                createHeaderTable(data),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Page 1 of 33",
                      bold: true,
                      size: 18,
                      color: "333333",
                    }),
                  ],
                  alignment: "right",
                  spacing: { before: 100, after: 0 },
                }),
              ],
            }),
          },
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1.6),
                right: convertInchesToTwip(0.6),
                bottom: convertInchesToTwip(0.6),
                left: convertInchesToTwip(0.6),
                header: convertInchesToTwip(0.3),
                footer: convertInchesToTwip(0.3),
              },
            },
          },
          children: [
            ...createReportContent(data, req.files || []),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", "attachment; filename=report.docx");
    res.send(buffer);

    // Clean up uploaded files after sending
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      });
    }
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({
      error: "Error generating report",
      detail: error?.message || "Unknown server error",
    });
  }
});

function createHeaderTable(data) {
  const header = data.reportHeader || {};
  const logoPath = path.join(__dirname, "frontend", "public", "company-logo.png");

  let logoRun = null;
  try {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoRun = new ImageRun({
        data: logoBuffer,
        type: "png",
        transformation: {
          width: 150,
          height: 75,
        },
      });
    }
  } catch (e) {
    console.warn("Could not load logo image:", e.message);
  }

  return new Table({
    width: { size: 100, type: "pct" },
    rows: [
      new TableRow({
        children: [
          // Left cell - Logo
          new TableCell({
            width: { size: 15, type: "pct" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              right: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
            },
            margins: { top: 60, bottom: 0, left: 40, right: 40 },
            children: [
              ...(logoRun
                ? [
                    new Paragraph({
                      children: [logoRun],
                      alignment: "center",
                      spacing: { after: 0 },
                    }),
                  ]
                : [
                    new Paragraph({
                      children: [new TextRun({ text: "" })],
                    }),
                  ]),
            ],
          }),

          // Middle cell - Information table
          new TableCell({
            width: { size: 60, type: "pct" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              right: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
            },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              new Table({
                width: { size: 100, type: "pct" },
                rows: [
                  // Row 1: Client Name & FRIN
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 40, type: "pct" },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          left: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          right: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                        },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Client Name (abbr.):",
                                bold: true,
                                size: 18,
                                color: "1F1F1F",
                              }),
                            ],
                            spacing: { after: 0 },
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 60, type: "pct" },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          left: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          right: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                        },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "FRIN",
                                bold: true,
                                size: 18,
                                color: "1F1F1F",
                              }),
                            ],
                            spacing: { after: 0 },
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Row 2: Inspection Number
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 40, type: "pct" },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          left: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          right: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                        },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Inspection Number:",
                                bold: true,
                                size: 18,
                                color: "1F1F1F",
                              }),
                            ],
                            spacing: { after: 0 },
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 60, type: "pct" },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: sanitizeDocxText(header.inspectionNumber || "-"),
                                bold: true,
                                size: 18,
                                color: "1F1F1F",
                              }),
                            ],
                            spacing: { after: 0 },
                          }),
                        ],
                      }),
                    ],
                  }),

                  // Row 3: Report Date
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 40, type: "pct" },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          left: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                          right: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
                        },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Report Date:",
                                bold: true,
                                size: 18,
                                color: "1F1F1F",
                              }),
                            ],
                            spacing: { after: 0 },
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 60, type: "pct" },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                        },
                        margins: { top: 40, bottom: 40, left: 40, right: 40 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: sanitizeDocxText(header.reportDate || "-"),
                                bold: true,
                                size: 18,
                                color: "1F1F1F",
                              }),
                            ],
                            spacing: { after: 0 },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Right cell - Conclusion (spans all rows)
          new TableCell({
            width: { size: 25, type: "pct" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
              right: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
            },
            margins: { top: 40, bottom: 40, left: 50, right: 50 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Conclusion",
                    bold: true,
                    size: 18,
                    color: "1F1F1F",
                  }),
                ],
                alignment: "center",
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: sanitizeDocxText(header.conclusion || "-"),
                    bold: true,
                    size: 32,
                    color:
                      header.conclusion === "FAILED"
                        ? "CC0000"
                        : header.conclusion === "PASSED"
                        ? "004400"
                        : "1F1F1F",
                  }),
                ],
                alignment: "center",
                spacing: { after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createReportContent(data, uploadedFiles) {
  const children = [];
  const blankIfEmpty = (value) => {
    if (typeof value === "string" && value.trim().length > 0) return value;
    if (typeof value === "number") return String(value);
    return "-";
  };

  // I. GENERAL INFORMATION - Table with title header and section header
  const generalInfoData = [
    ["Service Performed:", data.servicePerformed || "-"],
    ["Client:", data.client || "-"],
    ["Supplier:", data.supplier || "-"],
    ["Factory:", data.factory || "-"],
    ["Product Name:", data.productName || "-"],
    ["P.O. No.:", data.po || "-"],
    ["Item No.:", data.itemNo || "-"],
    ["Destination Country:", data.country || "-"],
    ["Inspection Date:", data.inspectionDate || "-"],
    ["Inspection Location:", data.inspectionLocation || "-"],
    ["Reference Sample:", data.referenceSample || "-"],
  ];

  const generalInfoRows = [
    // Title row (no background shading)
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Pre-Shipment Inspection Report",
                  bold: true,
                  size: 24,
                  color: "2C5AA0",
                }),
              ],
              alignment: "center",
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // Section header row (no background shading)
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "I. GENERAL INFORMATION",
                  bold: true,
                  size: 20,
                  color: "2C5AA0",
                }),
              ],
              alignment: "left",
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // First data row with row span for photo column
    new TableRow({
      children: [
        new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: sanitizeDocxText(generalInfoData[0][0]), bold: true, size: 18, color: "1F1F1F" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 44, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: sanitizeDocxText(generalInfoData[0][1]), size: 18, color: "1F1F1F" })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          rowSpan: generalInfoData.length,
          borders: tableBorders(),
          children: getPhotoContent(data.generalPhoto, uploadedFiles),
        }),
      ],
    }),
    // Remaining data rows (without photo column due to rowSpan)
    ...generalInfoData.slice(1).map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 26, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            shading: { fill: "E8E8E8" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: sanitizeDocxText(label), bold: true, size: 18, color: "1F1F1F" })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 44, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: sanitizeDocxText(value), size: 18, color: "1F1F1F" })],
              }),
            ],
          }),
        ],
      })
    ),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: generalInfoRows,
    })
  );

  children.push(new Paragraph(""));

  // II. INSPECTION SUMMARY
  const sectionHeaderBlue = "1F4E79";
  const sectionHeaderFill = "E8E8E8";
  const headerRowFill = "F2F2F2";
  const yesColor = "228B22";
  const noColor = "D7263D";
  const pendingColor = "F59E42";
  const naColor = "222222";

  const makeSummaryHeaderCell = (text, { color } = {}) =>
    new TableCell({
      borders: tableBorders(),
      shading: { fill: headerRowFill },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: sanitizeDocxText(text),
              bold: true,
              size: 18,
              ...(color ? { color } : {}),
            }),
          ],
          alignment: "center",
        }),
      ],
    });

  const makeSummaryLabelCell = (text) =>
    new TableCell({
      borders: tableBorders(),
      children: [
        new Paragraph({
          children: [new TextRun({ text: sanitizeDocxText(text), size: 18, color: "1F1F1F" })],
        }),
      ],
    });

  const makeTickCell = (isTick, color) =>
    new TableCell({
      borders: tableBorders(),
      children: [
        new Paragraph({
          children: [new TextRun({ text: isTick ? "✓" : "", bold: true, size: 20, color })],
          alignment: "center",
        }),
      ],
    });

  const normalizeResult = (v) => String(v || "").trim().toLowerCase();
  const resultKey = (v) => {
    const n = normalizeResult(v);
    if (n === "passed" || n === "pass") return "passed";
    if (n === "failed" || n === "fail") return "failed";
    if (n === "pending") return "pending";
    if (n === "n/a" || n === "na") return "na";
    return "";
  };

  const inspectionSummaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            borders: tableBorders(),
            shading: { fill: sectionHeaderFill },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "II. INSPECTION SUMMARY",
                    bold: true,
                    size: 22,
                    color: sectionHeaderBlue,
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          makeSummaryHeaderCell("", {}),
          makeSummaryHeaderCell("Passed", { color: yesColor }),
          makeSummaryHeaderCell("Failed", { color: noColor }),
          makeSummaryHeaderCell("Pending", { color: pendingColor }),
          makeSummaryHeaderCell("N/A", { color: naColor }),
        ],
      }),
      ...[
        { label: "A. Quantity", value: data.quantity },
        { label: "B. Workmanship", value: data.workmanship },
        { label: "C. On-Site Tests", value: data.onSiteTests },
        { label: "D. Dimensions", value: data.dimensions },
        { label: "E. Packing", value: data.packingResult },
        { label: "F. Marking & Labeling", value: data.marking_result_final },
        { label: "G. Client Special Requirement", value: data.client_requirement_result },
      ].map((row) => {
        const key = resultKey(row.value);
        return new TableRow({
          children: [
            makeSummaryLabelCell(row.label),
            makeTickCell(key === "passed", yesColor),
            makeTickCell(key === "failed", noColor),
            makeTickCell(key === "pending", pendingColor),
            makeTickCell(key === "na", naColor),
          ],
        });
      }),
    ],
  });

  children.push(inspectionSummaryTable);

  // Workmanship Summary (based on the finished products) - separate table like reference
  const wmResultValue = String(data.workmanshipResult || data.workmanship || "Pending");
  const wmResultKey = resultKey(wmResultValue);
  const wmResultColor = wmResultKey === "failed" ? "CC0000" : wmResultKey === "passed" ? "228B22" : "222222";
  const redIfNonEmpty = (txt) => (typeof txt === "string" && txt.trim() ? "CC0000" : undefined);

  const workmanshipSummaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 6,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Workmanship Summary (based on the finished products)", bold: true, size: 18 })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("Inspection Standard:", { bold: true, align: "left", shaded: true }),
          new TableCell({
            columnSpan: 2,
            borders: tableBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(data.inspectionStandardWM || "ANSI/ASQ Z1.4 (ISO 2859-1)"), size: 18 })] })],
          }),
          createQtyCell("Critical", { bold: true, shaded: true }),
          createQtyCell("Major", { bold: true, shaded: true }),
          createQtyCell("Minor", { bold: true, shaded: true }),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("Sampling Plan:", { bold: true, align: "left", shaded: true }),
          createQtyCell(data.samplingPlanWM || "Fixed Sample Size", { align: "left" }),
          createQtyCell("AQL:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.aqlCriticalWM || "Not Allowed"),
          createQtyCell(data.aqlMajorWM || "2.5"),
          createQtyCell(data.aqlMinorWM || "4.0"),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("Inspection Level:", { bold: true, align: "left", shaded: true }),
          createQtyCell(data.inspectionLevelWM || "Level II", { align: "left" }),
          createQtyCell("Accepted:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.acceptedCritical || "00"),
          createQtyCell(data.acceptedMajor || "00"),
          createQtyCell(data.acceptedMinor || "00"),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("Order Quantity:", { bold: true, align: "left", shaded: true }),
          createQtyCell(data.orderQuantityWM || data.orderQuantity || "-", { align: "left" }),
          createQtyCell("Found:", { bold: true, shaded: true, align: "left" }),
          createQtyCell(data.foundCriticalWM || data.totalFoundCritical || "00"),
          createQtyCell(data.foundMajorWM || data.totalFoundMajor || "00"),
          createQtyCell(data.foundMinorWM || data.totalFoundMinor || "00"),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("Available Quantity:", { bold: true, align: "left", shaded: true }),
          createQtyCell(data.availableQuantityWM || data.availableQuantity || "-", {
            align: "left",
            color: redIfNonEmpty(String(data.availableQuantityWM || data.availableQuantity || "")),
          }),
          createQtyCell("Result:", { bold: true, shaded: true, align: "left" }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: sanitizeDocxText(wmResultValue || "-"), bold: true, size: 20, color: wmResultColor })],
                alignment: "center",
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("Sample Size:", { bold: true, align: "left", shaded: true }),
          createQtyCell(data.sampleSizeWM || data.sampleSize || "-", {
            align: "left",
            color: redIfNonEmpty(String(data.sampleSizeWM || data.sampleSize || "")),
          }),
          createQtyCell("", { shaded: true }),
          createQtyCell("", { shaded: true }),
          createQtyCell("", { shaded: true }),
          createQtyCell("", { shaded: true }),
        ],
      }),
    ],
  });

  children.push(new Paragraph(""));
  children.push(workmanshipSummaryTable);

  // Factory Comments & Signature (with Chinese line) like reference
  children.push(new Paragraph(""));
  children.push(
    new Table({
      width: { size: 100, type: "pct" },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: "pct" },
              borders: tableBorders(),
              children: [
                new Paragraph({ children: [new TextRun({ text: "Factory Comments & Signature", bold: true, size: 18 })] }),
                new Paragraph({ children: [new TextRun({ text: "工厂签名及反馈", italics: true, size: 16 })] }),
              ],
            }),
            new TableCell({
              width: { size: 40, type: "pct" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: sanitizeDocxText(data.factorySigner || data.factorySignatureName || "Yang He"), bold: true, size: 18 })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Chinese notes block (exact style: numbered lines)
  const factoryNotesChinese =
    data.factoryNotesChinese ||
    `1. 本报告的结论为本次产品供应商签约后意见。任何疑问下，供应商都须对递批产品的品质、产品安全等方面的责任。
2. 产品供应商须就现货验货报告出的所有结论内容，并重新包装所有有开包装的产品。
3. 由于时间原因，本报告为草稿版本。若终稿以正式报告为准，最终结果以正式报告为准。
4. 该报告只代表产品在结论时的状态。
5. 工厂验货员本人若有针对本次验货的结论提出的质疑和供应商的相关人员，以便工厂做出及时处理或响应。
6. 本报告只对样本（抽样）负责。
7. 本报告为完整内容，不得部分复制本报告。`;
  factoryNotesChinese.split(/\r?\n/).forEach((line) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: line, size: 16 })],
        spacing: { after: 30 },
      })
    );
  });

  // Inspector signature line (right aligned) like reference
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Inspector Signature & Chop : ", size: 18 }),
        new TextRun({
          text: sanitizeDocxText(data.inspector || "Ronnie Zhu"),
          size: 18,
          bold: true,
          underline: {},
        }),
      ],
      alignment: "right",
      spacing: { before: 260, after: 80 },
    })
  );

  // End Page 1 exactly like reference (next content starts new page)
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // III. REMARKS (placed before A. QUANTITY as requested)
  {
    const remarks = Array.isArray(data.remarks) ? data.remarks : [];
    const remarkPhotosByIndex = data.remarkPhotosByIndex || {};

    const remarksTableRows = [];

    // Section header as the first row in the table (matches reference screenshot)
    remarksTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            borders: tableBorders(),
            shading: { fill: "E8E8E8" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "III. REMARKS",
                    bold: true,
                    size: 22,
                    color: "1F4E79",
                  }),
                ],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      })
    );

    // Problem Remarks header
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell("", { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            shading: { fill: "E9ECEF" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Problem Remarks:", bold: true, size: 20, color: "1F1F1F" })],
                spacing: { before: 40, after: 40 },
              }),
            ],
          }),
        ],
      })
    );

    // Problem remark rows: each row shows only its own photos.
    const sectionPhotos = Array.isArray(data.remarkSectionPhotos) ? data.remarkSectionPhotos : [];
    const remarkEndPhotos = sectionPhotos.filter((p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image"));

    const factoryCooperationChoice = String(data.factoryCooperation || "").trim().toLowerCase();
    const workerCountChoice = String(data.workerCount || "").trim().toLowerCase();
    const inspectorOpinionChoice = String(data.inspectorOpinion || "").trim().toLowerCase();
    const normalizeChoice = (v) => String(v || "").trim().toLowerCase();
    const CB_CHECKED = "\u2611";
    const CB_UNCHECKED = "\u2610";
    const CB_TICK = "\u2713";
    const CB_FONT = { ascii: "MS Gothic", hAnsi: "MS Gothic", eastAsia: "MS Gothic", cs: "MS Gothic" };
    const checkboxMark = (isChecked) => (isChecked ? CB_CHECKED : CB_UNCHECKED);
    const yesNoChecked = (value, target) => {
      const n = normalizeChoice(value);
      if (target === "yes") return n === "yes" || n === "y" || n === "true" || n === "1";
      return n === "no" || n === "n" || n === "false" || n === "0";
    };
    const hasToken = (value, tokens) => {
      const n = normalizeChoice(value);
      return tokens.some((t) => n === t || n.includes(t));
    };

    const remarkCount = Math.max(Array.isArray(remarks) ? remarks.length : 0, 5);
    for (let i = 0; i < remarkCount; i += 1) {
      remarksTableRows.push(
        new TableRow({
          children: [
            createQtyCell(`${i + 1}.`, { shaded: true }),
            new TableCell({
              columnSpan: 3,
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: blankIfEmpty(remarks[i]), size: 20 })] })],
            }),
          ],
        })
      );

      const rowPhotos = getRemarkPhotosForRow(remarkPhotosByIndex, i).filter(
        (p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image")
      );
      if (rowPhotos.length > 0) {
        remarksTableRows.push(
          new TableRow({
            children: [
              createQtyCell("", { shaded: true }),
              new TableCell({
                columnSpan: 3,
                borders: tableBorders(),
                children: [createInlinePhotoGridTable(rowPhotos, { cellWidth: 170, cellHeight: 118 })],
              }),
            ],
          })
        );
      }
    }

    // General Remarks header
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell("", { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            shading: { fill: "E9ECEF" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "General Remarks:", bold: true, size: 20, color: "1F1F1F" })],
                spacing: { before: 40, after: 40 },
              }),
            ],
          }),
        ],
      })
    );

    // Mold potential questions block
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell("", { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "We had checked mold potential about warehouse:", bold: true, size: 20 })],
                spacing: { before: 40, after: 40 },
              }),
            ],
          }),
        ],
      })
    );

    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell("", { shaded: true }),
          createQtyCell("", { shaded: true, align: "left" }),
          createQtyCell("Yes", { bold: true, shaded: true }),
          createQtyCell("No", { bold: true, shaded: true }),
        ],
      })
    );

    const yesNoRemarkQuestions = [
      { index: 1, key: "remarkQ1", text: "Is there any leakage on the roofs and walls (including windows & doors)?" },
      { index: 2, key: "remarkQ2", text: "Is there any special-assigned person or department to be responsible for mold control?" },
      { index: 3, key: "remarkQ3", text: "Is there any record for mold control?" },
      { index: 4, key: "remarkQ4", text: "Do all cartons put on plastic pallets with min. 12cm height away from the floor, and at least 1.5 meters away from windows?" },
      { index: 5, key: "remarkQ5", text: "Is there anyone such as factory QCs or supervisors to verify the procedure daily?" },
      { index: 6, key: "remarkQ6", text: "Are the export cartons kept dry?" },
      { index: 7, key: "remarkQ7", text: "Are there any damaged or wet cartons used?" },
    ];

    yesNoRemarkQuestions.forEach((q) => {
      const answer = data[q.key];
      const isYes = yesNoChecked(answer, "yes");
      const isNo = yesNoChecked(answer, "no");
      remarksTableRows.push(
        new TableRow({
          children: [
            createQtyCell(`${q.index}.`, { shaded: true }),
            createQtyCell(q.text, { align: "left" }),
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: isYes ? CB_CHECKED : CB_UNCHECKED, size: 18, font: CB_FONT }),
                    new TextRun({ text: "Yes", size: 18 }),
                  ],
                  alignment: "center",
                }),
              ],
            }),
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: isNo ? CB_CHECKED : CB_UNCHECKED, size: 18, font: CB_FONT }),
                    new TextRun({ text: "No", size: 18 }),
                  ],
                  alignment: "center",
                }),
              ],
            }),
          ],
        })
      );
    });

    const recommendationIndex = remarkCount + 1;
    const factoryCooperationIndex = remarkCount + 2;
    const workerCountIndex = remarkCount + 3;
    const inspectorOpinionIndex = remarkCount + 4;
    const sampleCollectionIndex = remarkCount + 5;

    // Recommendation
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell(`${recommendationIndex}.`, { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      "Based on our finding of material/accessories/semi-finished/finished products and the observation of product line, we recommend the manufacturer to make improvement or pay attention on follow up mass production:",
                    size: 20,
                  }),
                ],
                spacing: { after: 80 },
              }),
              new Paragraph({ children: [new TextRun({ text: blankIfEmpty(data.recommendationText), size: 20 })] }),
            ],
          }),
        ],
      })
    );

    // Factory Information header - full width row like reference
    remarksTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            borders: tableBorders(),
            shading: { fill: "E9ECEF" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Factory Information:", bold: true, size: 20, color: "1F1F1F" })],
                spacing: { before: 40, after: 40 },
              }),
            ],
          }),
        ],
      })
    );

    // 7. Factory cooperation - label row with checkbox options listed as sub-items
    const fcGood = hasToken(factoryCooperationChoice, ["good"]);
    const fcAvg = hasToken(factoryCooperationChoice, ["average", "avg"]);
    const fcPoor = hasToken(factoryCooperationChoice, ["poor"]);
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell(`${factoryCooperationIndex}.`, { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Factory cooperation:", bold: true, size: 20 })],
                spacing: { before: 40, after: 20 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: fcGood ? CB_CHECKED + " " : CB_UNCHECKED + " ", size: 18, font: CB_FONT }),
                  new TextRun({ text: "Good - Enough manpower to assist, and good cooperation.", size: 18 }),
                ],
                spacing: { after: 10 },
                indent: { left: 280 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: fcAvg ? "   " + CB_TICK + "   " : CB_UNCHECKED + " ", size: 18, font: CB_FONT }),
                  new TextRun({ text: "AVERAGE - Enough manpower to assist.", size: 18 }),
                ],
                spacing: { after: 10 },
                indent: { left: 280 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: fcPoor ? CB_CHECKED + " " : CB_UNCHECKED + " ", size: 18, font: CB_FONT }),
                  new TextRun({ text: "Poor - Manpower, equipment or document not provided timely.", size: 18 }),
                ],
                spacing: { after: 40 },
                indent: { left: 280 },
              }),
            ],
          }),
        ],
      })
    );

    // 8. Number of workers in factory - inline checkbox options
    const wLt50 = hasToken(workerCountChoice, ["lt50", "less than 50", "<50"]);
    const w50100 = hasToken(workerCountChoice, ["50to100", "50-100"]);
    const w100500 = hasToken(workerCountChoice, ["100to500", "100-500"]);
    const w5001000 = hasToken(workerCountChoice, ["500to1000", "500-1000"]);
    const wGt1000 = hasToken(workerCountChoice, ["gt1000", "more than 1000", ">1000"]);
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell(`${workerCountIndex}.`, { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Number of workers in factory:", bold: true, size: 20 })],
                spacing: { before: 40, after: 20 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: (wLt50 ? CB_CHECKED : CB_UNCHECKED) + " Less than 50 people, ", size: 16, font: CB_FONT }),
                  new TextRun({ text: (w50100 ? CB_CHECKED : CB_UNCHECKED) + " 50-100 people, ", size: 16, font: CB_FONT }),
                  new TextRun({ text: (w100500 ? CB_CHECKED : CB_UNCHECKED) + " 100-500 people, ", size: 16, font: CB_FONT }),
                  new TextRun({ text: (w5001000 ? CB_CHECKED : CB_UNCHECKED) + " 500-1000 people, ", size: 16, font: CB_FONT }),
                  new TextRun({ text: (wGt1000 ? CB_CHECKED : CB_UNCHECKED) + " More than 1000 people.", size: 16, font: CB_FONT }),
                ],
                spacing: { after: 40 },
                indent: { left: 280 },
              }),
            ],
          }),
        ],
      })
    );

    // 9. Inspector's opinion on the factory (on new page as per reference)
    const ioGood = hasToken(inspectorOpinionChoice, ["good"]);
    const ioAvg = hasToken(inspectorOpinionChoice, ["average", "avg"]);
    const ioPoor = hasToken(inspectorOpinionChoice, ["poor"]);
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell(`${inspectorOpinionIndex}.`, { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Inspector's opinion on the factory:", bold: true, size: 20 })],
                spacing: { before: 40, after: 20 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: ioGood ? CB_CHECKED + " " : CB_UNCHECKED + " ", size: 18, font: CB_FONT }),
                  new TextRun({ text: "Good - The factory was neat and tidy. The testing equipment was well maintained and calibrated.", size: 18 }),
                ],
                spacing: { after: 10 },
                indent: { left: 280 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: ioAvg ? "   " + CB_TICK + "   " : CB_UNCHECKED + " ", size: 18, font: CB_FONT }),
                  new TextRun({ text: "AVERAGE - The factory was tidy, and the testing equipment ran normally.", size: 18 }),
                ],
                spacing: { after: 10 },
                indent: { left: 280 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: ioPoor ? CB_CHECKED + " " : CB_UNCHECKED + " ", size: 18, font: CB_FONT }),
                  new TextRun({ text: "Poor - The factory was messed, the basic testing equipment was not available / not workable.", size: 18 }),
                ],
                spacing: { after: 40 },
                indent: { left: 280 },
              }),
            ],
          }),
        ],
      })
    );

    // 10. Sample Collection Record
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell(`${sampleCollectionIndex}.`, { shaded: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Sample Collection Record:", bold: true, size: 20 })],
                spacing: { before: 40, after: 20 },
              }),
              new Paragraph({
                children: [new TextRun({ text: blankIfEmpty(data.sampleCollectionRecord), size: 20 })],
                spacing: { after: 40 },
                indent: { left: 280 },
              }),
            ],
          }),
        ],
      })
    );

    // Section photos row
    remarksTableRows.push(
      new TableRow({
        children: [
          createQtyCell("Photos:", { shaded: true, align: "left", bold: true }),
          new TableCell({
            columnSpan: 3,
            borders: tableBorders(),
            children:
              remarkEndPhotos.length > 0
                ? [createInlinePhotoGridTable(remarkEndPhotos, { cellWidth: 170, cellHeight: 118 })]
                : [new Paragraph({ children: [new TextRun({ text: "NA", size: 18 })] })],
          }),
        ],
      })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: remarksTableRows,
      })
    );
    children.push(new Paragraph(""));
  }

  // IV. CONCLUSION (immediately after Remarks; match reference layout)
  {
    const normalizeConclusion = (v) => {
      const n = String(v || "").trim().toUpperCase();
      if (n === "FAIL" || n === "FAILED") return "FAILED";
      if (n === "PASS" || n === "PASSED") return "PASSED";
      if (n === "PENDING") return "PENDING";
      return n || "-";
    };

    const conclusionStatus = normalizeConclusion(data.conclusionStatus || data.conclusion || data.reportHeader?.conclusion);
    const conclusionColor = conclusionStatus === "FAILED" ? "CC0000" : conclusionStatus === "PASSED" ? "228B22" : "1F1F1F";
    const conclusionPhotos = Array.isArray(data.conclusionPhotos)
      ? data.conclusionPhotos.filter((p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image"))
      : [];
    const conclusionReviewerPhotos = Array.isArray(data.conclusionReviewerPhotos)
      ? data.conclusionReviewerPhotos.filter((p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image"))
      : [];
    const inspectorPhoto = conclusionPhotos.length > 0 ? conclusionPhotos[0] : null;
    const reviewerPhoto = conclusionReviewerPhotos.length > 0 ? conclusionReviewerPhotos[0] : null;

    children.push(
      new Table({
        width: { size: 100, type: "pct" },
        rows: [
          // Header bar
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                borders: tableBorders(),
                shading: { fill: "E8E8E8" },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "IV. CONCLUSION", bold: true, size: 22, color: "1F4E79" })],
                    spacing: { before: 60, after: 60 },
                  }),
                ],
              }),
            ],
          }),
          // Big result + Approved by line
          new TableRow({
            children: [
              new TableCell({
                width: { size: 55, type: "pct" },
                borders: tableBorders(),
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: conclusionStatus, bold: true, size: 72, color: conclusionColor })],
                    alignment: "center",
                    spacing: { before: 220, after: 140 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "PASSED", bold: true, size: 18 }),
                      new TextRun({ text: "  - Conform to Client’s Requirement", size: 18 }),
                    ],
                    spacing: { after: 20 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "PASSED (Conditional):", bold: true, size: 18 }),
                      new TextRun({
                        text: " The Passed results will be valid only after the client notes and accepts the issues in the remarks",
                        size: 18,
                      }),
                    ],
                    spacing: { after: 40 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "PENDING", bold: true, size: 18 }),
                      new TextRun({ text: " - Subject to Client’s Evaluation", size: 18 }),
                    ],
                    spacing: { after: 40 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "FAILED", bold: true, size: 18 }),
                      new TextRun({ text: "  - Not Conform to Client’s Requirement", size: 18 }),
                    ],
                    spacing: { after: 120 },
                  }),
                ],
              }),
              new TableCell({
                width: { size: 45, type: "pct" },
                borders: tableBorders(),
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "______________________________________________", bold: true, size: 18 })],
                    spacing: { before: 220, after: 0 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Approved by : ", bold: true, size: 18 }),
                      new TextRun({ text: sanitizeDocxText(data.approvedBy || "-"), bold: true, size: 18, underline: {} }),
                    ],
                    spacing: { before: 0, after: 0 },
                  }),
                ],
              }),
            ],
          }),
          // Inspector & Reviewer header row
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                borders: tableBorders(),
                shading: { fill: "E8E8E8" },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Inspector & Report Reviewer:", bold: true, size: 18 })],
                    spacing: { before: 40, after: 40 },
                  }),
                ],
              }),
            ],
          }),
          // Inspector / Reviewer photo area
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: "pct" },
                borders: tableBorders(),
                children: [
                  ...(inspectorPhoto
                    ? [
                        createImageParagraphFromDataUrl(inspectorPhoto.preview, {
                          width: 270,
                          height: 320,
                        }),
                      ]
                    : [new Paragraph({ children: [new TextRun({ text: "", size: 18 })], spacing: { before: 260, after: 260 } })]),
                ],
              }),
              new TableCell({
                width: { size: 50, type: "pct" },
                borders: tableBorders(),
                children: [
                  ...(reviewerPhoto
                    ? [
                        createImageParagraphFromDataUrl(reviewerPhoto.preview, {
                          width: 270,
                          height: 320,
                        }),
                      ]
                    : [new Paragraph({ children: [new TextRun({ text: "", size: 18 })], spacing: { before: 260, after: 260 } })]),
                ],
              }),
            ],
          }),
          // Inspector / Reviewer labels
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: "pct" },
                borders: tableBorders(),
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Inspector(s): ", size: 18 }),
                      new TextRun({ text: sanitizeDocxText(data.inspector || "----------"), size: 18 }),
                    ],
                    alignment: "center",
                    spacing: { before: 40, after: 40 },
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: "pct" },
                borders: tableBorders(),
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Report Reviewer: ", size: 18 }),
                      new TextRun({ text: sanitizeDocxText(data.reportReviewer || ""), size: 18 }),
                    ],
                    alignment: "center",
                    spacing: { before: 40, after: 40 },
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // Note paragraphs + dotted divider + end-of-page sentence
    const noteText =
      data.conclusionNote ||
      "Note: 1. This report reflects our findings at the time and the place of inspection based on random samples selected. 2. This inspection was carried out to the best of our knowledge and abilities, and our responsibility is limited to the exercise of reasonable one. 3. This report does not relieve the sellers from their contractual obligations nor does it prejudice buyer’s right for compensation for any apparent and/or hidden defects not detected during our inspection or occurring thereafter. 4. This report does not evidence shipment. 5. Our services are subject to the General Conditions of Service of Absolute Veritas, which is shown at our website and can be sent to you upon written request. 6. This report’s inspection results only relate to the samples as (randomly picked) by our inspector. 7. This report is complete and its content may not be reproduced.";

    children.push(
      new Paragraph({
        children: [new TextRun({ text: sanitizeDocxText(noteText), size: 16 })],
        spacing: { before: 120, after: 120 },
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "............................................................................................................................", size: 18, bold: true })],
        spacing: { before: 60, after: 80 },
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Please find our inspection details from next page (Section A – F).", size: 16 })],
        spacing: { before: 60, after: 0 },
      })
    );

    // Start next section on a new page
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const totalOrder = items.reduce((s, it) => s + toNum(it.orderQty), 0);
  const totalPacked = items.reduce((s, it) => s + toNum(it.packedBreakdown), 0);
  const totalUnpacked = items.reduce((s, it) => s + toNum(it.unpackedBreakdown), 0);
  const totalUnfinished = items.reduce((s, it) => s + toNum(it.unfinishedBreakdown), 0);
  const totalSamplePacked = items.reduce((s, it) => s + toNum(it.sampleSizePacked), 0);
  const totalSampleUnpacked = items.reduce((s, it) => s + toNum(it.sampleSizeUnpacked), 0);

  const quantityRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 10,
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "A. QUANTITY", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // Quantity + Unit row
    new TableRow({
      children: [
        createQtyCell("Quantity", { bold: true, align: "left", shaded: true, colSpan: 8 }),
        createQtyCell("Unit: Sets", { bold: true, align: "center", shaded: true, colSpan: 2 }),
      ],
    }),
    // Header row
    new TableRow({
      children: [
        createQtyCell("P.O.", { bold: true, shaded: true }),
        createQtyCell("Item", { bold: true, shaded: true }),
        createQtyCell("Order Qty", { bold: true, shaded: true }),
        createQtyCell("Qty / Carton", { bold: true, shaded: true }),
        createQtyCell("Cartons", { bold: true, shaded: true }),
        createQtyCell("Quantity Breakdown", { bold: true, shaded: true, colSpan: 3 }),
        createQtyCell("Sample Size", { bold: true, shaded: true, colSpan: 2 }),
      ],
    }),
    // Sub-header row
    new TableRow({
      children: [
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("Packed", { bold: true, shaded: true }),
        createQtyCell("Unpacked", { bold: true, shaded: true }),
        createQtyCell("Unfinished", { bold: true, shaded: true }),
        createQtyCell("Packed", { bold: true, shaded: true }),
        createQtyCell("Unpacked", { bold: true, shaded: true }),
      ],
    }),
    ...items.map((it) =>
      new TableRow({
        children: [
          createQtyCell(it.po || "-"),
          createQtyCell(it.itemName || it.name || "-", { align: "left" }),
          createQtyCell(it.orderQty || "-"),
          createQtyCell(it.qtyPerCarton || "-"),
          createQtyCell(it.cartons || "-"),
          createQtyCell(it.packedBreakdown || "0"),
          createQtyCell(it.unpackedBreakdown || "0"),
          createQtyCell(it.unfinishedBreakdown || "0", {
            color: Number(it.unfinishedBreakdown || 0) > 0 ? "CC0000" : undefined,
          }),
          createQtyCell(it.sampleSizePacked || "0"),
          createQtyCell(it.sampleSizeUnpacked || "0"),
        ],
      })
    ),
    new TableRow({
      children: [
        createQtyCell("", { shaded: true }),
        createQtyCell("Total:", { bold: true, align: "right", shaded: true }),
        createQtyCell(String(totalOrder), { bold: true }),
        createQtyCell("-"),
        createQtyCell("-"),
        createQtyCell(String(totalPacked), { bold: true }),
        createQtyCell(String(totalUnpacked), { bold: true }),
        createQtyCell(String(totalUnfinished), { bold: true, color: totalUnfinished > 0 ? "CC0000" : undefined }),
        createQtyCell(String(totalSamplePacked), { bold: true }),
        createQtyCell(String(totalSampleUnpacked), { bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Selected Cartons:", { bold: true, align: "left", shaded: true, colSpan: 10 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell(data.selectedCartonsCount || "0"),
        createQtyCell("Cartons were selected randomly on site No. carton number in shipping mark.", { align: "left", colSpan: 9 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Carton No.:", { bold: true, align: "left" }),
        createQtyCell(data.cartonNo1 || "-"),
        createQtyCell(data.cartonNo2 || "-"),
        createQtyCell(data.cartonNo3 || "-"),
        createQtyCell(data.cartonNo4 || "-"),
        createQtyCell(data.cartonNo5 || "-"),
        createQtyCell(data.cartonNo6 || "-"),
        createQtyCell(data.cartonNo7 || "-"),
        createQtyCell(data.cartonNo8 || "-"),
        createQtyCell(data.cartonNo9 || data.cartonNo10 || "-"),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.quantityResult || "Pending", {
          align: "left",
          bold: true,
          color:
            data.quantityResult === "Failed"
              ? "FF0000"
              : data.quantityResult === "Passed"
              ? "00AA00"
              : "FFA500",
          colSpan: 9,
        }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.quantityRemark || "-", { align: "left", colSpan: 9 }),
      ],
    }),
  ];

  children.push(new Table({ rows: quantityRows, width: { size: 100, type: "pct" } }));

  children.push(new Paragraph(""));

  const resolveWorkmanshipResult = (manual, found, accepted) => {
    if (manual) return manual;
    const f = Number(found || 0);
    const a = Number(accepted || 0);
    if (!Number.isFinite(f) || !Number.isFinite(a)) return "Pass";
    return f <= a ? "Pass" : "Fail";
  };

  const wmItems = (Array.isArray(items) && items.length > 0 ? items : [{ itemName: "Item", sampleSizePacked: "0" }]).slice(0, 7);

  // B. WORKMANSHIP - 7 columns to match reference: Label | Value | AQL Label | AQL Value | Accepted | Total Found | Result
  const workmanshipSummaryRows = [
    // Section header
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 7,
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "B.  WORKMANSHIP", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // Column headers row
    new TableRow({
      children: [
        createQtyCell("Inspection Standard:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.inspectionStandardWM || "ANSI/ASQ Z1.4 (ISO 2859-1)", { align: "left" }),
        createQtyCell("AQL", { bold: true, shaded: true, colSpan: 2 }),
        createQtyCell("Accepted", { bold: true, shaded: true }),
        createQtyCell("Total\nFound", { bold: true, shaded: true }),
        createQtyCell("Result", { bold: true, shaded: true }),
      ],
    }),
    // Critical row
    new TableRow({
      children: [
        createQtyCell("Sampling Plan:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.samplingPlanWM || "Fixed Sample Size", { align: "left" }),
        createQtyCell("Critical:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(data.aqlCriticalWM || "Not Allowed"),
        createQtyCell(data.acceptedCritical || "0"),
        createQtyCell(data.totalFoundCritical || "0"),
        createQtyCell(resolveWorkmanshipResult(data.result1WM, data.totalFoundCritical, data.acceptedCritical)),
      ],
    }),
    // Major row
    new TableRow({
      children: [
        createQtyCell("Inspection Level:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.inspectionLevelWM || "Level II", { align: "left" }),
        createQtyCell("Major:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(data.aqlMajorWM || "2.5"),
        createQtyCell(data.acceptedMajor || "0"),
        createQtyCell(data.totalFoundMajor || "0"),
        createQtyCell(resolveWorkmanshipResult(data.result2WM, data.totalFoundMajor, data.acceptedMajor)),
      ],
    }),
    // Minor row
    new TableRow({
      children: [
        createQtyCell("Sample Size:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.sampleSizeWM || "5 Sets", { align: "left" }),
        createQtyCell("Minor:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(data.aqlMinorWM || "4.0"),
        createQtyCell(data.acceptedMinor || "0"),
        createQtyCell(data.totalFoundMinor || "0"),
        createQtyCell(resolveWorkmanshipResult(data.result3WM, data.totalFoundMinor, data.acceptedMinor)),
      ],
    }),
    // Defect findings header
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 7,
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Workmanship Defectives / Function Inspection Findings", bold: true, size: 18 })],
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    }),
    // Defect column headers
    new TableRow({
      children: [
        createQtyCell("", { shaded: true }),
        createQtyCell("Description", { bold: true, shaded: true, align: "left", colSpan: 3 }),
        createQtyCell("Critical", { bold: true, shaded: true }),
        createQtyCell("Major", { bold: true, shaded: true }),
        createQtyCell("Minor", { bold: true, shaded: true }),
      ],
    }),
    // Defect item rows
    ...wmItems.flatMap((it, idx) => [
      new TableRow({
        children: [
          createQtyCell(`For Item ${sanitizeDocxText(it.itemName || it.name || `Item ${idx + 1}`)}`, { align: "left", colSpan: 2 }),
          createQtyCell(`Sample size: ${sanitizeDocxText(it.sampleSizePacked || "0")} Set`, { align: "left", colSpan: 2 }),
          createQtyCell("", {}),
          createQtyCell("", {}),
          createQtyCell("", {}),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell(`${idx + 1}.`, { align: "left" }),
          createQtyCell(blankIfEmpty(data[`defectDescription${idx + 1}`] || "-"), { align: "left", colSpan: 3 }),
          createQtyCell(blankIfEmpty(data[`defectCritical${idx + 1}`] || "0")),
          createQtyCell(blankIfEmpty(data[`defectMajor${idx + 1}`] || "0")),
          createQtyCell(blankIfEmpty(data[`defectMinor${idx + 1}`] || "0")),
        ],
      }),
    ]),
    // Total found row
    new TableRow({
      children: [
        createQtyCell("", { colSpan: 3 }),
        createQtyCell("Total found:", { bold: true, align: "right" }),
        createQtyCell(data.totalFoundCritical || "00", { bold: true }),
        createQtyCell(data.totalFoundMajor || "00", { bold: true }),
        createQtyCell(data.totalFoundMinor || "00", { bold: true }),
      ],
    }),
    // Accepted row
    new TableRow({
      children: [
        createQtyCell("", { colSpan: 3 }),
        createQtyCell("Accepted:", { bold: true, align: "right" }),
        createQtyCell(data.acceptedCritical || "00", { bold: true }),
        createQtyCell(data.acceptedMajor || "00", { bold: true }),
        createQtyCell(data.acceptedMinor || "00", { bold: true }),
      ],
    }),
    // Sample size row
    new TableRow({
      children: [
        createQtyCell("", { colSpan: 3 }),
        createQtyCell("Sample size:", { bold: true, align: "right" }),
        createQtyCell(data.sampleSizeCritical || "2", { bold: true }),
        createQtyCell(data.sampleSizeMajor || "2", { bold: true }),
        createQtyCell(data.sampleSizeMinor || "2", { bold: true }),
      ],
    }),
    // Result row
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, align: "left", shaded: true }),
        new TableCell({
          columnSpan: 6,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: sanitizeDocxText(data.workmanshipResult || "Failed"),
                  bold: true,
                  size: 18,
                  color: String(data.workmanshipResult || "").toLowerCase().includes("fail") ? "CC0000" : "228B22",
                  italics: true,
                }),
              ],
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    }),
    // Remark row
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left", shaded: true }),
        createQtyCell(blankIfEmpty(data.workmanshipRemark), { align: "left", colSpan: 6 }),
      ],
    }),
    // Note row
    new TableRow({
      children: [
        createQtyCell("Note:", { bold: true, align: "left", shaded: true }),
        new TableCell({
          columnSpan: 6,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "A ", bold: true, size: 14 }),
                new TextRun({ text: "Defective", bold: true, underline: {}, size: 14 }),
                new TextRun({ text: " is defined as a unit of product that contains one or more defects. A ", size: 14 }),
                new TextRun({ text: "Defect", bold: true, underline: {}, size: 14 }),
                new TextRun({ text: " is defined as any non-conformance of the inspected unit of product with specified requirements. A single defect is taken into account per each defective unit; only one most serious defect is taken into account per each defective unit.", size: 14 }),
              ],
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    }),
  ];

  children.push(new Table({ rows: workmanshipSummaryRows, width: { size: 100, type: "pct" } }));

  children.push(new Paragraph(""));

  // Defect photos section (from Workmanship step uploads)
  const defectPhotoRows = [];
  const defectPhotoItems = [1, 2, 3, 4].map((n) => ({
    index: n,
    title: blankIfEmpty(data[`defectPhotoDescription${n}`] || data[`defectDescription${n}`] || `Defect photo ${n}`),
    preview: data[`defectPhotoPreview${n}`],
  }));

  defectPhotoItems.forEach((item) => {
    defectPhotoRows.push(
      new TableRow({
        children: [
          createQtyCell(String(item.index), { bold: true }),
          createQtyCell(item.title, { align: "left", bold: true, colSpan: 2 }),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell("", {}),
          typeof item.preview === "string" && item.preview.startsWith("data:image")
            ? createPhotoCellFromDataUrl(item.preview, { width: 220, height: 150, label: "" })
            : createQtyCell("-", {}),
          createQtyCell("-", {}),
        ],
      })
    );
  });

  children.push(
    new Table({
      width: { size: 100, type: "pct" },
      rows: defectPhotoRows,
    })
  );

  children.push(new Paragraph(""));

  // C. ON-SITE TESTS — single unified table with embedded header
  const testRowIds = Array.from(
    new Set(
      Object.keys(data || {})
        .map((k) => {
          const m = k.match(/^test(?:Desc|Method|Sample|Result)(\d+)$/);
          return m ? Number(m[1]) : null;
        })
        .filter((n) => Number.isFinite(n))
    )
  ).sort((a, b) => a - b);

  const onSiteRows = testRowIds.length > 0 ? testRowIds : [1];

  // Resolve result color
  const onSiteResultText = sanitizeDocxText(data.onSiteTestResult || "Pending");
  const onSiteResultLower = onSiteResultText.toLowerCase();
  const onSiteResultColor = onSiteResultLower.includes("fail")
    ? "CC0000"
    : onSiteResultLower.includes("pass")
    ? "228B22"
    : "E36C09"; // orange for Pending

  const onSiteTableRows = [
    // Section header row (dark navy background, white text)
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 5,
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "C.  ON-SITE TESTS", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // Column headers
    new TableRow({
      children: [
        createQtyCell("", { bold: true, shaded: true }),
        createQtyCell("Description", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Method", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Sample Size", { bold: true, shaded: true }),
        createQtyCell("Result / Reading", { bold: true, shaded: true }),
      ],
    }),
    // Data rows
    ...onSiteRows.map((id, idx) =>
      new TableRow({
        children: [
          createQtyCell(String(idx + 1)),
          createQtyCell(blankIfEmpty(data[`testDesc${id}`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`testMethod${id}`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`testSample${id}`])),
          createQtyCell(blankIfEmpty(data[`testResult${id}`]), { color: onSiteResultColor }),
        ],
      })
    ),
    // Result row
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, shaded: true, align: "left" }),
        new TableCell({
          columnSpan: 4,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: onSiteResultText,
                  bold: true,
                  size: 18,
                  color: onSiteResultColor,
                }),
              ],
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    }),
    // Remark row
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.onSiteTestRemark), { align: "left", colSpan: 4 }),
      ],
    }),
  ];

  children.push(new Table({ rows: onSiteTableRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // D. PRODUCT SPECIFICATION — single unified table with embedded header
  const productItemIds = Array.from(
    new Set(
      Object.keys(data || {})
        .map((k) => {
          const m = k.match(/^item_(\d+)_(?:desc|name|c0|c1|c2|c3|c4)$/);
          return m ? Number(m[1]) : null;
        })
        .filter((n) => Number.isFinite(n))
    )
  ).sort((a, b) => a - b);

  const productRows = productItemIds.length > 0 ? productItemIds : [1];
  const productTableRows = [
    // Section header row (grey background, blue text)
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 6,
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "D.  PRODUCT SPECIFICATION", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // Column headers
    new TableRow({
      children: [
        createQtyCell("", { bold: true, shaded: true }),
        createQtyCell("Client's Spec.", { bold: true, shaded: true }),
        createQtyCell("Ref. Sample", { bold: true, shaded: true }),
        createQtyCell("1# Sample", { bold: true, shaded: true }),
        createQtyCell("2# Sample", { bold: true, shaded: true }),
        createQtyCell("3# Sample", { bold: true, shaded: true }),
      ],
    }),
    // Item No. header row
    new TableRow({
      children: [
        createQtyCell("Item No.:", { bold: true, shaded: true, align: "left" }),
        new TableCell({
          columnSpan: 5,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: sanitizeDocxText(data.productDescription || "-"), bold: true, size: 18 })],
              alignment: "center",
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    }),
    // Blank editable row
    new TableRow({
      children: [
        createQtyCell(blankIfEmpty(data.blank_row_0), { align: "left" }),
        createQtyCell(blankIfEmpty(data.blank_row_c0)),
        createQtyCell(blankIfEmpty(data.blank_row_c1)),
        createQtyCell(blankIfEmpty(data.blank_row_c2)),
        createQtyCell(blankIfEmpty(data.blank_row_c3)),
        createQtyCell(blankIfEmpty(data.blank_row_c4)),
      ],
    }),
    // Dynamic product item rows (Item No. header + data row pairs)
    ...productRows.flatMap((id) => [
      new TableRow({
        children: [
          createQtyCell("Item No.:", { bold: true, shaded: true, align: "left" }),
          new TableCell({
            columnSpan: 5,
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: sanitizeDocxText(data[`item_${id}_desc`] || "-"), bold: true, size: 18 })],
                alignment: "center",
                spacing: { before: 40, after: 40 },
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          createQtyCell(blankIfEmpty(data[`item_${id}_name`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`item_${id}_c0`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c1`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c2`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c3`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c4`])),
        ],
      }),
    ]),
    // Result row
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.productResult), { align: "left", colSpan: 5 }),
      ],
    }),
    // Remark row
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.productRemark), { align: "left", colSpan: 5 }),
      ],
    }),
  ];

  children.push(new Table({ rows: productTableRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // E. PACKING — single unified table with embedded header
  const packageIconPath = path.join(__dirname, "frontend", "public", "package.png");
  let packageIconRun = null;
  try {
    if (fs.existsSync(packageIconPath)) {
      const iconBuffer = fs.readFileSync(packageIconPath);
      packageIconRun = new ImageRun({
        data: iconBuffer,
        type: "png",
        transformation: {
          width: 50,
          height: 44,
        },
      });
    }
  } catch (e) {}

  const packingItemIds = [1, 2];

  // Resolve packing result color
  const packingResultText = sanitizeDocxText(data.packing_result || "Pending");
  const packingResultLower = packingResultText.toLowerCase();
  const packingResultColor = packingResultLower.includes("fail")
    ? "CC0000"
    : packingResultLower.includes("pass")
    ? "228B22"
    : "E36C09"; // orange for Pending

  const packingRows = [
    // Section header row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 9,
          borders: tableBorders(),
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "E.  PACKING", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 60, after: 60 },
            }),
          ],
        }),
      ],
    }),
    // Package Details header row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 6,
          borders: { ...tableBorders(), right: { style: BorderStyle.NONE, size: 0, color: "E8E8E8" } },
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Package Details:", bold: true, size: 18 })],
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
        new TableCell({
          columnSpan: 3,
          borders: { ...tableBorders(), left: { style: BorderStyle.NONE, size: 0, color: "E8E8E8" } },
          shading: { fill: "E8E8E8" },
          children: [
            new Paragraph({
              alignment: "right",
              children: packageIconRun ? [packageIconRun] : [new TextRun("")],
            }),
          ],
        }),
      ],
    }),
    // Sub-headers Row 1
    new TableRow({
      children: [
        createQtyCell("Item No.", { bold: true, rowSpan: 2, shaded: false }),
        createQtyCell("Qty / Carton", { bold: true, colSpan: 2, shaded: false }),
        createQtyCell("Carton Size L×W×H (cm)", { bold: true, colSpan: 2, shaded: false }),
        createQtyCell("Gross Weight (KG)", { bold: true, colSpan: 2, shaded: false }),
        createQtyCell("Qty / Inner box", { bold: true, colSpan: 2, shaded: false }),
      ],
    }),
    // Sub-headers Row 2
    new TableRow({
      children: [
        createQtyCell("Marking", { shaded: false }),
        createQtyCell("Actual", { shaded: false }),
        createQtyCell("Marking", { shaded: false }),
        createQtyCell("Actual", { shaded: false }),
        createQtyCell("Marking", { shaded: false }),
        createQtyCell("Actual", { shaded: false }),
        createQtyCell("Marking", { shaded: false }),
        createQtyCell("Actual", { shaded: false }),
      ],
    }),
    // Data Rows
    ...packingItemIds.map((id) =>
      new TableRow({
        children: [
          createQtyCell(blankIfEmpty(data[`packing_item_${id}`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`packing_qty_carton_marking_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_qty_carton_actual_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_carton_size_marking_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_carton_size_actual_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_weight_marking_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_weight_actual_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_qty_inner_marking_${id}`])),
          createQtyCell(blankIfEmpty(data[`packing_qty_inner_actual_${id}`])),
        ],
      })
    ),
    // Export Carton Details header
    new TableRow({
      children: [
        createQtyCell("Export Carton Details", { bold: true, shaded: true, align: "left", colSpan: 9 }),
      ],
    }),
    // Staples / Band row
    new TableRow({
      children: [
        createQtyCell("Fastening Metal Staples", { align: "right", colSpan: 3 }),
        createQtyCell(blankIfEmpty(data.fastening_metal_staples), { align: "left", colSpan: 2 }),
        createQtyCell("Nylon Band", { align: "right", colSpan: 2 }),
        createQtyCell(blankIfEmpty(data.nylon_band), { align: "left", colSpan: 2 }),
      ],
    }),
    // Material / Corrugated row
    new TableRow({
      children: [
        createQtyCell("Material", { align: "right", colSpan: 3 }),
        createQtyCell(blankIfEmpty(data.material), { align: "left", colSpan: 2 }),
        createQtyCell("Corrugated Paper Plies", { align: "right", colSpan: 2 }),
        createQtyCell(data.corrugated_paper_plies ? `${data.corrugated_paper_plies}-ply` : "-ply", { align: "left", colSpan: 2 }),
      ],
    }),
    // Packing Method Header
    new TableRow({
      children: [
        createQtyCell("Packing Method", { bold: true, shaded: true, align: "left", colSpan: 9 }),
      ],
    }),
    // Packing Method Value
    new TableRow({
      children: [
        createQtyCell(blankIfEmpty(data.packing_method), { align: "left", colSpan: 9 }),
      ],
    }),
    // Assortment Method Header
    new TableRow({
      children: [
        createQtyCell("Assortment Method", { bold: true, shaded: true, align: "left", colSpan: 9 }),
      ],
    }),
    // Assortment Method Value
    new TableRow({
      children: [
        createQtyCell(blankIfEmpty(data.assortment_method), { align: "left", colSpan: 9 }),
      ],
    }),
    // Result
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, align: "left", colSpan: 2 }),
        new TableCell({
          columnSpan: 7,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: packingResultText,
                  bold: true,
                  size: 18,
                  color: packingResultColor,
                }),
              ],
              alignment: "left",
              spacing: { before: 40, after: 40 },
            }),
          ],
        }),
      ],
    }),
    // Remark
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left", colSpan: 2 }),
        createQtyCell(blankIfEmpty(data.packing_remark), { align: "left", colSpan: 7 }),
      ],
    }),
  ];

  children.push(new Table({ rows: packingRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // F. MARKING & LABELING
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "F. MARKING & LABELING",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

  const markingRows = [
    new TableRow({
      children: [
        createQtyCell("Name", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Location", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Result", { bold: true, shaded: true, align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell(blankIfEmpty(data.barcode_name), { align: "left" }),
        createQtyCell(blankIfEmpty(data.barcode_location), { align: "left" }),
        createQtyCell(blankIfEmpty(data.barcode_result), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Instruction manual check", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.instruction_provided_by_label), { align: "left" }),
        createQtyCell(blankIfEmpty(data.instruction_provided_by), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("No instruction manual included", { align: "left" }),
        createQtyCell("-"),
        createQtyCell(blankIfEmpty(data.no_instruction_result), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("No CDF provided", { align: "left" }),
        createQtyCell("-"),
        createQtyCell(blankIfEmpty(data.no_cdf_result), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Shipping Marks", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.shipping_marks), { align: "left", colSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Side Marks", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.side_marks), { align: "left", colSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Inner Box Marks", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.inner_box_marks), { align: "left", colSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Result", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.marking_result_final), { align: "left", colSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.marking_remark), { align: "left", colSpan: 2 }),
      ],
    }),
  ];

  children.push(new Table({ rows: markingRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // G. CLIENT SPECIAL REQUIREMENT
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "G. CLIENT SPECIAL REQUIREMENT",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

  const clientRequirements = Array.isArray(data.clientRequirements)
    ? data.clientRequirements.map((req, idx) => ({
        index: idx + 1,
        requirement: blankIfEmpty(req?.requirement),
        result: blankIfEmpty(req?.result),
      }))
    : [];

  const requirementRows = clientRequirements.length > 0
    ? clientRequirements
    : [{ index: 1, requirement: "-", result: "-" }];

  const clientRequirementRows = [
    new TableRow({
      children: [
        createQtyCell("No.", { bold: true, shaded: true }),
        createQtyCell("Client Requirements", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Result", { bold: true, shaded: true }),
      ],
    }),
    ...requirementRows.map((req) =>
      new TableRow({
        children: [
          createQtyCell(`${req.index}.`),
          createQtyCell(req.requirement, { align: "left" }),
          createQtyCell(req.result, { align: "left" }),
        ],
      })
    ),
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, align: "left", shaded: true }),
        createQtyCell(blankIfEmpty(data.client_requirement_result), { align: "left", colSpan: 2 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left", shaded: true }),
        createQtyCell(blankIfEmpty(data.client_requirement_remark), { align: "left", colSpan: 2 }),
      ],
    }),
  ];

  children.push(new Table({ rows: clientRequirementRows, width: { size: 100, type: "pct" } }));

  children.push(new Paragraph(""));

  // Additional sections can be added here
  // III. QUANTITY DETAILS, IV. REMARKS, V. PHOTOS, etc.

  if (Array.isArray(data.reportPhotos) && data.reportPhotos.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Inspection Photos",
            bold: true,
            size: 24,
            color: "1F4E79",
          }),
        ],
        spacing: { before: 200, after: 100 },
        shading: { type: "clear", color: "E8E8E8", fill: "E8E8E8" },
      })
    );

    const reportPhotoParagraphs = getPhotoGridParagraphs(data.reportPhotos);
    if (reportPhotoParagraphs.length > 0) {
      children.push(...reportPhotoParagraphs);
    }
    children.push(new Paragraph(""));
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Inspection Photos",
            bold: true,
            size: 24,
            color: "1F4E79",
          }),
        ],
        spacing: { before: 200, after: 100 },
        shading: { type: "clear", color: "E8E8E8", fill: "E8E8E8" },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "-", size: 20 })],
      })
    );
    children.push(new Paragraph(""));
  }

  return children;
}

function getPhotoContent(photoData, uploadedFiles) {
  if (photoData && typeof photoData === "string" && photoData.startsWith("data:image")) {
    // Handle base64 data URLs
    try {
      const imageTypeFromDataUrl = getImageTypeFromDataUrl(photoData);
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const imageType = imageTypeFromDataUrl || detectImageTypeFromBuffer(buffer);

      if (!isSupportedImageBuffer(buffer) || !imageType) {
        return [new Paragraph({ text: "Photo not available", italics: true })];
      }

      return [
        new Paragraph({
          children: [
            new ImageRun({
              data: buffer,
              type: imageType,
              transformation: {
                width: 260,
                height: 180,
              },
            }),
          ],
        }),
      ];
    } catch (e) {
      return [new Paragraph({ text: "Photo not available", italics: true })];
    }
  }

  if (uploadedFiles && uploadedFiles.length > 0) {
    try {
      const buffer = fs.readFileSync(uploadedFiles[0].path);
      const imageTypeFromMime = getImageTypeFromMime(uploadedFiles[0].mimetype);
      const imageType = imageTypeFromMime || detectImageTypeFromBuffer(buffer);

      if (!isSupportedImageBuffer(buffer) || !imageType) {
        return [new Paragraph({ text: "Photo not available", italics: true })];
      }

      return [
        new Paragraph({
          children: [
            new ImageRun({
              data: buffer,
              type: imageType,
              transformation: {
                width: 260,
                height: 180,
              },
            }),
          ],
        }),
      ];
    } catch (e) {
      return [new Paragraph({ text: "Photo not available", italics: true })];
    }
  }

  return [new Paragraph({ text: "[Photo area]", italics: true, color: "999999" })];
}

function getPhotoGridParagraphs(photoItems) {
  if (!Array.isArray(photoItems) || photoItems.length === 0) return [];

  const valid = photoItems.filter((item) => item && typeof item.preview === "string" && item.preview.startsWith("data:image"));
  if (valid.length === 0) return [];

  const rows = [];
  for (let i = 0; i < valid.length; i += 2) {
    const left = valid[i];
    const right = valid[i + 1] || null;
    rows.push(
      new TableRow({
        children: [
          createPhotoCellFromDataUrl(left.preview, { width: 260, height: 180 }),
          right ? createPhotoCellFromDataUrl(right.preview, { width: 260, height: 180 }) : createEmptyPhotoCell(),
        ],
      })
    );
  }

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
  ];
}

function createEmptyPhotoCell() {
  return new TableCell({
    borders: tableBorders(),
    children: [new Paragraph({ children: [new TextRun({ text: "", size: 18 })] })],
  });
}

function createPhotoCellFromDataUrl(dataUrl, { width, height, label = "" }) {
  try {
    const imageTypeFromDataUrl = getImageTypeFromDataUrl(dataUrl);
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageType = imageTypeFromDataUrl || detectImageTypeFromBuffer(imageBuffer);

    if (!isSupportedImageBuffer(imageBuffer) || !imageType) {
      return new TableCell({
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Photo not available", italics: true, size: 18 })] })],
      });
    }

    return new TableCell({
      borders: tableBorders(),
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              type: imageType,
              transformation: { width, height },
            }),
          ],
          alignment: "center",
        }),
        ...(String(label || "").trim()
          ? [
              new Paragraph({
                children: [new TextRun({ text: sanitizeDocxText(label), size: 14 })],
                alignment: "center",
                spacing: { before: 40, after: 20 },
              }),
            ]
          : []),
      ],
    });
  } catch (e) {
    return new TableCell({
      borders: tableBorders(),
      children: [new Paragraph({ children: [new TextRun({ text: "Photo not available", italics: true, size: 18 })] })],
    });
  }
}

function createImageParagraphFromDataUrl(dataUrl, { width, height }) {
  try {
    const imageTypeFromDataUrl = getImageTypeFromDataUrl(dataUrl);
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const imageType = imageTypeFromDataUrl || detectImageTypeFromBuffer(imageBuffer);

    if (!isSupportedImageBuffer(imageBuffer) || !imageType) {
      return new Paragraph({
        children: [new TextRun({ text: "Photo not available", italics: true, size: 18 })],
        alignment: "center",
      });
    }

    return new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          type: imageType,
          transformation: { width, height },
        }),
      ],
      alignment: "center",
      spacing: { before: 60, after: 60 },
    });
  } catch (e) {
    return new Paragraph({
      children: [new TextRun({ text: "Photo not available", italics: true, size: 18 })],
      alignment: "center",
    });
  }
}

function createInlinePhotoGridTable(photoItems, { cellWidth, cellHeight }) {
  const previews = Array.isArray(photoItems)
    ? photoItems.filter((p) => p && typeof p.preview === "string" && p.preview.startsWith("data:image"))
    : [];

  const cells = previews.map((p) =>
    createPhotoCellFromDataUrl(p.preview, {
      width: cellWidth,
      height: cellHeight,
      label: p.label || "",
    })
  );

  if (cells.length === 0) cells.push(createEmptyPhotoCell(), createEmptyPhotoCell());
  if (cells.length % 2 !== 0) cells.push(createEmptyPhotoCell());

  const rows = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push(new TableRow({ children: [cells[i], cells[i + 1]] }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function getRemarkPhotosForRow(remarkPhotosByIndex, rowIndex) {
  if (!remarkPhotosByIndex || typeof remarkPhotosByIndex !== "object") return [];

  const direct = remarkPhotosByIndex[rowIndex];
  if (Array.isArray(direct)) return direct;

  const asStringKey = remarkPhotosByIndex[String(rowIndex)];
  if (Array.isArray(asStringKey)) return asStringKey;

  return [];
}

function getPhotoParagraphsForRemarkRow(photoItems) {
  const paragraphs = [];

  photoItems.forEach((item, index) => {
    if (!item || !item.preview || typeof item.preview !== "string") {
      return;
    }

    try {
      const imageTypeFromDataUrl = getImageTypeFromDataUrl(item.preview);
      const base64Data = item.preview.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const imageType = imageTypeFromDataUrl || detectImageTypeFromBuffer(imageBuffer);

      if (!isSupportedImageBuffer(imageBuffer) || !imageType) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: sanitizeDocxText(`Photo ${index + 1} is invalid or unsupported`), italics: true, size: 18 })],
            spacing: { after: 60 },
          })
        );
        return;
      }

      paragraphs.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              type: imageType,
              transformation: {
                width: 170,
                height: 120,
              },
            }),
          ],
          spacing: { after: 50 },
        })
      );

      if (item.label) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: sanitizeDocxText(`Photo ${index + 1}: ${item.label}`), size: 16 })],
            spacing: { after: 70 },
          })
        );
      }
    } catch (e) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: sanitizeDocxText(`Photo ${index + 1} could not be rendered`), italics: true, size: 18 })],
          spacing: { after: 60 },
        })
      );
    }
  });

  if (paragraphs.length === 0) {
    return [new Paragraph({ text: "-" })];
  }

  return paragraphs;
}

function tableBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "1F1F1F" },
  };
}

function getImageTypeFromMime(mime) {
  if (!mime || typeof mime !== "string") return null;
  const normalized = mime.toLowerCase().trim();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("bmp")) return "bmp";
  return null;
}

function getImageTypeFromDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext === "jpg" || ext === "png" || ext === "gif" || ext === "bmp") return ext;
  return null;
}

function detectImageTypeFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) return "png";
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) return "gif";
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return "bmp";
  return null;
}

function isSupportedImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  const hasPngHeader =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const hasJpegHeader = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const hasGifHeader =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61;

  const hasBmpHeader = buffer[0] === 0x42 && buffer[1] === 0x4d;

  if (hasJpegHeader) {
    // JPEG should end with EOI marker FF D9.
    return buffer.length > 4 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  }

  if (hasPngHeader) {
    // PNG should contain an IEND chunk trailer.
    const iendTrailer = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
    return buffer.indexOf(iendTrailer) !== -1;
  }

  if (hasGifHeader) {
    // GIF trailer byte is 0x3B.
    return buffer.length > 14 && buffer[buffer.length - 1] === 0x3b;
  }

  if (hasBmpHeader) {
    // BMP file size is stored in bytes 2-5 (little-endian).
    if (buffer.length < 6) return false;
    const declaredSize = buffer.readUInt32LE(2);
    return declaredSize > 0 && declaredSize <= buffer.length;
  }

  return false;
}

function normalizePayload(body) {
  const parsed = {};
  Object.keys(body || {}).forEach((key) => {
    const value = body[key];
    if (typeof value !== "string") {
      parsed[key] = value;
      return;
    }

    const trimmed = value.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        parsed[key] = JSON.parse(trimmed);
        return;
      } catch (e) {}
    }

    parsed[key] = value;
  });

  return parsed;
}

function enrichReportHeaderData(rawData) {
  const data = rawData || {};

  // Extract from General Information section
  const client = pickFirstValue(data, ["client", "clientName", "clientAbbr", "buyer"], "-");
  const po = pickFirstValue(data, ["po", "frin", "poNo", "poNumber", "purchaseOrder"], "-");

  // Extract Inspection Number (can come from multiple fields)
  const inspectionNumber = pickFirstValue(
    data,
    [
      "inspectionNumber",
      "inspectionNo",
      "inspectionId",
      "inspectionID",
      "reportNumber",
      "reportNo",
    ],
    po // Fallback to PO if not set
  );

  // Extract Report Date from General Information
  const reportDateInput = pickFirstValue(data, ["reportDate", "inspectionDate", "date"], "");
  const reportDate = normalizeReportDate(reportDateInput);

  // Extract Conclusion from Conclusion section
  const conclusionInput = pickFirstValue(
    data,
    ["conclusionStatus", "conclusion", "conclusionStep", "overallResult", "finalResult"],
    ""
  );
  const inferredConclusion = inferConclusionFromSummary(data);
  const normalizedConclusion = normalizeConclusionValue(conclusionInput) || inferredConclusion || "-";

  return {
    ...data,
    reportHeader: {
      client,
      po,
      inspectionNumber,
      reportDate,
      conclusion: normalizedConclusion,
    },
  };
}

function pickFirstValue(data, keys, fallback = "") {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

    const value = data[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function normalizeReportDate(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return value.trim();
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeConclusionValue(value) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();

  if (normalized === "PASS") return "PASSED";
  if (normalized === "FAIL") return "FAILED";
  if (normalized === "PASSED" || normalized === "FAILED" || normalized === "PENDING") {
    return normalized;
  }

  return "";
}

function inferConclusionFromSummary(data) {
  const summaryStatuses = [
    data.quantity,
    data.workmanship,
    data.onSiteTests,
    data.dimensions,
    data.packingResult,
    data.packing_result,
    data.marking_result_final,
    data.client_requirement_result,
    data.quantityResult,
    data.workmanshipResult,
    data.onSiteTestResult,
    data.productResult,
  ]
    .map((value) => normalizeConclusionValue(String(value || "")))
    .filter(Boolean);

  if (summaryStatuses.includes("FAILED")) return "FAILED";
  if (summaryStatuses.includes("PENDING")) return "PENDING";
  if (summaryStatuses.includes("PASSED")) return "PASSED";
  return "";
}

function createHeaderCell(text) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeDocxText(text),
            bold: true,
            size: 18,
            color: "FFFFFF",
          }),
        ],
        alignment: "center",
      }),
    ],
    shading: { fill: "1F4E79" },
  });
}

function createDataCell(text) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: sanitizeDocxText(text),
            size: 18,
          }),
        ],
        alignment: "center",
      }),
    ],
  });
}

function createQtyCell(text, options = {}) {
  const {
    bold = false,
    align = "center",
    colSpan,
    rowSpan,
    shaded = false,
    color,
    fontSize = 18,
    width,
  } = options;

  const textRunOptions = {
    text: sanitizeDocxText(text),
    bold,
    size: fontSize,
  };
  if (color) {
    textRunOptions.color = color;
  }

  const paragraphOptions = {
    children: [new TextRun(textRunOptions)],
    alignment: align,
  };

  const cellOptions = {
    children: [new Paragraph(paragraphOptions)],
    width,
  };
  if (shaded) {
    cellOptions.shading = { fill: "E9ECEF" };
  }

  if (typeof colSpan === "number" && colSpan > 1) {
    cellOptions.columnSpan = colSpan;
  }

  // Avoid rowSpan in generated report tables because some DOCX consumers
  // are strict and may mark the file as corrupted with unsupported merges.
  if (typeof rowSpan === "number" && rowSpan > 1) {
    cellOptions.rowSpan = rowSpan;
  }

  return new TableCell(cellOptions);
}

function createInspectionRow(label, result) {
  return new TableRow({
    children: [
      createDataCell(label),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: result === "Passed" ? "✓" : "",
                size: 22,
              }),
            ],
            alignment: "center",
          }),
        ],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: result === "Failed" ? "✓" : "",
                size: 22,
              }),
            ],
            alignment: "center",
          }),
        ],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: result === "Pending" ? "✓" : "",
                size: 22,
              }),
            ],
            alignment: "center",
          }),
        ],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: result === "N/A" ? "✓" : "",
                size: 22,
              }),
            ],
            alignment: "center",
          }),
        ],
      }),
    ],
  });
}

function sanitizeDocxText(value) {
  const str = String(value ?? "");
  // Keep valid XML 1.0 chars only: TAB, LF, CR and legal Unicode ranges.
  return str.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, "");
}

app.listen(5000, () => console.log("Server running"));
