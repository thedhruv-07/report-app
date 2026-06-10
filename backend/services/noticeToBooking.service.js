/**
 * noticeToBooking.service.js
 *
 * When an Inspection Notice is "submitted" (status = scheduled) with at least one
 * inspector assigned, this service:
 *   1. Creates one Booking record per assigned inspector.
 *   2. Creates a Task for each inspector so it appears in their dashboard.
 *   3. Sends in-app + system notifications to each inspector.
 *
 * The Booking/Task prefillData shape mirrors what the inspector's PSI report
 * form expects (see bookings.js /assign endpoint for the established shape).
 */

const Booking = require('../models/Booking');
const Task = require('../models/task.model');
const Notification = require('../models/notification.model');
const SystemNotification = require('../models/systemNotification.model');

// Map Inspection Notice service types → Booking.inspectionType enum
const SERVICE_TYPE_TO_BOOKING = {
  'Pre-Shipment Inspection':       'PSI',
  'Container Loading Supervision':  'CLS',
  'Factory Audit':                  'factory_audit',
  'During Production Inspection':   'DPI',
};

// Map Inspection Notice service types → Task.inspectionType enum
const SERVICE_TYPE_TO_TASK = {
  'Pre-Shipment Inspection':       'PSI',
  'Container Loading Supervision':  'CLS',
  'Factory Audit':                  'Factory Audit',
  'During Production Inspection':   'DPI',
};

/**
 * Build the prefillData object the inspector's report form expects.
 */
function buildPrefillData(notice) {
  const bi = notice.basicInfo || {};
  const pi = notice.productInfo || {};
  const aql = notice.aql || {};
  const fi = notice.factoryInfo || {};
  const si = notice.supplierInfo || {};
  const ir = notice.inspectionRequirements || {};
  const scr = notice.specialClientRequirements || {};

  const onSiteTests = (notice.onSiteTests || []).map(t => ({
    description: t.description || '',
    method: t.method || '',
    sampleSize: t.sampleSize || '',
  }));

  // First product row drives the primary fields
  const firstProduct = (pi.products || [])[0] || {};

  return {
    // General info (maps to inspector report generalInfo section)
    serviceType: bi.serviceType || '',
    client: { name: bi.customerName || '' },
    supplier: { name: si.supplierName || si.englishName || '' },
    factory: {
      name:    fi.factoryName || fi.englishName || '',
      address: fi.address || '',
      contact: fi.mainContactPerson || '',
      phone:   fi.phone || '',
      mobile:  fi.mobile || '',
      workingTime: fi.workingTime || '',
      environment: fi.inspectionEnvironment || '',
    },
    inspectionDate: bi.inspectionDateFrom || null,
    inspectionDateTo: bi.inspectionDateTo || null,
    inspectionLocation: bi.inspectionLocation || '',
    country: pi.destination || '',

    // Product
    product: {
      name: firstProduct.productName || bi.productCategory || '',
      description: firstProduct.productName || '',
      quantity: pi.totalQuantity || firstProduct.quantity || 0,
      poNumber: firstProduct.orderNo || '',
      itemNo: firstProduct.itemNo || '',
      unit: firstProduct.unit || 'pcs',
    },
    products: pi.products || [],
    quantityFinished: pi.quantityFinished || 0,
    quantityPacked:   pi.quantityPacked   || 0,
    shipmentDate:     pi.shipmentDate     || null,
    orderRemarks:     pi.orderRemarks     || '',

    // AQL — flattened to strings so inspector report form can render them safely
    aql: {
      samplingLevel:      aql.samplingLevel || 'Level II',
      inspectionLevel:    aql.samplingLevel || 'Level II',
      sampledQuantity:    aql.sampledQuantity || 0,
      sampleSize:         aql.sampledQuantity ? String(aql.sampledQuantity) : '',
      // AQL thresholds as plain strings
      aqlCritical:        String(aql.inspectionStandard?.critical || 'Not Allowed'),
      aqlMajor:           String(aql.inspectionStandard?.major    || '2.5'),
      aqlMinor:           String(aql.inspectionStandard?.minor    || '4.0'),
      // Accepted quantities as plain strings
      acceptedCritical:   String(aql.acceptedQuantity?.critical || '0'),
      acceptedMajor:      String(aql.acceptedQuantity?.major    || '0'),
      acceptedMinor:      String(aql.acceptedQuantity?.minor    || '0'),
      acceptPoint:        String(aql.acceptedQuantity?.major    || '0'),
      rejectPoint:        String(aql.acceptedQuantity?.critical || '0'),
      // Keep a readable label for the form's inspection standard field
      inspectionStandard: 'ANSI/ASQ Z1.4 (ISO 2859-1)',
      samplingPlan:       'Normal, Single',
      remarks:            aql.remarks || '',
    },

    // Requirements
    clientRequirements: ir.customerGeneralRequirement || '',
    specialInstructions: [
      ir.technicalManagerRemarks,
      ir.customerServiceRemarks,
      ir.organizerRemarks,
    ].filter(Boolean).join('\n\n'),

    // Special / Client-specific requirements
    colorMaterialFinish: scr.colorMaterialFinish || '',
    dimensionWeight: scr.dimensionWeight || '',
    logoLabel: scr.logoLabel || '',
    packingMaterial: scr.packingMaterial || '',
    shippingMark: scr.shippingMark || '',
    customerSpecialRequirements: scr.customerSpecialRequirements || '',

    // On-site tests & defect classifications
    onSiteTests,
    defectClassifications: notice.defectClassifications || [],

    // Source reference so the inspector's report can show the notice link
    inspectionNoticeId: String(notice._id),
    noticeId: notice.noticeId || '',
  };
}

