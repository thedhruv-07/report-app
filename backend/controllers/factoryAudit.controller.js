const FactoryAudit = require("../models/factoryAudit.model");
const mongoose = require("mongoose");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, convertInchesToTwip, AlignmentType } = require("docx");
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
    
    const report = await FactoryAudit.findOne({ _id: id, userId });
    if (!report) return res.status(404).json({ error: "Report not found" });

    const { createFAContent, createFAHeaderTable } = require("../services/faDocx.service");

    const doc = new Document({
      sections: [{
        headers: {
          default: new Header({
            children: [createFAHeaderTable(report)],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Page ", size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                  new TextRun({ text: " of ", size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
                ],
                alignment: AlignmentType.CENTER,
              }),
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
    console.error("Factory Audit Generation Error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};
