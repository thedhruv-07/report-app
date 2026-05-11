const FactoryAudit = require("../models/factoryAudit.model");
const mongoose = require("mongoose");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require("docx");
const { createFAContent } = require("../services/faDocx.service");

// Simple controller for Factory Audit
exports.createReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const report = new FactoryAudit({
      ...req.body,
      userId
    });
    await report.save();
    res.status(201).json({ status: "success", data: report });
  } catch (error) {
    console.error("Factory Audit Create Error:", error);
    res.status(500).json({ error: "Failed to create report", details: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const reports = await FactoryAudit.find({ userId }).sort({ createdAt: -1 });
    res.json({ status: "success", data: reports });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const report = await FactoryAudit.findOne({ _id: id, userId });
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ status: "success", data: report });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const report = await FactoryAudit.findOneAndUpdate(
      { _id: id, userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ status: "success", data: report });
  } catch (error) {
    res.status(500).json({ error: "Failed to update report" });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const format = req.query.format || "docx";
    
    const reportDoc = await FactoryAudit.findOne({ _id: id, userId });
    if (!reportDoc) return res.status(404).json({ error: "Report not found" });

    // Convert to plain object to avoid Mongoose internal issues during DOCX assembly
    const report = reportDoc.toObject();

    const { createFAContent, createFAHeaderTable } = require("../services/faDocx.service");

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Arial",
              size: 18, // 9pt
              color: "000000",
            },
          },
        },
      },
      sections: [{
        headers: {
          default: new Header({
            children: [createFAHeaderTable(report)],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "India    |    China    |    Bangladesh    |    Vietnam", size: 16, color: "333333" })
                            ],
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 100 }
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({ text: "www.absoluteveritas.com", size: 16, color: "333333" })
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 100 }
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({ text: "Absolute Veritas Copyright © All Rights Reserved", size: 16, color: "333333" })
                            ],
                            alignment: AlignmentType.RIGHT,
                          })
                        ]
                      })
                    ]
                  }),
                  // Optional: Add Page Number row below if needed, or keep it clean like the screenshot.
                  // The screenshot doesn't show page numbers, so I'll omit them for a cleaner look unless requested.
                ]
              })
            ],
          }),
        },
        children: createFAContent(report)
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    if (format === "pdf") {
      const { convertDocxToPdf } = require("../utils/pdf.utils");
      const pdfBuffer = await convertDocxToPdf(buffer);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=FactoryAudit-${id}.pdf`);
      return res.send(pdfBuffer);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=FactoryAudit-${id}.docx`);
    res.send(buffer);
  } catch (error) {
    console.error("CRITICAL: Factory Audit Generation Error:", error);
    res.status(500).json({ 
      error: "Failed to generate report", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
