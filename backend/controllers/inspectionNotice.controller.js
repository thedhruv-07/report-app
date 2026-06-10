const InspectionNotice = require("../models/InspectionNotice");
const { provisionFromNotice } = require("../services/noticeToBooking.service");

exports.createNotice = async (req, res) => {
  try {
    const { noticeId } = req.body;
    
    // Ensure noticeId is unique
    const existing = await InspectionNotice.findOne({ noticeId });
    if (existing) {
      return res.status(400).json({ error: "Notice ID already exists." });
    }

    const newNotice = new InspectionNotice({
      ...req.body,
      createdBy: req.user.id || req.user._id,
    });
    
    await newNotice.save();

    // If created directly as 'scheduled', provision bookings/tasks immediately
    let provisioned = null;
    if (newNotice.status === 'scheduled') {
      try {
        provisioned = await provisionFromNotice(newNotice, req.user.id || req.user._id);
        console.log(`[notice] Provisioned ${provisioned.bookings.length} booking(s) for notice ${newNotice.noticeId}`);
      } catch (provErr) {
        console.error("[notice] provisionFromNotice failed on create:", provErr.message);
      }
    }

    res.status(201).json({ message: "Inspection Notice created successfully", notice: newNotice, provisioned });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ error: "Failed to create Inspection Notice", details: error.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    let filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { noticeId: searchRegex },
        { "basicInfo.customerName": searchRegex },
        { "basicInfo.serviceType": searchRegex }
      ];
    }

    const total = await InspectionNotice.countDocuments(filter);
    const notices = await InspectionNotice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ notices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ error: "Failed to fetch Inspection Notices" });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await InspectionNotice.findById(id).lean();
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }
    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error fetching notice:", error);
    res.status(500).json({ error: "Failed to fetch Inspection Notice" });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    // Grab the old status before updating
    const before = await InspectionNotice.findById(id).lean();
    const wasScheduledBefore = before?.status === 'scheduled';

    const updatedNotice = await InspectionNotice.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedNotice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    // Provision bookings/tasks when notice transitions INTO 'scheduled' for the first time
    let provisioned = null;
    if (!wasScheduledBefore && updatedNotice.status === 'scheduled') {
      try {
        provisioned = await provisionFromNotice(updatedNotice, req.user.id || req.user._id);
        console.log(`[notice] Provisioned ${provisioned.bookings.length} booking(s) for notice ${updatedNotice.noticeId}`);
      } catch (provErr) {
        console.error("[notice] provisionFromNotice failed on update:", provErr.message);
      }
    }

    res.status(200).json({ message: "Inspection Notice updated", notice: updatedNotice, provisioned });
  } catch (error) {
    console.error("Error updating notice:", error);
    res.status(500).json({ error: "Failed to update Inspection Notice" });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await InspectionNotice.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }
    res.status(200).json({ message: "Inspection Notice deleted" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res.status(500).json({ error: "Failed to delete Inspection Notice" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: "Status is required" });

    const before = await InspectionNotice.findById(id).lean();
    const wasScheduledBefore = before?.status === 'scheduled';

    const updatedNotice = await InspectionNotice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedNotice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    // Provision if transitioning into scheduled
    let provisioned = null;
    if (!wasScheduledBefore && status === 'scheduled') {
      try {
        provisioned = await provisionFromNotice(updatedNotice, req.user.id || req.user._id);
        console.log(`[notice] Provisioned ${provisioned.bookings.length} booking(s) via status update for notice ${updatedNotice.noticeId}`);
      } catch (provErr) {
        console.error("[notice] provisionFromNotice failed on status update:", provErr.message);
      }
    }

    res.status(200).json({ message: "Status updated successfully", notice: updatedNotice, provisioned });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};
