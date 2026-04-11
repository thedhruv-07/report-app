const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Media,
  SectionProperties,
  Header,
} = require("docx");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/generate", upload.array("images"), async (req, res) => {
  const data = req.body;
  const items = JSON.parse(data.items || "[]");

  const doc = new Document();
  const children = [];

  // TITLE
  children.push(new Paragraph({
    children: [new TextRun({ text: "PRE-SHIPMENT INSPECTION REPORT", bold: true, size: 32 })],
  }));

  // REFERENCE SAMPLE (optional line)
  children.push(new Paragraph("Reference Sample: " + data.referenceSample));

  // INSPECTION SUMMARY TABLE
  children.push(new Paragraph({
    children: [new TextRun({ text: "II. INSPECTION SUMMARY", bold: true, size: 24 })],
  }));
  
  const criteriaRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Criteria", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Passed", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Failed", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Pending", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "N/A", bold: true })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("A. Quantity")] }),
        new TableCell({ children: [new Paragraph(data.quantity === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.quantity === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.quantity === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.quantity === "N/A" ? "✓" : "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("B. Workmanship")] }),
        new TableCell({ children: [new Paragraph(data.workmanship === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.workmanship === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.workmanship === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.workmanship === "N/A" ? "✓" : "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("C. On-Site Tests")] }),
        new TableCell({ children: [new Paragraph(data.onSiteTests === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.onSiteTests === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.onSiteTests === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.onSiteTests === "N/A" ? "✓" : "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("D. Dimensions")] }),
        new TableCell({ children: [new Paragraph(data.dimensions === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.dimensions === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.dimensions === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.dimensions === "N/A" ? "✓" : "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("E. Packing")] }),
        new TableCell({ children: [new Paragraph(data.packing === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.packing === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.packing === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.packing === "N/A" ? "✓" : "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("F. Marking & Labeling")] }),
        new TableCell({ children: [new Paragraph(data.markingLabeling === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.markingLabeling === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.markingLabeling === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.markingLabeling === "N/A" ? "✓" : "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("G. Client Special Requirement")] }),
        new TableCell({ children: [new Paragraph(data.clientSpecial === "Passed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.clientSpecial === "Failed" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.clientSpecial === "Pending" ? "✓" : "")] }),
        new TableCell({ children: [new Paragraph(data.clientSpecial === "N/A" ? "✓" : "")] }),
      ],
    }),
  ];
  children.push(new Table({ rows: criteriaRows }));

  // WORKMANSHIP SUMMARY
  children.push(new Paragraph({
    children: [new TextRun({ text: "Workmanship Summary", bold: true })],
  }));
  
  const workmanshipRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Inspection Standard", bold: true })] }),
        new TableCell({ children: [new Paragraph(data.inspectionStandard || "")] }),
        new TableCell({ children: [new Paragraph({ text: "Critical", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Major", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Minor", bold: true })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Sampling Plan", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: data.samplingPlan || "", bold: true })] }),
        new TableCell({ children: [new Paragraph("AQL")] }),
        new TableCell({ children: [new Paragraph(data.aqlMajor || "")] }),
        new TableCell({ children: [new Paragraph(data.aqlMinor || "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Inspection Level", bold: true })] }),
        new TableCell({ children: [new Paragraph(data.inspectionLevel || "")] }),
        new TableCell({ children: [new Paragraph("Accepted")] }),
        new TableCell({ children: [new Paragraph(data.acceptedMajor || "")] }),
        new TableCell({ children: [new Paragraph(data.acceptedMinor || "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Order Quantity")] }),
        new TableCell({ children: [new Paragraph(data.orderQuantity || "")] }),
        new TableCell({ children: [new Paragraph("Found")] }),
        new TableCell({ children: [new Paragraph(data.foundMajor || "")] }),
        new TableCell({ children: [new Paragraph(data.foundMinor || "")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Available Quantity")] }),
        new TableCell({ children: [new Paragraph(data.availableQuantity || "")] }),
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({ children: [new Paragraph("")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Sample Size")] }),
        new TableCell({ children: [new Paragraph(data.sampleSize || "")] }),
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({ children: [new Paragraph("")] }),
      ],
    }),
  ];
  children.push(new Table({ rows: workmanshipRows }));

  // FACTORY COMMENTS
  children.push(new Paragraph({
    children: [new TextRun({ text: "Factory Comments & Signature", bold: true })],
  }));
  children.push(new Paragraph(data.factoryComments || ""));

  // QUANTITY TABLE (Items details)
  children.push(new Paragraph({
    children: [new TextRun({ text: "III. QUANTITY DETAILS", bold: true, size: 24 })],
  }));
  const quantityRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Item Name", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Order Qty", bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "Available Qty", bold: true })] }),
      ],
    }),
    ...items.map(item =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(item.name || "")] }),
          new TableCell({ children: [new Paragraph(item.orderQty || "")] }),
          new TableCell({ children: [new Paragraph(item.availableQty || "")] }),
        ],
      })
    ),
  ];
  children.push(new Table({ rows: quantityRows }));

  // REMARKS
  children.push(new Paragraph({
    children: [new TextRun({ text: "IV. REMARKS", bold: true, size: 24 })],
  }));
  children.push(new Paragraph(data.remarks || ""));

  // PHOTOS
  children.push(new Paragraph({
    children: [new TextRun({ text: "V. PHOTOS", bold: true, size: 24 })],
  }));

  if (req.files) {
    for (let file of req.files) {
      const image = Media.addImage(doc, fs.readFileSync(file.path));
      children.push(new Paragraph(image));
    }
  }

  children.push(new Paragraph("{"));
  children.push(new Paragraph({
    children: [new TextRun({ text: "Inspector Signature & Chop: " + (data.inspector || ""), bold: true })],
  }));

  // Create header with company and client info
  const headerTable = new Table({
    width: { size: 100, type: "pct" },
    rows: [
      new TableRow({
        children: [
          // Left side - Company info
          new TableCell({
            width: { size: 50, type: "pct" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "Absolute Veritas", bold: true, size: 18 })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "Inspection, Testing and Certifications", size: 12, italics: true })]
              })
            ]
          }),
          // Right side - Inspection info
          new TableCell({
            width: { size: 50, type: "pct" },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Client Name (abbr.): ", bold: true, size: 10 }),
                  new TextRun({ text: data.client || "", size: 10 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "FRIN: ", bold: true, size: 10 }),
                  new TextRun({ text: data.po || "", size: 10 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Inspection Number: ", bold: true, size: 10 }),
                  new TextRun({ text: data.inspectionNumber || "", size: 10 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Report Date: ", bold: true, size: 10 }),
                  new TextRun({ text: data.inspectionDate || "", size: 10 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Conclusion: ", bold: true, size: 10, color: data.conclusion === "FAILED" ? "FF0000" : "00AA00" }),
                  new TextRun({ text: data.conclusion || "", bold: true, size: 10, color: data.conclusion === "FAILED" ? "FF0000" : "00AA00" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  doc.addSection({ 
    children,
    properties: new SectionProperties({
      children: [
        new Header({
          children: [headerTable]
        })
      ]
    })
  });

  const buffer = await Packer.toBuffer(doc);

  res.setHeader("Content-Disposition", "attachment; filename=report.docx");
  res.send(buffer);
});

app.listen(5000, () => console.log("Server running"));