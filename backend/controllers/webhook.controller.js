const crypto = require("crypto");
const SystemNotification = require("../models/systemNotification.model");
const Booking = require("../models/Booking");
const { User } = require("../models/user.model");
const { getIO } = require("../socket");
const { sendImmediateEmail } = require("../services/email.service");
const { createDraftNoticeFromBooking } = require("../services/bookingToNotice.service");

const allowedEventTypes = new Set([
  "booking.payment.received",
  "booking.confirmed",
  "booking.updated"
]);

const eventMeta = {
  "booking.payment.received": {
    title: "Payment received",
    type: "success",
    priority: 2
  },
  "booking.confirmed": {
    title: "Booking confirmed",
    type: "info",
    priority: 3
  },
  "booking.updated": {
    title: "Booking updated",
    type: "warning",
    priority: 3
  }
};

const normalizeSecret = (value) => (typeof value === "string" ? value.trim() : "");

const secretsMatch = (expected, provided) => {
  if (!expected) return true;
  const safeExpected = Buffer.from(expected);
  const safeProvided = Buffer.from(normalizeSecret(provided));

  if (safeExpected.length !== safeProvided.length) {
    return false;
  }

  return crypto.timingSafeEqual(safeExpected, safeProvided);
};

const isValidPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  if (!allowedEventTypes.has(payload.eventType)) {
    return false;
  }

  if (!payload.booking || typeof payload.booking !== "object" || Array.isArray(payload.booking)) {
    return false;
  }

  if (typeof payload.booking.id !== "string" || payload.booking.id.trim().length === 0) {
    return false;
  }

  if (payload.booking.service && typeof payload.booking.service !== "object") {
    return false;
  }

  if (payload.payment && typeof payload.payment !== "object") {
    return false;
  }

  if (payload.user && typeof payload.user !== "object") {
    return false;
  }

  return true;
};

const formatBookingShortId = (bookingId) => {
  const cleaned = String(bookingId).replace(/[^a-zA-Z0-9]/g, "");
  const shortId = cleaned.slice(-8).toUpperCase();
  return shortId || cleaned.toUpperCase();
};

const formatAmount = (amount) => {
  if (amount === undefined || amount === null || amount === "") {
    return "N/A";
  }

  return typeof amount === "number" ? amount.toLocaleString("en-US") : String(amount);
};

const buildServiceNames = (booking) => {
  const selected = Array.isArray(booking?.service?.selected) ? booking.service.selected : [];
  if (selected.length === 0) {
    return "N/A";
  }

  return selected
    .map((value) => String(value).replace(/-/g, " "))
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(", ");
};

const buildMessage = ({ user, booking, payment }) => {
  const parts = [
    `By: ${user?.name || "Unknown user"}`,
    `Service: ${buildServiceNames(booking)}`,
    `Method: ${payment?.method || "N/A"}`,
    `Amount: ${formatAmount(payment?.amount)}`
  ];

  return parts.join(" · ");
};

const resolveCreatedBy = async () => {
  const admin = await User.findOne({ role: "admin" }).select("_id").lean();
  return admin?._id || null;
};

