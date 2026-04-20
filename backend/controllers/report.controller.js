const fs = require("fs");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, convertInchesToTwip } = require("docx");
const { createHeaderTable, createReportContent } = require("../services/docx.service");
const { learnFromReport } = require("../services/ai.service");
const { enrichReportHeaderData, normalizePayload } = require("../utils/parser.utils");
const mongoose = require("mongoose");

// Import Mongoose Models
const { Report } = require("../models/report.model");
const { GeneralInfo } = require("../models/sections/generalInfo.model");
const { Quantity } = require("../models/sections/quantity.model");
const { Workmanship } = require("../models/sections/workmanship.model");
const { Inspection } = require("../models/sections/inspection.model");
const { Materials } = require("../models/sections/materials.model");
const { Safety } = require("../models/sections/safety.model");
const { Comments } = require("../models/sections/comments.model");
const { Media } = require("../models/sections/media.model");
const { SectionStatus } = require("../models/sections/sectionStatus.model");

const generateReport = async (req, res) => {
  console.log("📥 Generating full report and saving to granular modular database...");
  
  try {
    const rawData = normalizePayload(req.body);
    const data = enrichReportHeaderData(rawData);
    
    // --- DATABASE PERSISTENCE LOGIC ---
    try {
      const reportId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId(req.user.id || req.user._id);

      const generalInfo = new GeneralInfo({
        reportId: reportId,
        servicePerformed: data.servicePerformed || "",
        client: data.client || "",
        supplier: data.supplier || "",
        factory: data.factory || "",
        productName: data.productName || "",
        po: data.po || "",
        itemNo: data.itemNo || "",
        country: data.country || "",
        inspectionDate: data.inspectionDate || "",
        inspectionLocation: data.inspectionLocation || "",
        referenceSample: data.referenceSample || "",
      });

      const quantityDoc = new Quantity({
        reportId: reportId,
        items: data.items || [],
        quantityResult: data.quantityResult || "",
        quantityRemark: data.quantityRemark || "",
        selectedCartonsCount: data.selectedCartonsCount || "",
        cartonNo1: data.cartonNo1 || "",
        cartonNo2: data.cartonNo2 || "",
      });

      const workmanshipDoc = new Workmanship({
        reportId: reportId,
        inspectionStandardWM: data.inspectionStandardWM || "",
        samplingPlanWM: data.samplingPlanWM || "",
        inspectionLevelWM: data.inspectionLevelWM || "",
        sampleSizeWM: data.sampleSizeWM || "",
        aqlCriticalWM: data.aqlCriticalWM || "",
        aqlMajorWM: data.aqlMajorWM || "",
        aqlMinorWM: data.aqlMinorWM || "",
        acceptedCritical: data.acceptedCritical || "",
        acceptedMajor: data.acceptedMajor || "",
        acceptedMinor: data.acceptedMinor || "",
        totalFoundCritical: data.totalFoundCritical || "",
        totalFoundMajor: data.totalFoundMajor || "",
        totalFoundMinor: data.totalFoundMinor || "",
        workmanshipResult: data.workmanshipResult || "",
        workmanshipRemark: data.workmanshipRemark || "",
      });

      const inspectionDoc = new Inspection({
        reportId: reportId,
        quantityResult: data.quantity || "",
        workmanshipResult: data.workmanship || "",
        onSiteTestsResult: data.onSiteTests || "",
        dimensionsResult: data.dimensions || "",
        packingResult: data.packingResult || "",
        markingResult: data.marking_result_final || "",
        clientRequirementResult: data.client_requirement_result || "",
      });

      const materialsDoc = new Materials({
        reportId: reportId,
        productSpec: data.productSpec || "",
        dimensionsData: data.dimensionsData || {},
        materialsUsed: data.materialsUsed || "",
        referenceSampleMatch: data.referenceSample || "",
      });

      const safetyDoc = new Safety({
        reportId: reportId,
        onSiteTestResult: data.onSiteTestResult || "",
        onSiteTestRemark: data.onSiteTestRemark || "",
        safetyChecks: Array.isArray(data.safetyChecks) ? data.safetyChecks : [],
      });

      const commentsDoc = new Comments({
        reportId: reportId,
        remarks: Array.isArray(data.remarks) ? data.remarks : [],
        recommendations: data.recommendationText || "",
        factoryComments: data.factoryComments || "",
        inspectorOpinion: data.inspectorOpinion || "",
      });

      // Track photo metadata for each section
      const mediaDocs = [];
      if (data.generalPhoto) {
        mediaDocs.push(new Media({ reportId, sectionName: "General", description: "General Info Photo" }));
      }
      (data.reportPhotos || []).forEach(p => {
        mediaDocs.push(new Media({ reportId, sectionName: "Photos", description: p.label || "" }));
      });

      // Track status for each major section
      const sectionStatuses = [
        new SectionStatus({ reportId, sectionName: "GeneralInfo", status: "completed" }),
        new SectionStatus({ reportId, sectionName: "Quantity", status: "completed" }),
        new SectionStatus({ reportId, sectionName: "Workmanship", status: "completed" }),
        new SectionStatus({ reportId, sectionName: "Inspection", status: "completed" }),
      ];

      const report = new Report({
        _id: reportId,
        userId: userId,
        title: data.productName ? `Inspection Report - ${data.productName}` : "Inspection Report",
        reportNumber: data.reportHeader?.inspectionNumber || data.po || `REP-${Date.now()}`,
        status: "completed",
        generalInfo: generalInfo._id,
        quantityDetails: quantityDoc._id,
        workmanship: workmanshipDoc._id,
        inspection: inspectionDoc._id,
        materials: materialsDoc._id,
        safety: safetyDoc._id,
        comments: commentsDoc._id,
        media: mediaDocs.map(m => m._id),
        sectionStatuses: sectionStatuses.map(s => s._id),
      });

      await Promise.all([
        generalInfo.save(),
        quantityDoc.save(),
        workmanshipDoc.save(),
        inspectionDoc.save(),
        materialsDoc.save(),
        safetyDoc.save(),
        commentsDoc.save(),
        ...mediaDocs.map(m => m.save()),
        ...sectionStatuses.map(s => s.save()),
        report.save()
      ]);

      console.log(`✅ Saved Granular Modular Report to MongoDB with ID: ${report._id}`);
      
    } catch (dbError) {
      console.error("❌ DATABASE SAVE ERROR:", dbError.message);
      if (dbError.errors) {
        Object.keys(dbError.errors).forEach(key => {
          console.error(`   Validation error [${key}]:`, dbError.errors[key].message);
        });
      }
    }
    // --- END DATABASE PERSISTENCE LOGIC ---
    
    // Non-blocking learning
    try { learnFromReport(data); } catch (e) { console.error("Learning failed:", e); }

    const reportContent = await createReportContent(data, req.files || []);
    
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

const getReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const reports = await Report.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v');
      
    res.json({ reports });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

const getReportById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    
    const report = await Report.findOne({ _id: id, userId })
      .populate('generalInfo')
      .populate('quantityDetails')
      .populate('workmanship')
      .select('-__v');
      
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    res.json({ report });
  } catch (error) {
    console.error("Get Report By ID Error:", error);
    res.status(500).json({ error: "Failed to fetch report details" });
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
    const { images, mode } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const { analyzeVision, analyzeIndividualPhotos } = require("../services/ai.service");

    if (mode === "individual") {
      // images array should contain base64 strings
      const suggestions = await analyzeIndividualPhotos(images);
      return res.json({ suggestions });
    }

    // Default: Group mode (text-based generic suggestions)
    const aiResponse = await analyzeVision(images, 5);
    
    // Parse "Suggestion N: ..." format
    const suggestions = aiResponse
      .split(/\n/)
      .map(line => line.replace(/^Suggestion \d+:\s*/i, "").trim())
      .filter(s => s.length > 5);

    res.json({ 
      suggestions,
      description: suggestions[0] || "", // backward compat
      descriptions: suggestions           // backward compat
    });
  } catch (error) {
    console.error("Vision Controller Error:", error);
    res.status(500).json({ error: "Analysis Failed" });
  }
};

module.exports = {
  generateReport,
  getReports,
  getReportById,
  suggestText,
  analyzePhoto,
};
