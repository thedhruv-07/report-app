const { Report } = require("../models/report.model");
const FactoryAudit = require("../models/factoryAudit.model");
const { getIO } = require("../socket");

// Helper to fetch all reports (standard + factory audit) and normalize them
const getAllReports = async (query = {}) => {
  const reports = await Report.find(query)
    .populate("userId", "name email")
    .populate("generalInfo")
    .sort({ submittedAt: -1, updatedAt: -1 })
    .lean();

  const factoryAudits = await FactoryAudit.find(query)
    .populate("userId", "name email")
    .sort({ submittedAt: -1, updatedAt: -1 })
    .lean();

  // Normalize report data
  const normalizedReports = reports.map(r => ({
    id: r._id,
    reportId: r.reportNumber || `RPT-${r._id.toString().slice(-6).toUpperCase()}`,
    clientName: r.generalInfo?.client || "Unknown Client",
    inspectionType: r.title || "Standard Inspection",
    inspectorName: r.userId?.name || "Unknown Inspector",
    submittedAt: r.submittedAt || r.updatedAt,
    status: r.operationStatus,
    revisionRound: r.revisionRound || 1,
    type: "standard"
  }));

  const normalizedFactoryAudits = factoryAudits.map(fa => ({
    id: fa._id,
    reportId: `FA-${fa._id.toString().slice(-6).toUpperCase()}`,
    clientName: fa.generalInfo?.client || "Unknown Client",
    inspectionType: fa.title || "Factory Audit",
    inspectorName: fa.userId?.name || "Unknown Inspector",
    submittedAt: fa.submittedAt || fa.updatedAt,
    status: fa.operationStatus,
    revisionRound: fa.revisionRound || 1,
    type: "factoryAudit"
  }));

  return [...normalizedReports, ...normalizedFactoryAudits].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

exports.getQueue = async (req, res) => {
  try {
    const { status = 'all', type = 'all' } = req.query;
    
    // Filter by relevant TM statuses by default
    let query = {
      operationStatus: { $in: ["submitted", "under_review", "revision_required", "approved"] }
    };

    if (status && status !== "all") {
      query.operationStatus = status;
    }

    const allReports = await getAllReports(query);

    // Apply type filter if necessary
    let filteredReports = allReports;
    if (type && type !== "all") {
      if (type === "factory_audit") {
        filteredReports = allReports.filter(r => r.type === "factoryAudit");
      } else {
        filteredReports = allReports.filter(r => r.inspectionType.includes(type));
      }
    }

    // Calculate Summary Stats
    const stats = {
      totalReports: allReports.length,
      pendingReview: allReports.filter(r => r.status === "submitted").length,
      underReview: allReports.filter(r => r.status === "under_review").length,
      sentForCorrection: allReports.filter(r => r.status === "revision_required").length,
      finalizedToday: allReports.filter(r => {
        if (r.status !== "approved") return false;
        const submitted = new Date(r.submittedAt);
        const today = new Date();
        return submitted.getDate() === today.getDate() && 
               submitted.getMonth() === today.getMonth() && 
               submitted.getFullYear() === today.getFullYear();
      }).length
    };

    res.json({ reports: filteredReports, stats });
  } catch (error) {
    console.error("Error fetching TM queue:", error);
    res.status(500).json({ error: "Failed to fetch report queue" });
  }
};

exports.getReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let report = await Report.findById(id)
      .populate("userId", "name email")
      .populate("generalInfo")
      .populate("quantityDetails")
      .populate("workmanship")
      .populate("inspection")
      .populate("materials")
      .populate("safety")
      .populate("comments")
      .populate("media");

    let type = "standard";

    if (!report) {
      report = await FactoryAudit.findById(id).populate("userId", "name email");
      type = "factoryAudit";
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
    }

    res.json({ report, type });
  } catch (error) {
    console.error("Error fetching report details:", error);
    res.status(500).json({ error: "Failed to fetch report details" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["submitted", "under_review", "revision_required", "approved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let report = await Report.findById(id);
    if (!report) report = await FactoryAudit.findById(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.operationStatus = status;
    await report.save();

    // Emit real-time update
    getIO().emit("report_status_changed", {
      reportId: report._id,
      status: report.operationStatus
    });

    res.json({ message: "Status updated successfully", status: report.operationStatus });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update report status" });
  }
};

exports.requestCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { section, comment, priority } = req.body;

    let report = await Report.findById(id);
    if (!report) report = await FactoryAudit.findById(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.operationStatus = "revision_required";
    report.correctionFeedback.push({
      section,
      comment,
      priority,
      addedBy: req.user._id
    });
    // Increment revision round when sent for correction
    report.revisionRound += 1;
    
    await report.save();

    // Emit real-time update
    getIO().emit("report_status_changed", {
      reportId: report._id,
      status: report.operationStatus,
      revisionRound: report.revisionRound
    });

    res.json({ message: "Correction requested successfully", report });
  } catch (error) {
    console.error("Error requesting correction:", error);
    res.status(500).json({ error: "Failed to request correction" });
  }
};

exports.finalizeReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    let report = await Report.findById(id);
    if (!report) report = await FactoryAudit.findById(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.operationStatus = "approved";
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    // Emit real-time update
    getIO().emit("report_status_changed", {
      reportId: report._id,
      status: report.operationStatus
    });

    res.json({ message: "Report finalized successfully", report });
  } catch (error) {
    console.error("Error finalizing report:", error);
    res.status(500).json({ error: "Failed to finalize report" });
  }
};

exports.addRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    let report = await Report.findById(id);
    if (!report) report = await FactoryAudit.findById(id);
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.tmRemarks.push({
      text,
      addedBy: req.user._id
    });

    await report.save();

    res.json({ message: "Internal remark added successfully", report });
  } catch (error) {
    console.error("Error adding remarks:", error);
    res.status(500).json({ error: "Failed to add remarks" });
  }
};
