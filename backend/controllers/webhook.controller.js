const crypto = require("crypto");
const SystemNotification = require("../models/systemNotification.model");
const { User } = require("../models/user.model");
const { getIO } = require("../socket");

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

const handleBookingWebhook = async (req, res) => {
  const path = req.originalUrl || req.url || "/api/webhooks/bookings";
  console.info(`[webhook] ${req.method} ${path}`);

  try {
    const expectedSecret = normalizeSecret(process.env.REPORT_APP_WEBHOOK_SECRET);
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

    const notification = await SystemNotification.create({
      title,
      message,
      type: meta.type,
      priority: meta.priority,
      targetRoles: ["admin", "manager"],
      createdBy,
      isActive: true
    });

    try {
      const io = getIO();
      io.to("manager_room").emit("new_system_notification", {
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

    return res.status(201).json({ success: true, notification: notification._id.toString() });
  } catch (error) {
    console.error("[webhook] booking webhook failed:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  handleBookingWebhook
};