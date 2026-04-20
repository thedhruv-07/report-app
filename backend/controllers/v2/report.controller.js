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

    // We can't directly populate a Map of ObjectIds cleanly in all mongoose versions
    // So we fetch the report, and then manually populate if needed, 
    // but Mongoose 5.10+ supports populating maps: `populate('sections.$*')`
    const report = await ReportV2.findOne({ _id: id, createdBy: userId })
      .populate("sections.$*")
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
