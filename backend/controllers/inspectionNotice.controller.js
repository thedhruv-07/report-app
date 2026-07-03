const InspectionNotice = require("../models/InspectionNotice");
const { provisionFromNotice } = require("../services/noticeToBooking.service");
const { generateClientCode } = require("../utils/clientCode");
const wasabiService = require("../services/wasabiService");

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

exports.createNotice = async (req, res) => {
  try {
    const { noticeId } = req.body;

    // Ensure noticeId is unique
    const existing = await InspectionNotice.findOne({ noticeId });
    if (existing) {
      return res.status(400).json({ error: "Notice ID already exists." });
    }

    const clientCode = generateClientCode(
      req.body.basicInfo?.customerName || '',
      req.body.basicInfo?.inspectionLocation || ''
    );

    const newNotice = new InspectionNotice({
      ...req.body,
      createdBy: req.user.id || req.user._id,
      clientCode,
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
    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }
    notice.readingRecords.push({ inspectorName: req.user.name, timeViewed: new Date() });
    await notice.save();
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

    // Recompute clientCode if basicInfo changed
    const newCode = generateClientCode(
      updatedNotice.basicInfo?.customerName || '',
      updatedNotice.basicInfo?.inspectionLocation || ''
    );
    if (newCode !== updatedNotice.clientCode) {
      await InspectionNotice.findByIdAndUpdate(id, { $set: { clientCode: newCode } });
      updatedNotice.clientCode = newCode;
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

      try {
        const notifyStaff = require('../utils/notifyStaff');
        const { getIO } = require('../socket');
        const SystemNotification = require('../models/systemNotification.model');

        const inspectorName = updatedNotice.teamAssignment?.inspectors?.[0]?.name || 'an inspector';
        const title = 'Inspection Notice Scheduled';
        const message = `${updatedNotice.noticeId} — ${updatedNotice.basicInfo?.customerName || 'Unknown Client'} — assigned to ${inspectorName}`;

        await notifyStaff({
          title,
          message,
          type: 'info',
          priority: 2,
          emailSubject: '[Absolute Veritas] Inspection Notice Scheduled',
          templateName: 'system-alert.html',
          templateVars: { title, message },
        });

        const notification = await SystemNotification.findOne({ title, message }).sort({ createdAt: -1 });

        getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt,
        });
      } catch (notifErr) {
        console.warn('[notice] Failed to notify managers of scheduling:', notifErr.message);
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

exports.uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['client', 'supplier'].includes(type)) {
      return res.status(400).json({ error: "type must be 'client' or 'supplier'" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const { url } = await wasabiService.uploadFile(req.file);
    const entry = {
      fileName: req.file.originalname,
      size: formatFileSize(req.file.size),
      uploadDate: new Date(),
      url,
    };

    const arrayField = type === 'client' ? 'clientFiles' : 'supplierFiles';
    notice.attachments[arrayField].push(entry);
    await notice.save();

    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const { type } = req.query;

    if (!['client', 'supplier'].includes(type)) {
      return res.status(400).json({ error: "type must be 'client' or 'supplier'" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const arrayField = type === 'client' ? 'clientFiles' : 'supplierFiles';
    const entry = notice.attachments[arrayField].id(fileId);
    if (!entry) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    await wasabiService.deleteFile(wasabiService.extractKey(entry.url));
    notice.attachments[arrayField].pull(fileId);
    await notice.save();

    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};

exports.getRecentByFactory = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await InspectionNotice.findById(id).lean();
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const factoryName = (notice.factoryInfo?.factoryName || '').trim();
    if (!factoryName) {
      return res.status(200).json({ records: [] });
    }

    const escaped = factoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('^' + escaped + '$', 'i');

    const others = await InspectionNotice.find({
      _id: { $ne: id },
      'factoryInfo.factoryName': pattern,
    })
      .sort({ 'basicInfo.inspectionDateFrom': -1 })
      .limit(5)
      .lean();

    const records = others.map(n => ({
      inspectionDate: n.basicInfo?.inspectionDateFrom || null,
      inspectorName: n.teamAssignment?.inspectors?.[0]?.name || '—',
      noticeId: n.noticeId,
    }));

    res.status(200).json({ records });
  } catch (error) {
    console.error("Error fetching recent records:", error);
    res.status(500).json({ error: "Failed to fetch recent records" });
  }
};

exports.uploadReportFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['inspector', 'auditor'].includes(type)) {
      return res.status(400).json({ error: "type must be 'inspector' or 'auditor'" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const { url } = await wasabiService.uploadFile(req.file);
    const entry = {
      fileName: req.file.originalname,
      size: formatFileSize(req.file.size),
      uploadTime: new Date(),
      uploadedBy: req.user.name,
      url,
    };

    const arrayField = type === 'inspector' ? 'inspectorUploads' : 'auditorUploads';
    notice.reportUploads[arrayField].push(entry);
    await notice.save();

    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error uploading report file:", error);
    res.status(500).json({ error: "Failed to upload report file" });
  }
};

exports.logReportFileView = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const { type } = req.body;

    if (!['inspector', 'auditor'].includes(type)) {
      return res.status(400).json({ error: "type must be 'inspector' or 'auditor'" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const arrayField = type === 'inspector' ? 'inspectorUploads' : 'auditorUploads';
    const entry = notice.reportUploads[arrayField].id(fileId);
    if (!entry) {
      return res.status(404).json({ error: "Uploaded file not found" });
    }

    entry.timeViewed = new Date();
    entry.viewedBy = req.user.name;
    await notice.save();

    res.status(200).json({ url: entry.url });
  } catch (error) {
    console.error("Error logging file view:", error);
    res.status(500).json({ error: "Failed to log file view" });
  }
};
