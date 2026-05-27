const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const Booking = require('../models/Booking');
const Notification = require('../models/notification.model');
const SystemNotification = require('../models/systemNotification.model');
const Task = require('../models/task.model');
const { User } = require('../models/user.model');
const { sendImmediateEmail, renderTemplate } = require('../services/email.service');

// Maps Booking.inspectionType values to Task.inspectionType enum values
const toTaskInspectionType = (type = '') => {
  const map = { factory_audit: 'Factory Audit', social_audit: 'Social Audit' };
  return map[type] || type.toUpperCase();
};

router.use(authMiddleware);

const formatBookingSummary = (booking) => ({
  id: String(booking._id),
  clientName: booking.clientName,
  clientEmail: booking.clientEmail,
  inspectionType: booking.inspectionType,
  factoryName: booking.factoryName || '',
  factoryAddress: booking.factoryAddress || '',
  scheduledDate: booking.scheduledDate || null,
  scheduledTime: booking.scheduledTime || '',
  orderQuantity: booking.orderQuantity || null,
  specialInstructions: booking.specialInstructions || '',
  assignedInspectorId: booking.assignedInspectorId?._id ? String(booking.assignedInspectorId._id) : (booking.assignedInspectorId ? String(booking.assignedInspectorId) : null),
  inspectorName: booking.assignedInspectorId?.name || booking.assignedInspectorId?.email || '',
  status: booking.status,
  onlineBookingId: booking.onlineBookingId || null,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

// GET /api/bookings — Admin/manager can list bookings received by the report app
router.get('/', roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const bookings = await Booking.find({})
      .populate('assignedInspectorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ bookings: bookings.map(formatBookingSummary) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings — Admin creates a booking (manual or from online system)
router.post('/', roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const booking = new Booking({ ...req.body, adminId: req.user.id });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/bookings/:id/assign — Admin assigns a booking to an inspector
router.post('/:id/assign', roleCheck(['admin', 'manager']), async (req, res) => {
  try {
    const { assignedInspectorId } = req.body;
    if (!assignedInspectorId) {
      return res.status(400).json({ error: 'assignedInspectorId is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const inspector = await User.findById(assignedInspectorId).select('name email').lean();
    if (!inspector) {
      return res.status(404).json({ error: 'Inspector not found' });
    }

    booking.assignedInspectorId = assignedInspectorId;
    booking.status = 'assigned';

    // Fetch prefill data from IRMS without forwarding the internal JWT
    if (booking.onlineBookingId && process.env.BOOKING_API_URL) {
      try {
        const headers = {};
        if (process.env.BOOKING_API_SECRET) {
          headers['x-api-secret'] = process.env.BOOKING_API_SECRET;
        }
        const response = await fetch(
          process.env.BOOKING_API_URL + '/api/bookings/' + booking.onlineBookingId + '/report-data',
          { headers }
        );
        if (response.ok) {
          booking.prefillData = await response.json();
        } else {
          console.warn(`[bookings] prefill fetch returned ${response.status} for booking ${booking.onlineBookingId}`);
        }
      } catch (prefillErr) {
        console.warn('[bookings] prefill fetch failed, continuing without prefill data:', prefillErr.message);
      }
    }

    await Booking.updateOne(
      { _id: booking._id },
      {
        $set: {
          assignedInspectorId: booking.assignedInspectorId,
          status: booking.status,
          prefillData: booking.prefillData
        }
      },
      { runValidators: false }
    );

    // Create Task so the booking appears in the inspector's task list
    const taskInspectionType = toTaskInspectionType(booking.inspectionType);
    const validTaskTypes = ['PSI', 'CLS', 'DPI', 'Factory Audit', 'Social Audit'];
    if (validTaskTypes.includes(taskInspectionType)) {
      try {
        await Task.create({
          assignedInspectorId,
          clientName: booking.clientName,
          factoryName: booking.factoryName || 'TBD',
          factoryAddress: booking.factoryAddress || 'TBD',
          inspectionType: taskInspectionType,
          scheduledDate: booking.scheduledDate || new Date(),
          status: 'Pending Acceptance',
          adminInstructions: booking.specialInstructions || '',
        });
      } catch (taskErr) {
        console.warn('[bookings] Task creation failed:', taskErr.message);
      }
    }

    // Notification in the Notification collection (inspector dashboard list)
    await Notification.create({
      inspectorId: assignedInspectorId,
      title: 'New Inspection Assignment',
      type: 'task_assigned',
      message: 'You have been assigned a new inspection task for ' + booking.clientName,
      relatedBookingId: booking._id,
      isRead: false,
    });

    // SystemNotification so the bell count reflects this assignment
    await SystemNotification.create({
      title: 'New Inspection Assignment',
      message: `You have been assigned a new ${booking.inspectionType || 'inspection'} task for ${booking.clientName}.`,
      type: 'info',
      priority: 2,
      targetRoles: [],
      targetUsers: [assignedInspectorId],
      isActive: true,
    });

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const bookingDate = booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleString() : 'N/A';
      const inspectionType = booking.inspectionType || 'N/A';
      const assignmentUrl = `${frontendUrl}/dashboard/inspector`;
      const emailHtml = renderTemplate('booking-assigned.html', {
        bookingId: booking._id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        inspectionType,
        factoryName: booking.factoryName || 'N/A',
        factoryAddress: booking.factoryAddress || 'N/A',
        scheduledDate: bookingDate,
        assignmentUrl,
        inspectorName: inspector.name || 'Inspector',
        year: new Date().getFullYear(),
      });
      const fallbackHtml = `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1e293b;max-width:680px;margin:0 auto;background:#f8fafc;padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6edf3;box-shadow:0 14px 35px rgba(15,23,42,0.08);">
            <tr><td style="height:8px;background:linear-gradient(90deg,#1d4ed8 0%,#7c3aed 100%);"></td></tr>
            <tr>
              <td style="padding:22px 24px 10px;background:#ffffff;text-align:center;">
                <div style="display:inline-block;padding:10px 16px;border:1px solid #dbe7f3;border-radius:12px;background:#fbfdff;">
                  <img src="cid:company-logo" alt="Absolute Veritas" style="height:44px;display:block;margin:0 auto;" />
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;color:#16325c;text-align:center;">New Inspection Assigned</h1>
                <p style="margin:0 auto 18px;color:#475569;text-align:center;max-width:540px;line-height:1.6;">Hello ${inspector.name || 'Inspector'}, a new inspection task has been assigned to you.</p>
                <div style="background:#f8fbff;border:1px solid #dbe7f3;border-radius:12px;padding:16px 18px;color:#334155;line-height:1.7;">
                  <div><strong>Booking ID:</strong> ${booking._id}</div>
                  <div><strong>Client:</strong> ${booking.clientName} &nbsp;•&nbsp; <strong>Email:</strong> ${booking.clientEmail}</div>
                  <div><strong>Type:</strong> ${inspectionType} &nbsp;•&nbsp; <strong>Factory:</strong> ${booking.factoryName || 'N/A'}</div>
                  <div><strong>Scheduled:</strong> ${bookingDate}</div>
                  <div style="margin-top:8px;">Open your dashboard to review the task and start the report.</div>
                </div>
                <div style="text-align:center;margin:26px 0 18px;">
                  <a href="${assignmentUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;box-shadow:0 10px 22px rgba(29,78,216,0.20);">Open Inspector Dashboard</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 22px;background:#fbfdff;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #eef2f7;">© ${new Date().getFullYear()} Absolute Veritas • <a href="mailto:cs@absoluteveritas.com" style="color:#1d4ed8;text-decoration:none;">cs@absoluteveritas.com</a></td>
            </tr>
          </table>
        </div>
      `;

      await sendImmediateEmail({
        to: inspector.email,
        subject: `New inspection assigned — ${booking.clientName}`,
        html: emailHtml || fallbackHtml,
        text: [
          'New inspection assigned',
          `Booking ID: ${booking._id}`,
          `Client: ${booking.clientName}`,
          `Client Email: ${booking.clientEmail}`,
          `Inspection Type: ${inspectionType}`,
          `Factory: ${booking.factoryName || 'N/A'}`,
          `Scheduled Date: ${bookingDate}`,
          `Dashboard: ${assignmentUrl}`
        ].join('\n')
      });
    } catch (emailError) {
      console.warn('Failed to send inspector assignment email:', emailError.message);
    }

    res.json(booking);
  } catch (err) {
    console.error('Assign booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
