/**
 * bookingToNotice.service.js
 *
 * When a Booking arrives (either from the online booking website via webhook,
 * or manually created by admin), this service auto-creates a draft
 * InspectionNotice pre-filled with whatever information the client provided.
 *
 * The CS team can then open the notice, fill in the remaining 16 sections,
 * and submit it to assign an inspector.
 */

const InspectionNotice = require('../models/InspectionNotice');
const wasabiService = require('./wasabiService');

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Map Booking/webhook inspection types → InspectionNotice service type enum
const BOOKING_TYPE_TO_SERVICE = {
  PSI:           'Pre-Shipment Inspection',
  CLS:           'Container Loading Supervision',
  DPI:           'During Production Inspection',
  factory_audit: 'Factory Audit',
  social_audit:  'Pre-Shipment Inspection', // closest fallback
};

// Also handle free-text values that may come from the booking website
const normalizeServiceType = (raw = '') => {
  const s = String(raw).toLowerCase().replace(/[-_\s]+/g, ' ').trim();
  if (s.includes('container') || s.includes('cls') || s.includes('loading supervision')) return 'Container Loading Supervision';
  if (s.includes('factory')) return 'Factory Audit';
  if (s.includes('during') || s.includes('dpi') || s.includes('production')) return 'During Production Inspection';
  return 'Pre-Shipment Inspection'; // default
};

/**
 * Generate a unique notice ID like PN-A3F2B1
 */
const generateNoticeId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `PN-${rand}`;
};

/**
 * Ensure notice ID is unique (retry up to 5 times)
 */
const uniqueNoticeId = async () => {
  for (let i = 0; i < 5; i++) {
    const id = generateNoticeId();
    const exists = await InspectionNotice.findOne({ noticeId: id }).lean();
    if (!exists) return id;
  }
  return `PN-${Date.now()}`;
};

/**
 * Pulls client-uploaded booking documents from booking-app-react and copies
 * them into notice.attachments.clientFiles (our own Wasabi bucket, not the
 * booking app's local-disk URLs). Never throws — every failure mode degrades
 * to "notice created with zero or partial attachments".
 */
async function syncBookingAttachments(notice, booking) {
  if (!booking.onlineBookingId || !process.env.BOOKING_API_URL || !process.env.BOOKING_API_SECRET) {
    return; // no online booking, or service auth not configured — skip silently
  }

  let files;
  try {
    const res = await fetch(
      `${process.env.BOOKING_API_URL}/api/upload/booking/${booking.onlineBookingId}/service`,
      { headers: { 'x-api-secret': process.env.BOOKING_API_SECRET } }
    );
    if (!res.ok) {
      console.warn(`[bookingToNotice] attachment list fetch returned ${res.status}`);
      return;
    }
    files = await res.json();
  } catch (err) {
    console.warn('[bookingToNotice] attachment list fetch failed:', err.message);
    return;
  }

  for (const file of files) {
    try {
      const fileRes = await fetch(file.url);
      if (!fileRes.ok) {
        console.warn(`[bookingToNotice] could not download ${file.name}: ${fileRes.status}`);
        continue;
      }
      const buffer = Buffer.from(await fileRes.arrayBuffer());
      const { url } = await wasabiService.uploadFile({
        buffer,
        originalname: file.name,
        mimetype: file.type,
      });
      notice.attachments.clientFiles.push({
        fileName: file.name,
        size: formatFileSize(file.size),
        uploadDate: file.createdAt,
        url,
      });
    } catch (err) {
      console.warn(`[bookingToNotice] failed to sync attachment ${file.name}:`, err.message);
      // continue to next file — one bad file must not block the rest
    }
  }
}

/**
 * Main function. Creates a draft InspectionNotice from a Booking document.
 * Safe to call multiple times — it checks for an existing notice linked to
 * the same booking (via onlineBookingId or booking _id stored in sourceBookingId).
 *
 * @param {Object} booking  – Mongoose document or plain object (from Booking model)
 * @param {String} adminId  – ObjectId of the admin/system user
 * @returns {Object|null}   – The created InspectionNotice, or null if already exists
 */
