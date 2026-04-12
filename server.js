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
              children: [createHeaderTable(data)],
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

  return new Table({
    width: { size: 100, type: "pct" },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: "pct" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Absolute Veritas",
                    bold: true,
                    size: 28,
                    color: "FF8C00",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Inspection, Testing and Certifications",
                    size: 18,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: "pct" },
            children: [new Paragraph("")],
          }),
          new TableCell({
            width: { size: 30, type: "pct" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Client Name (abbr.): ", bold: true, size: 20 }),
                  new TextRun({ text: sanitizeDocxText(header.client || "-"), size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "FRIN: ", bold: true, size: 20 }),
                  new TextRun({ text: sanitizeDocxText(header.po || "-"), size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Inspection Number: ", bold: true, size: 20 }),
                  new TextRun({ text: sanitizeDocxText(header.inspectionNumber || "-"), size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Report Date: ", bold: true, size: 20 }),
                  new TextRun({ text: sanitizeDocxText(header.reportDate || "-"), size: 20 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Conclusion: ",
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: sanitizeDocxText(header.conclusion || "-"),
                    bold: true,
                    size: 24,
                    color:
                      header.conclusion === "FAILED"
                        ? "FF0000"
                        : header.conclusion === "PASSED"
                        ? "00AA00"
                        : "FFA500",
                  }),
                ],
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

  // Title
  children.push(
    new Paragraph({
      alignment: "center",
      children: [
        new TextRun({
          text: "Pre-Shipment Inspection Report",
          bold: true,
          size: 44,
        }),
      ],
    })
  );

  children.push(new Paragraph(""));

  // I. GENERAL INFORMATION
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "I. GENERAL INFORMATION",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  // General Info as label/value rows with a dedicated right-side photo panel.
  const generalInfoRows = [
    ["Service Performed", data.servicePerformed || "-"],
    ["Client", data.client || "-"],
    ["Supplier", data.supplier || "-"],
    ["Factory", data.factory || "-"],
    ["Product Name", data.productName || "-"],
    ["P.O. No.", data.po || "-"],
    ["Item No.", data.itemNo || "-"],
    ["Destination Country", data.country || "-"],
    ["Inspection Date", data.inspectionDate || "-"],
    ["Inspection Location", data.inspectionLocation || "-"],
    ["Reference Sample", data.referenceSample || "-"],
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: generalInfoRows.map(([label, value], index) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 26, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: sanitizeDocxText(label), bold: true, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 44, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: sanitizeDocxText(value), size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: index === 0 ? getPhotoContent(data.generalPhoto, uploadedFiles) : [new Paragraph("")],
            }),
          ],
        })
      ),
    })
  );

  children.push(new Paragraph(""));

  // II. INSPECTION SUMMARY
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "II. INSPECTION SUMMARY",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  const inspectionSummaryRows = [
    new TableRow({
      children: [
        createHeaderCell(""),
        createHeaderCell("Passed"),
        createHeaderCell("Failed"),
        createHeaderCell("Pending"),
        createHeaderCell("N /A"),
      ],
    }),
    createInspectionRow(
      "A. Quantity",
      data.quantity
    ),
    createInspectionRow(
      "B. Workmanship",
      data.workmanship
    ),
    createInspectionRow(
      "C. On-Site Tests",
      data.onSiteTests
    ),
    createInspectionRow(
      "D. Dimensions",
      data.dimensions
    ),
    createInspectionRow(
      "E. Packing",
      data.packingResult
    ),
    createInspectionRow(
      "F. Marking & Labeling",
      data.marking_result_final
    ),
    createInspectionRow(
      "G. Client Special Requirement",
      data.client_requirement_result
    ),
  ];

  children.push(new Table({ rows: inspectionSummaryRows, width: { size: 100, type: "pct" } }));

  children.push(new Paragraph(""));

  // A. QUANTITY
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "A. QUANTITY",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 200, after: 120 },
    })
  );

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
        createQtyCell("Quantity", { bold: true, align: "left", shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("Unit:", { bold: true, align: "right", shaded: true }),
        createQtyCell("Sets", { bold: true, align: "left", shaded: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("P.O.", { bold: true, shaded: true }),
        createQtyCell("Item", { bold: true, shaded: true }),
        createQtyCell("Order Qty", { bold: true, shaded: true }),
        createQtyCell("Qty / Carton", { bold: true, shaded: true }),
        createQtyCell("Quantity Breakdown", { bold: true, shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("Sample Size", { bold: true, shaded: true }),
        createQtyCell("", { shaded: true }),
      ],
    }),
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
          createQtyCell(it.unfinishedBreakdown || "0"),
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
        createQtyCell(String(totalUnfinished), { bold: true }),
        createQtyCell(String(totalSamplePacked), { bold: true }),
        createQtyCell(String(totalSampleUnpacked), { bold: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Selected Cartons:", { bold: true, align: "left", shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell(data.selectedCartonsCount || "0"),
        createQtyCell("Cartons were selected randomly on site No. carton number in shipping mark.", { align: "left" }),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
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
        }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
        createQtyCell("", { shaded: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.quantityRemark || "-", { align: "left" }),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
        createQtyCell("", {}),
      ],
    }),
  ];

  children.push(new Table({ rows: quantityRows, width: { size: 100, type: "pct" } }));

  children.push(new Paragraph(""));

  // B. WORKMANSHIP
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "B. WORKMANSHIP",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

  const resolveWorkmanshipResult = (manual, found, accepted) => {
    if (manual) return manual;
    const f = Number(found || 0);
    const a = Number(accepted || 0);
    if (!Number.isFinite(f) || !Number.isFinite(a)) return "Pass";
    return f <= a ? "Pass" : "Fail";
  };

  const workmanshipSummaryRows = [
    new TableRow({
      children: [
        createQtyCell("Inspection Standard:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.inspectionStandardWM || "ANSI/ASQ Z1.4 (ISO 2859-1)", { align: "left" }),
        createQtyCell("AQL", { bold: true, shaded: true }),
        createQtyCell("Accepted", { bold: true, shaded: true }),
        createQtyCell("Total Found", { bold: true, shaded: true }),
        createQtyCell("Result", { bold: true, shaded: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Sampling Plan:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.samplingPlanWM || "Fixed Sample Size", { align: "left" }),
        createQtyCell(`Critical: ${data.aqlCriticalWM || "Not Allowed"}`, { align: "left" }),
        createQtyCell(data.acceptedCritical || "0"),
        createQtyCell(data.totalFoundCritical || "0"),
        createQtyCell(resolveWorkmanshipResult(data.result1WM, data.totalFoundCritical, data.acceptedCritical)),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Inspection Level:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.inspectionLevelWM || "Level II", { align: "left" }),
        createQtyCell(`Major: ${data.aqlMajorWM || "2.5"}`, { align: "left" }),
        createQtyCell(data.acceptedMajor || "0"),
        createQtyCell(data.totalFoundMajor || "0"),
        createQtyCell(resolveWorkmanshipResult(data.result2WM, data.totalFoundMajor, data.acceptedMajor)),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Sample Size:", { bold: true, align: "left", shaded: true }),
        createQtyCell(data.sampleSizeWM || "5 Sets", { align: "left" }),
        createQtyCell(`Minor: ${data.aqlMinorWM || "4.0"}`, { align: "left" }),
        createQtyCell(data.acceptedMinor || "0"),
        createQtyCell(data.totalFoundMinor || "0"),
        createQtyCell(resolveWorkmanshipResult(data.result3WM, data.totalFoundMinor, data.acceptedMinor)),
      ],
    }),
  ];

  children.push(new Table({ rows: workmanshipSummaryRows, width: { size: 100, type: "pct" } }));

  children.push(new Paragraph(""));

  const blankIfEmpty = (value) => {
    if (typeof value === "string" && value.trim().length > 0) return value;
    if (typeof value === "number") return String(value);
    return "-";
  };

  // C. ON-SITE TESTS
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "C. ON-SITE TESTS",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

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
  const onSiteTableRows = [
    new TableRow({
      children: [
        createQtyCell("#", { bold: true, shaded: true }),
        createQtyCell("Description", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Method", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Sample Size", { bold: true, shaded: true }),
        createQtyCell("Result / Reading", { bold: true, shaded: true, align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("0"),
        createQtyCell("Overall On-Site Test Status", { align: "left" }),
        createQtyCell("-", { align: "left" }),
        createQtyCell("-"),
        createQtyCell(blankIfEmpty(data.onSiteTests), { align: "left" }),
      ],
    }),
    ...onSiteRows.map((id, idx) =>
      new TableRow({
        children: [
          createQtyCell(String(idx + 1)),
          createQtyCell(blankIfEmpty(data[`testDesc${id}`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`testMethod${id}`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`testSample${id}`])),
          createQtyCell(blankIfEmpty(data[`testResult${id}`]), { align: "left" }),
        ],
      })
    ),
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.onSiteTestResult), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.onSiteTestRemark), { align: "left", colSpan: 4 }),
      ],
    }),
  ];

  children.push(new Table({ rows: onSiteTableRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // D. PRODUCT SPECIFICATION
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "D. PRODUCT SPECIFICATION",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

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
    new TableRow({
      children: [
        createQtyCell("Item", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Client's Spec.", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Ref. Sample", { bold: true, shaded: true }),
        createQtyCell("1# Sample", { bold: true, shaded: true }),
        createQtyCell("2# Sample", { bold: true, shaded: true }),
        createQtyCell("3# Sample", { bold: true, shaded: true }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Item No.", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.productDescription), { align: "left", colSpan: 5 }),
      ],
    }),
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
    ...productRows.map((id) =>
      new TableRow({
        children: [
          createQtyCell(blankIfEmpty(data[`item_${id}_name`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`item_${id}_desc`]), { align: "left" }),
          createQtyCell(blankIfEmpty(data[`item_${id}_c0`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c1`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c2`])),
          createQtyCell(blankIfEmpty(data[`item_${id}_c3`] || data[`item_${id}_c4`])),
        ],
      })
    ),
    new TableRow({
      children: [
        createQtyCell("Result:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.productResult), { align: "left", colSpan: 5 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark:", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.productRemark), { align: "left", colSpan: 5 }),
      ],
    }),
  ];

  children.push(new Table({ rows: productTableRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // E. PACKING
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "E. PACKING",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

  const packingItemIds = [1, 2];
  const packingRows = [
    new TableRow({
      children: [
        createQtyCell("Item No.", { bold: true, shaded: true, align: "left" }),
        createQtyCell("Qty/Carton M/A", { bold: true, shaded: true }),
        createQtyCell("Carton Size M/A", { bold: true, shaded: true }),
        createQtyCell("Gross Weight M/A", { bold: true, shaded: true }),
        createQtyCell("Qty/Inner M/A", { bold: true, shaded: true }),
      ],
    }),
    ...packingItemIds.map((id) =>
      new TableRow({
        children: [
          createQtyCell(blankIfEmpty(data[`packing_item_${id}`]), { align: "left" }),
          createQtyCell(
            `${blankIfEmpty(data[`packing_qty_carton_marking_${id}`])} / ${blankIfEmpty(data[`packing_qty_carton_actual_${id}`])}`
          ),
          createQtyCell(
            `${blankIfEmpty(data[`packing_carton_size_marking_${id}`])} / ${blankIfEmpty(data[`packing_carton_size_actual_${id}`])}`
          ),
          createQtyCell(
            `${blankIfEmpty(data[`packing_weight_marking_${id}`])} / ${blankIfEmpty(data[`packing_weight_actual_${id}`])}`
          ),
          createQtyCell(
            `${blankIfEmpty(data[`packing_qty_inner_marking_${id}`])} / ${blankIfEmpty(data[`packing_qty_inner_actual_${id}`])}`
          ),
        ],
      })
    ),
    new TableRow({
      children: [
        createQtyCell("Fastening Metal Staples", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.fastening_metal_staples), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Nylon Band", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.nylon_band), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Material", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.material), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Corrugated Paper Plies", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.corrugated_paper_plies), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Packing Method", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.packing_method), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Assortment Method", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.assortment_method), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Result", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.packing_result), { align: "left", colSpan: 4 }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Remark", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.packing_remark), { align: "left", colSpan: 4 }),
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

  // III. REMARKS
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "III. REMARKS",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

  const remarks = Array.isArray(data.remarks) ? data.remarks : [];
  const remarkRows = [];
  for (let i = 0; i < 9; i += 1) {
    const remarkText = blankIfEmpty(remarks[i]);
    remarkRows.push(
      new TableRow({
        children: [
          createQtyCell(`${i + 1}.`, { shaded: true }),
          createQtyCell(remarkText, { align: "left" }),
        ],
      })
    );

    const photosForRemark = getRemarkPhotosForRow(data.remarkPhotosByIndex, i);
    if (photosForRemark.length > 0) {
      remarkRows.push(
        new TableRow({
          children: [
            createQtyCell("Photos", { bold: true, shaded: true, align: "left" }),
            new TableCell({
              children: getPhotoParagraphsForRemarkRow(photosForRemark),
            }),
          ],
        })
      );
    }
  }
  remarkRows.push(
    new TableRow({
      children: [
        createQtyCell("Factory cooperation", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.factoryCooperation), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Worker count", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.workerCount), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Inspector opinion", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.inspectorOpinion), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Sample collection record", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.sampleCollectionRecord), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Recommendation", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.recommendationText), { align: "left" }),
      ],
    })
  );
  children.push(new Table({ rows: remarkRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // IV. CONCLUSION
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "IV. CONCLUSION",
          bold: true,
          size: 28,
          color: "1F4E79",
        }),
      ],
      spacing: { before: 160, after: 100 },
    })
  );

  const conclusionRows = [
    new TableRow({
      children: [
        createQtyCell("Conclusion", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.conclusionStatus), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Approved by", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.approvedBy), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Inspector", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.inspector), { align: "left" }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Report Reviewer", { bold: true, shaded: true, align: "left" }),
        createQtyCell(blankIfEmpty(data.reportReviewer), { align: "left" }),
      ],
    }),
  ];
  children.push(new Table({ rows: conclusionRows, width: { size: 100, type: "pct" } }));
  children.push(new Paragraph(""));

  // Factory Comments
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Factory Comment& Signature",
          bold: true,
          size: 24,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: sanitizeDocxText(data.factoryComments || "-"),
          size: 22,
        }),
      ],
    })
  );

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
          }),
        ],
        spacing: { before: 200, after: 100 },
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
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "-", size: 20 })],
      })
    );
    children.push(new Paragraph(""));
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Inspector Signature & Chop",
          bold: true,
          size: 22,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

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
            spacing: { after: 80 },
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
                width: 220,
                height: 150,
              },
            }),
          ],
          spacing: { after: 80 },
        })
      );

      if (item.label) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: sanitizeDocxText(`Photo ${index + 1}: ${item.label}`), size: 18 })],
            spacing: { after: 120 },
          })
        );
      }
    } catch (e) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: sanitizeDocxText(`Photo ${index + 1} could not be rendered`), italics: true, size: 18 })],
          spacing: { after: 80 },
        })
      );
    }
  });

  return paragraphs;
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
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
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

  const client = pickFirstValue(data, ["client", "clientName", "clientAbbr", "buyer"], "-");
  const po = pickFirstValue(data, ["po", "frin", "poNo", "poNumber", "purchaseOrder"], "-");

  const inspectionNumber = pickFirstValue(
    data,
    [
      "inspectionNumber",
      "inspectionNo",
      "inspectionId",
      "inspectionID",
      "reportNumber",
      "reportNo",
      "frin",
      "po",
    ],
    "-"
  );

  const reportDateInput = pickFirstValue(data, ["reportDate", "inspectionDate", "date"], "");
  const reportDate = normalizeReportDate(reportDateInput);

  const conclusionInput = pickFirstValue(
    data,
    ["conclusionStatus", "conclusion", "overallResult", "finalResult"],
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
            size: 20,
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
            size: 20,
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
  } = options;

  const textRunOptions = {
    text: sanitizeDocxText(text),
    bold,
    size: 20,
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
