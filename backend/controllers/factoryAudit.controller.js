const FactoryAudit = require("../models/factoryAudit.model");
const mongoose = require("mongoose");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require("docx");
const sharp = require('sharp');
const { createFAContent, createFAHeaderTable } = require("../services/faDocx.service");
const wasabiService = require("../services/wasabiService");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getIO } = require("../socket");
const notifyStaff = require("../utils/notifyStaff");

const emitReportSubmitted = (report, user) => {
  try {
    getIO().to("manager_room").emit("new_report_submitted", {
      reportId: report._id,
      inspectorName: user?.name || "Inspector",
      client: report.generalInfo?.client || "",
      reportType: "Factory Audit",
      submittedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Socket notification failed:", e.message);
  }
};

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
    emitReportSubmitted(report, req.user);

    const inspectorName = req.user?.name || 'Inspector';
    const clientLabel = report.generalInfo?.client || report.generalInfo?.factory || 'Unknown Client';
    notifyStaff({
      title: 'Factory Audit Submitted',
      message: `${inspectorName} submitted a Factory Audit report for ${clientLabel}.`,
      type: 'info',
      priority: 2,
      emailSubject: `[REPORT SUBMITTED] Factory Audit — ${clientLabel}`,
      emailHtml: `<p>Inspector <strong>${inspectorName}</strong> has submitted a <strong>Factory Audit</strong> report for <strong>${clientLabel}</strong>.</p><p>Please log in to review the report.</p>`,
    }).catch(e => console.warn('[faSubmit] notifyStaff failed:', e.message));

    // Enqueue email alert for submitted FA
    try {
      const { enqueueEmail } = require('../services/email.queue');
      const { renderTemplate } = require('../services/email.service');
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      const recipients = new Set(adminList);
      if (req.user && req.user.email) recipients.add(req.user.email);
      const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/factory-audit/${report._id}`;
      const html = renderTemplate('report-submitted.html', {
        reportId: report._id,
        inspectorName: req.user?.name || 'Inspector',
        factory: report.generalInfo?.client || '',
        inspectionDate: report.submittedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        summary: report.title || '' ,
        viewUrl
      });
      for (const r of Array.from(recipients)) {
        enqueueEmail({ reportId: report._id, recipient: r, subject: `[NEW REPORT] Factory Audit Submitted - #${report._id}`, type: 'report_submitted', html });
      }
    } catch (err) {
      console.warn('Failed to enqueue FA submitted emails:', err && err.message ? err.message : err);
    }
    res.status(201).json({ status: "success", data: report });
  } catch (error) {
    console.error("Factory Audit Create Error:", error);
    res.status(500).json({ error: "Failed to create report", details: error.message });
  }
};

