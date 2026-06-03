/**
 * faDocx.service.js
 * Factory Audit DOCX report generator for Absolute Veritas.
 * Exports: createFAHeaderTable(data), createFAContent(data)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  VerticalMergeType,
  PageBreak,
} = require("docx");

const { tableBorders, createQtyCell, sanitizeDocxText } = require("../utils/docx.utils");

// Load logo once at module startup.
// Primary:  backend/assets/company-logo.png  (ships with backend in production)
// Fallback: frontend/public/company-logo.png (local dev convenience)
const _LOGO_CANDIDATES = [
  path.join(__dirname, "..", "assets", "company-logo.png"),
  path.join(__dirname, "..", "..", "frontend", "public", "company-logo.png"),
];
let _logoBuffer = null;
for (const candidate of _LOGO_CANDIDATES) {
  try {
    if (fs.existsSync(candidate)) {
      _logoBuffer = fs.readFileSync(candidate);
      console.log("[faDocx] Logo loaded:", candidate, `(${_logoBuffer.length} bytes)`);
      break;
    }
  } catch (e) {
    console.error("[faDocx] Failed to read logo from", candidate, ":", e.message);
  }
}
if (!_logoBuffer) {
  console.warn("[faDocx] Company logo not found in any candidate path — header will show text fallback");
}

// ─── helpers ────────────────────────────────────────────────────────────────

function san(v) {
  return sanitizeDocxText(v === undefined || v === null ? "" : String(v));
}

function val(v, fallback = "N/A") {
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s || fallback;
}

/** Return colour hex for PASS / FAIL / PENDING */
function getResultColor(result) {
  const r = String(result || "").toUpperCase();
  if (r.includes("PASS")) return "228B22";
  if (r.includes("FAIL")) return "CC0000";
  return "F39C12"; // PENDING / default
}

/** Detect image type string for docx ImageRun from a data-URI or default to "png". */
function detectImageType(src) {
  if (typeof src === "string" && src.startsWith("data:")) {
    const mime = src.split(";")[0].split(":")[1] || "";
    if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
    if (mime === "image/webp") return "jpg"; // docx lib doesn't support webp; convert to jpg label but buffer stays
    if (mime === "image/gif") return "gif";
    if (mime === "image/bmp") return "bmp";
    if (mime === "image/svg+xml") return "svg";
  }
  return "png";
}

/** Load a photo (base64 data-URI or Buffer) safely. Returns { buffer, type } or null. */
function loadImageSafe(src) {
  try {
    if (!src) return null;
    if (typeof src === "string") {
      if (src.startsWith("data:")) {
        const header = src.split(";")[0].split(":")[1] || "";
        const b64 = src.split(",")[1];
        if (!b64) return null;
        const buffer = Buffer.from(b64, "base64");
        if (header.toLowerCase() === "image/webp" || (buffer.length >= 12 && buffer.slice(0, 4).toString() === "RIFF" && buffer.slice(8, 12).toString() === "WEBP")) {
          return sharp(buffer).jpeg().toBuffer().then(out => ({ buffer: out, type: "jpg" })).catch(() => null);
        }
        return { buffer, type: detectImageType(src) };
      }
      // Plain file path fallback — assume PNG
      if (fs.existsSync(src)) {
        const buffer = fs.readFileSync(src);
        if (buffer.length >= 12 && buffer.slice(0, 4).toString() === "RIFF" && buffer.slice(8, 12).toString() === "WEBP") {
          return sharp(buffer).jpeg().toBuffer().then(out => ({ buffer: out, type: "jpg" })).catch(() => null);
        }
        return { buffer, type: "png" };
      }
    }
    if (Buffer.isBuffer(src)) {
      if (src.length >= 12 && src.slice(0, 4).toString() === "RIFF" && src.slice(8, 12).toString() === "WEBP") {
        return sharp(src).jpeg().toBuffer().then(out => ({ buffer: out, type: "jpg" })).catch(() => null);
      }
      return { buffer: src, type: "png" };
    }
  } catch (e) {
    console.warn("[faDocx] loadImageSafe failed:", e.message);
  }
  return null;
}

/** Create an ImageRun paragraph or a placeholder paragraph. */
function makePhotoParagraph(src, { width = 400, height = 300, label = "" } = {}) {
  const img = loadImageSafe(src);
  if (img) {
    const children = [new ImageRun({ data: img.buffer, type: img.type, transformation: { width, height } })];
    const paras = [new Paragraph({ children, alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 } })];
    if (label) {
      paras.push(new Paragraph({
        children: [new TextRun({ text: san(label), size: 16, color: "555555", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 }
      }));
    }
    return paras;
  }
  // Placeholder
  return [new Paragraph({
    children: [new TextRun({ text: label ? `[Photo: ${san(label)}]` : "[Photo not available]", size: 16, color: "999999" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 }
  })];
}

// ─── Row factory helpers ─────────────────────────────────────────────────────

/** Full-width section heading row — matches PSI style (E9ECEF bg, 1F4E79 text, Arial). */
function sectionHeaderRow(text, colSpan = 2) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: colSpan,
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: san(text), bold: true, size: 20, color: "1F4E79", font: "Arial" })],
          spacing: { before: 80, after: 80 } })]
      })
    ]
  });
}

/** Full-width part title row — dark navy bg, white text, for Part 1–7 headings. */
function partTitleRow(text, colSpan = 1) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: colSpan,
        shading: { fill: "1F4E79" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: san(text), bold: true, size: 24, color: "FFFFFF", font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 } })]
      })
    ]
  });
}

/** Sub-heading row (D9D9D9 bg). */
function subHeadRow(text, colSpan = 2) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: colSpan,
        shading: { fill: "D9D9D9" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: san(text), bold: true, size: 18 })],
          spacing: { before: 60, after: 60 }
        })]
      })
    ]
  });
}

/** Alias of sectionHeaderRow — kept for call-site compatibility. */
function redHeaderRow(text, colSpan = 2) {
  return sectionHeaderRow(text, colSpan);
}

/** Numbered label + value data row (3-column). */
function numberedDataRow(num, label, value) {
  return new TableRow({
    children: [
      createQtyCell(String(num), { width: { size: 5, type: "pct" }, align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
      createQtyCell(san(label), { width: { size: 35, type: "pct" }, align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
      createQtyCell(san(val(value)), { width: { size: 60, type: "pct" }, align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })
    ]
  });
}

/** Label + value data row (2-column). */
function dataRow(label, value, opts = {}) {
  const colSpanValue = opts.colSpanValue || 1;
  return new TableRow({
    children: [
      createQtyCell(san(label), { bold: true, align: AlignmentType.LEFT, shaded: true, width: { size: 30, type: "pct" }, spacing: { before: 60, after: 60 } }),
      createQtyCell(san(val(value)), { align: AlignmentType.LEFT, colSpan: colSpanValue, spacing: { before: 60, after: 60 } })
    ]
  });
}

/** 4-column table header row (F2F2F2 bg). */
function colHeaderRow(labels) {
  return new TableRow({
    children: labels.map(l => new TableCell({
      shading: { fill: "F2F2F2" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: san(l), bold: true, size: 18, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    }))
  });
}

/** Build a simple two-column table (rows = [[label, val], ...]) with a header. */
function buildSimpleTable(headerText, rows) {
  const tableRows = [sectionHeaderRow(headerText, 2)];
  rows.forEach(([label, value]) => tableRows.push(dataRow(label, value)));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}

/** Page-break paragraph */
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

/** Empty spacer paragraph */

/** Invisible spacer row for gaps inside tables */
function tableSpacerRow(colSpan = 10) {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: colSpan,
        borders: {
          top: { style: "none", size: 0, color: "FFFFFF" },
          bottom: { style: "none", size: 0, color: "FFFFFF" },
          left: { style: "none", size: 0, color: "FFFFFF" },
          right: { style: "none", size: 0, color: "FFFFFF" }
        },
        shading: { fill: "FFFFFF" },
        children: [new Paragraph({ children: [], spacing: { before: 120, after: 120 } })]
      })
    ]
  });
}

