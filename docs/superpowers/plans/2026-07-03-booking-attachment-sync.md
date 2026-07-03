# Automatic Client-Document Sync: Booking App → Inspection Notice Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically pull client-uploaded booking documents from `booking-app-react` into the corresponding `InspectionNotice.attachments.clientFiles` at draft-creation time, and fix the pre-existing broken service-to-service auth between the two apps, per `docs/superpowers/specs/2026-07-03-booking-attachment-sync-design.md`.

**Architecture:** This plan spans **two repositories**: `booking-app-react` (path `C:\Projects\booking-app-react`) gets a new shared-secret middleware and two new service-only routes (no ownership/JWT check, gated by `x-api-secret` instead). `report-app-main` (this repo) gets its existing broken prefill URL fixed, plus a new `syncBookingAttachments` step wired into `createDraftNoticeFromBooking`. No new schema — `InspectionNotice.attachments.clientFiles` already exists.

**Tech Stack:** Express 5 (both apps), Mongoose, native `fetch` (Node 18+, already used elsewhere in both codebases), existing `wasabiService.uploadFile`.

**No automated test suite exists in either project.** Each task's verification step is a `node -e "require(...)"` load check plus an exact manual action once both servers are running.

**IMPORTANT — env var correction to the spec:** The spec's "Operational steps" section says `BOOKING_API_URL` "already lives" in `report-app-main/.env` (root). That's incorrect as of this plan being written: `BOOKING_API_URL` is currently only set in `report-app-main/backend/.env`, but `backend/server.js:2` loads env vars exclusively from the **root** `.env` (`path.join(__dirname, "..", ".env")`) — `backend/.env` is never read by the running server. This means `process.env.BOOKING_API_URL` is `undefined` today, and the prefill-fetch guard (`if (booking.onlineBookingId && process.env.BOOKING_API_URL)`) has been silently skipping the fetch entirely — a more basic reason it's never worked than the auth mismatch the spec identified. Task 6 below covers moving/adding both `BOOKING_API_URL` and `BOOKING_API_SECRET` to the root `.env`. This is a manual step (touches `.env` files, potentially with existing secrets) — not something to script.

---

## Task 1: `booking-app-react` — shared-secret middleware

**Files:**
- Create: `C:\Projects\booking-app-react\backend\middleware\apiSecret.js`

- [ ] **Step 1: Create the middleware**

```js
const requireApiSecret = (req, res, next) => {
  const secret = req.headers['x-api-secret'];
  if (!secret || !process.env.BOOKING_API_SECRET || secret !== process.env.BOOKING_API_SECRET) {
    return res.status(401).json({ message: 'Invalid or missing API secret' });
  }
  next();
};

module.exports = { requireApiSecret };
```

- [ ] **Step 2: Verify it loads**

Run: `cd /c/Projects/booking-app-react/backend && node -e "require('./middleware/apiSecret.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
cd /c/Projects/booking-app-react
git add backend/middleware/apiSecret.js
git commit -m "feat: add shared-secret middleware for service-to-service auth"
```

---

## Task 2: `booking-app-react` — service-only `report-data` route

**Files:**
- Modify: `C:\Projects\booking-app-react\backend\routes\bookings.js`

- [ ] **Step 1: Add the import and the new route, registered BEFORE `router.use(auth)`**

Find:

```js
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth); 
```

Replace with:

