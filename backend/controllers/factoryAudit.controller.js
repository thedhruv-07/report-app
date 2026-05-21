const FactoryAudit = require("../models/factoryAudit.model");
const mongoose = require("mongoose");
const { Document, Packer, Header, Paragraph, TextRun, PageNumber, Footer, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = require("docx");
const { createFAContent, createFAHeaderTable } = require("../services/faDocx.service");
const wasabiService = require("../services/wasabiService");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getIO } = require("../socket");

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
              top: 720,
              bottom: 720,
              left: 900,
              right: 900,
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

// Helper: Preload all cloud/url photos of a report into base64 data urls in-memory
const preloadReportPhotos = async (obj) => {
  if (!obj || typeof obj !== "object") return;

  const loadAsBase64 = async (photoData) => {
    if (!photoData) return null;

    let url = null;
    let wasabiKey = null;

    if (typeof photoData === "string") {
      if (photoData.startsWith("data:image")) return photoData;
      url = photoData.startsWith("http") ? photoData : null;
    } else if (typeof photoData === "object") {
      const preview = photoData.preview || photoData.picture || photoData.photo;
      if (preview && preview.startsWith("data:image")) return preview;
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
          const buffer = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get("content-type") || "image/jpeg";
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
        const buffer = Buffer.concat(chunks);
        return `data:${mimeFromKey(wasabiKey)};base64,${buffer.toString("base64")}`;
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