function spacer() {
  return new Paragraph({ children: [], spacing: { before: 240, after: 240 } });
}

// ─── HEADER TABLE ────────────────────────────────────────────────────────────

/**
 * createFAHeaderTable(data)
 * Returns a single Table element used in the document Header.
 */
exports.createFAHeaderTable = function createFAHeaderTable(data) {
  const gi = data.generalInfo || {};

  const client = san(val(gi.client || data.client, ""));
  const inspectionNo = san(val(gi.inspectionNo || data.inspectionNumber, "-"));
  const auditDate = san(val(gi.auditDate || data.auditDate, "-"));
  const auditor = san(val(gi.auditorName || data.auditorName || data.auditor || data.inspectorName, "-"));
  const conclusion = san(val(data.auditOverview?.overallConclusion || data.conclusion, "PENDING"));
  const conclusionColor = getResultColor(conclusion);

  // Logo — use buffer loaded once at module startup
  let logoRun = null;
  if (_logoBuffer) {
    try {
      logoRun = new ImageRun({ data: _logoBuffer, type: "png", transformation: { width: 140, height: 70 } });
    } catch (e) {
      console.error("[faDocx] ImageRun creation failed:", e.message);
    }
  }

  const noBorder = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE }
  };

  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
    left: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" },
    right: { style: BorderStyle.SINGLE, size: 6, color: "1F1F1F" }
  };

  const thickBorder = {
    top: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
    bottom: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
    left: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" },
    right: { style: BorderStyle.SINGLE, size: 12, color: "1F1F1F" }
  };

  function labelCell(text) {
    return new TableCell({
      borders: thinBorder,
      shading: { fill: "F2F2F2" },
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })] })]
    });
  }

  function valueCell(text) {
    return new TableCell({
      borders: thinBorder,
      children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(text), bold: true, size: 18 })] })]
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Row 1: Logo | Report Title (span 2) | Conclusion (span, restart merge)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 22, type: "pct" },
            verticalMerge: VerticalMergeType.RESTART,
            borders: thickBorder,
            verticalAlign: VerticalAlign.CENTER,
            children: [logoRun
              ? new Paragraph({ children: [logoRun], alignment: AlignmentType.CENTER })
              : new Paragraph({ children: [new TextRun({ text: "Absolute Veritas", bold: true, size: 18 })] })
            ]
          }),
          new TableCell({
            width: { size: 14, type: "pct" },
            borders: thinBorder,
            shading: { fill: "F2F2F2" },
            children: [new Paragraph({ children: [new TextRun({ text: "Report Type:", bold: true, size: 18 })] })]
          }),
          new TableCell({
            width: { size: 26, type: "pct" },
            borders: thinBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "FACTORY AUDIT REPORT", bold: true, size: 18 })] })]
          }),
          new TableCell({
            width: { size: 38, type: "pct" },
            verticalMerge: VerticalMergeType.RESTART,
            borders: thickBorder,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({
              children: [new TextRun({ text: conclusion, bold: true, size: 48, font: "Arial", color: conclusionColor })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 }
            })]
          })
        ]
      }),
      // Row 2: (logo merge) | Client | value | (conclusion merge)
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] }),
          labelCell("Client:"),
          valueCell(client),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] })
        ]
      }),
      // Row 3: (logo merge) | Inspection No. | value | (conclusion merge)
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] }),
          labelCell("Inspection No.:"),
          valueCell(inspectionNo),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] })
        ]
      }),
      // Row 4: (logo merge) | Audit Date | value | (conclusion merge)
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] }),
          labelCell("Audit Date:"),
          valueCell(auditDate),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] })
        ]
      }),
      // Row 5: (logo merge) | Auditor | value | (conclusion merge)
      new TableRow({
        children: [
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] }),
          labelCell("Auditor:"),
          valueCell(auditor),
          new TableCell({ verticalMerge: VerticalMergeType.CONTINUE, borders: thickBorder, children: [new Paragraph({ children: [] })] })
        ]
      })
    ]
  });
};

// ─── CONTENT BUILDER ─────────────────────────────────────────────────────────

/**
 * createFAContent(data)
 * Returns an array of Table/Paragraph elements for the document body.
 */
exports.createFAContent = function createFAContent(data) {
  const children = [];

  children.push(spacer()); // Gap below page header
  children.push(...buildGeneralInfoTable(data));
  children.push(spacer());
  children.push(...buildScoreTable(data));
  children.push(pageBreak());
  children.push(...buildCommentsSection(data));
  children.push(spacer());
  children.push(...buildConclusionSection(data));

  children.push(pageBreak());
  children.push(...buildRemarksSection(data));
  children.push(pageBreak());
  children.push(...buildTOCSection(data));
  children.push(pageBreak());

  children.push(...buildPart1(data));
  children.push(...buildPart2(data));
  children.push(...buildPart3(data));
  children.push(...buildPart4(data));
  children.push(...buildPart5(data));
  children.push(...buildPart6(data));
  children.push(...buildPart7(data));

  return children;
};

// ─── SECTION 1: General Information ─────────────────────────────────────────

function buildGeneralInfoTable(data) {
  const gi = data.generalInfo || {};
  const sp = data.supplierProfile || {};

  const factory = san(val(gi.factory || data.factory, "N/A"));
  const supplier = san(val(gi.supplier || data.supplier, "N/A"));
  const client = san(val(gi.client || data.client, "N/A"));
  const address = san(val(gi.factoryAddress || sp.actualLocation || data.factoryAddress, "N/A"));
  const auditDate = san(val(gi.auditDate || data.auditDate, "N/A"));
  const supplierLocation = san(val(sp.actualLocation || address, "N/A"));

  const labelFields = [
    ["Factory name", factory],
    ["Supplier name", supplier],
    ["Client's name", client],
    ["Audit date", auditDate],
    ["Factory location", address],
    ["Supplier location", supplierLocation]
  ];

  const generalPhoto = data.generalPhoto || gi.generalPhoto;

  const rows = [];

  // Report title row (spans all 3 cols) — matches PSI title row style
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: "FFFFFF" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "FACTORY AUDIT REPORT", bold: true, size: 28, color: "1F4E79", font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 }
        })]
      })
    ]
  }));

  // Section header row (spans all 3 cols) — matches PSI "I. GENERAL INFORMATION" style
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "GENERAL INFORMATION", bold: true, size: 22, color: "1F4E79", font: "Arial" })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 80, after: 80 }
        })]
      })
    ]
  }));

  // First data row — photo in col 3 spans all data rows via vertical merge (matches PSI layout)
  const [firstLabel, firstValue] = labelFields[0];
  rows.push(new TableRow({
    children: [
      createQtyCell(firstLabel, { bold: true, align: AlignmentType.LEFT, shaded: true, width: { size: 25, type: "pct" }, spacing: { before: 60, after: 60 } }),
      createQtyCell(firstValue, { align: AlignmentType.LEFT, width: { size: 35, type: "pct" }, spacing: { before: 60, after: 60 } }),
      new TableCell({
        verticalMerge: VerticalMergeType.RESTART,
        width: { size: 40, type: "pct" },
        borders: tableBorders(),
        verticalAlign: VerticalAlign.CENTER,
        children: makePhotoParagraph(generalPhoto, { width: 320, height: 220 })
      })
    ]
  }));

  // Remaining data rows — photo cell continues merge
  labelFields.slice(1).forEach(([label, value]) => {
    rows.push(new TableRow({
      children: [
        createQtyCell(label, { bold: true, align: AlignmentType.LEFT, shaded: true, width: { size: 25, type: "pct" }, spacing: { before: 60, after: 60 } }),
        createQtyCell(value, { align: AlignmentType.LEFT, width: { size: 35, type: "pct" }, spacing: { before: 60, after: 60 } }),
        new TableCell({
          verticalMerge: VerticalMergeType.CONTINUE,
          borders: tableBorders(),
          children: []
        })
      ]
    }));
  });

  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })];
}

