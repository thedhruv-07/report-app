const { Report } = require("../models/report.model");
const FactoryAudit = require("../models/factoryAudit.model");
const { GeneralInfo } = require("../models/sections/generalInfo.model");
const { Quantity } = require("../models/sections/quantity.model");
const { Workmanship } = require("../models/sections/workmanship.model");
const { Inspection } = require("../models/sections/inspection.model");
const { Materials } = require("../models/sections/materials.model");
const { Safety } = require("../models/sections/safety.model");
const { Comments } = require("../models/sections/comments.model");
const { Media } = require("../models/sections/media.model");
const { SectionStatus } = require("../models/sections/sectionStatus.model");
const wasabiService = require("../services/wasabiService");

/**
 * Get all submitted reports across all types
 */
const getSubmittedReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const commonFilter = { operationStatus: { $ne: "draft" } };
    if (status) commonFilter.operationStatus = status;

    const reportFilter = { ...commonFilter };
    const auditFilter = { ...commonFilter };


    const [reports, audits] = await Promise.all([
      Report.find(reportFilter)
        .populate("userId", "name email")
        .populate("generalInfo")
        .sort({ submittedAt: -1, createdAt: -1 }),
      FactoryAudit.find(auditFilter)
        .populate("userId", "name email")
        .sort({ submittedAt: -1, createdAt: -1 })
    ]);


    // Format them uniformly
    const unifiedReports = [
      ...reports.map(r => ({
        _id: r._id,
        type: r.generalInfo?.servicePerformed || "Inspection Report",
        reportNumber: r.reportNumber,
        clientName: r.generalInfo?.client || "N/A",
        factoryName: r.generalInfo?.factory || "N/A",
        inspectorName: r.userId?.name || "Unknown",
        productName: r.generalInfo?.productName || "N/A",
        status: r.operationStatus,
        createdAt: r.createdAt,
        submittedAt: r.submittedAt || r.createdAt
      })),
      ...audits.map(a => ({
        _id: a._id,
        type: "Factory Audit",
        reportNumber: a.generalInfo?.auditDate ? `FA-${a.generalInfo.auditDate.replace(/-/g, '')}` : "FA-AUDIT",
        clientName: a.generalInfo?.client || "N/A",
        factoryName: a.generalInfo?.factory || "N/A",
        inspectorName: a.userId?.name || "Unknown",
        productName: "Factory Audit",
        status: a.operationStatus,
        createdAt: a.createdAt,
        submittedAt: a.submittedAt || a.createdAt
      }))
    ];

    // Sort combined list
    unifiedReports.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Pagination
    const paginatedReports = unifiedReports.slice(skip, skip + parseInt(limit));

    res.json({
      reports: paginatedReports,
      total: unifiedReports.length,
      page: parseInt(page),
      totalPages: Math.ceil(unifiedReports.length / limit)
    });
  } catch (error) {
    console.error("Get Operations Reports Error:", error);
    res.status(500).json({ error: "Failed to fetch reports for operations" });
  }
};

/**
 * Review a report (Approve/Reject/Revision)
 */
const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, type } = req.body;
    const userId = req.user.id;

    if (!["approved", "rejected", "revision_required", "under_review"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let report;
    if (type === "Factory Audit") {
      report = await FactoryAudit.findById(id);
    } else {
      report = await Report.findById(id);
    }

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.operationStatus = status;
    if (comment !== undefined) report.operationComment = comment;
    report.reviewedBy = userId;
    report.reviewedAt = new Date();

    await report.save();

    res.json({ 
      message: `Report ${status} successfully`,
      report: {
        _id: report._id,
        status: report.operationStatus,
        comment: report.operationComment
      }
    });
  } catch (error) {
    console.error("Review Report Error:", error);
    res.status(500).json({ error: "Failed to update report status" });
  }
};

/**
 * Get Operations Dashboard Stats
 */
