# Automatic Client-Document Sync: Booking App → Inspection Notice Attachments

## Context

This is a cross-repository feature spanning two separate applications:
- **`report-app-main`** (this repo) — the inspection report platform, including the Inspection Notice feature built in the three prior specs (`2026-07-03-inspection-notice-*-design.md`).
- **`booking-app-react`** (sibling repo, path `c:\Projects\booking-app-react`) — the client-facing online booking system ("IRMS"), where clients create bookings and can upload documents (PO files, spec sheets) against them.

Today, when a client uploads a document on the booking website, it is stored entirely within `booking-app-react` (local disk, via `multer.diskStorage`, tracked in its own `Upload` Mongoose model) and is completely invisible to `report-app-main`. This was confirmed by direct code inspection: `report-app-main` only ever calls `booking-app-react`'s `GET /:id/report-data` endpoint, which returns structured booking fields only — no file references. Our own `InspectionNotice.attachments` is populated exclusively by an admin manually uploading through the UI (see the second Inspection Notice spec).

This spec closes that gap: client-uploaded booking documents should automatically appear in the corresponding Inspection Notice's Attachments (Client Files) the moment the draft notice is created from that booking — no manual re-upload required.

## Pre-existing bugs discovered during design

Two separate, compounding bugs meant the existing `report-app-main` → `booking-app-react` prefill fetch (`backend/routes/bookings.js:167-184` in `report-app-main`, calling `GET /:id/report-data`) has never actually done anything:

1. **Config never loaded.** `report-app-main/backend/server.js:2` loads env vars via `require("dotenv").config({ path: path.join(__dirname, "..", ".env") })` — i.e. only the **root** `.env`, never `backend/.env`. `BOOKING_API_URL` was only ever set in `backend/.env`, so `process.env.BOOKING_API_URL` was `undefined` at runtime, and the guard at `bookings.js:167` (`if (booking.onlineBookingId && process.env.BOOKING_API_URL)`) was always false — the fetch code never even ran. This is the more fundamental of the two bugs: even with correct auth, nothing would have fired without this fix.
2. **Auth mismatch.** Even if #1 were fixed, the fetch would still fail: `booking-app-react/backend/routes/bookings.js:15` applies `router.use(auth)` to that route, and that `auth` middleware only accepts a `Bearer <JWT>` signed with `booking-app-react`'s own secret — but `report-app-main` sends an `x-api-secret` header instead, which nothing in `booking-app-react` has ever checked (grepped the whole backend — zero matches for `x-api-secret` or `BOOKING_API_SECRET`). The fetch would 401, get caught, and `prefillData` would never be set. `BOOKING_API_SECRET` was also unset in both apps' `.env` files.

**Both are now fixed as operational/config changes** (not covered by an implementation task, since no code was needed): `BOOKING_API_URL` and a freshly-generated `BOOKING_API_SECRET` were added to `report-app-main`'s root `.env` (the file `server.js` actually loads), `BOOKING_API_SECRET` was also added to `report-app-main/backend/.env` for consistency with the existing (if redundant) convention there, and the same `BOOKING_API_SECRET` value was added to `booking-app-react/backend/.env`. Verified by loading env vars through the exact path `server.js` uses and confirming both variables resolve. The auth-mismatch bug (#2) is still fixed at the code level per the "`booking-app-react` changes" section below — the `.env` fix alone isn't sufficient, since nothing was checking that header at all until the new `requireApiSecret` middleware exists.

## `booking-app-react` changes

### New middleware: `backend/middleware/apiSecret.js`

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

### New route: `GET /api/bookings/:id/report-data/service`

Added to `backend/routes/bookings.js`, registered **before** the file's existing `router.use(auth)` line — Express applies middleware in registration order, so a route declared earlier in the same router never passes through a `router.use()` call declared later. This route uses `requireApiSecret` instead, and is never subject to the JWT check. Same response body as the existing `/:id/report-data` handler, and the same `REPORT_ELIGIBLE_STATUSES` gate is kept (still only return data once a booking is confirmed/in_progress/completed — that's about data readiness, not about who's allowed to ask). The `isOwner`/`isAdmin` ownership check is dropped entirely, since the caller is a trusted service, not a specific user.

### New route: `GET /api/upload/booking/:bookingId/service`

Added to `backend/routes/upload.js`, also gated by `requireApiSecret` only:

```js
router.get('/booking/:bookingId/service', requireApiSecret, uploadController.getBookingFilesForService);
```

New controller function in `backend/controllers/uploadController.js`:

```js
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

Deliberately filters to `category: 'booking'` only (documents the client explicitly attached to that booking via `uploadBookingDocument`) — excludes `'file'` (generic uploads) and `'payment_receipt'` (not an inspection-relevant document).

The existing client-facing routes (`GET /:id/report-data`, `GET /api/upload/booking/:bookingId`) are **untouched** — same behavior, same security posture (real JWT + ownership check), for logged-in client/admin users of the booking site itself.

## `report-app-main` changes

### 1. Fix the existing prefill fetch

`backend/routes/bookings.js:174` — change the URL from `/api/bookings/${booking.onlineBookingId}/report-data` to `/api/bookings/${booking.onlineBookingId}/report-data/service`. No other change to that block; it already sends the `x-api-secret` header via `BOOKING_API_SECRET`.

### 2. Pull attachments during draft notice creation

`backend/services/bookingToNotice.service.js`, inside `createDraftNoticeFromBooking`, after the existing structured-field copying (untouched) and before the notice is saved (or as an immediate follow-up save — see below):

```js
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

Called as `await syncBookingAttachments(notice, booking);` right before the final `await notice.save()` in `createDraftNoticeFromBooking`, so attachments are included in the same save as the rest of the draft — one write, not two.

`formatFileSize` is duplicated from `backend/controllers/inspectionNotice.controller.js` (where it was introduced in the previous spec) into `bookingToNotice.service.js`, since the two files don't currently share a utilities module for this and introducing one is out of scope for this spec (YAGNI — two small identical 4-line functions is cheaper than a new shared-utils file for one function, until a third caller shows up).

### Error handling posture

Both `createDraftNoticeFromBooking` callers (`webhook.controller.js:301`, `routes/bookings.js:133`) already wrap the whole call in try/catch and tolerate failure (log + continue). `syncBookingAttachments` itself never throws — every failure mode (missing config, unreachable API, bad individual file) is caught and logged, degrading to "notice created with zero or partial attachments" rather than blocking notice creation. This matches the existing resilience posture of the surrounding code exactly.

## Operational steps (done, ahead of the implementation plan)

These were config-only fixes with no code involved, so they were applied directly rather than deferred to the plan:
- `report-app-main/.env` (root, the file `server.js` actually loads): added `BOOKING_API_URL=http://localhost:3001` and a freshly-generated `BOOKING_API_SECRET`.
- `report-app-main/backend/.env`: added the same `BOOKING_API_SECRET` for consistency with the existing convention there (it already independently carries `BOOKING_API_URL`/`REPORT_APP_WEBHOOK_SECRET`, unused by `server.js` but used by ad-hoc scripts run from within `backend/`).
- `booking-app-react/backend/.env`: added the same `BOOKING_API_SECRET` value.

The implementation plan still needs to add the `requireApiSecret` middleware and the two new `/service` routes — the secret existing in both `.env` files is necessary but not sufficient, since nothing checks it until that code exists.

## Data flow

```
Client uploads a document on the booking website
   → booking-app-react stores it on local disk, Upload doc { bookingId, category: 'booking', url, ... }

Admin (or webhook) triggers booking → InspectionNotice conversion
   → report-app-main: createDraftNoticeFromBooking(booking, adminId)
       → copies structured fields into basicInfo/productInfo/factoryInfo/aql (existing, untouched)
       → NEW: syncBookingAttachments(notice, booking)
             → GET booking-app-react /api/upload/booking/:id/service   (x-api-secret)
             → for each file: fetch bytes → wasabiService.uploadFile() → push into attachments.clientFiles
       → notice.save()  (one write, includes attachments)
```

Once saved, the Inspection Notice's existing Section 9 UI (built in the second spec) displays these files exactly like a manually-uploaded one — same list, same download links — the admin just never had to touch them.

## Out of scope

- Payment receipts and generic (`category: 'file'`) uploads are not synced.
- Supplier files (`attachments.supplierFiles`) are not touched — the booking app has no concept of a "supplier upload," only client/booking documents.
- Re-syncing after the draft notice already exists (e.g., a client uploads a new document *after* the notice was created) is not covered — this spec only syncs once, at draft-creation time. A "re-sync" button could be a future addition if needed.
- No changes to the booking app's client-facing upload UI or the existing `GET /api/upload/booking/:bookingId` endpoint used by real logged-in users.

## Testing

No automated test suite exists in either project. Manual verification: in `booking-app-react`, log in as a client, create a booking, and upload a booking document. Trigger the webhook/booking flow that creates the corresponding `report-app-main` `Booking` + draft `InspectionNotice` (or manually call the relevant endpoint if testing locally without a live webhook). Open the resulting Inspection Notice in `report-app-main`'s admin dashboard and confirm the uploaded document appears in Section 9 → Client Files, with a working download link pointing at *our* Wasabi bucket (not the booking app's local disk URL). Separately, confirm the previously-broken prefill (`booking.prefillData`) now actually populates by checking the `Booking` document after assignment.