// ─── SECTION 2: General Overview / Score Table ───────────────────────────────

function buildScoreTable(data) {
  const ao = data.auditOverview || {};

  // Parts definition: [partKey, partName, maxScore, weight]
  const parts = [
    { key: "profile", label: "Supplier/Factory Profile", max: 10, weight: 5 },
    { key: "orgCharts", label: "Factory Organization Charts", max: 10, weight: 3 },
    { key: "production", label: "Production Lines - Capacity", max: 10, weight: 5 },
    { key: "machinery", label: "Factory Facilities - machinery Conditions", max: 10, weight: 5 },
    { key: "qa", label: "Quality Assurance & Quality Control System", max: 10, weight: 5 },
    { key: "rd", label: "R&D – Sampling Capacity", max: 10, weight: 3 },
    { key: "env", label: "Environment (optional)", max: 10, weight: 3 }
  ];

  // Also support direct part1Score–part7Score fields on data
  const directScores = {
    profile: data.part1Score,
    orgCharts: data.part2Score,
    production: data.part3Score,
    machinery: data.part4?.part4Score,
    qa: data.part5?.part5Score,
    rd: data.part6?.part6Score,
    env: data.part7?.part7Score
  };

  const rows = [];

  // Title row
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "General overview of audit", bold: true, size: 22, color: "1F4E79", font: "Arial" })],
          spacing: { before: 80, after: 80 }
        })]
      })
    ]
  }));
  // Header row
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "Fields", bold: true, size: 18, font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 }
        })]
      }),
      new TableCell({
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "Score /10", bold: true, size: 18, font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 }
        })]
      }),
      new TableCell({
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "Weight /5", bold: true, size: 18, font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 }
        })]
      }),
      new TableCell({
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "Weighted score", bold: true, size: 18, font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 }
        })]
      })
    ]
  }));

  let totalWeight = 0;
  let totalWeightedScore = 0;

  parts.forEach(({ key, label, max, weight }, index) => {
    const scoreObtained = Number(ao[key] || directScores[key] || 0);
    const currentWeight = Number(ao[`${key}_weight`] || weight);
    const weightedScore = scoreObtained * currentWeight;

    totalWeight += currentWeight;
    totalWeightedScore += weightedScore;

    rows.push(new TableRow({
      children: [
        new TableCell({
          width: { size: 5, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({
            children: [new TextRun({ text: String(index + 1), size: 18 })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60, left: 100 }
          })]
        }),
        new TableCell({
          width: { size: 50, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({
            children: [new TextRun({ text: label, size: 18 })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 60, after: 60, left: 100 }
          })]
        }),
        createQtyCell(String(scoreObtained), { align: AlignmentType.CENTER, width: { size: 15, type: "pct" }, spacing: { before: 60, after: 60 } }),
        createQtyCell(String(currentWeight), { align: AlignmentType.CENTER, width: { size: 15, type: "pct" }, spacing: { before: 60, after: 60 } }),
        createQtyCell(String(weightedScore), { align: AlignmentType.CENTER, width: { size: 15, type: "pct" }, spacing: { before: 60, after: 60 } })
      ]
    }));
  });

  // Totals row
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "Total:", bold: true, size: 18 })],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60, after: 60, right: 100 }
        })]
      }),
      createQtyCell(String(totalWeight), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
      createQtyCell(String(totalWeightedScore), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
    ]
  }));

  // Conclusion row
  const conclusionVal = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(2) : "0.00";
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 4,
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: "General Overview Conclusion", bold: true, size: 18, font: "Arial" })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 60, after: 60, left: 100 }
        })]
      }),
      new TableCell({
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({
          children: [new TextRun({ text: `${conclusionVal}/ 10`, bold: true, size: 18, color: "1F4E79", font: "Arial" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 60 }
        })]
      })
    ]
  }));
  const tableChildren = [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })];

  // Add text paragraphs below table
  tableChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: "PASSED:      ", size: 16 }),
        new TextRun({ text: "The general overview conclusion is minimum 8", size: 16 })
      ],
      spacing: { before: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "PENDING:     ", size: 16 }),
        new TextRun({ text: "The general overview conclusion is less than 8 and minimum 6", size: 16 })
      ],
      spacing: { before: 60 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "FAILED:      ", size: 16 }),
        new TextRun({ text: "The general overview conclusion is less than 6", size: 16 })
      ],
      spacing: { before: 60 }
    })
  );

  return tableChildren;
}

function buildCommentsSection(data) {
  const generalOverviewRemarks = Array.isArray(data.generalOverviewRemarks)
    ? data.generalOverviewRemarks
    : (data.generalOverviewRemarks ? [data.generalOverviewRemarks] : []);

  const clientSpecialRemarks = Array.isArray(data.clientSpecialRemarks)
    ? data.clientSpecialRemarks
    : (data.clientSpecialRemarks ? [data.clientSpecialRemarks] : []);

  const tables = [];

  // ── COMMENTS TABLE ──
  const commentRows = [sectionHeaderRow("COMMENTS", 2)];

  if (generalOverviewRemarks.length > 0) {
    generalOverviewRemarks.forEach((text, i) => {
      const children = [];
      if (i === 0) {
        children.push(
          new TableCell({
            width: { size: 30, type: "pct" },
            verticalMerge: VerticalMergeType.RESTART,
            borders: tableBorders(),
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: "Main comments of this audit", size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
          })
        );
      } else {
        children.push(
          new TableCell({
            width: { size: 30, type: "pct" },
            verticalMerge: VerticalMergeType.CONTINUE,
            borders: tableBorders(),
            children: []
          })
        );
      }

      children.push(
        new TableCell({
          width: { size: 70, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: `${i + 1}.  ${san(text)}`, size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
        })
      );

      commentRows.push(new TableRow({ children }));
    });
  } else {
    commentRows.push(new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Main comments of this audit", size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
        }),
        new TableCell({
          width: { size: 70, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "-", size: 16, color: "888888" })], spacing: { before: 60, after: 60, left: 100 } })]
        })
      ]
    }));
  }

  tables.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: commentRows }));
  tables.push(spacer());

  // ── CLIENT'S SPECIAL REQUIREMENT TABLE ──
  const reqRows = [sectionHeaderRow("Client's special requirement of audit", 4)];

  // Header Row
  reqRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Requirement", bold: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
      }),
      new TableCell({
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Result", bold: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
      }),
      new TableCell({
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Remark", bold: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
      })
    ]
  }));

  if (clientSpecialRemarks.length > 0) {
    clientSpecialRemarks.forEach((text, i) => {
      reqRows.push(new TableRow({
        children: [
          new TableCell({
            width: { size: 10, type: "pct" },
            borders: tableBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: `8.${i + 1}`, size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
          }),
          new TableCell({
            width: { size: 40, type: "pct" },
            borders: tableBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: san(text.requirement || text), size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
          }),
          new TableCell({
            width: { size: 25, type: "pct" },
            borders: tableBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: san(text.result || ""), size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
          }),
          new TableCell({
            width: { size: 25, type: "pct" },
            borders: tableBorders(),
            children: [new Paragraph({ children: [new TextRun({ text: san(text.remark || ""), size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
          })
        ]
      }));
    });
  } else {
    reqRows.push(new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "8.1", size: 16 })], spacing: { before: 60, after: 60, left: 100 } })]
        }),
        new TableCell({
          width: { size: 40, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "-", size: 16, color: "888888" })], spacing: { before: 60, after: 60, left: 100 } })]
        }),
        new TableCell({
          width: { size: 25, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [] })]
        }),
        new TableCell({
          width: { size: 25, type: "pct" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [] })]
        })
      ]
    }));
  }

  // Conclusion Row
  reqRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Special Requirement Conclusion", bold: true, size: 16, font: "Arial" })], spacing: { before: 60, after: 60, left: 100 } })]
      }),
      new TableCell({
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [] })]
      })
    ]
  }));
  tables.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: reqRows }));

  return tables;
}

// ─── SECTION 4: Final Conclusion ──────────────────────────────────────────────

