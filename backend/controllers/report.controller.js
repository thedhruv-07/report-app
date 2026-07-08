const fs = require("fs");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, convertInchesToTwip } = require("docx");
const { createHeaderTable, createReportContent } = require("../services/docx.service");
const { learnFromReport } = require("../services/ai.service");
const { enrichReportHeaderData, normalizePayload } = require("../utils/parser.utils");
const { claimInspectionNumber } = require("../utils/noticeId");
const mongoose = require("mongoose");
const { getIO } = require("../socket");
const notifyStaff = require("../utils/notifyStaff");
const { getReportDisplayId } = require("../utils/reportDisplayId");

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
const { ReportV2 } = require("../models/v2/report.model");
const FactoryAudit = require('../models/factoryAudit.model');

const generateReport = async (req, res) => {
  console.log("📥 Generating full report and saving to granular modular database...");
  
  try {
    const rawData = normalizePayload(req.body);

    // Flatten CLS specific fields for the DOCX generator
    if (rawData.productConformityDetails && typeof rawData.productConformityDetails === 'object') {
      Object.assign(rawData, rawData.productConformityDetails);
    }

    const data = enrichReportHeaderData(rawData);
    data.reportHeader.inspectionNumber = await claimInspectionNumber(data.reportHeader.inspectionNumber);

    let dbReportId = null;
    let userId = null;
    let reportV2 = null;

    // --- DATABASE PERSISTENCE LOGIC ---
    try {
      const reportId = new mongoose.Types.ObjectId();
      dbReportId = reportId;
      userId = new mongoose.Types.ObjectId(req.user.id || req.user._id);

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
        defects: Array.isArray(data.workmanshipDefects) ? data.workmanshipDefects : [],
      });

      const inspectionDoc = new Inspection({
        reportId: reportId,
        quantityResult: data.summaryQuantity || data.quantity || data.quantityResult || "",
        workmanshipResult: data.summaryWorkmanship || data.workmanship || data.workmanshipResult || "",
        onSiteTestsResult: data.summaryOnSiteTests || data.onSiteTests || data.onSiteTestResult || "",
        dimensionsResult: data.summaryDimensions || data.dimensions || data.dimensionsResult || "",
        packingResult: data.summaryPacking || data.packingResult || data.packing || "",
        markingResult: data.summaryMarkingLabeling || data.marking_result_final || data.markingResult || data.marking || "",
        clientRequirementResult: data.summaryClientRequirement || data.client_requirement_result || data.clientRequirement || data.client_requirement || "",
      });

      const materialsDoc = new Materials({
        reportId: reportId,
        productSpec: data.productSpec || "",
        dimensionsData: data.dimensionsData || {},
        materialsUsed: data.materialsUsed || "",
        referenceSampleMatch: data.referenceSample || "",
        specifications: Array.isArray(data.productSpecificationTable) ? data.productSpecificationTable : [],
      });

      const safetyDoc = new Safety({
        reportId: reportId,
        onSiteTestResult: data.onSiteTestResult || "",
        onSiteTestRemark: data.onSiteTestRemark || "",
        safetyChecks: Array.isArray(data.safetyChecks) ? data.safetyChecks : [],
      });

      // Capture remarks (handles both PSI and CLS formats)
      let combinedRemarks = Array.isArray(data.remarks) ? [...data.remarks] : [];
      if (Array.isArray(data.problemRemarks)) combinedRemarks = [...combinedRemarks, ...data.problemRemarks];
      if (Array.isArray(data.generalRemarks)) combinedRemarks = [...combinedRemarks, ...data.generalRemarks];
      
      const commentsDoc = new Comments({
        reportId: reportId,
        remarks: combinedRemarks,
        recommendations: data.recommendationText || data.recommendations || "",
        factoryComments: data.factoryComments || "",
        inspectorOpinion: data.inspectorOpinion || "",
        approvedBy: data.approvedByManager || data.approvedBy || "",
        inspector: data.inspectorName || data.inspector || "",
        reportReviewer: data.reportReviewer || "",
        conclusionPhotos: data.conclusionPhotos || [],
        conclusionReviewerPhotos: data.conclusionReviewerPhotos || []
      });

      // Track photo metadata for each section
      const mediaDocs = [];
      if (data.generalPhoto) {
        const gm = new Media({ reportId, sectionName: "General", description: "General Info Photo" });
        mediaDocs.push(gm);
        // Link to the photo object for later URL update
        if (data.generalPhoto && typeof data.generalPhoto === 'object') data.generalPhoto.mediaId = gm._id;
      }

      (data.reportPhotos || []).forEach(p => {
        const m = new Media({ reportId, sectionName: "Photos", description: p.label || "" });
        mediaDocs.push(m);
        p.mediaId = m._id; // Attach ID
      });

      (data.reportPhotoGroups || []).forEach(group => {
        (group.photos || []).forEach(p => {
          const m = new Media({ reportId, sectionName: "Photos", description: p.label || group.description || "Grouped Photo" });
          mediaDocs.push(m);
          p.mediaId = m._id; // Attach ID
        });
      });

      (data.conclusionPhotos || []).forEach(p => {
        const m = new Media({ reportId, sectionName: "Conclusion", description: p.label || "Inspector Signature" });
        mediaDocs.push(m);
        p.mediaId = m._id;
      });

      (data.conclusionReviewerPhotos || []).forEach(p => {
        const m = new Media({ reportId, sectionName: "Reviewer", description: p.label || "Reviewer Signature" });
        mediaDocs.push(m);
        p.mediaId = m._id;
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
        operationStatus: "submitted",
        submittedAt: new Date(),
      });

      reportV2 = new ReportV2({
        title: `Inspection Report - ${data.productName || "No Title"}`,
        createdBy: userId,
        sections: [],
        summary: {
          overview: data.inspectorOpinion || "",
          issues: data.remarks ? data.remarks.filter(r => r && r.trim()) : [],
          recommendations: [data.recommendationText].filter(r => r && r.trim())
        }
      });
      // We'll save reportV2 later after population in the upload loop

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

      // Link the inspector's Task to this report so correction flow works
      if (data.taskId) {
        try {
          const Task = require('../models/task.model');
          await Task.findByIdAndUpdate(data.taskId, {
            status: 'Report Submitted',
            reportId: report._id,
            reportSubmittedAt: new Date(),
          });
        } catch (e) {
          console.warn('[generateReport] Task link failed:', e.message);
        }
      }

      // Dashboard + email notification for admin and manager
      const inspectorName = data.auditorName || req.user?.name || 'Inspector';
      const clientLabel = data.client || data.factory || 'Unknown Client';
      const reportType = data.servicePerformed || 'PSI';
      notifyStaff({
        title: 'Report Submitted',
        message: `${inspectorName} submitted a ${reportType} report for ${clientLabel}.`,
        type: 'info',
        priority: 2,
        relatedReportId: report._id,
        relatedTaskId: data.taskId || null,
        emailSubject: `[REPORT SUBMITTED] ${reportType} — ${clientLabel}`,
        templateName: 'report-submitted-staff.html',
        templateVars: {
          inspectorName,
          reportType,
          clientName: clientLabel,
          submittedAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
        },
      }).catch(e => console.warn('[reportSubmit] notifyStaff failed:', e.message));

      if (req.query.notify === "true") {
        try {
          getIO().to(["manager_room", "admin_room"]).emit("new_report_submitted", {
            reportId: report._id,
            inspectorName,
            client: data.client || "",
            reportType,
            submittedAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Socket notification failed:", e.message);
        }
      }

      // Enqueue email alerts (non-blocking)
      try {
        const { enqueueEmail } = require('../services/email.queue');
        const { renderTemplate, formatEmailDate } = require('../services/email.service');

        const recipients = new Set();
        // Admin list via env (comma separated) or fallback to SMTP_USER
        const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
        adminList.forEach(e => recipients.add(e));
        // Inspector (reporting user)
        if (req.user && req.user.email) recipients.add(req.user.email);
        // Optional client email from payload
        if (data.clientEmail) recipients.add(data.clientEmail);

        const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/${report._id}`;
        const displayId = getReportDisplayId(report);
        const html = renderTemplate('report-submitted.html', {
          reportId: displayId,
          inspectorName: data.auditorName || req.user?.name || 'Inspector',
          factory: data.factory || data.client || '',
          inspectionDate: data.inspectionDate || '',
          submittedAt: formatEmailDate(new Date()),
          summary: (data.inspectorOpinion || '').slice(0, 400),
          viewUrl
        });

        for (const r of Array.from(recipients)) {
          if (!r) continue;
          enqueueEmail({ reportId: report._id, recipient: r, subject: `[NEW REPORT] Inspection Report Submitted - #${displayId}`, type: 'report_submitted', html, metadata: { priority: data.priority || 'normal' } });
        }
      } catch (e) {
        console.warn('Failed to enqueue report-submitted emails:', e && e.message ? e.message : e);
      }

        // If critical findings exist, send an urgent alert
        try {
          const criticalCount = parseInt(data.totalFoundCritical || data.totalCritical || 0, 10) || 0;
          if (criticalCount > 0) {
            const { enqueueEmail } = require('../services/email.queue');
            const { renderTemplate } = require('../services/email.service');
            const recipients = new Set();
            const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
            adminList.forEach(e=>recipients.add(e));
            if (req.user && req.user.email) recipients.add(req.user.email);
            const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/${report._id}`;
            const criticalDisplayId = getReportDisplayId(report);
            const htmlCritical = renderTemplate('critical-alert.html', { reportId: criticalDisplayId, severity: 'Critical', issueSummary: (data.inspectorOpinion || '').slice(0,400), viewUrl });
            for (const r of Array.from(recipients)) enqueueEmail({ reportId: report._id, recipient: r, subject: `[URGENT] Critical Inspection Issue Detected - #${criticalDisplayId}`, type: 'critical_alert', html: htmlCritical, metadata: { priority: 'high' } });
          }
        } catch (err) {
          console.warn('Failed to enqueue critical alert emails:', err && err.message ? err.message : err);
        }

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

    // --- OPTIMIZED CLOUD STORAGE UPLOAD (PARALLEL) ---
    const wasabiService = require("../services/wasabiService");
    const { Photo } = require("../models/v2/photo.model");
    
    // 1. Collect all photos needing upload
    const uploadQueue = [];
    const collectFromList = (list) => {
      if (!Array.isArray(list)) return;
      list.forEach(p => {
        if (p.preview && String(p.preview).startsWith("data:image")) {
          uploadQueue.push(p);
        }
      });
    };

    if (data.reportPhotoGroups) data.reportPhotoGroups.forEach(g => collectFromList(g.photos));
    if (data.reportPhotos) collectFromList(data.reportPhotos);
    if (data.conclusionPhotos) {
      data.conclusionPhotos.forEach(p => { p._section = "conclusionPhotos"; });
      collectFromList(data.conclusionPhotos);
    }
    if (data.conclusionReviewerPhotos) {
      data.conclusionReviewerPhotos.forEach(p => { p._section = "conclusionReviewerPhotos"; });
      collectFromList(data.conclusionReviewerPhotos);
    }
    if (data.generalPhoto && data.generalPhoto.preview && String(data.generalPhoto.preview).startsWith("data:image")) {
      uploadQueue.push(data.generalPhoto);
    }

    // 2. Upload everything in parallel
    if (uploadQueue.length > 0) {
      console.log(`⚡ Parallel uploading ${uploadQueue.length} photos to Wasabi...`);
      await Promise.all(uploadQueue.map(async (p) => {
        try {
          const base64 = p.preview.split(",")[1];
          const buffer = Buffer.from(base64, "base64");
          const mimeMatch = p.preview.match(/^data:(image\/\w+);base64,/);
          
          const uploadRes = await wasabiService.uploadFile({
            buffer,
            originalname: `report_photo_${Date.now()}.png`,
            mimetype: mimeMatch ? mimeMatch[1] : "image/png"
          });
          p.wasabiKey = uploadRes.key;
          
          if (dbReportId) {
            // 1. Update the Legacy Media Document with the URL using the attached mediaId
            const { Media } = require("../models/sections/media.model");
            if (p.mediaId) {
              console.log(`Updating Media doc ${p.mediaId} with URL: ${uploadRes.url}`);
              await Media.findByIdAndUpdate(p.mediaId, { 
                $set: { url: uploadRes.url, originalName: uploadRes.key } 
              });
            } else {
              // Fallback for any outliers
              await Media.findOneAndUpdate(
                { reportId: dbReportId, url: "", sectionName: "Photos" },
                { $set: { url: uploadRes.url, originalName: uploadRes.key } }
              );
            }

            if (p._section) {
              await Comments.updateOne(
                { reportId: dbReportId, [`${p._section}.id`]: p.id },
                { $set: { [`${p._section}.$.url`]: uploadRes.url, [`${p._section}.$.originalName`]: uploadRes.key } }
              );
            }

            // 2. Save to the new architecture (Photo doc)
            const photoDoc = new Photo({
              url: uploadRes.url,
              key: uploadRes.key,
              reportId: dbReportId,
              section: "Photos",
              caption: p.label || ""
            });
            await photoDoc.save();

            // 3. Update the ReportV2 document sections array in real-time
            const sectionName = "Photos";
            let sectionIndex = -1;
            
            if (reportV2 && reportV2.sections) {
              sectionIndex = reportV2.sections.findIndex(s => s.sectionName === sectionName);
            }
            const photoEntry = {
              photoId: photoDoc._id,
              url: uploadRes.url,
              caption: p.label || ""
            };

            if (reportV2 && reportV2.sections) {
              if (sectionIndex > -1) {
                reportV2.sections[sectionIndex].photos.push(photoEntry);
              } else {
                reportV2.sections.push({
                  sectionName,
                  photos: [photoEntry]
                });
              }
            }
          }
          // Optional: p.preview = null; // Clean up memory if not needed anymore
        } catch (err) {
          console.warn(`⚠️ Parallel upload failed for ${p.id}:`, err.message);
        }
      }));
    }
    // Finalize the V2 summary and save the V2 report
    try {
      if (reportV2) {
        await reportV2.save();
      }
      console.log(`✅ Parallel V2 Report saved with id: ${reportV2._id}`);
    } catch (v2Err) {
      console.warn("⚠️ V2 Report save failed (non-critical):", v2Err.message);
    }
    // --- END OPTIMIZED UPLOAD LOGIC ---

    const reportContent = await createReportContent(data, req.files || []);
    
    const doc = new Document({
      features: { updateFields: false },
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
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                createHeaderTable(data),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Page ", bold: true, size: 18, color: "333333" }),
                    new TextRun({ children: [PageNumber.CURRENT], bold: true, size: 18, color: "333333" }),
                    new TextRun({ text: " of ", bold: true, size: 18, color: "333333" }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], bold: true, size: 18, color: "333333" }),
                  ],
                  alignment: "right",
                  spacing: { before: 0, after: 40 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "India | China | Bangladesh | www.absoluteveritas.com", size: 18, color: "333333" })],
                  alignment: "left",
                  spacing: { before: 0, after: 20 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: "Absolute Veritas Copyright © All Rights Reserved", size: 18, color: "333333" })],
                  alignment: "right",
                  spacing: { before: 0, after: 0 },
                }),
              ],
            }),
          },
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1.3),
                right: convertInchesToTwip(0.6),
                bottom: convertInchesToTwip(0.8),
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

    const { convertDocxToPdf } = require("../utils/pdf.utils");
    const format = req.body.format || "docx";

    const buffer = await Packer.toBuffer(doc);

    if (format === "pdf") {
      try {
        const pdfBuffer = await convertDocxToPdf(buffer);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
        res.send(pdfBuffer);
      } catch (pdfErr) {
        console.error("PDF Conversion Error:", pdfErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "PDF Conversion Failed", detail: pdfErr.message });
        }
      }
    } else {
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", "attachment; filename=report.docx");
      res.send(buffer);
    }

    // Async cleanup
    if (req.files) {
      req.files.forEach(file => {
        if (file.path) {
          fs.unlink(file.path, () => {});
        }
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
    const isAdmin = req.user.role === "admin";
    
    // Admins see everything, others see only their own
    const query = isAdmin ? {} : { userId };
    
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');
      
    res.json({ reports });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Check permissions: Owner, Admin, or Operator can delete
    if (report.userId.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "operator") {
      return res.status(403).json({ error: "Unauthorized to delete this report" });
    }

    // Delete linked sub-documents if they exist
    const { GeneralInfo } = require("../models/sections/generalInfo.model");
    const { Quantity } = require("../models/sections/quantity.model");
    const { Workmanship } = require("../models/sections/workmanship.model");
    const { Inspection } = require("../models/sections/inspection.model");
    const { Materials } = require("../models/sections/materials.model");
    const { Safety } = require("../models/sections/safety.model");
    const { Comments } = require("../models/sections/comments.model");

    if (report.generalInfo) await GeneralInfo.findByIdAndDelete(report.generalInfo);
    if (report.quantityDetails) await Quantity.findByIdAndDelete(report.quantityDetails);
    if (report.workmanship) await Workmanship.findByIdAndDelete(report.workmanship);
    if (report.inspection) await Inspection.findByIdAndDelete(report.inspection);
    if (report.materials) await Materials.findByIdAndDelete(report.materials);
    if (report.safety) await Safety.findByIdAndDelete(report.safety);
    if (report.comments) await Comments.findByIdAndDelete(report.comments);
    
    await Report.findByIdAndDelete(req.params.id);

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getReportById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    
    const isPrivileged = ["admin", "manager"].includes(req.user.role);
    const report = await Report.findOne(isPrivileged ? { _id: id } : { _id: id, userId })
      .populate('generalInfo')
      .populate('quantityDetails')
      .populate('workmanship')
      .populate('comments')
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
    const { context, partialText, photos, reportMeta } = req.body;
    const { getAISuggestion } = require("../services/ai.service");
    const suggestion = await getAISuggestion(context, partialText, photos || [], reportMeta || {});
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
      // images array contains [{ data: 'base64...', fileName: '...' }]
      const processedImages = images.map(img => {
        if (typeof img === 'object' && img.data) return img;
        return { data: img, fileName: 'unknown_photo' };
      });
      
      const suggestions = await analyzeIndividualPhotos(processedImages);
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

const getStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    
    // Admins see global stats, others see only their own
    const query = isAdmin ? {} : { userId };
    
    const total = await Report.countDocuments(query);
    const completed = await Report.countDocuments({ ...query, status: "completed" });
    const active = await Report.countDocuments({ ...query, status: "draft" });
    
    res.json({ total, active, completed });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

const getAdminQueue = async (req, res) => {
  try {
    const { status = 'all', type = 'all', reviewedBy = 'all', fromDate, toDate } = req.query;

    let query = {
      operationStatus: { $in: ['submitted', 'under_review', 'revision_required', 'approved'] },
    };
    if (status && status !== 'all') query.operationStatus = status;

    const [reports, factoryAudits] = await Promise.all([
      Report.find(query)
        .populate('userId', 'name email')
        .populate('generalInfo')
        .populate('assignedTM', 'name')
        .populate('reviewedBy', 'name')
        .sort({ submittedAt: -1, updatedAt: -1 })
        .lean(),
      FactoryAudit.find(query)
        .populate('userId', 'name email')
        .populate('assignedTM', 'name')
        .populate('reviewedBy', 'name')
        .sort({ submittedAt: -1, updatedAt: -1 })
        .lean(),
    ]);

    const normalized = [
      ...reports.map(r => ({
        id: r._id,
        reportId: r.reportNumber || `RPT-${r._id.toString().slice(-6).toUpperCase()}`,
        clientName: r.generalInfo?.client || 'Unknown Client',
        inspectionType: r.title || 'Standard Inspection',
        inspectorName: r.userId?.name || 'Unknown Inspector',
        submittedAt: r.submittedAt || r.updatedAt,
        status: r.operationStatus,
        revisionRound: r.revisionRound || 1,
        type: 'standard',
        assignedTMName: r.assignedTM?.name || null,
        reviewedByName: r.reviewedBy?.name || null,
      })),
      ...factoryAudits.map(fa => ({
        id: fa._id,
        reportId: fa.generalInfo?.inspectionNo || `FA-${fa._id.toString().slice(-6).toUpperCase()}`,
        clientName: fa.generalInfo?.client || 'Unknown Client',
        inspectionType: fa.title || 'Factory Audit',
        inspectorName: fa.userId?.name || 'Unknown Inspector',
        submittedAt: fa.submittedAt || fa.updatedAt,
        status: fa.operationStatus,
        revisionRound: fa.revisionRound || 1,
        type: 'factoryAudit',
        assignedTMName: fa.assignedTM?.name || null,
        reviewedByName: fa.reviewedBy?.name || null,
      })),
    ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Apply type filter
    let filtered = normalized;
    if (type && type !== 'all') {
      if (type === 'factory_audit') {
        filtered = normalized.filter(r => r.type === 'factoryAudit');
      } else {
        filtered = normalized.filter(r => r.inspectionType.includes(type));
      }
    }

    // Apply reviewedBy filter (TM name)
    if (reviewedBy && reviewedBy !== 'all') {
      filtered = filtered.filter(
        r => r.assignedTMName === reviewedBy || r.reviewedByName === reviewedBy
      );
    }

    if (fromDate) {
      filtered = filtered.filter(r => new Date(r.submittedAt) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter(r => new Date(r.submittedAt) <= new Date(toDate));
    }

    const stats = {
      totalReports: normalized.length,
      pendingReview: normalized.filter(r => r.status === 'submitted').length,
      underReview: normalized.filter(r => r.status === 'under_review').length,
      sentForCorrection: normalized.filter(r => r.status === 'revision_required').length,
      finalizedToday: normalized.filter(r => {
        if (r.status !== 'approved') return false;
        const today = new Date();
        return new Date(r.submittedAt).toDateString() === today.toDateString();
      }).length,
    };

    res.json({ reports: filtered, stats });
  } catch (err) {
    console.error('getAdminQueue error:', err);
    res.status(500).json({ error: err.message });
  }
};

const assignTM = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicalManagerId, note } = req.body;

    if (!technicalManagerId) {
      return res.status(400).json({ error: 'technicalManagerId is required' });
    }

    const { User } = require('../models/user.model');
    const tm = await User.findById(technicalManagerId).select('name role').lean();
    if (!tm || tm.role !== 'manager') {
      return res.status(400).json({ error: 'Invalid Technical Manager ID' });
    }

    let doc = await Report.findById(id);
    let isFA = false;
    if (!doc) {
      doc = await FactoryAudit.findById(id);
      isFA = true;
    }
    if (!doc) return res.status(404).json({ error: 'Report not found' });

    doc.assignedTM = technicalManagerId;
    if (doc.operationStatus === 'submitted') {
      doc.operationStatus = 'under_review';
    }
    if (note && !isFA && Array.isArray(doc.tmRemarks)) {
      doc.tmRemarks.push({
        text: `[Admin Note] ${note}`,
        addedBy: req.user._id || req.user.id,
        addedAt: new Date(),
      });
    }
    await doc.save();

    res.json({
      success: true,
      report: {
        id: doc._id,
        assignedTMName: tm.name,
        status: doc.operationStatus,
      },
    });
  } catch (err) {
    console.error('assignTM error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  generateReport,
  getReports,
  getReportById,
  suggestText,
  analyzePhoto,
  getStats,
  deleteReport,
  getAdminQueue,
  assignTM,
};
