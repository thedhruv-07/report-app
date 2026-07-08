const { Report } = require("../models/report.model");
const FactoryAudit = require("../models/factoryAudit.model");
const { getIO } = require("../socket");
const { generateClientCode } = require("../utils/clientCode");
const { getReportDisplayId } = require("../utils/reportDisplayId");
const { uniqueTaskNumber } = require("../utils/noticeId");

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
    reportId: fa.generalInfo?.inspectionNo || `FA-${fa._id.toString().slice(-6).toUpperCase()}`,
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

    // Mirror under_review → Task so inspector sees "Under Review" badge
    if (status === 'under_review') {
      try {
        const Task = require('../models/task.model');
        await Task.findOneAndUpdate({ reportId: report._id }, { status: 'Under Review' });
      } catch (e) { console.warn('[updateStatus] Task update failed:', e.message); }
    }

    // Emit real-time update to manager + admin rooms
    getIO().to(["manager_room", "admin_room"]).emit("report_status_changed", {
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

    let report = await Report.findById(id).populate('userId', 'name email').populate('generalInfo');
    if (!report) report = await FactoryAudit.findById(id).populate('userId', 'name email');
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.operationStatus = "revision_required";
    report.correctionFeedback.push({
      section,
      comment,
      priority,
      addedBy: req.user.id
    });
    // Increment revision round when sent for correction
    report.revisionRound += 1;

    await report.save();

    // Push correction status + feedback summary to inspector's Task, creating one if absent
    let correctionTaskId = null;
    try {
      const Task = require('../models/task.model');
      const feedbackSummary = report.correctionFeedback
        .map(fb => `[${fb.section || 'General'}] ${fb.comment}`)
        .join('\n');
      const updated = await Task.findOneAndUpdate(
        { reportId: report._id },
        { status: 'Correction Requested', correctionFeedback: feedbackSummary },
        { new: true }
      );
      if (updated) {
        correctionTaskId = updated._id;
      } else if (report.userId?._id) {
        const gi = report.generalInfo || {};
        const t = (report.title || '').toLowerCase();
        const inspType = t.includes('cls') || t.includes('container') ? 'CLS'
          : t.includes('dpi') || t.includes('during') ? 'DPI'
          : t.includes('factory') ? 'Factory Audit'
          : 'PSI';
        const clientNameForTask = gi.client || report.title || 'Inspection Report';
        const locationForTask = gi.inspectionLocation || gi.location || gi.factoryAddress || '';
        const created = await Task.create({
          taskNumber: await uniqueTaskNumber(),
          assignedInspectorId: report.userId._id,
          clientName:     clientNameForTask,
          clientCode:     generateClientCode(clientNameForTask, locationForTask),
          factoryName:    gi.supplier    || gi.factory   || 'Unknown Factory',
          factoryAddress: locationForTask || 'Unknown Location',
          inspectionType: inspType,
          scheduledDate:  report.submittedAt || new Date(),
          status:         'Correction Requested',
          reportId:       report._id,
          correctionFeedback: feedbackSummary,
        });
        correctionTaskId = created._id;
      }
    } catch (e) { console.warn('[requestCorrection] Task update failed:', e.message); }

    // Create in-app notification for the inspector
    try {
      const SystemNotification = require('../models/systemNotification.model');
      const inspectorId = report.userId?._id || report.userId;
      if (inspectorId) {
        await SystemNotification.create({
          title: 'Correction Required on Your Report',
          message: `[${section || 'General'}] ${comment || 'Please review the feedback and resubmit.'}`,
          type: 'warning',
          priority: 2,
          targetUsers: [inspectorId],
          relatedTaskId: correctionTaskId,
          createdBy: req.user.id,
        });
        getIO().to(`user_${inspectorId}`).emit('new_notification');
      }
    } catch (e) { console.warn('[requestCorrection] Notification creation failed:', e.message); }

    // Emit real-time update to manager + admin rooms
    getIO().to(["manager_room", "admin_room"]).emit("report_status_changed", {
      reportId: report._id,
      status: report.operationStatus,
      revisionRound: report.revisionRound
    });

    // Enqueue rejected email to inspector + admin
    try {
      const { enqueueEmail } = require('../services/email.queue');
      const { renderTemplate } = require('../services/email.service');
      const recipients = new Set();
      if (report.userId && report.userId.email) recipients.add(report.userId.email);
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      adminList.forEach(e=>recipients.add(e));
      const resubmitUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/inspector`;
      const rejectedDisplayId = getReportDisplayId(report);
      const html = renderTemplate('report-rejected.html', {
        reportId: rejectedDisplayId,
        rejectedBy: req.user?.name || 'Reviewer',
        rejectedAt: new Date().toISOString(),
        reason: (comment || ''),
        resubmitUrl,
      });
      for (const r of Array.from(recipients)) enqueueEmail({ reportId: report._id, recipient: r, subject: `[ACTION REQUIRED] Report #${rejectedDisplayId} Rejected`, type: 'report_rejected', html });
    } catch (err) {
      console.warn('Failed to enqueue rejection emails:', err && err.message ? err.message : err);
    }

    res.json({ message: "Correction requested successfully", report });
  } catch (error) {
    console.error("Error requesting correction:", error);
    res.status(500).json({ error: "Failed to request correction" });
  }
};