function buildConclusionSection(data) {
  const ao = data.auditOverview || {};
  const conclusion = san(val(ao.overallConclusion || data.conclusion, "PENDING")).toUpperCase();
  const conclusionColor = getResultColor(conclusion);

  const rows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: "pct" },
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Overall Conclusion", bold: true, size: 36, color: "1F4E79", font: "Arial" })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 }
            })
          ]
        }),
        new TableCell({
          width: { size: 50, type: "pct" },
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: conclusion, bold: true, size: 36, color: conclusionColor, font: "Arial" })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 120 }
            })
          ]
        })
      ]
    })
  ];

  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })];
}

// ─── SECTION 5: Remarks ───────────────────────────────────────────────────────

function buildRemarksSection(data) {
  const generalOverviewRemarks = Array.isArray(data.generalOverviewRemarks)
    ? data.generalOverviewRemarks
    : (data.generalOverviewRemarks ? [data.generalOverviewRemarks] : []);

  const clientSpecialRemarks = Array.isArray(data.clientSpecialRemarks)
    ? data.clientSpecialRemarks
    : (data.clientSpecialRemarks ? [data.clientSpecialRemarks] : []);

  const suggestions = Array.isArray(data.suggestions)
    ? data.suggestions
    : (Array.isArray(data.recommendations) ? data.recommendations : []);

  const rows = [sectionHeaderRow("REMARKS", 2)];

  let counter = 1;

  // General Overview
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "General Overview:", bold: true, size: 18 })], spacing: { before: 60, after: 60, left: 60 } })]
      })
    ]
  }));
  if (generalOverviewRemarks.length > 0) {
    generalOverviewRemarks.forEach(text => {
      rows.push(new TableRow({
        children: [
          new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(counter++) + ".", size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
          new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: san(text), size: 18 })], spacing: { before: 60, after: 60, left: 60 } })] })
        ]
      }));
    });
  }

  // Client's special requirement
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Client's special requirement", bold: true, size: 18 })], spacing: { before: 60, after: 60, left: 60 } })]
      })
    ]
  }));

  if (clientSpecialRemarks.length > 0) {
    clientSpecialRemarks.forEach(text => {
      rows.push(new TableRow({
        children: [
          new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(counter), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
          new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: san(text.requirement || text), size: 18 })], spacing: { before: 60, after: 60, left: 60 } })] })
        ]
      }));
      counter++;
    });
  } else {
    rows.push(new TableRow({
      children: [
        new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(counter++), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "-", size: 18 })], spacing: { before: 60, after: 60, left: 60 } })] })
      ]
    }));
  }

  // Suggestion:
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "F2F2F2" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Suggestion:", bold: true, size: 18 })], spacing: { before: 60, after: 60, left: 60 } })]
      })
    ]
  }));

  if (suggestions.length > 0) {
    suggestions.forEach(text => {
      rows.push(new TableRow({
        children: [
          new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(counter++), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
          new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: san(text), size: 18 })], spacing: { before: 60, after: 60, left: 60 } })] })
        ]
      }));
    });
  } else {
    rows.push(new TableRow({
      children: [
        new TableCell({ width: { size: 5, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: String(counter++), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 95, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "-", size: 18 })], spacing: { before: 60, after: 60, left: 60 } })] })
      ]
    }));
  }

  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })];
}

// ─── SECTION 6: Table of Contents ─────────────────────────────────────────────

function buildTOCSection(data) {
  const children = [];

  // Header Table
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [sectionHeaderRow("CONTENT:", 1)]
  }));

  children.push(spacer());
  children.push(spacer());

  const items = [
    "Part 1—Supplier/Factory Profile",
    "Part 2—Factory Organization",
    "Part 3—Production Lines/Capacity",
    "Part 4—Factory Facilities/Machinery Conditions",
    "Part 5—Quality Assurance& Quality Control System",
    "Part 6—R & D/Sampling Capacity",
    "Part 7—Environment (optional)"
  ];

  items.forEach(item => {
    children.push(new Paragraph({
      children: [new TextRun({ text: item, size: 24, font: "Arial" })],
      indent: { left: 2500 },
      spacing: { before: 120, after: 120 }
    }));
  });

  return children;
}

// ─── PART 1: Supplier Profile ─────────────────────────────────────────────────

function buildPart1(data) {
  const sp = data.supplierProfile || {};
  const ci = data.communicationInfrastructure || {};
  const rp = data.relatedPictures || {};
  const pm = Array.isArray(data.productsMarkets) ? data.productsMarkets : [];
  const recs = Array.isArray(data.recommendations) ? data.recommendations : [];

  const result = [];

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 1", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "A: Supplier profile", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  // ── General info table
  const infoRows = [
    sectionHeaderRow("General information", 3),
    numberedDataRow(1, "Date of foundation", sp.dateOfFoundation),
    numberedDataRow(2, "Legal status", sp.legalStatus),
    numberedDataRow(3, "Actual location", sp.actualLocation || "Same as above"),
    numberedDataRow(4, "Location on business license", sp.businessLicenseInfo || "Same as above"),
    numberedDataRow(5, "Location on export license", sp.exportLicenseInfo || "Same as above"),
    numberedDataRow(6, "Location on bank information", sp.bankInfo || "Same as above"),
    numberedDataRow(7, "Location on business card", sp.businessCardInfo || "Same as above"),
    numberedDataRow(8, "Area", sp.area),
    numberedDataRow(9, "Number of staff", sp.numberOfStaff),
    numberedDataRow(10, "Corporate representative", sp.corporateRepresentative),
    numberedDataRow(11, "Main products", sp.mainProducts),
    numberedDataRow(12, "Main market", sp.mainMarket),
    numberedDataRow(13, "Business license", sp.businessLicenseInfo),
    numberedDataRow(14, "Annual turnover", sp.annualTurnover || "N/A")
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: infoRows }));
  result.push(spacer());

  // ── Communication sub-table
  const commRows = [
    sectionHeaderRow("Communication infrastructures", 3),
    numberedDataRow(1, "Telephone sets", ci.telephoneSets),
    numberedDataRow(2, "Fax machines", ci.faxMachines),
    numberedDataRow(3, "Computers", ci.computers),
    numberedDataRow(4, "E-mail Domain", ci.emailDomain)
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: commRows }));
  result.push(spacer());

  // ── Products & Markets sub-table
  const pmRows = [
    sectionHeaderRow("Products / markets", 4),
    colHeaderRow(["Product type", "Major customer name", "Market location", "Monthly Order Qty (pcs)"])
  ];
  if (pm.length > 0) {
    pm.forEach(r => {
      pmRows.push(new TableRow({
        children: [
          createQtyCell(san(val(r.productType)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.customerName)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.marketLocation)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.monthlyQty)), { spacing: { before: 60, after: 60 } })
        ]
      }));
    });
  } else {
    pmRows.push(new TableRow({ children: [new TableCell({ columnSpan: 4, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "No data provided.", size: 18, color: "888888" })], spacing: { before: 60, after: 60 } })] })] }));
  }
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: pmRows }));
  result.push(spacer());

  // ── Recommendations sub-table
  const recRows = [
    sectionHeaderRow("Recommendations / credentials", 5),
    colHeaderRow(["Company name", "Country", "Contact", "Products", "Details"])
  ];
  if (recs.length > 0) {
    recs.forEach(r => {
      recRows.push(new TableRow({
        children: [
          createQtyCell(san(val(r.companyName)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.country)), { spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.contact)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.products)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.details)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })
        ]
      }));
    });
  } else {
    recRows.push(new TableRow({ children: [new TableCell({ columnSpan: 5, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "No recommendations provided.", size: 18, color: "888888" })], spacing: { before: 60, after: 60 } })] })] }));
  }
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: recRows }));
  result.push(spacer());

  // ── Building/Office photos
  const buildingPhotos = Array.isArray(data.buildingOfficePhotos) ? data.buildingOfficePhotos : [];
  if (buildingPhotos.length > 0) {
    const bpRows = [
      sectionHeaderRow("Related pictures:", 2),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: "D9D9D9" },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Building and office viewing", bold: true, size: 18, font: "Arial" })],
                spacing: { before: 60, after: 60 }
              })
            ]
          })
        ]
      })
    ];
    for (let i = 0; i < buildingPhotos.length; i += 2) {
      const cells = [buildingPhotos[i], buildingPhotos[i + 1]].filter(Boolean).map(p =>
        new TableCell({
          borders: tableBorders(),
          width: { size: 50, type: "pct" },
          children: makePhotoParagraph(p.preview, { width: 300, height: 220, label: p.label || "" })
        })
      );
      if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
      bpRows.push(new TableRow({ children: cells }));
    }
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bpRows }));
    result.push(spacer());
  }

  // ── Certificates on separate pages ──
  
  // Building Certificate
  if (rp.certPhoto || rp.certCertNo) {
    result.push(pageBreak());
    const bcHeaderRow = new TableRow({
      children: [
        new TableCell({
          shading: { fill: "D9D9D9" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Building Certificate (Proprietary or leasing Document)", bold: true, size: 18 })], spacing: { before: 60, after: 60 } })]
        })
      ]
    });
    const bcPhotoRow = new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: makePhotoParagraph(rp.certPhoto, { width: 500, height: 600, label: "" })
        })
      ]
    });
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [bcHeaderRow, bcPhotoRow] }));
    
    const bcAccRows = [
      sectionHeaderRow("License accreditation:", 1),
      new TableRow({ children: [createQtyCell(`Certificate No: ${san(val(rp.certCertNo))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] }),
      new TableRow({ children: [createQtyCell(`Date issued: ${san(val(rp.licenseDateIssued, "--"))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] }),
      new TableRow({ children: [createQtyCell(`Expiration: ${san(val(rp.licenseExpiration, "Life time"))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] })
    ];
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bcAccRows }));
  }

  // Export License
  if (rp.exportPhoto || rp.exportCertNo) {
    result.push(pageBreak());
    result.push(...makePhotoParagraph(rp.exportPhoto, { width: 500, height: 600, label: "Export License Document" }));
    const elRows = [
      sectionHeaderRow("Export license", 1),
      new TableRow({ children: [createQtyCell(`Certificate No: Ref. No: ${san(val(rp.exportCertNo))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] }),
      new TableRow({ children: [createQtyCell(`Date issued: ${san(val(rp.licenseDateIssued, "--"))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] })
    ];
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: elRows }));
  }

  // Bank Info
  if (rp.bankPhoto || rp.bankAccountNumber) {
    result.push(pageBreak());
    result.push(...makePhotoParagraph(rp.bankPhoto, { width: 500, height: 600, label: "Bank Certificate Document" }));
    const bankRows = [
      sectionHeaderRow("Bank information", 1),
      new TableRow({ children: [createQtyCell(`Certificate No: ${san(val(rp.bankCertNo))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] }),
      new TableRow({ children: [createQtyCell(`Date issued: --`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] }),
      new TableRow({ children: [createQtyCell(`USD Bank account number: ${san(val(rp.bankAccountNumber))}`, { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })] })
    ];
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bankRows }));
  }

  // ── Score row at end of Part 1 ──
  result.push(spacer());
  const part1Score = Number(data.part1Score || 0);
  const scoreCells = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part1Score;
    scoreCells.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells })]
  }));

  return result;
}