const getStats = async (req, res) => {
  try {
    const [
      pendingReports,
      pendingAudits,
      approvedReports,
      approvedAudits,
      rejectedReports,
      rejectedAudits
    ] = await Promise.all([
      Report.countDocuments({ operationStatus: "submitted" }),
      FactoryAudit.countDocuments({ operationStatus: "submitted" }),
      Report.countDocuments({ operationStatus: "approved" }),
      FactoryAudit.countDocuments({ operationStatus: "approved" }),
      Report.countDocuments({ operationStatus: "rejected" }),
      FactoryAudit.countDocuments({ operationStatus: "rejected" })
    ]);

    res.json({
      pending: pendingReports + pendingAudits,
      approved: approvedReports + approvedAudits,
      rejected: rejectedReports + rejectedAudits
    });
  } catch (error) {
    console.error("Get Operations Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch operations statistics" });
  }
};

/**
 * Get full report details for review
 */
const getReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let report;
    if (type === "Factory Audit") {
      report = await FactoryAudit.findById(id).populate("userId", "name email");
    } else {
      report = await Report.findById(id)
        .populate("userId", "name email")
        .populate("generalInfo")
        .populate("quantityDetails")
        .populate("workmanship")
        .populate("inspection")
        .populate("materials")
        .populate("safety")
        .populate("comments")
        .populate("media")
        .populate("sectionStatuses");
    }

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Generate signed URLs for media if they exist (PSI/CLS)
    if (type !== "Factory Audit" && report.media && report.media.length > 0) {
      const mediaWithSignedUrls = await Promise.all(report.media.map(async (m) => {

        const mediaObj = m.toObject ? m.toObject() : m;
        if (mediaObj.url && mediaObj.url.includes("wasabisys.com")) {
          try {
            const key = wasabiService.extractKey(mediaObj.url);
            mediaObj.url = await wasabiService.getSignedUrl(key);
          } catch (e) {
            console.error("Failed to sign URL for media:", mediaObj._id);
          }
        }
        return mediaObj;
      }));
      
      // Replace report.media with the signed versions in a plain object
      const reportObj = report.toObject();
      reportObj.media = mediaWithSignedUrls;
      return res.json({ report: reportObj });
    }

    res.json({ report });
  } catch (error) {
    console.error("Get Report Details Error:", error);
    res.status(500).json({ error: "Failed to fetch report details" });
  }
};

/**
 * Bulk delete reports
 */
const bulkDeleteReports = async (req, res) => {
  try {
    const { reportIds } = req.body; // Array of { id, type }

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ error: "No reports selected for deletion" });
    }

    const results = await Promise.all(reportIds.map(async ({ id, type }) => {
      try {
        if (type === "Factory Audit") {
          await FactoryAudit.findByIdAndDelete(id);
        } else {
          const report = await Report.findById(id);
          if (report) {
            // Delete linked sub-documents
            if (report.generalInfo) await GeneralInfo.findByIdAndDelete(report.generalInfo);
            if (report.quantityDetails) await Quantity.findByIdAndDelete(report.quantityDetails);
            if (report.workmanship) await Workmanship.findByIdAndDelete(report.workmanship);
            if (report.inspection) await Inspection.findByIdAndDelete(report.inspection);
            if (report.materials) await Materials.findByIdAndDelete(report.materials);
            if (report.safety) await Safety.findByIdAndDelete(report.safety);
            if (report.comments) await Comments.findByIdAndDelete(report.comments);
            
            // Delete media and status docs
            if (report.media && report.media.length > 0) {
              await Media.deleteMany({ _id: { $in: report.media } });
            }
            if (report.sectionStatuses && report.sectionStatuses.length > 0) {
              await SectionStatus.deleteMany({ _id: { $in: report.sectionStatuses } });
            }

            await Report.findByIdAndDelete(id);
          }
        }
        return { id, success: true };
      } catch (err) {
        console.error(`Failed to delete report ${id}:`, err);
        return { id, success: false, error: err.message };
      }
    }));

    res.json({ message: "Bulk deletion completed", results });
  } catch (error) {
    console.error("Bulk Delete Error:", error);
    res.status(500).json({ error: "Failed to perform bulk deletion" });
  }
};

module.exports = {
  getSubmittedReports,
  getReportDetails,
  reviewReport,
  getStats,
  bulkDeleteReports
};