exports.submitForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";

    const { formData } = req.body;
    const query = (isAdmin || isManager) ? { _id: id } : { _id: id, userId };

    const updatePayload = formData
      ? { ...formData, operationStatus: "submitted", submittedAt: new Date() }
      : { operationStatus: "submitted", submittedAt: new Date() };

    let report = await FactoryAudit.findOneAndUpdate(query, updatePayload, { new: true, upsert: false });

    if (!report) {
      // First submission — create the record
      report = new FactoryAudit({
        ...(formData || {}),
        userId,
        operationStatus: "submitted",
        submittedAt: new Date(),
      });
      await report.save();
    }
    emitReportSubmitted(report, req.user);

    const _inspectorName = req.user?.name || 'Inspector';
    const _clientLabel = report.generalInfo?.client || report.generalInfo?.factory || 'Unknown Client';
    notifyStaff({
      title: 'Factory Audit Submitted',
      message: `${_inspectorName} submitted a Factory Audit report for ${_clientLabel}.`,
      type: 'info',
      priority: 2,
      emailSubject: `[REPORT SUBMITTED] Factory Audit — ${_clientLabel}`,
      emailHtml: `<p>Inspector <strong>${_inspectorName}</strong> has submitted a <strong>Factory Audit</strong> report for <strong>${_clientLabel}</strong>.</p><p>Please log in to review the report.</p>`,
    }).catch(e => console.warn('[faSubmitForReview] notifyStaff failed:', e.message));

    try {
      const { enqueueEmail } = require('../services/email.queue');
      const { renderTemplate } = require('../services/email.service');
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      const recipients = new Set(adminList);
      if (req.user && req.user.email) recipients.add(req.user.email);
      const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/factory-audit/${report._id}`;
      const html = renderTemplate('report-submitted.html', {
        reportId: report._id,
        inspectorName: req.user?.name || 'Inspector',
        factory: report.generalInfo?.client || '',
        inspectionDate: report.submittedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        summary: report.title || '' ,
        viewUrl
      });
      for (const r of Array.from(recipients)) {
        enqueueEmail({ reportId: report._id, recipient: r, subject: `[NEW REPORT] Factory Audit Submitted - #${report._id}`, type: 'report_submitted', html });
      }
    } catch (err) {
      console.warn('Failed to enqueue FA submitted emails:', err && err.message ? err.message : err);
    }
    res.json({ status: "success", data: report });
  } catch (error) {
    console.error("FA Submit For Review Error:", error);
    res.status(500).json({ error: "Failed to submit report", details: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";
    
    const query = (isAdmin || isManager) ? {} : { userId };
    
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
    const isManager = req.user.role === "manager";
    
    const query = (isAdmin || isManager) ? { _id: id } : { _id: id, userId };
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
    const isManager = req.user.role === "manager";
    
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.body.status === "completed") {
      updateData.operationStatus = "submitted";
      updateData.submittedAt = new Date();
    }
    
    const query = (isAdmin || isManager) ? { _id: id } : { _id: id, userId };
    const report = await FactoryAudit.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Enqueue report updated emails
    try {
      await report.populate('userId', 'name email');
      const { enqueueEmail } = require('../services/email.queue');
      const { renderTemplate } = require('../services/email.service');
      const recipients = new Set();
      if (report.userId && report.userId.email) recipients.add(report.userId.email);
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      adminList.forEach(e => recipients.add(e));
      const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/factory-audit/${report._id}`;
      const html = renderTemplate('report-submitted.html', {
        reportId: report._id,
        inspectorName: report.userId?.name || 'Inspector',
        factory: report.generalInfo?.client || '',
        inspectionDate: report.updatedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        summary: 'A report update was saved.',
        viewUrl
      });
      for (const r of Array.from(recipients)) {
        await enqueueEmail({ reportId: report._id, recipient: r, subject: `[UPDATED] Report #${report._id} Updated`, type: 'report_updated', html });
      }
    } catch (err) {
      console.warn('Failed to enqueue FA updated emails:', err && err.message ? err.message : err);
    }
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
    const isManager = req.user.role === "manager";
    const format = req.query.format || "docx";
    
    const query = (isAdmin || isManager) ? { _id: id } : { _id: id, userId };
    const reportDoc = await FactoryAudit.findOne(query);
    if (!reportDoc) return res.status(404).json({ error: "Report not found" });

    // Convert to plain object to avoid Mongoose internal issues during DOCX assembly
    const report = reportDoc.toObject();

    // Preload all cloud/url photos into base64 strings so they render synchronously
    genDiagnostics.reset();
    await preloadReportPhotos(report);

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 20, // 10pt
              color: "000000",
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 2160,    // 1.5 inch — keeps body below the 5-row header table
              bottom: 720,
              left: 900,
              right: 900,
              header: 360,  // 0.25 inch from page edge to top of header
            },
          },
        },
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

    // Attach diagnostics as a small JSON header for debugging (if not too large)
    try {
      const diag = {
        convertedWebP: genDiagnostics.convertedWebP || 0,
        fetchedImages: genDiagnostics.fetchedImages || 0,
        wasabiImages: genDiagnostics.wasabiImages || 0,
        skipped: genDiagnostics.skipped || 0,
      };
      res.setHeader('X-FA-DIAG', JSON.stringify(diag));
    } catch (e) {
      console.warn('Failed to set diag header', e.message);
    }

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
    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";
    
    const report = await FactoryAudit.findOne({ _id: id });
    if (!report) return res.status(404).json({ error: "Report not found" });

    // Permissions: Only the owner, admin or manager can delete
    if (report.userId.toString() !== userId && !isAdmin && !isManager) {
      return res.status(403).json({ error: "Unauthorized to delete this report" });
    }

    await FactoryAudit.findByIdAndDelete(id);
    res.json({ status: "success", message: "Report deleted successfully" });
  } catch (error) {
    console.error("Factory Audit Delete Error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

const ALLOWED_IMAGE_HOSTS = ["wasabisys.com"];

const isAllowedImageUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_IMAGE_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};

const mimeFromKey = (key) => {
  const ext = (key || "").split(".").pop().toLowerCase();
  return { jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" }[ext] || "image/png";
};

// Diagnostic collector used during preload/generation
const genDiagnostics = {
  reset() {
    this.convertedWebP = 0;
    this.fetchedImages = 0;
    this.wasabiImages = 0;
    this.skipped = 0;
  }
};

// Helper: Preload all cloud/url photos of a report into base64 data urls in-memory
const preloadReportPhotos = async (obj) => {
  if (!obj || typeof obj !== "object") return;

  const loadAsBase64 = async (photoData) => {
    if (!photoData) return null;

    let url = null;
    let wasabiKey = null;

    if (typeof photoData === "string") {
      if (photoData.startsWith("data:")) {
        const mime = (photoData.split(";")[0].split(":")[1] || "").toLowerCase();
        if (mime === "image/webp") {
          try {
            const b64 = photoData.split(",")[1];
            const buf = Buffer.from(b64 || "", "base64");
            const out = await sharp(buf).jpeg().toBuffer();
            genDiagnostics.convertedWebP = (genDiagnostics.convertedWebP || 0) + 1;
            return `data:image/jpeg;base64,${out.toString("base64")}`;
          } catch (err) {
            console.warn('[FA Preload] Failed to convert WebP data-uri to JPEG:', err.message);
            return null;
          }
        }
        return photoData;
      }
      url = photoData.startsWith("http") ? photoData : null;
    } else if (typeof photoData === "object") {
      const preview = photoData.preview || photoData.picture || photoData.photo;
      if (preview && typeof preview === 'string' && preview.startsWith("data:")) {
        const mime = (preview.split(";")[0].split(":")[1] || "").toLowerCase();
        if (mime === "image/webp") {
          try {
            const b64 = preview.split(",")[1];
            const buf = Buffer.from(b64 || "", "base64");
            const out = await sharp(buf).jpeg().toBuffer();
            return `data:image/jpeg;base64,${out.toString("base64")}`;
          } catch (err) {
            console.warn('[FA Preload] Failed to convert WebP preview to JPEG:', err.message);
            return null;
          }
        }
        return preview;
      }
      url = photoData.url || photoData.preview;
      wasabiKey = photoData.wasabiKey;
    }

    if (url && typeof url === "string" && url.startsWith("http")) {
      if (!isAllowedImageUrl(url)) {
        console.warn(`[FA Preload] Blocked fetch for disallowed host: ${url}`);
        return null;
      }
      try {
        console.log(`🌐 [FA Preload] Fetching image from HTTP URL: ${url}`);
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
            genDiagnostics.fetchedImages = (genDiagnostics.fetchedImages || 0) + 1;
            const buffer = Buffer.from(await res.arrayBuffer());
            let mime = (res.headers.get("content-type") || "image/jpeg").toLowerCase();
          // Convert webp to jpeg for docx compatibility
          if (mime.includes("webp")) {
            try {
              const out = await sharp(buffer).jpeg().toBuffer();
                genDiagnostics.convertedWebP = (genDiagnostics.convertedWebP || 0) + 1;
                mime = "image/jpeg";
                return `data:${mime};base64,${out.toString("base64")}`;
            } catch (err) {
              console.warn('[FA Preload] Failed to convert fetched WebP to JPEG:', err.message);
                genDiagnostics.skipped = (genDiagnostics.skipped || 0) + 1;
                return null;
            }
          }
          return `data:${mime};base64,${buffer.toString("base64")}`;
        }
      } catch (error) {
        console.warn(`[FA Preload] HTTP fetch failed for ${url}`, error.message);
      }
    }

    if (!wasabiKey && url && typeof url === "string" && url.includes("wasabisys.com/")) {
      wasabiKey = url.split("wasabisys.com/")[1];
    }
    if (wasabiKey) {
      try {
        console.log(`☁️ [FA Preload] Fetching image from Wasabi: ${wasabiKey}`);
        const params = { Bucket: wasabiService.bucket, Key: wasabiKey };
        const { Body } = await wasabiService.s3.send(new GetObjectCommand(params));
        const chunks = [];
        for await (const chunk of Body) chunks.push(chunk);
        genDiagnostics.wasabiImages = (genDiagnostics.wasabiImages || 0) + 1;
        const buffer = Buffer.concat(chunks);
        let mime = mimeFromKey(wasabiKey) || "image/jpeg";
        if (mime.includes("webp")) {
          try {
            const out = await sharp(buffer).jpeg().toBuffer();
            genDiagnostics.convertedWebP = (genDiagnostics.convertedWebP || 0) + 1;
            mime = "image/jpeg";
            return `data:${mime};base64,${out.toString("base64")}`;
          } catch (err) {
            console.warn('[FA Preload] Failed to convert Wasabi WebP to JPEG:', err.message);
            genDiagnostics.skipped = (genDiagnostics.skipped || 0) + 1;
            return null;
          }
        }
        return `data:${mime};base64,${buffer.toString("base64")}`;
      } catch (error) {
        console.warn(`[FA Preload] Wasabi fetch failed for ${wasabiKey}`, error.message);
      }
    }

    return null;
  };

  await Promise.all(Object.keys(obj).map(async (key) => {
    const val = obj[key];
    if (!val) return;

    if (Array.isArray(val)) {
      await Promise.all(val.map(async (item, i) => {
        if (item && typeof item === "object") {
          if (item.preview !== undefined || item.photo !== undefined || item.picture !== undefined || item.url !== undefined) {
            const loaded = await loadAsBase64(item);
            if (loaded) {
              if (item.preview !== undefined) item.preview = loaded;
              if (item.photo !== undefined) item.photo = loaded;
              if (item.picture !== undefined) item.picture = loaded;
            }
          } else {
            await preloadReportPhotos(item);
          }
        } else if (typeof item === "string" && item.startsWith("http")) {
          const loaded = await loadAsBase64(item);
          if (loaded) val[i] = loaded;
        }
      }));
    } else if (typeof val === "object") {
      await preloadReportPhotos(val);
    } else if (typeof val === "string" && val.startsWith("http") &&
               (key.toLowerCase().includes("photo") || key.toLowerCase().includes("picture") ||
                key === "rawMaterials" || key === "finishedProducts" || key.startsWith("loadingPlace") ||
                key === "qaqcOffice" || key === "qaqcChecking" || key.startsWith("onlineQCRecord") ||
                key.startsWith("rawMaterialQCRecord") || key.startsWith("testEquipment") || key.startsWith("wastewaterPhoto"))) {
      const loaded = await loadAsBase64(val);
      if (loaded) obj[key] = loaded;
    }
  }));
};