```js
const { auth } = require('../middleware/auth');
const { requireApiSecret } = require('../middleware/apiSecret');

const router = express.Router();

const REPORT_ELIGIBLE_STATUSES_SERVICE = ['confirmed', 'in_progress', 'completed'];

// Service-to-service route — MUST be registered before router.use(auth) below,
// since Express applies middleware in registration order and a route declared
// earlier in the same router never passes through a router.use() call declared later.
router.get('/:id/report-data/service', requireApiSecret, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(req.params.id).populate('userId', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!REPORT_ELIGIBLE_STATUSES_SERVICE.includes(booking.status)) {
      return res.status(403).json({ success: false, message: 'Report data not available until booking is confirmed' });
    }

    res.json({
      bookingId:      booking._id,
      inspectionType: booking.service.selected,
      inspectionDate: booking.inspectionDate,
      client: {
        name:  booking.userId.name,
        email: booking.userId.email
      },
      product: {
        name:        booking.product.name,
        description: booking.product.description,
        quantity:    booking.product.quantity,
        unitType:    booking.product.unitType
      },
      factory: {
        name:    booking.factory.name,
        address: booking.factory.address,
        city:    booking.factory.city,
        country: booking.factory.country
      },
      contact: {
        name:  booking.contact.name,
        email: booking.contact.email,
        phone: booking.contact.phone
      },
      aql: {
        inspectionLevel:  booking.aql.inspectionLevel,
        majorDefectLimit: booking.aql.majorDefectLimit,
        minorDefectLimit: booking.aql.minorDefectLimit,
        sampleSize:       booking.aql.sampleSize,
        acceptPoint:      booking.aql.acceptPoint,
        rejectPoint:      booking.aql.rejectPoint
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.use(auth); 
```

Note: the handler body is identical to the existing `/:id/report-data` route further down in this file, minus the `isOwner`/`isAdmin` check (the caller is a trusted service, not a specific user) — this is a deliberate near-duplicate rather than a shared helper, since the existing route must keep its own ownership check untouched and unifying them isn't worth the indirection for one call site each.

- [ ] **Step 2: Verify the routes file still loads**

Run: `cd /c/Projects/booking-app-react/backend && node -e "require('./routes/bookings.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
cd /c/Projects/booking-app-react
git add backend/routes/bookings.js
git commit -m "feat: add service-only report-data route for report-app-main"
```

---

## Task 3: `booking-app-react` — service-only booking-files route

**Files:**
- Modify: `C:\Projects\booking-app-react\backend\routes\upload.js`
- Modify: `C:\Projects\booking-app-react\backend\controllers\uploadController.js`

- [ ] **Step 1: Add the controller function**

Add at the end of `backend/controllers/uploadController.js` (after `exports.getBookingFiles`):