// ─── PART 2: Factory Organization ────────────────────────────────────────────

function buildPart2(data) {
  const orgPhotos = Array.isArray(data.orgChartPhotos) ? data.orgChartPhotos : [];
  const description = san(val(data.organizationDescription || (data.part2 && data.part2.organizationDescription), ""));

  const result = [];

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 2", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "Factory Organization", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  const mainRows = [sectionHeaderRow("Factory organization chart", 1)];

  // Description if present
  if (description) {
    mainRows.push(new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: description, size: 18 })], spacing: { before: 240, after: 240 } })]
        })
      ]
    }));
  }

  // Org chart photos — each displayed large, one per row
  if (orgPhotos.length > 0) {
    orgPhotos.forEach(p => {
      mainRows.push(new TableRow({
        children: [
          new TableCell({
            borders: tableBorders(),
            children: makePhotoParagraph(p.preview, { width: 500, height: 600, label: p.label || "" })
          })
        ]
      }));
    });
  }

  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: mainRows }));

  // Score row
  result.push(spacer());
  const part2Score = Number(data.part2Score || 0);
  const scoreCells2 = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part2Score;
    scoreCells2.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells2 })]
  }));

  return result;
}

// ─── PART 3: Production Lines & Capacity ──────────────────────────────────────

function buildPart3(data) {
  const workflowPhotos = Array.isArray(data.productionWorkflowPhotos) ? data.productionWorkflowPhotos : [];
  const processLines = Array.isArray(data.productionProcess) ? data.productionProcess : [];
  const doc = data.dailyOutputCheck || {};
  const lt = data.leadTimes || {};
  const bn = data.bottlenecks || {};
  const doPhotos = Array.isArray(data.dailyOutputPhotos) ? data.dailyOutputPhotos : [];

  const result = [];

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 3", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 50, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "Production lines / Capacity", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  // ── Production workflow chart ──
  const wfRows = [sectionHeaderRow("Production workflow chart", 1)];
  if (workflowPhotos.length > 0) {
    workflowPhotos.forEach(p => {
      wfRows.push(new TableRow({
        children: [
          new TableCell({
            borders: tableBorders(),
            children: makePhotoParagraph(p.preview, { width: 500, height: 600, label: p.label || "" })
          })
        ]
      }));
    });
  } else {
    wfRows.push(new TableRow({ children: [new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "No workflow photos provided.", size: 18, color: "888888" })], spacing: { before: 60, after: 60 } })] })] }));
  }
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: wfRows }));
  result.push(spacer());

  // ── Production process table ──
  const procRows = [
    sectionHeaderRow("Production process", 6),
    colHeaderRow(["Operation Name", "Machine/ Device Name", "Machine count", "Workers number", "Output (pcs/hour)", "Total Step Capacity (PCS per day)"])
  ];

  if (processLines.length > 0) {
    processLines.forEach(r => {
      procRows.push(new TableRow({
        children: [
          createQtyCell(san(val(r.operationName)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.machineName)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.machineCount)), { spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.workersNumber)), { spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.outputPerHour)), { spacing: { before: 60, after: 60 } }),
          createQtyCell(san(val(r.dailyCapacity)), { spacing: { before: 60, after: 60 } })
        ]
      }));
    });
  } else {
    procRows.push(new TableRow({ children: [new TableCell({ columnSpan: 6, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "No production process data provided.", size: 18, color: "888888" })], spacing: { before: 60, after: 60 } })] })] }));
  }
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: procRows }));
  result.push(spacer());

  // ── Overall capacity row ──
  let minCapacity = "";
  if (processLines.length > 0) {
    const capacities = processLines.map(r => Number(r.dailyCapacity || 0)).filter(c => c > 0);
    if (capacities.length > 0) minCapacity = String(Math.min(...capacities));
  }
  const ocRows = [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          width: { size: 80, type: "pct" },
          children: [new Paragraph({
            children: [new TextRun({ text: "Overall capacity = minimum step capacity (pcs per week):", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
            spacing: { before: 60, after: 60 }
          })]
        }),
        createQtyCell(san(val(minCapacity)), { spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ocRows }));
  result.push(spacer());

  // ── Daily output check ──
  const docRows = [sectionHeaderRow("Daily output check:", 2)];
  docRows.push(new TableRow({
    children: [
      new TableCell({
        borders: tableBorders(),
        width: { size: 50, type: "pct" },
        children: [new Paragraph({ children: [new TextRun({ text: "Is there a running production in the factory during the Audit?", size: 18 })], spacing: { before: 60, after: 60 } })]
      }),
      new TableCell({
        borders: tableBorders(),
        width: { size: 50, type: "pct" },
        children: [new Paragraph({
          children: [
            new TextRun({ text: san(val(doc.runningProduction, "N/A")), size: 18 }),
            new TextRun({ text: doc.outputCheckComments ? `     Comment(s): - ${san(doc.outputCheckComments)}` : "", size: 18 })
          ],
          spacing: { before: 60, after: 60 }
        })]
      })
    ]
  }));
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: docRows }));
  result.push(spacer());

  // ── Daily output photos ──
  if (doPhotos.length > 0) {
    const photoRows = [];
    for (let i = 0; i < doPhotos.length; i += 2) {
      const cells = [doPhotos[i], doPhotos[i + 1]].filter(Boolean).map(p =>
        new TableCell({
          borders: tableBorders(),
          width: { size: 50, type: "pct" },
          children: makePhotoParagraph(p.preview, { width: 300, height: 220, label: p.label || "Product Storage" })
        })
      );
      if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
      photoRows.push(new TableRow({ children: cells }));
    }
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: photoRows }));
    result.push(spacer());
  }

  // ── For -process,- lines table ──
  const plRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [new Paragraph({
            children: [new TextRun({ text: "For -process,- lines", bold: true, size: 20, font: "Arial" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 }
          })]
        })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Start time", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell("Finished time", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell("Total time", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(san(val(doc.startTime)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(doc.finishedTime)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(doc.totalTime)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Finished products", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell("Finished products", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell("Output", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell(san(val(doc.finishedProductsStart)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(doc.finishedProductsEnd)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(doc.outputPieces)) + " pieces", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: plRows }));
  result.push(spacer());

  // ── Lead times for client's production ──
  const ltRows = [
    sectionHeaderRow("Lead times for client's production:", 3),
    new TableRow({
      children: [
        createQtyCell("According to", { bold: true, align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell("Factory", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell("Auditor check", { bold: true, align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Raw material supply capacity:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(lt.rawMaterialCapacityFactory)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(lt.rawMaterialCapacityAuditor)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Production weekly capacity:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(lt.weeklyCapacityFactory)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(lt.weeklyCapacityAuditor)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ltRows }));
  result.push(spacer());

  // ── Sensitive points / bottlenecks ──
  const bnRows = [
    sectionHeaderRow("Sensitive points / bottlenecks", 1),
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: `According to auditor check: - ${san(val(bn.bottleneckAuditorCheck))}`, size: 18 })], spacing: { before: 60, after: 60 } })]
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: `Comments: - ${san(val(bn.bottleneckComments))}`, size: 18 })], spacing: { before: 60, after: 60 } })]
        })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bnRows }));

  // ── Score row ──
  result.push(spacer());
  const part3Score = Number(data.part3Score || 0);
  const scoreCells3 = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part3Score;
    scoreCells3.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells3 })]
  }));

  return result;
}