const resolveAdminRecipients = async () => {
  const configured = (process.env.NOTIFICATION_ADMIN_EMAILS || process.env.SMTP_USER || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const admins = await User.find({ role: "admin" }).select("email").lean();
  const emails = new Set(configured);
  admins.forEach((admin) => {
    if (admin?.email) emails.add(admin.email);
  });

  return Array.from(emails);
};

const mapInspectionType = (serviceSelected = []) => {
  const first = Array.isArray(serviceSelected) ? String(serviceSelected[0] || "") : "";
  if (!first) return "PSI";
  const normalized = first.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (normalized.includes("factory")) return "factory_audit";
  if (normalized.includes("cls") || normalized.includes("container")) return "CLS";
  if (normalized.includes("dpi") || normalized.includes("production")) return "DPI";
  if (normalized.includes("social")) return "social_audit";
  return "PSI";
};

const buildBookingSnapshot = (payload) => {
  const booking = payload?.booking || {};
  const user = payload?.user || {};
  const payment = payload?.payment || {};
  const selectedServices = Array.isArray(booking?.service?.selected) ? booking.service.selected : [];
  const inspectionType = mapInspectionType(selectedServices);

  const clientName = String(user?.name || booking?.client?.name || booking?.clientName || payment?.payerName || "").trim();
  const clientEmail = String(user?.email || booking?.client?.email || booking?.clientEmail || payment?.payerEmail || "").trim().toLowerCase();

  if (!clientName || !clientEmail) {
    throw new Error("booking payload must include user.name and user.email (or equivalent client fields)");
  }

  return {
    onlineBookingId: String(booking.id || "").trim(),
    clientName,
    clientEmail,
    clientPhone: String(user?.phone || booking?.client?.phone || booking?.clientPhone || "").trim() || undefined,
    inspectionType,
    factoryName: String(booking?.factory?.name || booking?.factoryName || booking?.client?.factoryName || "").trim() || undefined,
    factoryAddress: String([
      booking?.factory?.address,
      booking?.factory?.city,
      booking?.factory?.country
    ].filter(Boolean).join(", ") || booking?.factoryAddress || "").trim() || undefined,
    scheduledDate: booking?.scheduledDate || payload?.createdAt || new Date().toISOString(),
    scheduledTime: booking?.scheduledTime || undefined,
    productDescription: String(booking?.product?.description || booking?.productDescription || "").trim() || undefined,
    orderQuantity: Number(booking?.product?.quantity || booking?.orderQuantity || payment?.amount || 0) || undefined,
    specialInstructions: String(booking?.specialInstructions || booking?.notes || "").trim() || undefined,
    paymentInfo: payment && Object.keys(payment).length ? payment : undefined,
    prefillData: payload,
    status: "new"
  };
};

const sendBookingSummaryEmail = async ({ bookingDoc, payload }) => {
  const recipients = await resolveAdminRecipients();
  if (recipients.length === 0) return { skipped: true };

  const selectedServices = Array.isArray(payload?.booking?.service?.selected) ? payload.booking.service.selected : [];
  const payment = payload?.payment || {};
  const user = payload?.user || {};
  const subject = `New booking received — ${bookingDoc.clientName}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1e293b">
      <h2 style="margin:0 0 12px">New booking received</h2>
      <p style="margin:0 0 16px">A new booking has arrived from the booking app and is ready for assignment.</p>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <tr><td style="background:#f8fafc;font-weight:700">Booking ID</td><td>${bookingDoc._id}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Client</td><td>${bookingDoc.clientName}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Email</td><td>${bookingDoc.clientEmail}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Service</td><td>${selectedServices.join(', ') || bookingDoc.inspectionType}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Factory</td><td>${bookingDoc.factoryName || 'N/A'}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Factory Address</td><td>${bookingDoc.factoryAddress || 'N/A'}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Scheduled</td><td>${bookingDoc.scheduledDate ? new Date(bookingDoc.scheduledDate).toLocaleString() : 'N/A'}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Payment</td><td>${payment.method || 'N/A'} · ${payment.status || 'N/A'} · ${payment.amount ?? 'N/A'}</td></tr>
        <tr><td style="background:#f8fafc;font-weight:700">Submitted By</td><td>${user.name || 'N/A'} (${user.email || 'N/A'})</td></tr>
      </table>
      <p style="margin-top:16px;color:#475569">Open the Admin Console → All Bookings to assign an inspector.</p>
    </div>
  `;

  const results = [];
  for (const recipient of recipients) {
    try {
      const info = await sendImmediateEmail({
        to: recipient,
        subject,
        html,
        text: [
          'New booking received',
          `Booking ID: ${bookingDoc._id}`,
          `Client: ${bookingDoc.clientName}`,
          `Email: ${bookingDoc.clientEmail}`,
          `Service: ${selectedServices.join(', ') || bookingDoc.inspectionType}`,
          `Factory: ${bookingDoc.factoryName || 'N/A'}`,
          `Factory Address: ${bookingDoc.factoryAddress || 'N/A'}`,
          `Scheduled: ${bookingDoc.scheduledDate ? new Date(bookingDoc.scheduledDate).toISOString() : 'N/A'}`,
          `Payment: ${payment.method || 'N/A'} / ${payment.status || 'N/A'} / ${payment.amount ?? 'N/A'}`,
          `Submitted By: ${user.name || 'N/A'} (${user.email || 'N/A'})`
        ].join('\n')
      });
      results.push({ recipient, messageId: info.messageId });
    } catch (error) {
      results.push({ recipient, error: error.message });
    }
  }

  return { sent: results };
};

const handleBookingWebhook = async (req, res) => {
  const path = req.originalUrl || req.url || "/api/webhooks/bookings";
  console.info(`[webhook] ${req.method} ${path}`);

  try {
    const expectedSecret = normalizeSecret(process.env.REPORT_APP_WEBHOOK_SECRET);
    if (!expectedSecret) {
      console.error("[webhook] REPORT_APP_WEBHOOK_SECRET is not configured — rejecting all requests");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const providedSecret = req.get("x-webhook-secret");
    if (!secretsMatch(expectedSecret, providedSecret)) {
      console.warn("[webhook] invalid secret for booking webhook");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = req.body;
    if (!isValidPayload(payload)) {
      console.warn("[webhook] invalid payload", { eventType: payload?.eventType, bookingId: payload?.booking?.id });
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const meta = eventMeta[payload.eventType];
    const bookingShortId = formatBookingShortId(payload.booking.id);
    const title = `${meta.title} — Booking ${bookingShortId}`;
    const message = buildMessage(payload);
    const createdBy = await resolveCreatedBy();

    const bookingSnapshot = buildBookingSnapshot(payload);
    const existingBooking = await Booking.findOne({ onlineBookingId: bookingSnapshot.onlineBookingId });
    const bookingDoc = existingBooking
      ? await Booking.findByIdAndUpdate(
          existingBooking._id,
          {
            ...bookingSnapshot,
            adminId: createdBy
          },
          { new: true, runValidators: true }
        )
      : await Booking.create({
          ...bookingSnapshot,
          adminId: createdBy
        });

    const notification = await SystemNotification.create({
      title,
      message,
      type: meta.type,
      priority: meta.priority,
      targetRoles: ["admin", "manager"],
      createdBy,
      targetUsers: [],
      isActive: true
    });

    await sendBookingSummaryEmail({ bookingDoc, payload });

    // Auto-create a draft Inspection Notice for CS to review and complete
    if (!existingBooking) {
      try {
        const notice = await createDraftNoticeFromBooking(bookingDoc, createdBy);
        if (notice) {
          console.log(`[webhook] Draft notice ${notice.noticeId} created for incoming booking`);
        }
      } catch (noticeErr) {
        console.warn('[webhook] Failed to create draft notice from booking:', noticeErr.message);
      }
    }

    try {
      const io = getIO();
      io.to(["manager_room", "admin_room"]).emit("new_system_notification", {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt
      });
    } catch (socketError) {
      console.warn("[webhook] socket emit skipped:", socketError.message);
    }

    return res.status(201).json({ success: true, booking: bookingDoc._id.toString(), notification: notification._id.toString() });
  } catch (error) {
    console.error("[webhook] booking webhook failed:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  handleBookingWebhook
};