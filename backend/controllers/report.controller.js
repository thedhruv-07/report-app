const fs = require("fs");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, convertInchesToTwip } = require("docx");
const { createHeaderTable, createReportContent } = require("../services/docx.service");
const { learnFromReport } = require("../services/ai.service");
const { enrichReportHeaderData, normalizePayload } = require("../utils/parser.utils");

const generateReport = async (req, res) => {
  console.log("📥 Generating full report...");
  
  try {
    const data = enrichReportHeaderData(normalizePayload(req.body));
    
    // Non-blocking learning
    try { learnFromReport(data); } catch (e) { console.error("Learning failed:", e); }

    const reportContent = createReportContent(data, req.files || []);
    
    const doc = new Document({
      features: { updateFields: false },
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                createHeaderTable(data),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Page ", bold: true, size: 18, color: "333333" }),
                    new TextRun({ children: [PageNumber.CURRENT], bold: true, size: 18, color: "333333" }),
                    new TextRun({ text: " of ", bold: true, size: 18, color: "333333" }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], bold: true, size: 18, color: "333333" }),
                  ],
                  alignment: "right",
                  spacing: { before: 100, after: 0 },
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "India | China | Bangladesh |", size: 20, color: "333333" })],
                  alignment: "left",
                  spacing: { before: 0, after: 120 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "www.absoluteveritas.com", size: 18, color: "333333" })],
                  alignment: "right",
                  spacing: { before: 0, after: 40 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Absolute Veritas Copyright © All Rights Reserved", size: 20, color: "333333" })],
                  alignment: "right",
                  spacing: { before: 0, after: 0 },
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
          children: reportContent,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=report.docx");
    res.send(buffer);

    // Async cleanup
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, () => {});
      });
    }
  } catch (error) {
    console.error("CRITICAL REPORT ERROR:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Generation Failed", detail: error.message });
    }
  }
};

const suggestText = async (req, res) => {
  try {
    const { context, partialText } = req.body;
    const { getAISuggestion } = require("../services/ai.service");
    const suggestion = await getAISuggestion(context, partialText);
    res.json({ suggestion });
  } catch (error) {
    res.json({ suggestion: "" });
  }
};

const analyzePhoto = async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }
    const { analyzeVision } = require("../services/ai.service");
    const description = await analyzeVision(images);
    res.json({ description });
  } catch (error) {
    console.error("Vision Controller Error:", error);
    res.status(500).json({ error: "Analysis Failed" });
  }
};

module.exports = {
  generateReport,
  suggestText,
  analyzePhoto,
};