// ─── PART 4: Factory Facilities & Machinery ───────────────────────────────────

function buildPart4(data) {
  const p4 = data.part4 || {};
  const machines = Array.isArray(p4.machineryConditions) ? p4.machineryConditions : [];
  const wh = p4.warehouseCondition || {};
  const whPhotos = p4.warehousePhotos || {};
  const sr = p4.sampleRoomCondition || {};
  const ps = p4.publicPowerSupply || {};
  const sc = p4.shipmentCapabilities || {};
  const shipPhotos = p4.shipmentPhotos || {};

  const result = [];

  const formatCB = (valStr) => {
    const v = san(valStr).toLowerCase();
    if (v === 'yes') return "☒Yes ☐No";
    if (v === 'no') return "☐Yes ☒No";
    return "☐Yes ☐No";
  };

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 4", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "Factory Facilities / Machinery Conditions", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  // ── Machinery table ──
  const machRows = [
    sectionHeaderRow("Machines for production", 4),
    new TableRow({
      children: [
        new TableCell({ shading: { fill: "FFFFFF" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Machine Name/\nBrand/Country of\nOrigin", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ shading: { fill: "FFFFFF" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Picture", size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ shading: { fill: "FFFFFF" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Count", size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ shading: { fill: "FFFFFF" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Comments (conditions\nand age)", size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    })
  ];

  if (machines.length > 0) {
    machines.forEach(m => {
      const photoBuf = loadImageSafe(m.picture);
      machRows.push(new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            borders: tableBorders(),
            width: { size: 20, type: "pct" },
            children: [new Paragraph({ children: [new TextRun({ text: san(val(m.machineName)), bold: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            borders: tableBorders(),
            width: { size: 50, type: "pct" },
            children: photoBuf
              ? makePhotoParagraph(m.picture, { width: 300, height: 220 })
              : [new Paragraph({ children: [new TextRun({ text: "-", size: 18, color: "888888" })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            borders: tableBorders(),
            width: { size: 10, type: "pct" },
            children: [new Paragraph({ children: [new TextRun({ text: san(val(m.count)), bold: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            borders: tableBorders(),
            width: { size: 20, type: "pct" },
            children: [new Paragraph({ children: [new TextRun({ text: san(val(m.comments)), bold: true, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
          })
        ]
      }));
    });
  } else {
    machRows.push(new TableRow({ children: [new TableCell({ columnSpan: 4, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "No machinery data provided.", size: 18, color: "888888" })], spacing: { before: 60, after: 60 } })] })] }));
  }

  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: machRows }));
  result.push(spacer());

  // ── Warehouse condition ──
  const whRows = [
    sectionHeaderRow("Warehouse condition", 2),
    new TableRow({
      children: [
        createQtyCell("Area of Warehouse (M²)", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(wh.warehouseArea)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Materials clearly stocked in different areas?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(wh.materialsStocked), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Lab/Marking clearly indicated in different material?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(wh.labMarking), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Warehouse clean and tidy?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(wh.warehouseClean), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Equipment/Tools/Facilities Advanced?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(wh.facilitiesAdvanced), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];

  // Warehouse photos
  if (whPhotos.rawMaterials || whPhotos.finishedProducts) {
    const cells = [];
    if (whPhotos.rawMaterials) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(whPhotos.rawMaterials, { width: 300, height: 220, label: "Raw Materials Storage" }) }));
    if (whPhotos.finishedProducts) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(whPhotos.finishedProducts, { width: 300, height: 220, label: "Finished products storage condition" }) }));
    if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
    whRows.push(new TableRow({ children: cells }));
  }

  // Estimated warehouse capacity
  whRows.push(new TableRow({
    children: [
      new TableCell({
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Estimated warehouse capacity:", bold: true, size: 20, color: "1F4E79", font: "Arial" })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })]
      }),
      createQtyCell(san(val(wh.warehouseCapacity)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
    ]
  }));
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: whRows }));
  result.push(spacer());

  // ── Sample room condition ──
  const srRows = [
    sectionHeaderRow("Sample room condition", 2),
    new TableRow({
      children: [
        createQtyCell("Sample room clean and tidy?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(sr.sampleRoomClean), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Sample complete disposed in Sample room?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(sr.sampleDisposed), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: srRows }));
  result.push(spacer());

  // ── Public power supply ──
  const psRows = [
    sectionHeaderRow("Public power supply", 2),
    new TableRow({
      children: [
        createQtyCell("Public power Connected?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(ps.publicPowerConnected), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Frequent Power Outage in the area?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(ps.frequentPowerOutage), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Diesel Generator available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(ps.dieselGenerator), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("If yes, Electric Power Generator Count:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(ps.generatorCount, "N/A")), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: psRows }));
  result.push(spacer());

  // ── Shipment capabilities ──
  const scRows = [
    sectionHeaderRow("Shipment capabilities", 2),
    new TableRow({
      children: [
        createQtyCell("Capacity of shipping meets requirement of buyer?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(sc.shippingMeetsRequirement), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Over 4 containers can be loaded together?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(sc.containersLoadedTogether), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Protection for loading against bad weather?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(sc.protectionBadWeather), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Mechanical Loading Capacity disposed? (Fork,etc.)", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(sc.mechanicalLoadingDisposed), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];

  if (shipPhotos.loadingPlace1 || shipPhotos.loadingPlace2) {
    const cells = [];
    if (shipPhotos.loadingPlace1) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(shipPhotos.loadingPlace1, { width: 300, height: 220, label: "Loading Place" }) }));
    if (shipPhotos.loadingPlace2) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(shipPhotos.loadingPlace2, { width: 300, height: 220, label: "Loading Place" }) }));
    if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
    scRows.push(new TableRow({ children: cells }));
  }

  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: scRows }));
  result.push(spacer());

  // ── Score row ──
  const part4Score = Number(data.part4?.part4Score || data.part4Score || 0);
  const scoreCells4 = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part4Score;
    scoreCells4.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells4 })]
  }));

  return result;
}

// ─── PART 5: Quality Assurance & QC System ────────────────────────────────────

function buildPart5(data) {
  const p5 = data.part5 || {};
  const qsm = p5.qualitySystemManagement || {};
  const itr = p5.inspectionTrackRecord || {};
  const oqc = p5.onlineQC || {};
  const fqc = p5.finalQC || {};
  const iqc = p5.incomingQC || {};
  const tePhotos = p5.testEquipmentPhotos || {};

  const result = [];

  const formatCB = (valStr) => {
    const v = san(valStr).toLowerCase();
    if (v === 'yes') return "☒Yes ☐No";
    if (v === 'no') return "☐Yes ☒No";
    return "☐Yes ☐No";
  };

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 5", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "Quality Assurance & Quality Control System", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  // ── Quality system management ──
  const qsmRows = [
    sectionHeaderRow("Quality system management", 3),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Certificate: ISO 9001", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(qsm.iso9001Status), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Comment: ${san(val(qsm.iso9001Comment, "-"))}`, size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Internal QA manual", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(qsm.internalQAManualStatus), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Comment: ${san(val(qsm.internalQAManualComment, "-"))}`, size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Others:", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(qsm.othersStatus), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Comment: ${san(val(qsm.othersComment, "-"))}`, size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "QA staff", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(qsm.qaStaffStatus), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: san(val(qsm.qaStaffComment, "-")), size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    })
  ];

  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: qsmRows }));
  // Table 2: QSM Photos 2-columns
  const qsmPhotoRows = [];
  if (qsm.qaqcOffice || qsm.qaqcChecking) {
    qsmPhotoRows.push(new TableRow({
      children: [
        new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: qsm.qaqcOffice ? makePhotoParagraph(qsm.qaqcOffice, { width: 300, height: 220 }) : [new Paragraph({ children: [] })] }),
        new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: qsm.qaqcChecking ? makePhotoParagraph(qsm.qaqcChecking, { width: 300, height: 220 }) : [new Paragraph({ children: [] })] })
      ]
    }));
    qsmPhotoRows.push(new TableRow({
      children: [
        createQtyCell("QA/QC office", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
        createQtyCell("QA / QC checking", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }));
  }
  if (qsmPhotoRows.length > 0) {
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: qsmPhotoRows }));
  }

  // Table 3: List of certificates
  const certRows = [
    new TableRow({
      children: [
        new TableCell({ borders: tableBorders(), width: { size: 30, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "List of certificates available (with certification company details and dates)", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ borders: tableBorders(), width: { size: 70, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: san(val(qsm.listCertificates, "No certification")), size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: certRows }));
  result.push(spacer());

  // ── Inspection track record by client ──
  const itrRows = [
    sectionHeaderRow("Inspection track record by client", 2),
    new TableRow({
      children: [
        createQtyCell("How often is it updated?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(itr.howOftenUpdated)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Last inspection by QC company (date)", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(itr.lastInspectionDate)), { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: itrRows }));
  result.push(spacer());

  // ── QC ──
  const qcRows = [
    sectionHeaderRow("QC", 2),
    new TableRow({
      children: [
        new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "QC staff count", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: san(val(p5.qcStaffCount)), size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: qcRows }));
  result.push(spacer());

  // ── On-line QC ──
  const oqcRows = [
    sectionHeaderRow("On-line QC", 2),
    new TableRow({
      children: [
        createQtyCell("Is there on-line QC?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(oqc.isOnlineQC), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("QC manual available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(oqc.onlineQCManualAvailable), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("List of testing equipment", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(oqc.onlineQCTestingEquipment)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Record / reports available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(oqc.onlineQCRecordsAvailable), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: oqcRows }));

  // Photos: On-Line QC Record
  if (oqc.onlineQCRecord1 || oqc.onlineQCRecord2) {
    const cells = [];
    if (oqc.onlineQCRecord1) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(oqc.onlineQCRecord1, { width: 300, height: 220 }) }));
    if (oqc.onlineQCRecord2) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(oqc.onlineQCRecord2, { width: 300, height: 220 }) }));
    if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
    const lblCells = [
      createQtyCell("On-Line QC Record", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
      createQtyCell("On-Line QC Record", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
    ];
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: cells }),
      new TableRow({ children: lblCells })
    ]}));
  }
  result.push(spacer());

  // ── Final QC ──
  const fqcRows = [
    sectionHeaderRow("Final QC", 2),
    new TableRow({
      children: [
        createQtyCell("Is there Final QC?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(fqc.isFinalQC), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("QC manual available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(fqc.finalQCManualAvailable), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("List of testing equipment", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(fqc.finalQCTestingEquipment)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Record / reports available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(fqc.finalQCRecordsAvailable), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Last results / record", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(fqc.finalQCLastResults), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: fqcRows }));
  result.push(spacer());

  // ── Incoming QC ──
  const iqcRows = [
    sectionHeaderRow("Incoming QC", 2),
    new TableRow({
      children: [
        createQtyCell("Is there an Incoming QC?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(iqc.isIncomingQC), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("QC manual available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(iqc.incomingQCManualAvailable), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("List of testing equipment", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(iqc.incomingQCTestingEquipment)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Record / reports available?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(iqc.incomingQCRecordsAvailable), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: iqcRows }));

  // Photos: Raw Material QC record
  if (iqc.rawMaterialQCRecord1 || iqc.rawMaterialQCRecord2) {
    const cells = [];
    if (iqc.rawMaterialQCRecord1) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(iqc.rawMaterialQCRecord1, { width: 300, height: 220 }) }));
    if (iqc.rawMaterialQCRecord2) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(iqc.rawMaterialQCRecord2, { width: 300, height: 220 }) }));
    if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
    const lblCells = [
      createQtyCell("Raw Material QC record", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
      createQtyCell("Raw Material QC Record", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
    ];
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: cells }),
      new TableRow({ children: lblCells })
    ]}));
  }

  // Photos: Test Equipment
  if (tePhotos.testEquipment1 || tePhotos.testEquipment2) {
    const cells = [];
    if (tePhotos.testEquipment1) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(tePhotos.testEquipment1, { width: 300, height: 220 }) }));
    if (tePhotos.testEquipment2) cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: makePhotoParagraph(tePhotos.testEquipment2, { width: 300, height: 220 }) }));
    if (cells.length === 1) cells.push(new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })] }));
    const lblCells = [
      createQtyCell("Test Equipment", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
      createQtyCell("Test Equipment", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
    ];
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: cells }),
      new TableRow({ children: lblCells })
    ]}));
  }
  result.push(spacer());

  // ── Score row ──
  const part5Score = Number(data.part5?.part5Score || data.part5Score || 0);
  const scoreCells5 = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part5Score;
    scoreCells5.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells5 })]
  }));

  return result;
}