exports.finalizeReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    let report = await Report.findById(id).populate('userId', 'name email');
    if (!report) report = await FactoryAudit.findById(id).populate('userId', 'name email');
    if (!report) return res.status(404).json({ error: "Report not found" });

    report.operationStatus = "approved";
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    // Push Finalized status to inspector's Task
    let finalizedTaskId = null;
    try {
      const Task = require('../models/task.model');
      const updated = await Task.findOneAndUpdate({ reportId: report._id }, { status: 'Finalized' }, { new: true });
      finalizedTaskId = updated?._id || null;
    } catch (e) { console.warn('[finalizeReport] Task update failed:', e.message); }

    // Create in-app notification for the inspector
    try {
      const SystemNotification = require('../models/systemNotification.model');
      const inspectorId = report.userId?._id || report.userId;
      if (inspectorId) {
        await SystemNotification.create({
          title: 'Your Report Has Been Approved',
          message: `Report #${getReportDisplayId(report)} has been reviewed and approved by ${req.user?.name || 'the reviewer'}.`,
          type: 'success',
          priority: 3,
          targetUsers: [inspectorId],
          relatedTaskId: finalizedTaskId,
          createdBy: req.user.id,
        });
        getIO().to(`user_${inspectorId}`).emit('new_notification');
      }
    } catch (e) { console.warn('[finalizeReport] Notification creation failed:', e.message); }

    // Emit real-time update to manager + admin rooms
    getIO().to(["manager_room", "admin_room"]).emit("report_status_changed", {
      reportId: report._id,
      status: report.operationStatus
    });

    // Enqueue approved email
    try {
      const { enqueueEmail } = require('../services/email.queue');
      const { renderTemplate } = require('../services/email.service');
      const recipients = new Set();
      if (report.userId && report.userId.email) recipients.add(report.userId.email);
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      adminList.forEach(e=>recipients.add(e));
      const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/${report._id}`;
      const approvedDisplayId = getReportDisplayId(report);
      const html = renderTemplate('report-approved.html', {
        reportId: approvedDisplayId,
        approvedBy: req.user?.name || 'Reviewer',
        approvedAt: new Date().toISOString(),
        finalRemarks: report.finalRemarks || '',
        downloadUrl
      });
      for (const r of Array.from(recipients)) enqueueEmail({ reportId: report._id, recipient: r, subject: `[APPROVED] Report #${approvedDisplayId} Approved Successfully`, type: 'report_approved', html });
    } catch (err) {
      console.warn('Failed to enqueue approval emails:', err && err.message ? err.message : err);
    }

    res.json({ message: "Report finalized successfully", report });
  } catch (error) {
    console.error("Error finalizing report:", error);
    res.status(500).json({ error: "Failed to finalize report" });
  }
};

// POST /reports/:id/deliver
exports.deliverReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredTo } = req.body;

    let report = await Report.findById(id);
    if (!report) report = await FactoryAudit.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.populate) await report.populate('userId', 'name email');
    if (report.populate) await report.populate('userId', 'name email');
    if (report.populate) await report.populate('userId', 'name email');

    report.delivery = report.delivery || {};
    report.delivery.status = 'delivered';
    report.delivery.deliveredAt = new Date();
    report.delivery.deliveredTo = deliveredTo || '';
    await report.save();

    // Emit update
    getIO().emit('report_status_changed', { reportId: report._id, status: report.delivery.status });

    // Enqueue delivery email
    try {
      const { enqueueEmail } = require('../services/email.queue');
      const { renderTemplate } = require('../services/email.service');
      const recipients = new Set();
      if (deliveredTo) recipients.add(deliveredTo);
      if (report.userId && report.userId.email) recipients.add(report.userId.email);
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      adminList.forEach(e=>recipients.add(e));
      const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/${report._id}`;
      const deliveredDisplayId = getReportDisplayId(report);
      const html = renderTemplate('delivery-completed.html', { reportId: deliveredDisplayId, deliveredAt: report.delivery.deliveredAt, deliveredTo: deliveredTo || '', viewUrl });
      for (const r of Array.from(recipients)) enqueueEmail({ reportId: report._id, recipient: r, subject: `[DELIVERED] Report #${deliveredDisplayId} Delivered Successfully`, type: 'delivery_completed', html });
    } catch (err) {
      console.warn('Failed to enqueue delivery emails:', err && err.message ? err.message : err);
    }

    res.json({ message: 'Report delivered', report });
  } catch (err) {
    console.error('Error delivering report:', err);
    res.status(500).json({ error: 'Failed to mark report delivered' });
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
