const { ReportV2 } = require("../../models/v2/report.model");

// Create a new report
const createReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { title, summary } = req.body;

    const newReport = new ReportV2({
      title,
      summary,
      createdBy: userId,
      sections: {},
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    console.error("Create Report V2 Error:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// Get all reports for a user
const getReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const reports = await ReportV2.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({ reports });
  } catch (error) {
    console.error("Get Reports V2 Error:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// Get a specific report and fully populate its sections
const getReportById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const report = await ReportV2.findOne({ _id: id, createdBy: userId })
      .populate("sections.photos")
      .select("-__v");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ report });
  } catch (error) {
    console.error("Get Report By ID V2 Error:", error);
    res.status(500).json({ error: "Failed to fetch report details" });
  }
};

// Update a report (title, summary)
const updateReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { title, summary } = req.body;

    const report = await ReportV2.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { $set: { title, summary } },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    try {
      await report.populate('createdBy', 'name email');
      const { enqueueEmail } = require('../../services/email.queue');
      const { renderTemplate, formatEmailDate } = require('../../services/email.service');
      const recipients = new Set();
      if (report.createdBy && report.createdBy.email) recipients.add(report.createdBy.email);
      const adminList = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || '').split(',').map(s=>s.trim()).filter(Boolean);
      adminList.forEach(e => recipients.add(e));
      const viewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/${report._id}`;
      const html = renderTemplate('report-submitted.html', {
        reportId: report._id,
        inspectorName: report.createdBy?.name || 'Inspector',
        factory: report.title || '',
        inspectionDate: formatEmailDate(new Date()),
        submittedAt: formatEmailDate(new Date()),
        summary: 'A report was updated.',
        viewUrl
      });
      for (const r of Array.from(recipients)) {
        await enqueueEmail({ reportId: report._id, recipient: r, subject: `[UPDATED] Report #${report._id} Updated`, type: 'report_updated', html });
      }
    } catch (err) {
      console.warn('Failed to enqueue V2 report updated emails:', err && err.message ? err.message : err);
    }

    res.json(report);
  } catch (error) {
    console.error("Update Report V2 Error:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    // Would need to cascade delete photos from Wasabi as well for completeness,
    // but for now we delete the document.
    const deleted = await ReportV2.findOneAndDelete({ _id: id, createdBy: userId });

    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete Report V2 Error:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
};