async function createDraftNoticeFromBooking(booking, adminId) {
  // Avoid duplicates: check if a notice already links to this booking
  const bookingRef = booking._id ? String(booking._id) : null;
  const onlineRef  = booking.onlineBookingId || null;

  const existing = await InspectionNotice.findOne({
    $or: [
      ...(bookingRef ? [{ sourceBookingId: bookingRef }] : []),
      ...(onlineRef  ? [{ 'basicInfo.externalBookingRef': onlineRef }] : []),
    ]
  }).lean();

  if (existing) {
    console.log(`[bookingToNotice] Notice already exists for booking ${bookingRef}: ${existing.noticeId}`);
    return null;
  }

  // Resolve service type
  const rawType = booking.inspectionType || '';
  const serviceType = BOOKING_TYPE_TO_SERVICE[rawType] || normalizeServiceType(rawType);

  // Resolve products list from booking
  const products = [];
  if (booking.productDescription || booking.orderQuantity) {
    products.push({
      orderNo:     booking.poNumber     || '',
      productName: booking.productDescription || '',
      itemNo:      '',
      quantity:    booking.orderQuantity || 0,
      unit:        'pcs',
    });
  }

  const noticeId = await uniqueNoticeId();

  const notice = new InspectionNotice({
    noticeId,
    status: 'draft',
    createdBy: adminId || undefined,

    // Store reference back to the source booking
    sourceBookingId: bookingRef,

    basicInfo: {
      serviceType,
      sameDayReport: false,
      onlineReport:  false,
      inspectionDateFrom: booking.scheduledDate || null,
      inspectionDateTo:   booking.scheduledDate || null,
      inspectionLocation: '',
      customerName:       booking.clientName    || '',
      productCategory:    booking.productDescription || '',
      attentiveOrder:     false,
      csSatisfactionBonus: false,
      externalBookingRef: onlineRef || '',     // reference to booking website ID
    },

    productInfo: {
      products,
      totalQuantity:    booking.orderQuantity || 0,
      quantityFinished: 0,
      quantityPacked:   0,
      orderRemarks:     booking.specialInstructions || '',
      destination:      booking.countryOfOrigin    || '',
      shipmentDate:     null,
    },

    factoryInfo: {
      factoryName:   booking.factoryName    || '',
      englishName:   booking.factoryName    || '',
      address:       booking.factoryAddress || '',
      mainContactPerson: '',
      phone:         '',
      mobile:        '',
      fax:           '',
      workingTime:   'AM: 9:00 - PM: 6:00',
    },

    aql: {
      samplingLevel:    booking.aqlInspectionLevel    || 'Level II',
      sampledQuantity:  booking.aqlSampleSize         || 0,
      inspectionStandard: {
        critical: 'Not Allowed',
        major:    booking.aqlAcceptPoint  || 0,
        minor:    0,
      },
      acceptedQuantity: { critical: 0, major: 0, minor: 0 },
      remarks: booking.aqlInspectionStandard || '',
    },

    inspectionRequirements: {
      customerGeneralRequirement: booking.clientRequirements    || '',
      technicalManagerRemarks:    '',
      customerServiceRemarks:     booking.specialInstructions   || '',
      organizerRemarks:           '',
    },

    onSiteTests: Array.isArray(booking.onSiteTests)
      ? booking.onSiteTests.map(t => ({
          include:     true,
          description: t.description || '',
          method:      t.method      || '',
          criteria:    '',
          sampleSize:  t.sampleSize  || '',
        }))
      : [],

    // Default defect classifications — CS can customise
    defectClassifications: [
      { description: 'Sharp edges or points',                            critical: true,  major: false, minor: false, photoRequired: true },
      { description: 'Broken or cracked',                                critical: true,  major: false, minor: false, photoRequired: true },
      { description: 'Dirt stain, color stain, oil stain',               critical: false, major: true,  minor: true,  photoRequired: true },
      { description: 'Poor printing of logo',                            critical: false, major: true,  minor: false, photoRequired: true },
      { description: 'Finger print',                                     critical: false, major: false, minor: true,  photoRequired: false },
    ],

    teamAssignment: {
      cs:             { name: '', phone: '', mobile: '' },
      cse:            { name: '', phone: '', mobile: '' },
      previewManager: { name: '', phone: '', mobile: '' },
      scheduler:      { name: '', phone: '', mobile: '' },
      inspectors:     [],
    },
  });

  await syncBookingAttachments(notice, booking);

  await notice.save();
  console.log(`[bookingToNotice] Created draft notice ${notice.noticeId} for booking ${bookingRef} (${booking.clientName})`);
  return notice;
}

module.exports = { createDraftNoticeFromBooking };