// ─── PART 6: R&D / Sampling Capacity ─────────────────────────────────────────

function buildPart6(data) {
  const p6 = data.part6 || {};

  const result = [];

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 6", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 40, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "R&D / Sampling capacity", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  // ── R & D facilities ──
  const rdRows = [
    sectionHeaderRow("R & D facilities", 2),
    new TableRow({
      children: [
        createQtyCell("Specific staff count:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(p6.rdSpecificStaffCount)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Specific facilities:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(p6.rdSpecificFacilities)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Sample Production Process Description", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(p6.sampleProductionProcess)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Record", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(p6.rdRecord)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Approval sample lead time:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(p6.approvalSampleLeadTime)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rdRows }));
  result.push(spacer());

  // ── Score row ──
  const part6Score = Number(data.part6?.part6Score || data.part6Score || 0);
  const scoreCells6 = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  
  // The screenshot shows 0, 2, 3, 4, 5... but we will use 1 to 10 for logic consistency
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part6Score;
    scoreCells6.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells6 })]
  }));

  return result;
}

// ─── PART 7: Environment ──────────────────────────────────────────────────────

function buildPart7(data) {
  const p7 = data.part7 || {};
  const env = p7.envManagement || {};
  const ww = p7.wastewaterReport || {};
  const ctr = p7.controlTrackRecord || {};
  const actions = Array.isArray(p7.preventiveActions) ? p7.preventiveActions : [];
  const envPhotos = Array.isArray(p7.envPhotos) ? p7.envPhotos : [];

  const result = [];

  const formatCB = (valStr) => {
    const v = san(valStr).toLowerCase();
    if (v === 'yes') return "☒Yes ☐No";
    if (v === 'no') return "☐Yes ☒No";
    return "☐Yes ☐No";
  };

  // Title section
  result.push(new Paragraph({
    children: [new TextRun({ text: "Part 7", bold: true, size: 28, font: "Arial" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 }
  }));
  result.push(new Table({
    width: { size: 40, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: "E9ECEF" },
      borders: tableBorders(),
      children: [new Paragraph({
        children: [new TextRun({ text: "Environment (optional)", bold: true, size: 24, font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 }
      })]
    })] })]
  }));
  result.push(spacer());

  // ── Environment management ──
  const envRows = [
    sectionHeaderRow("Environment management", 3),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "ISO14000 series:", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(env.iso14000Status), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Comment: ${san(val(env.iso14000Comment, "-"))}`, size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Others:Internal Environment system", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(env.internalEnvStatus), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Comment: ${san(val(env.internalEnvComment, "-"))}`, size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "Environment Policy Available", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: formatCB(env.envPolicyStatus), size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
        new TableCell({ width: { size: 40, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: `Description: ${san(val(env.envPolicyDescription, "-"))}`, size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: "List of certificates available", size: 18 })], spacing: { before: 60, after: 60 } })] }),
        new TableCell({ columnSpan: 2, width: { size: 70, type: "pct" }, borders: tableBorders(), children: [new Paragraph({ children: [new TextRun({ text: san(val(env.envListCertificates, "N/A")), size: 18 })], spacing: { before: 60, after: 60 } })] })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: envRows }));
  result.push(spacer());

  // ── Wastewater Report Photos ──
  const wwRows = [];
  const p1 = ww.wastewaterPhoto1 ? makePhotoParagraph(ww.wastewaterPhoto1, { width: 300, height: 220 }) : [new Paragraph({ children: [new TextRun({ text: "/", size: 18 })], alignment: AlignmentType.CENTER })];
  const p2 = ww.wastewaterPhoto2 ? makePhotoParagraph(ww.wastewaterPhoto2, { width: 300, height: 220 }) : [new Paragraph({ children: [new TextRun({ text: "/", size: 18 })], alignment: AlignmentType.CENTER })];
  
  wwRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: p1, verticalAlign: VerticalAlign.CENTER }),
      new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: p2, verticalAlign: VerticalAlign.CENTER })
    ],
    height: { value: 3000, rule: "atLeast" }
  }));
  wwRows.push(new TableRow({
    children: [
      createQtyCell("Wastewater test Report", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }),
      createQtyCell("Wastewater test Report", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
    ]
  }));
  wwRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: "Staff in charge\n(name and mission)", size: 18 })], spacing: { before: 60, after: 60 } })] }),
      new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: [new Paragraph({ children: [new TextRun({ text: san(val(ww.wastewaterStaffInCharge, "No")), size: 18 })], spacing: { before: 60, after: 60 } })] })
    ]
  }));
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: wwRows }));
  result.push(spacer());

  // ── Control track record ──
  const ctrRows = [
    sectionHeaderRow("Control track record", 2),
    new TableRow({
      children: [
        createQtyCell("Control track recordavailable?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(ctr.envControlRecordsStatus), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("If yes, how often is it updated?", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(formatCB(ctr.envUpdateFrequency), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Item checked:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(ctr.envItemChecked, "Nil")), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Last control date:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(ctr.envLastControlDate, "No")), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Findings:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(ctr.envFindings)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        createQtyCell("Standard:", { align: AlignmentType.LEFT, spacing: { before: 60, after: 60 } }),
        createQtyCell(san(val(ctr.envStandard)), { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })], width: { size: 50, type: "pct" } }),
        new TableCell({ borders: tableBorders(), children: [new Paragraph({ children: [] })], width: { size: 50, type: "pct" } })
      ]
    })
  ];
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ctrRows }));
  result.push(spacer());

  // ── Preventive actions ──
  const actRows = [
    sectionHeaderRow("Preventive/corrective actions (Sewage/Smokes/Noise/Waste/other)", 2)
  ];
  const actDesc = actions.length > 0 ? actions.map(a => san(val(a.actionDescription || a))).join("\n") : "No";
  actRows.push(new TableRow({
    children: [
      new TableCell({ borders: tableBorders(), width: { size: 30, type: "pct" }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new TextRun({ text: "Description of the action", size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })] }),
      new TableCell({ borders: tableBorders(), width: { size: 70, type: "pct" }, children: actDesc.split("\n").map(l => new Paragraph({ children: [new TextRun({ text: l, size: 18 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })) })
    ]
  }));
  result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: actRows }));

  // ── Environmental Photos Grid ──
  if (envPhotos.length > 0) {
    const epRows = [];
    for (let i = 0; i < envPhotos.length; i += 2) {
      const p1 = envPhotos[i];
      const p2 = envPhotos[i + 1];
      
      const row1Cells = [
        new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: p1.photo ? makePhotoParagraph(p1.photo, { width: 300, height: 220 }) : [new Paragraph({ children: [] })] })
      ];
      const row2Cells = [
        createQtyCell(p1.caption || "", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } })
      ];

      if (p2) {
        row1Cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: p2.photo ? makePhotoParagraph(p2.photo, { width: 300, height: 220 }) : [new Paragraph({ children: [] })] }));
        row2Cells.push(createQtyCell(p2.caption || "", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }));
      } else {
        row1Cells.push(new TableCell({ borders: tableBorders(), width: { size: 50, type: "pct" }, children: [new Paragraph({ children: [] })] }));
        row2Cells.push(createQtyCell("", { align: AlignmentType.CENTER, spacing: { before: 60, after: 60 } }));
      }

      epRows.push(new TableRow({ children: row1Cells }));
      epRows.push(new TableRow({ children: row2Cells }));
    }
    result.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: epRows }));
  }
  result.push(spacer());

  // ── Score row ──
  const part7Score = Number(data.part7?.part7Score || data.part7Score || 0);
  const scoreCells7 = [
    new TableCell({
      shading: { fill: "E8E8E8" },
      borders: tableBorders(),
      width: { size: 10, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: "Score", bold: true, size: 20, color: "1F4E79", font: "Arial" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    })
  ];
  
  for (let i = 1; i <= 10; i++) {
    const isSelected = i === part7Score;
    scoreCells7.push(new TableCell({
      shading: isSelected ? { fill: "D9D9D9" } : undefined,
      borders: tableBorders(),
      width: { size: 9, type: "pct" },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        children: [new TextRun({ text: String(i), bold: isSelected, size: 20, font: "Arial", color: isSelected ? "FF0000" : "000000" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 }
      })]
    }));
  }
  result.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: scoreCells7 })]
  }));
  result.push(spacer());

  // END OF THE REPORT
  result.push(new Paragraph({
    children: [new TextRun({ text: "END OF THE REPORT", bold: true, size: 40, color: "FF0000", font: "Arial", underline: {} })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 400 }
  }));

  return result;
}
