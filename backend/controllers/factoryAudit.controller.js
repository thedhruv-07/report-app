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
      userId,
      operationStatus: "submitted",
      submittedAt: new Date()
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
    const isAdmin = req.user.role === "admin";
    
    // Admins see everything, others see only their own
    const query = isAdmin ? {} : { userId };
    
    const reports = await FactoryAudit.find(query).sort({ createdAt: -1 });
    res.json({ status: "success", data: reports });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    
    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const report = await FactoryAudit.findOne(query);
    
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
    const isAdmin = req.user.role === "admin";
    
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.body.status === "completed") {
      updateData.operationStatus = "submitted";
      updateData.submittedAt = new Date();
    }
    
    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const report = await FactoryAudit.findOneAndUpdate(
      query,
      updateData,
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
    const isAdmin = req.user.role === "admin";
    const format = req.query.format || "docx";
    
    const query = isAdmin ? { _id: id } : { _id: id, userId };
    const reportDoc = await FactoryAudit.findOne(query);
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
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader("Content-Disposition", `attachment; filename=FactoryAudit-Report-${dateStr}.pdf`);
      return res.send(pdfBuffer);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader("Content-Disposition", `attachment; filename=FactoryAudit-Report-${dateStr}.docx`);
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

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    
    const report = await FactoryAudit.findOne({ _id: id });
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Permissions: Owner or Admin
    if (report.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized to delete this report" });
    }

    await FactoryAudit.findByIdAndDelete(id);
    res.json({ status: "success", message: "Report deleted successfully" });
  } catch (error) {
    console.error("Factory Audit Delete Error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};