/**
 * Main provisioning function.
 * Call this after an InspectionNotice is saved with status = 'scheduled'.
 *
 * @param {Object} notice  – Mongoose document or lean object
 * @param {String} adminId – ObjectId of the admin who submitted the notice
 * @returns {{ bookings: Booking[], tasks: Task[] }}
 */
async function provisionFromNotice(notice, adminId) {
  const inspectors = notice.teamAssignment?.inspectors || [];
  if (inspectors.length === 0) {
    return { bookings: [], tasks: [] };
  }

  const bi = notice.basicInfo || {};
  const fi = notice.factoryInfo || {};
  const pi = notice.productInfo || {};
  const firstProduct = (pi.products || [])[0] || {};

  const bookingType = SERVICE_TYPE_TO_BOOKING[bi.serviceType] || 'PSI';
  const taskType   = SERVICE_TYPE_TO_TASK[bi.serviceType]   || 'PSI';
  const prefillData = buildPrefillData(notice);

  const createdBookings = [];
  const createdTasks    = [];

  for (const inspector of inspectors) {
    // inspector rows from teamAssignment.inspectors have { name, mobile, role, inspectorId? }
    const inspectorId = inspector.inspectorId || null;

    // ── 1. Create Booking ────────────────────────────────────────────────────
    const booking = new Booking({
      adminId,
      clientName:        bi.customerName || 'Unknown Client',
      clientEmail:       'not-provided@example.com', // not collected on the notice form
      inspectionType:    bookingType,
      factoryName:       fi.factoryName || fi.englishName || '',
      factoryAddress:    fi.address || '',
      scheduledDate:     bi.inspectionDateFrom || new Date(),
      productDescription: firstProduct.productName || bi.productCategory || '',
      orderQuantity:     pi.totalQuantity || 0,
      poNumber:          firstProduct.orderNo || '',
      countryOfOrigin:   pi.destination || '',
      aqlInspectionLevel:    notice.aql?.samplingLevel || '',
      aqlSampleSize:         notice.aql?.sampledQuantity || 0,
      aqlAcceptPoint:        notice.aql?.acceptedQuantity?.major || 0,
      aqlRejectPoint:        notice.aql?.acceptedQuantity?.critical || 0,
      aqlInspectionStandard: String(notice.aql?.inspectionStandard?.major || ''),
      specialInstructions:   notice.inspectionRequirements?.technicalManagerRemarks || '',
      clientRequirements:    notice.inspectionRequirements?.customerGeneralRequirement || '',
      onSiteTests: (notice.onSiteTests || []).map(t => ({
        description: t.description || '',
        method:      t.method || '',
        sampleSize:  t.sampleSize || '',
      })),
      assignedInspectorId: inspectorId,
      status:              inspectorId ? 'assigned' : 'new',
      prefillData,
      onlineBookingId:     String(notice._id), // link back to source notice
    });

    await booking.save();
    createdBookings.push(booking);

    // ── 2. Create Task (only if we have a real user ObjectId) ────────────────
    if (inspectorId) {
      const task = await Task.create({
        assignedInspectorId: inspectorId,
        clientName:    bi.customerName || 'Unknown Client',
        factoryName:   fi.factoryName || fi.englishName || 'TBD',
        factoryAddress: fi.address || 'TBD',
        inspectionType: taskType,
        scheduledDate:  bi.inspectionDateFrom || new Date(),
        status:         'Pending Acceptance',
        adminInstructions: notice.inspectionRequirements?.technicalManagerRemarks || '',
        prefillData,
      });
      createdTasks.push(task);

      // ── 3. Notifications ──────────────────────────────────────────────────
      await Notification.create({
        inspectorId,
        title:   'New Inspection Assignment',
        type:    'task_assigned',
        message: `You have been assigned a ${bi.serviceType || 'inspection'} for ${bi.customerName || 'a client'}.`,
        relatedBookingId: booking._id,
        isRead: false,
      });

      await SystemNotification.create({
        title:   'New Inspection Assignment',
        message: `Notice ${notice.noticeId || ''}: ${bi.serviceType || 'Inspection'} for ${bi.customerName || 'client'}.`,
        type:    'info',
        priority: 2,
        targetRoles: [],
        targetUsers: [inspectorId],
        isActive: true,
      });

      // Keep ≤10 notifications per inspector
      const all = await Notification.find({ inspectorId })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean();
      if (all.length > 10) {
        await Notification.deleteMany({ _id: { $in: all.slice(10).map(n => n._id) } });
      }
    }
  }

  return { bookings: createdBookings, tasks: createdTasks };
}

module.exports = { provisionFromNotice, buildPrefillData };
