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
    
    const query = { userId };
    
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
    
    const query = { _id: id, userId };
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
    
    const updateData = { ...req.body, updatedAt: Date.now() };
    if (req.body.status === "completed") {
      updateData.operationStatus = "submitted";
      updateData.submittedAt = new Date();
    }
    
    const query = { _id: id, userId };
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
    const format = req.query.format || "docx";
    
    const query = { _id: id, userId };
    const reportDoc = await FactoryAudit.findOne(query);
    if (!reportDoc) return res.status(404).json({ error: "Report not found" });

    // Convert to plain object to avoid Mongoose internal issues during DOCX assembly
    const report = reportDoc.toObject();

    // Preload all cloud/url photos into base64 strings so they render synchronously
    await preloadReportPhotos(report);

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

    // Permissions: Only the owner can delete
    if (report.userId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this report" });
    }

    await FactoryAudit.findByIdAndDelete(id);
    res.json({ status: "success", message: "Report deleted successfully" });
  } catch (error) {
    console.error("Factory Audit Delete Error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

// Helper: Preload all cloud/url photos of a report into base64 data urls in-memory
const preloadReportPhotos = async (obj) => {
  if (!obj || typeof obj !== "object") return;

  const wasabiService = require("../services/wasabiService");

  // Helper to load buffer and return data URL
  const loadAsBase64 = async (photoData) => {
    if (!photoData) return null;

    let url = null;
    let wasabiKey = null;
    let preview = null;

    if (typeof photoData === "string") {
      if (photoData.startsWith("data:image")) return photoData;
      if (photoData.startsWith("http")) url = photoData;
    } else if (typeof photoData === "object") {
      preview = photoData.preview || photoData.picture || photoData.photo;
      if (preview && preview.startsWith("data:image")) return preview;
      url = photoData.url || photoData.preview;
      wasabiKey = photoData.wasabiKey;
    }

    // Try fetching from URL first
    if (url && typeof url === "string" && url.startsWith("http")) {
      try {
        console.log(`🌐 [FA Preload] Fetching image from HTTP URL: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get("content-type") || "image/png";
          return `data:${mime};base64,${buffer.toString("base64")}`;
        }
      } catch (error) {
        console.warn(`[FA Preload] HTTP fetch failed for ${url}`, error.message);
      }
    }

    // Try Wasabi direct
    if (!wasabiKey && url && typeof url === "string" && url.includes("wasabisys.com/")) {
      wasabiKey = url.split("wasabisys.com/")[1];
    }
    if (wasabiKey) {
      try {
        console.log(`☁️ [FA Preload] Fetching image from Wasabi: ${wasabiKey}`);
        const params = { Bucket: wasabiService.bucket, Key: wasabiKey };
        const { Body } = await wasabiService.s3.send(new (require("@aws-sdk/client-s3").GetObjectCommand)(params));
        const chunks = [];
        for await (const chunk of Body) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return `data:image/png;base64,${buffer.toString("base64")}`;
      } catch (error) {
        console.warn(`[FA Preload] Wasabi fetch failed for ${wasabiKey}`, error.message);
      }
    }

    // If it is already a base64 string, return it
    if (preview && preview.startsWith("data:image")) return preview;

    return null;
  };

  // Traversal loop
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (!val) continue;

    // Handle array of photo objects or raw elements
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const item = val[i];
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
      }
    }
    // Handle nested objects
    else if (typeof val === "object") {
      await preloadReportPhotos(val);
    }
    // Handle single string photo fields (e.g., generalPhoto, certPhoto, etc.)
    else if (typeof val === "string" && val.startsWith("http") && 
             (key.toLowerCase().includes("photo") || key.toLowerCase().includes("picture") || 
              key === "rawMaterials" || key === "finishedProducts" || key.startsWith("loadingPlace") || 
              key === "qaqcOffice" || key === "qaqcChecking" || key.startsWith("onlineQCRecord") || 
              key.startsWith("rawMaterialQCRecord") || key.startsWith("testEquipment") || key.startsWith("wastewaterPhoto"))) {
      const loaded = await loadAsBase64(val);
      if (loaded) obj[key] = loaded;
    }
  }
};