```js
/**
 * ✅ Get booking files for a trusted service caller (no user ownership check)
 */
exports.getBookingFilesForService = async (req, res, next) => {
  try {
    const files = await Upload.find({
      bookingId: req.params.bookingId,
      category: 'booking',
    });

    res.json(
      files.map((file) => ({
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type,
        createdAt: file.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Add the route**

Find in `backend/routes/upload.js`:

```js
const { auth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../utils/storage');

const router = express.Router();

router.use(auth);
```

Replace with:

```js
const { auth } = require('../middleware/auth');
const { requireApiSecret } = require('../middleware/apiSecret');
const { upload, handleMulterError } = require('../utils/storage');

const router = express.Router();

// Service-to-service route — registered before router.use(auth) below, same
// reasoning as the report-data route in routes/bookings.js.
router.get('/booking/:bookingId/service', requireApiSecret, uploadController.getBookingFilesForService);

router.use(auth);
```

- [ ] **Step 3: Verify the routes file still loads**

Run: `cd /c/Projects/booking-app-react/backend && node -e "require('./routes/upload.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 4: Commit**

```bash
cd /c/Projects/booking-app-react
git add backend/controllers/uploadController.js backend/routes/upload.js
git commit -m "feat: add service-only booking-files route for report-app-main"
```

---

## Task 4: `report-app-main` — fix the broken prefill URL

**Files:**
- Modify: `backend/routes/bookings.js:174`

- [ ] **Step 1: Change the URL to hit the new service route**

Find:

```js
        const response = await fetch(
          process.env.BOOKING_API_URL + '/api/bookings/' + booking.onlineBookingId + '/report-data',
          { headers }
        );
```

Replace with:

```js
        const response = await fetch(
          process.env.BOOKING_API_URL + '/api/bookings/' + booking.onlineBookingId + '/report-data/service',
          { headers }
        );
```

- [ ] **Step 2: Verify the routes file still loads**

Run: `cd backend && node -e "require('dotenv').config({ path: '../.env' }); require('./routes/bookings.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/routes/bookings.js
git commit -m "fix: point booking prefill fetch at the service-authenticated route"
```

---

## Task 5: `report-app-main` — sync booking attachments into the draft notice

**Files:**
- Modify: `backend/services/bookingToNotice.service.js`

- [ ] **Step 1: Add the `wasabiService` import and `formatFileSize` helper**

Find:

```js
const InspectionNotice = require('../models/InspectionNotice');
```

Replace with:

```js
const InspectionNotice = require('../models/InspectionNotice');
const wasabiService = require('./wasabiService');

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 2: Add `syncBookingAttachments`**

Add after `uniqueNoticeId` (before `createDraftNoticeFromBooking`):

```js
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
```

- [ ] **Step 3: Call it before `notice.save()`**

Find:

```js
  await notice.save();
  console.log(`[bookingToNotice] Created draft notice ${notice.noticeId} for booking ${bookingRef} (${booking.clientName})`);
  return notice;
```

Replace with:

```js
  await syncBookingAttachments(notice, booking);

  await notice.save();
  console.log(`[bookingToNotice] Created draft notice ${notice.noticeId} for booking ${bookingRef} (${booking.clientName})`);
  return notice;
```

- [ ] **Step 4: Verify the service file still loads**

Run: `cd backend && node -e "require('dotenv').config({ path: '../.env' }); require('./services/bookingToNotice.service.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/services/bookingToNotice.service.js
git commit -m "feat: auto-sync booking client documents into draft notice attachments"
```

---

## Task 6: Operational — env vars (manual, not scripted)

**Files:** `.env` files in both repos — the user should do this step directly since it touches live secrets.

- [ ] **Step 1:** Generate one shared secret value (e.g. a random 32+ char string).
- [ ] **Step 2:** Add `BOOKING_API_SECRET=<value>` to `booking-app-react/backend/.env`.
- [ ] **Step 3:** In `report-app-main`'s **root** `.env` (the one `backend/server.js` actually loads — confirmed via `path.join(__dirname, "..", ".env")`), add:
  - `BOOKING_API_URL=<booking-app-react backend base URL, e.g. http://localhost:3001>` (currently only present in `report-app-main/backend/.env`, which is never read by the running server — move or duplicate it into root `.env`)
  - `BOOKING_API_SECRET=<same value as Step 2>`
- [ ] **Step 4:** Restart both servers so the new env vars are picked up.

---

## Task 7: Full round-trip verification

**Files:** none (verification only)

- [ ] **Step 1: Start both apps**

`booking-app-react`: start its backend per its own README/scripts.
`report-app-main`: `npm run dev:all` from repo root.

- [ ] **Step 2: Full walkthrough**

In `booking-app-react`, log in as a client, create a booking, upload a booking document (via the existing client-facing upload UI). Trigger the flow that creates the corresponding `report-app-main` `Booking` + draft `InspectionNotice` (webhook, or manually via the admin "create booking" flow if testing without a live webhook). Open the resulting Inspection Notice in `report-app-main`'s admin dashboard, go to Notice tab → Section 9 → Client Files, and confirm the uploaded document appears there with a working download link pointing at the Wasabi bucket (not the booking app's `localhost:3001/uploads/...` URL). Separately, assign that booking to an inspector and confirm `booking.prefillData` is now actually populated (check the `Booking` document, or confirm the inspector's report auto-fills from it).

- [ ] **Step 3: Fix anything surfaced**

If Step 2 surfaces any bugs, fix them in the relevant file from the task above, re-verify, and commit with a `fix:` prefixed message describing exactly what was wrong.
