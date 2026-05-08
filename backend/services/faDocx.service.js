const fs = require("fs");
const { 
  Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, VerticalMergeType,
  ImageRun, PageBreak, VerticalAlign
} = require("docx");
const { sanitizeDocxText, tableBorders, createQtyCell } = require("../utils/docx.utils");
const { LOGO_PATH } = require("../config/config");

/**
 * Factory Audit DOCX Service
 * Handles generation of the Factory Audit report document with table layouts.
 * Isolated from PSI/CLS logic.
 */

// Helper to get photo content safely with custom sizing
const getPhotoContent = (photoData, width = 200, height = 150) => {
  if (!photoData || !photoData.startsWith("data:image")) {
    return [new Paragraph({ text: "No photo uploaded", alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } })];
  }
  try {
    const parts = photoData.split(",");
    if (parts.length < 2) throw new Error("Invalid image data");
    const buffer = Buffer.from(parts[1], "base64");
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: buffer,
            transformation: { width, height },
          }),
        ],
        spacing: { before: 100, after: 100 },
      }),
    ];
  } catch (e) {
    console.error("Photo processing error:", e);
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

// Helper to create a 2nd/3rd column data table with optional photo (rowSpan) and integrated title
const createDataTable = (dataArray, photoData = null, title = null) => {
  const rows = [];

  // If title is provided, prepend the integrated header row
  if (title) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: photoData ? 3 : 2,
            shading: { fill: "E9ECEF" },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: title, bold: true, size: 22, color: "1F4E79" })],
                alignment: AlignmentType.LEFT,
                spacing: { before: 100, after: 100 },
              }),
            ],
          }),
        ],
      })
    );
  }

  const dataRows = dataArray.map(([label, value], index) => {
    const cells = [
      createQtyCell(label, { 
        bold: true, 
        align: AlignmentType.LEFT, 
        shaded: true, 
        width: { size: 25, type: WidthType.PERCENTAGE },
        spacing: { before: 60, after: 60 }
      }),
      createQtyCell(value || "-", { 
        align: AlignmentType.LEFT, 
        width: { size: photoData ? 35 : 75, type: WidthType.PERCENTAGE },
        spacing: { before: 60, after: 60 }
      }),
    ];

    if (photoData) {
      cells.push(
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          verticalAlign: VerticalAlign.CENTER,
          verticalMerge: index === 0 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
          children: index === 0 ? getPhotoContent(photoData) : [new Paragraph({ text: "" })],
        })
      );
    }

    return new TableRow({ children: cells });
  });

  rows.push(...dataRows);

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
            width: { size: 30, type: WidthType.PERCENTAGE }, 
            verticalMerge: VerticalMergeType.RESTART, 
            borders: tableBorders(),
            children: [logoRun ? new Paragraph({ children: [logoRun], alignment: AlignmentType.CENTER }) : new Paragraph({ text: "" })], 
            verticalAlign: VerticalAlign.CENTER 
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
                text: sanitizeDocxText(conclusion).toUpperCase(), 
                bold: true, 
                size: 40, 
                color: conclusion.toUpperCase().includes("PASS") ? "008000" : 
                       conclusion.toUpperCase().includes("PENDING") ? "F39C12" : "FF0000"
              })], 
              alignment: AlignmentType.CENTER 
            })],
            verticalAlign: VerticalAlign.CENTER,
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
  const conclusionText = data.conclusion?.result || data.result || "PENDING";
  const children = [];

  // Get Logo for repeated headers
  let logoBase64 = null;
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const imgBuffer = fs.readFileSync(LOGO_PATH);
      logoBase64 = `data:image/png;base64,${imgBuffer.toString("base64")}`;
    }
  } catch (e) {
    console.error("Error loading logo for repeated headers:", e);
  }

  // Add a gap between the header and the first section
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 1. Title and General Info Combined Table (removes gaps)
  const info = data.generalInfo || {};
  const generalRows = [
    ["Factory name", info.factory || data.factory],
    ["Supplier name", info.supplier || data.supplier],
    ["Client's name", info.client || data.client],
    ["Audit date", info.auditDate || data.auditDate],
    ["Factory location", info.factoryAddress || data.factoryAddress],
    ["Supplier location", info.supplierAddress || data.supplierAddress],
  ];

  const mainRows = [
    // Service Title Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "FACTORY AUDIT REPORT", bold: true, size: 36, color: "1F4E79" })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 120 },
            }),
          ],
        }),
      ],
    }),
    // Section Header Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "GENERAL INFORMATION", bold: true, size: 24, color: "1F4E79" })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
  ];

  // Add Data Rows with Merged Photo Column
  generalRows.forEach(([label, value], idx) => {
    const cells = [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: tableBorders(),
        shading: { fill: "F2F2F2" },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })], spacing: { before: 80, after: 80 } })],
      }),
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(value || "-"), size: 18 })], spacing: { before: 80, after: 80 } })],
      }),
    ];

    // Add Photo Cell (Merged vertically)
    cells.push(
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders: tableBorders(),
        verticalAlign: VerticalAlign.CENTER,
        verticalMerge: idx === 0 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE,
        children: idx === 0 ? getPhotoContent(data.generalPhoto) : [new Paragraph({ text: "" })],
      })
    );

    mainRows.push(new TableRow({ children: cells }));
  });

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: mainRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 2. Audit Overview Section
  const overviewSections = [
    { id: "profile", label: "Supplier/Factory Profile", weight: 5 },
    { id: "orgCharts", label: "Factory Organization Charts", weight: 3 },
    { id: "lines", label: "Production Lines - Capacity", weight: 5 },
    { id: "machinery", label: "Factory Facilities - machinery Conditions", weight: 5 },
    { id: "qaqc", label: "Quality Assurance & Quality Control System", weight: 5 },
    { id: "rd", label: "R&D – Sampling Capacity", weight: 3 },
    { id: "environment", label: "Environment (optional)", weight: 3 },
  ];

  const overviewRows = [
    // Section Header Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 5,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "II. General overview of audit", bold: true, size: 24, color: "1F4E79" })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 },
            }),
          ],
        }),
      ],
    }),
    // Table Header Row
    new TableRow({
      children: [
        createQtyCell("#", { bold: true, shaded: true, align: AlignmentType.CENTER, width: { size: 5, type: WidthType.PERCENTAGE } }),
        createQtyCell("Fields", { bold: true, shaded: true, align: AlignmentType.CENTER, width: { size: 45, type: WidthType.PERCENTAGE } }),
        createQtyCell("Score /10", { bold: true, shaded: true, align: AlignmentType.CENTER, width: { size: 15, type: WidthType.PERCENTAGE } }),
        createQtyCell("Weight /5", { bold: true, shaded: true, align: AlignmentType.CENTER, width: { size: 15, type: WidthType.PERCENTAGE } }),
        createQtyCell("Weighted score", { bold: true, shaded: true, align: AlignmentType.CENTER, width: { size: 20, type: WidthType.PERCENTAGE } }),
      ]
    })
  ];

  let totalScore = 0;
  let totalWeight = 0;
  let totalWeighted = 0;

  overviewSections.forEach((sec, idx) => {
    const weight = data.auditOverview?.[`${sec.id}_weight`] ?? sec.weight;
    const score = data.auditOverview?.[sec.id] || 0;
    const weighted = data.auditOverview?.[`${sec.id}_weighted`] ?? (score * weight);
    totalScore += score;
    totalWeight += weight;
    totalWeighted += weighted;

    overviewRows.push(
      new TableRow({
        children: [
          createQtyCell((idx + 1).toString(), { align: AlignmentType.CENTER }),
          createQtyCell(sec.label, { align: AlignmentType.LEFT }),
          createQtyCell(score.toString(), { align: AlignmentType.CENTER }),
          createQtyCell(weight.toString(), { align: AlignmentType.CENTER }),
          createQtyCell(weighted.toString(), { align: AlignmentType.CENTER, bold: true }),
        ]
      })
    );
  });

  const conclusionVal = totalWeight > 0 ? (totalWeighted / totalWeight).toFixed(2) : "0.00";

  // Total and Conclusion Rows
  overviewRows.push(
    new TableRow({
      children: [
        new TableCell({ 
          columnSpan: 2, 
          borders: tableBorders(), 
          shading: { fill: "F2F2F2" }, 
          children: [new Paragraph({ children: [new TextRun({ text: "Total:", bold: true })], alignment: AlignmentType.RIGHT })] 
        }),
        createQtyCell(totalScore.toString(), { align: AlignmentType.CENTER, bold: true, shaded: true }),
        createQtyCell(totalWeight.toString(), { align: AlignmentType.CENTER, bold: true, shaded: true }),
        createQtyCell(totalWeighted.toString(), { align: AlignmentType.CENTER, bold: true, shaded: true }),
      ]
    })
  );

  overviewRows.push(
    new TableRow({
      children: [
        new TableCell({ 
          columnSpan: 4, 
          borders: tableBorders(), 
          shading: { fill: "F2F2F2" }, 
          children: [new Paragraph({ children: [new TextRun({ text: "General Overview Conclusion", bold: true })] })] 
        }),
        new TableCell({ 
          borders: tableBorders(), 
          children: [new Paragraph({ children: [new TextRun({ text: `${conclusionVal}/ 10`, bold: true, color: "CC0000", size: 28 })], alignment: AlignmentType.CENTER })] 
        }),
      ]
    })
  );

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: overviewRows }));

  // Legend
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "PASSED:   ", bold: true, size: 18 }),
      new TextRun({ text: "The general overview conclusion is minimum 8", size: 18 }),
    ],
    spacing: { before: 100 }
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "PENDING:  ", bold: true, size: 18 }),
      new TextRun({ text: "The general overview conclusion is less than 8 and minimum 6", size: 18 }),
    ],
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "FAILED:   ", bold: true, size: 18 }),
      new TextRun({ text: "The general overview conclusion is less than 6", size: 18 }),
    ],
    spacing: { after: 200 }
  }));

  // 3. Comments Section
  const commentParagraphs = (data.generalOverviewRemarks || []).map((c, i) => (
    new Paragraph({
      children: [
        new TextRun({ text: `${i + 1}. `, bold: true }),
        new TextRun({ text: c }),
      ],
      spacing: { before: 120, after: 120 },
      indent: { left: 240, hanging: 240 },
    })
  ));

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Section Header Row
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "III. COMMENTS", bold: true, size: 24, color: "1F4E79" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 100, after: 100 },
                }),
              ],
            }),
          ],
        }),
        // Data Row
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Main comments of this audit", bold: true })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: commentParagraphs.length > 0 ? commentParagraphs : [new Paragraph({ text: "No comments recorded." })],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 4. Special Requirements Section
  const specialReqRows = [
    // Section Header Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "IV. Client's special requirement of audit", bold: true, size: 24, color: "1F4E79" })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 },
            }),
          ],
        }),
      ],
    }),
    // Table Header Row
    new TableRow({
      children: [
        createQtyCell("#", { bold: true, shaded: true, width: { size: 5, type: WidthType.PERCENTAGE } }),
        createQtyCell("Requirement", { bold: true, shaded: true, width: { size: 60, type: WidthType.PERCENTAGE } }),
        createQtyCell("Result", { bold: true, shaded: true, width: { size: 15, type: WidthType.PERCENTAGE } }),
        createQtyCell("Remark", { bold: true, shaded: true, width: { size: 20, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  if (data.specialRequirements && data.specialRequirements.length > 0) {
    data.specialRequirements.forEach((req, idx) => {
      specialReqRows.push(
        new TableRow({
          children: [
            createQtyCell(`4.${idx + 1}`, { align: AlignmentType.CENTER }),
            createQtyCell(req.requirement || ""),
            createQtyCell(req.result || ""),
            createQtyCell(req.remark || ""),
          ],
        })
      );
    });
  } else {
    specialReqRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            borders: tableBorders(),
            children: [new Paragraph({ text: "No special requirements listed", alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 } })],
          })
        ],
      })
    );
  }

  // Special Requirement Conclusion Row
  specialReqRows.push(
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Special Requirement Conclusion", bold: true })] })],
        }),
        new TableCell({
          shading: { fill: "F2F2F2" },
          borders: tableBorders(),
          children: [new Paragraph({ text: data.specialRequirementConclusion || "-" })],
        }),
      ],
    })
  );

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: specialReqRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));


  // 12. Conclusion
  const result = data.conclusion?.result || "PENDING";
  
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Section Header Row
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "XII. FINAL CONCLUSION", bold: true, size: 24, color: "1F4E79" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 100, after: 100 },
                }),
              ],
            }),
          ],
        }),
        // Conclusion Data Row
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Overall Conclusion", bold: true, size: 32 })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: result.toUpperCase(), 
                      bold: true, 
                      size: 40, 
                      color: result.toUpperCase().includes("PASS") ? "228B22" : 
                             result.toUpperCase().includes("PENDING") ? "F39C12" : "CC0000" 
                    })
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ text: "", spacing: { before: 200, after: 200 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: data.conclusion?.summary || "" })] }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // ===== REMARKS SECTION (new page) =====
  // Helper to build a remarks sub-section table
  const buildRemarksTable = (subTitle, remarksArr, startNum) => {
    const rows = [
      // Sub-header row
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: "E9ECEF" },
            borders: tableBorders(),
            children: [
              new Paragraph({
                children: [new TextRun({ text: subTitle, bold: true, size: 20 })],
                spacing: { before: 60, after: 60 },
              }),
            ],
          }),
        ],
      }),
    ];

    if (remarksArr && remarksArr.length > 0) {
      remarksArr.forEach((remark, idx) => {
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                width: { size: 8, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                verticalAlign: VerticalAlign.TOP,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: (startNum + idx).toString(), bold: true })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                width: { size: 92, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: remark || "" })],
                    spacing: { before: 40, after: 40 },
                  }),
                ],
              }),
            ],
          })
        );
      });
    } else {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 8, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: startNum.toString() })] , alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 92, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ text: "-" })],
            }),
          ],
        })
      );
    }

    return { rows, nextNum: startNum + Math.max((remarksArr || []).length, 1) };
  };

  const generalOverviewRemarks = data.generalOverviewRemarks || [];
  const clientSpecialRemarks = data.clientSpecialRemarks || [];
  const suggestionsRemarks = data.suggestions || [];

  const section1 = buildRemarksTable("General Overview:", generalOverviewRemarks, 1);
  const section2 = buildRemarksTable("Client's special requirement", clientSpecialRemarks, section1.nextNum);
  const section3 = buildRemarksTable("Suggestion:", suggestionsRemarks, section2.nextNum);

  const allRemarksRows = [
    // Main Section Header Row
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "REMARKS", bold: true, size: 28, color: "1F4E79" })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 },
            }),
          ],
        }),
      ],
    }),
    ...section1.rows, 
    ...section2.rows, 
    ...section3.rows
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: allRemarksRows,
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // ===== CONTENT SECTION (new page) =====
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "CONTENT:", bold: true, size: 28, color: "1F4E79" })],
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 100, after: 100 },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const contentParts = [
    "Part 1—Supplier/Factory Profile",
    "Part 2—Factory Organization",
    "Part 3—Production Lines/Capacity",
    "Part 4—Factory Facilities/Machinery Conditions",
    "Part 5—Quality Assurance & Quality Control System",
    "Part 6—R & D/Sampling Capacity",
    "Part 7—Environment (optional)",
  ];

  children.push(new Paragraph({ text: "", spacing: { before: 800 } }));

  contentParts.forEach(part => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: part, size: 24, bold: true, color: "333333" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      })
    );
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // Detailed Parts (Part 1 - 7)
  // ===== PART 1: Supplier Profile =====
  children.push(new Paragraph({
    children: [new TextRun({ text: "Part 1", bold: true, size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 100 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "A: Supplier profile", bold: true, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 300 },
  }));

  // Sub-section: General Information
  const generalInfoRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "General information", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ...[
          ["1", "Date of foundation", data.supplierProfile?.dateOfFoundation],
          ["2", "Legal status", data.supplierProfile?.legalStatus],
          ["3", "Actual location", data.supplierProfile?.actualLocation],
          ["4", "Location on business license", data.supplierProfile?.locationBusinessLicense],
          ["5", "Location on export license", data.supplierProfile?.locationExportLicense],
          ["6", "Location on bank information", data.supplierProfile?.locationBankInfo],
          ["7", "Location on business card", data.supplierProfile?.locationBusinessCard],
          ["8", "Area", data.supplierProfile?.area],
          ["9", "Number of staff", data.supplierProfile?.numberOfStaff?.toString()],
          ["10", "Corporate representative", data.supplierProfile?.corporateRepresentative],
          ["11", "Main products", data.supplierProfile?.mainProducts],
          ["12", "Main market", data.supplierProfile?.mainMarket],
          ["13", "Business license", data.supplierProfile?.businessLicenseInfo],
        ].map(([num, label, val]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [new Paragraph({ children: [new TextRun({ text: num, bold: true })], alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
              }),
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [new Paragraph({ text: val || "" })],
              }),
            ],
          })
        ),
        // Annual turnover row (spans)
        new TableRow({
          children: [
            new TableCell({
              width: { size: 5, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              verticalMerge: VerticalMergeType.RESTART,
              children: [new Paragraph({ children: [new TextRun({ text: "14", bold: true })], alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              verticalMerge: VerticalMergeType.RESTART,
              children: [new Paragraph({ children: [new TextRun({ text: "Annual turnover for the past 3 years", bold: true })] })],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ text: `2018: ${data.supplierProfile?.turnover2018 || "N/A"}  |  2019: ${data.supplierProfile?.turnover2019 || "N/A"}  |  2020: ${data.supplierProfile?.turnover2020 || "N/A"}  |  Trend: ${data.supplierProfile?.turnoverTrend || "N/A"}` })],
            }),
          ],
        }),
      ];

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: generalInfoRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

  // Sub-section: Communication Infrastructures
  const commRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Communication infrastructures", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ...[
          ["1", "Telephone sets", data.communicationInfrastructure?.telephoneSets],
          ["2", "Fax machines", data.communicationInfrastructure?.faxMachines],
          ["3", "Computers", data.communicationInfrastructure?.computers],
          ["4", "E-mail Domain", data.communicationInfrastructure?.emailDomain],
        ].map(([num, label, val]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [new Paragraph({ children: [new TextRun({ text: num })], alignment: AlignmentType.CENTER })],
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
              }),
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                borders: tableBorders(),
                children: [new Paragraph({ text: val || "" })],
              }),
            ],
          })
    ),
  ];

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: commRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

  // Sub-section: Products / Markets
  const pmRows = [
    new TableRow({
      children: [
        new TableCell({ columnSpan: 4, shading: { fill: "E9ECEF" }, borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Products / markets", bold: true, size: 22, color: "1F4E79" })], spacing: { before: 80, after: 80 } })],
        }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Product type", { bold: true, shaded: true }),
        createQtyCell("Major customer name", { bold: true, shaded: true }),
        createQtyCell("Market location", { bold: true, shaded: true }),
        createQtyCell("Monthly Order Qty (pcs)", { bold: true, shaded: true }),
      ],
    }),
  ];

  if (data.productsMarkets && data.productsMarkets.length > 0) {
    data.productsMarkets.forEach(pm => {
      pmRows.push(new TableRow({
        children: [
          createQtyCell(pm.productType || ""),
          createQtyCell(pm.customerName || ""),
          createQtyCell(pm.marketLocation || ""),
          createQtyCell(pm.monthlyQty || ""),
        ],
      }));
    });
  } else {
    pmRows.push(new TableRow({ children: [createQtyCell("No data", { columnSpan: 4 })] }));
  }

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: pmRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

  // Sub-section: Recommendations / Credentials
  const recRows = [
    new TableRow({
      children: [
        new TableCell({ columnSpan: 5, shading: { fill: "E9ECEF" }, borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Recommendations / credentials", bold: true, size: 22, color: "1F4E79" })], spacing: { before: 80, after: 80 } })],
        }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Company name", { bold: true, shaded: true }),
        createQtyCell("Country", { bold: true, shaded: true }),
        createQtyCell("Contact", { bold: true, shaded: true }),
        createQtyCell("Products", { bold: true, shaded: true }),
        createQtyCell("Details", { bold: true, shaded: true }),
      ],
    }),
  ];

  if (data.recommendations && data.recommendations.length > 0) {
    data.recommendations.forEach(rec => {
      recRows.push(new TableRow({
        children: [
          createQtyCell(rec.companyName || ""),
          createQtyCell(rec.country || ""),
          createQtyCell(rec.contact || ""),
          createQtyCell(rec.products || ""),
          createQtyCell(rec.details || ""),
        ],
      }));
    });
  } else {
    recRows.push(new TableRow({ children: [createQtyCell("Nil", { columnSpan: 5 })] }));
  }

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: recRows }));
  children.push(new Paragraph({ text: "", spacing: { before: 200 } }));

  // Related Pictures Section
  const boPhotos = data.buildingOfficePhotos || [];
  const boRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Related pictures:", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Building and office viewing", bold: true, size: 22, color: "1F4E79" })], spacing: { before: 80, after: 80 } })],
        }),
      ],
    }),
  ];

  for (let i = 0; i < boPhotos.length; i += 2) {
    const p1 = boPhotos[i];
    const p2 = boPhotos[i + 1];

    boRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: getPhotoContent(p1?.preview),
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: p2 ? getPhotoContent(p2?.preview) : [],
          }),
        ],
      })
    );

    boRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: [new Paragraph({ text: p1?.label || "", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: [new Paragraph({ text: p2?.label || "", alignment: AlignmentType.CENTER })],
          }),
        ],
      })
    );
  }

  if (boPhotos.length === 0) {
    boRows.push(new TableRow({ children: [createQtyCell("No photos uploaded", { columnSpan: 2 })] }));
  }

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: boRows }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 2. Building Certificate (Large)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Building Certificate (Proprietary or leasing Document)", bold: true, size: 22, color: "1F4E79" })], spacing: { before: 80, after: 80 } })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: getPhotoContent(data.relatedPictures?.certPhoto), // Assuming this helper exists or I'll adjust size
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ text: data.relatedPictures?.certCaption || "Building Certificate Document", alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 3. License accreditation
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "License accreditation:", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: getPhotoContent(data.relatedPictures?.licensePhoto),
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({ text: `Certificate No: ${data.relatedPictures?.licenseCertNo || ""}` }),
                new Paragraph({ text: `Date issued: ${data.relatedPictures?.licenseDateIssued || ""}` }),
                new Paragraph({ text: `Expiration: ${data.relatedPictures?.licenseExpiration || ""}` }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 4. Export license
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Export license:", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: getPhotoContent(data.relatedPictures?.exportPhoto),
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({ text: `Certificate No: ${data.relatedPictures?.exportCertNo || ""}` }),
                new Paragraph({ text: `Date issued: ${data.relatedPictures?.exportDateIssued || ""}` }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 5. Bank information
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Bank information:", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: getPhotoContent(data.relatedPictures?.bankPhoto),
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [
                new Paragraph({ text: `Certificate No: ${data.relatedPictures?.bankCertNo || ""}` }),
                new Paragraph({ text: `Date issued: ${data.relatedPictures?.bankDateIssued || ""}` }),
                new Paragraph({ text: `USD Bank account number: ${data.relatedPictures?.bankAccountNumber || ""}` }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 300 } }));

  // Part 1 Score Table
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 8.5, type: WidthType.PERCENTAGE },
                shading: { fill: (data.part1Score || 0) === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: (data.part1Score || 0) === num, color: (data.part1Score || 0) === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // Part 2: Factory Organization
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Part 2", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Factory Organization", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Factory organization chart", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Helper to get logo safely
  const getSafeLogo = (width = 100, height = 40) => {
    try {
      if (typeof LOGO_PATH !== 'undefined' && fs.existsSync(LOGO_PATH)) {
        return [new ImageRun({ data: fs.readFileSync(LOGO_PATH), transformation: { width, height } })];
      }
    } catch (e) {
      console.error("Logo load error:", e);
    }
    return [new TextRun({ text: "" })]; // Return a blank TextRun instead of empty array
  };

  // Part 2 Header Table (Client, Inspection #, etc.)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: getSafeLogo(),
                  alignment: AlignmentType.CENTER
                })
              ],
              verticalMerge: VerticalMergeType.RESTART,
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Client name (abbr.):", size: 18 })] })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(data.client || data.generalInfo?.client || "-"), size: 18, bold: true })] })],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Conclusion", size: 18, bold: true })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ borders: tableBorders(), children: [new Paragraph({ text: "" })], verticalMerge: VerticalMergeType.CONTINUE }),
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Inspection number:", size: 18 })] })],
            }),
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(data.reportId || data.inspectionNumber || "-"), size: 18, bold: true })] })],
            }),
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(data.conclusion?.result || "PENDING"), size: 22, bold: true, color: "FF0000" })], alignment: AlignmentType.CENTER })],
              verticalMerge: VerticalMergeType.RESTART,
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ borders: tableBorders(), children: [new Paragraph({ text: "" })], verticalMerge: VerticalMergeType.CONTINUE }),
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Report Date:", size: 18 })] })],
            }),
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: sanitizeDocxText(data.auditDate || data.generalInfo?.auditDate || "-"), size: 18, bold: true })] })],
            }),
            new TableCell({ borders: tableBorders(), children: [new Paragraph({ text: "" })], verticalMerge: VerticalMergeType.CONTINUE }),
          ],
        }),
      ],
    })
  );

  // Org Chart Images
  const orgPhotos = (data.orgChartPhotos || []).filter(p => p.preview);
  orgPhotos.forEach(p => {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders(),
                children: getPhotoContent(p.preview, 450, 600), // Larger size for org chart
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders(),
                children: [new Paragraph({ text: p.label || "", alignment: AlignmentType.CENTER })],
              }),
            ],
          }),
        ],
      })
    );
  });

  if (orgPhotos.length === 0) {
    children.push(new Paragraph({ text: "No organization chart uploaded", alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }));
  }

  // Part 2 Score Table
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 8.5, type: WidthType.PERCENTAGE },
                shading: { fill: (data.part2Score || 0) === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: (data.part2Score || 0) === num, color: (data.part2Score || 0) === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // Part 3: Production lines / Capacity
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Part 3", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Production lines / Capacity", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Workflow Chart
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Production workflow chart", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const workflowPhotos = (data.productionWorkflowPhotos || []).filter(p => p.preview);
  workflowPhotos.forEach(p => {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders(),
                children: getPhotoContent(p.preview, 450, 300),
              }),
            ],
          }),
        ],
      })
    );
  });
  if (workflowPhotos.length === 0) {
    children.push(new Paragraph({ text: "No workflow chart uploaded", alignment: AlignmentType.CENTER, spacing: { before: 400, after: 400 } }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Production Process Table
  const processRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 6,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Production process", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Operation Name", { bold: true, shaded: true, size: 18 }),
        createQtyCell("Machine / Device Name", { bold: true, shaded: true, size: 18 }),
        createQtyCell("Machine count", { bold: true, shaded: true, size: 18 }),
        createQtyCell("Workers number", { bold: true, shaded: true, size: 18 }),
        createQtyCell("Output (pcs/hour)", { bold: true, shaded: true, size: 18 }),
        createQtyCell("Total Step Capacity (PCS per day)", { bold: true, shaded: true, size: 18 }),
      ],
    }),
  ];

  if (data.productionProcess && data.productionProcess.length > 0) {
    data.productionProcess.forEach(p => {
      processRows.push(new TableRow({
        children: [
          createQtyCell(p.operationName || ""),
          createQtyCell(p.machineName || ""),
          createQtyCell(p.machineCount?.toString() || ""),
          createQtyCell(p.workersNumber?.toString() || ""),
          createQtyCell(p.outputPerHour?.toString() || ""),
          createQtyCell(p.dailyCapacity?.toString() || ""),
        ]
      }));
    });
  } else {
    processRows.push(new TableRow({ children: [createQtyCell("No production processes listed", { columnSpan: 6 })] }));
  }

  // Overall Capacity Row
  processRows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        shading: { fill: "E9ECEF" },
        borders: tableBorders(),
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Overall capacity = minimum step capacity (pcs per week):", bold: true, color: "1F4E79" })],
            alignment: AlignmentType.LEFT,
          })
        ],
      }),
      new TableCell({
        borders: tableBorders(),
        children: [new Paragraph({ text: data.productionCapacity?.weeklyCapacity || "-", bold: true, alignment: AlignmentType.CENTER })],
      })
    ]
  }));

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: processRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Daily Output Check
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Daily output check:", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ text: "Is there a running production in the factory during the Audit?", bold: true })]
            }),
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ text: data.dailyOutputCheck?.runningProduction || "Yes", alignment: AlignmentType.CENTER })]
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ text: `Comment(s): ${data.dailyOutputCheck?.outputCheckComments || "-"}` })]
            }),
          ]
        })
      ]
    })
  );

  // Daily Output Photos
  const outputPhotos = (data.dailyOutputPhotos || []).filter(p => p.preview);
  if (outputPhotos.length > 0) {
    const photoRow = new TableRow({
      children: [0, 1].map(idx => {
        const p = outputPhotos[idx];
        return new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: p ? [
            ...getPhotoContent(p.preview, 240, 180),
            new Paragraph({ text: p.label || "Product Storage", alignment: AlignmentType.CENTER })
          ] : [new Paragraph({ text: "" })]
        });
      })
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [photoRow] }));
  }

  // Timing Table
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ text: `For ${data.dailyOutputCheck?.processLines || "-"} lines`, bold: true, alignment: AlignmentType.CENTER })]
            })
          ]
        }),
        new TableRow({
          children: [
            createQtyCell("Start time", { bold: true, shaded: true }),
            createQtyCell("Finished time", { bold: true, shaded: true }),
            createQtyCell("Total time", { bold: true, shaded: true }),
          ]
        }),
        new TableRow({
          children: [
            createQtyCell(data.dailyOutputCheck?.startTime || ""),
            createQtyCell(data.dailyOutputCheck?.finishedTime || ""),
            createQtyCell(data.dailyOutputCheck?.totalTime || ""),
          ]
        }),
        new TableRow({
          children: [
            createQtyCell("Finished products", { bold: true, shaded: true }),
            createQtyCell("Finished products", { bold: true, shaded: true }),
            createQtyCell("Output", { bold: true, shaded: true }),
          ]
        }),
        new TableRow({
          children: [
            createQtyCell(data.dailyOutputCheck?.finishedProductsStart?.toString() || "0"),
            createQtyCell(data.dailyOutputCheck?.finishedProductsEnd?.toString() || "0"),
            createQtyCell(`${data.dailyOutputCheck?.outputPieces || "0"} pieces`),
          ]
        })
      ]
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Lead Times
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 3,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Lead times for client’s production:", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            createQtyCell("According to", { bold: true, shaded: true }),
            createQtyCell("Factory", { bold: true, shaded: true }),
            createQtyCell("Auditor check", { bold: true, shaded: true }),
          ]
        }),
        new TableRow({
          children: [
            createQtyCell("Raw material supply capacity:"),
            createQtyCell(data.leadTimes?.rawMaterialCapacityFactory || ""),
            createQtyCell(data.leadTimes?.rawMaterialCapacityAuditor || ""),
          ]
        }),
        new TableRow({
          children: [
            createQtyCell("Production weekly capacity:"),
            createQtyCell(data.leadTimes?.weeklyCapacityFactory || ""),
            createQtyCell(data.leadTimes?.weeklyCapacityAuditor || ""),
          ]
        })
      ]
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Bottlenecks
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Sensitive points / bottlenecks", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ text: `According to auditor check: - ${data.bottlenecks?.bottleneckAuditorCheck || ""}` })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: tableBorders(),
              children: [new Paragraph({ text: `Comments: - ${data.bottlenecks?.bottleneckComments || ""}` })]
            })
          ]
        })
      ]
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Score Row
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 8.5, type: WidthType.PERCENTAGE },
                shading: { fill: (data.part3Score || 0) === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: (data.part3Score || 0) === num, color: (data.part3Score || 0) === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // Part 4: Factory Facilities / Machinery Conditions
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Part 4", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F2F2F2" },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Factory Facilities / Machinery Conditions", bold: true, size: 24 })], alignment: AlignmentType.CENTER })],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Machines for production
  const machineHeaderRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Machines for production", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    new TableRow({
      children: [
        createQtyCell("Machine Name/ Brand/Country of Origin", { bold: true, shaded: true }),
        createQtyCell("Picture", { bold: true, shaded: true }),
        createQtyCell("Count", { bold: true, shaded: true }),
        createQtyCell("Comments (conditions and age)", { bold: true, shaded: true }),
      ],
    }),
  ];

  if (data.part4?.machineryConditions && data.part4.machineryConditions.length > 0) {
    data.part4.machineryConditions.forEach(m => {
      machineHeaderRows.push(new TableRow({
        children: [
          createQtyCell(m.machineName || ""),
          new TableCell({
            borders: tableBorders(),
            children: m.picture ? getPhotoContent(m.picture, 120, 90) : [new Paragraph({ text: "No photo" })],
          }),
          createQtyCell(m.count?.toString() || "0"),
          createQtyCell(m.comments || ""),
        ]
      }));
    });
  } else {
    machineHeaderRows.push(new TableRow({ children: [createQtyCell("No machinery listed", { columnSpan: 4 })] }));
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: machineHeaderRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Warehouse condition
  const warehouseRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Warehouse condition", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ...[
      ["Area of Warehouse (M²)", data.part4?.warehouseCondition?.warehouseArea || ""],
      ["Materials clearly stocked in different areas?", data.part4?.warehouseCondition?.materialsStocked || ""],
      ["Lab/Marking clearly indicated in different material?", data.part4?.warehouseCondition?.labMarking || ""],
      ["Warehouse clean and tidy?", data.part4?.warehouseCondition?.warehouseClean || ""],
      ["Equipment/Tools/Facilities Advanced?", data.part4?.warehouseCondition?.facilitiesAdvanced || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val, alignment: AlignmentType.CENTER })] }),
      ]
    }))
  ];

  // Warehouse Photos
  const whPhotoRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: tableBorders(),
        children: [
          ...(data.part4?.warehousePhotos?.rawMaterials ? getPhotoContent(data.part4.warehousePhotos.rawMaterials, 240, 180) : []),
          new Paragraph({ text: "Raw Materials Storage", alignment: AlignmentType.CENTER })
        ]
      }),
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: tableBorders(),
        children: [
          ...(data.part4?.warehousePhotos?.finishedProducts ? getPhotoContent(data.part4.warehousePhotos.finishedProducts, 240, 180) : []),
          new Paragraph({ text: "Finished products storage condition", alignment: AlignmentType.CENTER })
        ]
      }),
    ]
  });
  warehouseRows.push(whPhotoRow);

  // Capacity highlight row
  warehouseRows.push(new TableRow({
    children: [
      new TableCell({
        shading: { fill: "FF0000" },
        borders: tableBorders(),
        children: [new Paragraph({ children: [new TextRun({ text: "Estimated warehouse capacity:", bold: true, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })],
      }),
      new TableCell({
        borders: tableBorders(),
        children: [new Paragraph({ text: data.part4?.warehouseCondition?.warehouseCapacity || "", bold: true, alignment: AlignmentType.CENTER })],
      })
    ]
  }));

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: warehouseRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Sample Room
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Sample room condition", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: "Sample room clean and tidy?", bold: true })] }),
            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: data.part4?.sampleRoomCondition?.sampleRoomClean || "", alignment: AlignmentType.CENTER })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: "Sample complete disposed in Sample room?", bold: true })] }),
            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: data.part4?.sampleRoomCondition?.sampleDisposed || "", alignment: AlignmentType.CENTER })] }),
          ]
        })
      ]
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Public Power
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "E9ECEF" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Public power supply", bold: true, size: 22, color: "1F4E79" })],
                  spacing: { before: 80, after: 80 },
                }),
              ],
            }),
          ],
        }),
        ...[
          ["Public power Connected?", data.part4?.publicPowerSupply?.publicPowerConnected || ""],
          ["Frequent Power Outage in the area?", data.part4?.publicPowerSupply?.frequentPowerOutage || ""],
          ["Diesel Generator available?", data.part4?.publicPowerSupply?.dieselGenerator || ""],
          ["If yes, Electric Power Generator Count:", data.part4?.publicPowerSupply?.generatorCount || ""],
        ].map(([label, val]) => new TableRow({
          children: [
            new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: label, bold: true })] }),
            new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val, alignment: AlignmentType.CENTER })] }),
          ]
        }))
      ]
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Shipment Capabilities
  const shipmentRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "E9ECEF" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Shipment capabilities", bold: true, size: 22, color: "1F4E79" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ...[
      ["Capacity of shipping meets requirement of buyer?", data.part4?.shipmentCapabilities?.shippingMeetsRequirement || ""],
      ["Over 4 containers can be loaded together?", data.part4?.shipmentCapabilities?.containersLoadedTogether || ""],
      ["Protection for loading against bad weather?", data.part4?.shipmentCapabilities?.protectionBadWeather || ""],
      ["Mechanical Loading Capacity disposed? (Fork,etc.)", data.part4?.shipmentCapabilities?.mechanicalLoadingDisposed || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val, alignment: AlignmentType.CENTER })] }),
      ]
    })),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(data.part4?.shipmentPhotos?.loadingPlace1 ? getPhotoContent(data.part4.shipmentPhotos.loadingPlace1, 240, 180) : []),
            new Paragraph({ text: "Loading Place", alignment: AlignmentType.CENTER })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(data.part4?.shipmentPhotos?.loadingPlace2 ? getPhotoContent(data.part4.shipmentPhotos.loadingPlace2, 240, 180) : []),
            new Paragraph({ text: "Loading Place", alignment: AlignmentType.CENTER })
          ]
        }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: shipmentRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Part 4 Score Row
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 8.5, type: WidthType.PERCENTAGE },
                shading: { fill: (data.part4?.part4Score || 0) === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: (data.part4?.part4Score || 0) === num, color: (data.part4?.part4Score || 0) === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 5. QUALITY ASSURANCE & QUALITY CONTROL SYSTEM
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "1F4E79" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "5. QUALITY ASSURANCE & QUALITY CONTROL SYSTEM", bold: true, size: 24, color: "FFFFFF" })],
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
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Helper for sub-headers
  const createSubHeader = (text) => new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        shading: { fill: "1F4E79" },
        borders: tableBorders(),
        children: [
          new Paragraph({
            children: [new TextRun({ text: text, bold: true, size: 22, color: "FFFFFF" })],
            spacing: { before: 80, after: 80 },
          }),
        ],
      }),
    ],
  });

  // Quality system management
  const qsm = data.part5?.qualitySystemManagement || {};
  const qsmRows = [
    createSubHeader("Quality system management"),
    ...[
      ["Is the factory ISO 9001 certified?", qsm.iso9001Status || ""],
      ["Comments on ISO 9001 status:", qsm.iso9001Comment || ""],
      ["Is there an internal QA manual?", qsm.internalQAManualStatus || ""],
      ["Comments on QA manual:", qsm.internalQAManualComment || ""],
      ["Other quality management systems?", qsm.othersStatus || ""],
      ["Comments on other systems:", qsm.othersComment || ""],
      ["Are there dedicated QA/QC staff?", qsm.qaStaffStatus || ""],
      ["Details of QA/QC staff:", qsm.qaStaffComment || ""],
      ["List of major certificates:", qsm.listCertificates || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    })),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(qsm.qaqcOffice ? getPhotoContent(qsm.qaqcOffice, 240, 180) : []),
            new Paragraph({ text: "QA/QC Office", alignment: AlignmentType.CENTER })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(qsm.qaqcChecking ? getPhotoContent(qsm.qaqcChecking, 240, 180) : []),
            new Paragraph({ text: "QA/QC Checking Process", alignment: AlignmentType.CENTER })
          ]
        }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: qsmRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Inspection track record by client
  const itr = data.part5?.inspectionTrackRecord || {};
  const itrRows = [
    createSubHeader("Inspection track record by client"),
    ...[
      ["How often are records updated?", itr.howOftenUpdated || ""],
      ["Date of last inspection:", itr.lastInspectionDate || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    }))
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: itrRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // QC Section
  const qcBasicRows = [
    createSubHeader("QC"),
    new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: "Total QC Staff Count:", bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: (data.part5?.qcStaffCount || 0).toString(), alignment: AlignmentType.CENTER })] }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: qcBasicRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // On-line QC
  const oqc = data.part5?.onlineQC || {};
  const oqcRows = [
    createSubHeader("On-line QC"),
    ...[
      ["Is there on-line QC conducted?", oqc.isOnlineQC || ""],
      ["Is the on-line QC manual available?", oqc.onlineQCManualAvailable || ""],
      ["Testing equipment used on-line:", oqc.onlineQCTestingEquipment || ""],
      ["Are on-line QC records available?", oqc.onlineQCRecordsAvailable || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    })),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(oqc.onlineQCRecord1 ? getPhotoContent(oqc.onlineQCRecord1, 240, 180) : []),
            new Paragraph({ text: "On-line QC Record 1", alignment: AlignmentType.CENTER })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(oqc.onlineQCRecord2 ? getPhotoContent(oqc.onlineQCRecord2, 240, 180) : []),
            new Paragraph({ text: "On-line QC Record 2", alignment: AlignmentType.CENTER })
          ]
        }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: oqcRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Final QC
  const fqc = data.part5?.finalQC || {};
  const fqcRows = [
    createSubHeader("Final QC"),
    ...[
      ["Is there final QC conducted?", fqc.isFinalQC || ""],
      ["Is the final QC manual available?", fqc.finalQCManualAvailable || ""],
      ["Testing equipment used for final QC:", fqc.finalQCTestingEquipment || ""],
      ["Are final QC records available?", fqc.finalQCRecordsAvailable || ""],
      ["Last final QC inspection results:", fqc.finalQCLastResults || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    }))
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: fqcRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Incoming QC
  const iqc = data.part5?.incomingQC || {};
  const iqcRows = [
    createSubHeader("Incoming QC"),
    ...[
      ["Is there incoming QC conducted?", iqc.isIncomingQC || ""],
      ["Is the incoming QC manual available?", iqc.incomingQCManualAvailable || ""],
      ["Testing equipment used for incoming QC:", iqc.incomingQCTestingEquipment || ""],
      ["Are incoming QC records available?", iqc.incomingQCRecordsAvailable || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    })),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(iqc.rawMaterialQCRecord1 ? getPhotoContent(iqc.rawMaterialQCRecord1, 240, 180) : []),
            new Paragraph({ text: "Incoming QC Record 1", alignment: AlignmentType.CENTER })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(iqc.rawMaterialQCRecord2 ? getPhotoContent(iqc.rawMaterialQCRecord2, 240, 180) : []),
            new Paragraph({ text: "Incoming QC Record 2", alignment: AlignmentType.CENTER })
          ]
        }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: iqcRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Test Equipment Photos
  const tePhotoRows = [
    createSubHeader("Test Equipment Photos"),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(data.part5?.testEquipmentPhotos?.testEquipment1 ? getPhotoContent(data.part5.testEquipmentPhotos.testEquipment1, 240, 180) : []),
            new Paragraph({ text: "Testing Equipment 1", alignment: AlignmentType.CENTER })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(data.part5?.testEquipmentPhotos?.testEquipment2 ? getPhotoContent(data.part5.testEquipmentPhotos.testEquipment2, 240, 180) : []),
            new Paragraph({ text: "Testing Equipment 2", alignment: AlignmentType.CENTER })
          ]
        }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tePhotoRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Part 5 Score
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 8.5, type: WidthType.PERCENTAGE },
                shading: { fill: data.part5?.part5Score === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: data.part5?.part5Score === num, color: data.part5?.part5Score === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));

  // 6. R&D / SAMPLING CAPACITY
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "1F4E79" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "6. R&D / SAMPLING CAPACITY", bold: true, size: 24, color: "FFFFFF" })],
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
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // R & D facilities
  const rd = data.part6 || {};
  const rdRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "1F4E79" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "R & D facilities", bold: true, size: 22, color: "FFFFFF" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ...[
      ["Specific staff count:", (rd.rdSpecificStaffCount || 0).toString()],
      ["Specific facilities:", rd.rdSpecificFacilities || ""],
      ["Sample Production Process Description", rd.sampleProductionProcess || ""],
      ["Record", rd.rdRecord || ""],
      ["Approval sample lead time:", rd.approvalSampleLeadTime || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    }))
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rdRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Part 6 Score
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 7.7, type: WidthType.PERCENTAGE },
                shading: { fill: rd.part6Score === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: rd.part6Score === num, color: rd.part6Score === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  // 7. ENVIRONMENT MANAGEMENT
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: "1F4E79" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "7. ENVIRONMENT MANAGEMENT", bold: true, size: 24, color: "FFFFFF" })],
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
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  const env = data.part7 || {};
  const mgmt = env.envManagement || {};

  // Environment management table
  const mgmtRows = [
    ...[
      ["ISO14000 series:", mgmt.iso14000Status || "", "Comment: " + (mgmt.iso14000Comment || "")],
      ["Others:Internal Environment system", mgmt.internalEnvStatus || "", "Comment: " + (mgmt.internalEnvComment || "")],
      ["Environment Policy Available", mgmt.envPolicyStatus || "", "Description: " + (mgmt.envPolicyDescription || "")],
    ].map(([label, status, comment]) => new TableRow({
      children: [
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: status, alignment: AlignmentType.CENTER })] }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: comment })] }),
      ]
    })),
    new TableRow({
      children: [
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: "List of certificates available", bold: true })] }),
        new TableCell({ columnSpan: 2, width: { size: 60, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: mgmt.envListCertificates || "N/A" })] }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: mgmtRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 8. WASTEWATER TEST REPORT
  children.push(new Paragraph({ children: [new PageBreak()] }));
  
  // Repeated Header Table (Logo and Client Info)
  const headerTableRows = [
    new TableRow({
      children: [
        new TableCell({
          rowSpan: 3,
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(logoBase64 ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: Buffer.from(logoBase64.split(",")[1], "base64"),
                    transformation: { width: 140, height: 45 },
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ] : []),
          ],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Client name (abbr.):", size: 18 })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.generalInfo?.client || "US", bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Conclusion", size: 18 })], alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Inspection number:", size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.generalInfo?.inspectionNo || "AV-C20211007-GEMUS", bold: true, size: 16 })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          rowSpan: 2,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "PENDING", bold: true, color: "FF0000", size: 24 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Report Date:", size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.generalInfo?.auditDate || "08-Oct-2021", bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: headerTableRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

  const ww = env.wastewaterReport || {};
  const wwRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(ww.wastewaterPhoto1 ? getPhotoContent(ww.wastewaterPhoto1, 240, 180) : []),
            new Paragraph({ 
              children: [new TextRun({ text: "Wastewater test Report", bold: true })], 
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 }
            })
          ]
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(ww.wastewaterPhoto2 ? getPhotoContent(ww.wastewaterPhoto2, 240, 180) : []),
            new Paragraph({ 
              children: [new TextRun({ text: "Wastewater test Report", bold: true })], 
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 }
            })
          ]
        }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: "Staff in charge (name and mission)", bold: true })] }),
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: ww.wastewaterStaffInCharge || "No" })] }),
      ]
    })
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: wwRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Control track record
  const ctr = env.controlTrackRecord || {};
  const ctrRows = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          shading: { fill: "1F4E79" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Control track record", bold: true, size: 22, color: "FFFFFF" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ...[
      ["Control track record available?", ctr.envControlRecordsStatus || ""],
      ["If yes, how often is it updated?", ctr.envUpdateFrequency || ""],
      ["Item checked:", ctr.envItemChecked || "Nil"],
      ["Last control date:", ctr.envLastControlDate || "No"],
      ["Findings:", ctr.envFindings || ""],
      ["Standard:", ctr.envStandard || ""],
    ].map(([label, val]) => new TableRow({
      children: [
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorders(), shading: { fill: "F2F2F2" }, children: [new Paragraph({ text: label, bold: true })] }),
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: tableBorders(), children: [new Paragraph({ text: val || "-", alignment: AlignmentType.CENTER })] }),
      ]
    }))
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ctrRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // 9. PREVENTIVE/CORRECTIVE ACTIONS
  children.push(new Paragraph({ children: [new PageBreak()] }));
  
  // Repeated Header Table (Logo and Client Info)
  const headerTableRowsActions = [
    new TableRow({
      children: [
        new TableCell({
          rowSpan: 3,
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [
            ...(logoBase64 ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: Buffer.from(logoBase64.split(",")[1], "base64"),
                    transformation: { width: 140, height: 45 },
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ] : []),
          ],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Client name (abbr.):", size: 18 })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.generalInfo?.client || "US", bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Conclusion", size: 18 })], alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Inspection number:", size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.generalInfo?.inspectionNo || "AV-C20211007-GEMUS", bold: true, size: 16 })], alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          rowSpan: 2,
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "PENDING", bold: true, color: "FF0000", size: 24 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: "Report Date:", size: 18 })] })],
        }),
        new TableCell({
          borders: tableBorders(),
          children: [new Paragraph({ children: [new TextRun({ text: data.generalInfo?.auditDate || "08-Oct-2021", bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
        }),
      ],
    }),
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: headerTableRowsActions }));
  children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

  // Preventive/corrective actions table
  const paRows = [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: "FF0000" },
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Preventive/corrective actions (Sewage/Smokes/Noise/Waste/other applicable)", bold: true, color: "FFFFFF" })],
              spacing: { before: 80, after: 80 },
            }),
          ],
        }),
      ],
    }),
    ... (env.preventiveActions || []).map((pa, idx) => new TableRow({
      children: [
        new TableCell({
          borders: tableBorders(),
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Description of the action: ", bold: true }),
                new TextRun({ text: pa.actionDescription || "" })
              ],
              spacing: { before: 100, after: 100 }
            })
          ]
        })
      ]
    }))
  ];
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: paRows }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

  // Dynamic Photos with Captions (envPhotos)
  const dynPhotos = env.envPhotos || [];
  if (dynPhotos.length > 0) {
    const photoRows = [];
    for (let i = 0; i < dynPhotos.length; i += 2) {
      const p1 = dynPhotos[i];
      const p2 = dynPhotos[i + 1];

      photoRows.push(new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: [
              ...(p1.photo ? getPhotoContent(p1.photo, 240, 180) : []),
              new Paragraph({ 
                children: [new TextRun({ text: p1.caption || "Environment Photo", bold: true })], 
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 }
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: tableBorders(),
            children: p2 ? [
              ...(p2.photo ? getPhotoContent(p2.photo, 240, 180) : []),
              new Paragraph({ 
                children: [new TextRun({ text: p2.caption || "Environment Photo", bold: true })], 
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 100 }
              })
            ] : [new Paragraph({ text: "" })]
          }),
        ]
      }));
    }
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: photoRows }));
  }

  // Part 7 Score
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              borders: tableBorders(),
              children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, color: "FF0000", size: 28 })] })],
            }),
            ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => 
              new TableCell({
                width: { size: 8.5, type: WidthType.PERCENTAGE },
                shading: { fill: env.part7Score === num ? "E9ECEF" : "FFFFFF" },
                borders: tableBorders(),
                children: [
                  new Paragraph({ 
                    children: [new TextRun({ text: num.toString(), bold: env.part7Score === num, color: env.part7Score === num ? "FF0000" : "000000" })], 
                    alignment: AlignmentType.CENTER 
                  })
                ],
              })
            ),
          ],
        }),
      ],
    })
  );

  // END OF THE REPORT
  children.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "1F4E79" },
              borders: tableBorders(),
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "END OF THE REPORT", bold: true, size: 28, color: "FFFFFF" })],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200, after: 200 },
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
