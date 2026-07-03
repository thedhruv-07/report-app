# Client Code Auto-Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-generate a 4-letter client code (e.g. WAUS) from clientName + location whenever a booking or inspection notice is created/updated, and surface it in the admin bookings list and inspector task card.

**Architecture:** A shared `generateClientCode(clientName, location)` utility function lives in `backend/utils/clientCode.js`. All three write paths (Booking route, InspectionNotice controller, noticeToBooking service) import and call it server-side. The code is stored as a `clientCode` field on `Booking`, `Task`, and `InspectionNotice` models. Frontend reads it from API responses — no client-side generation.

**Tech Stack:** Node/Express backend, Mongoose models, React 19 + Tailwind CSS frontend.

---

## File Map

| File | Change |
|---|---|
| `backend/utils/clientCode.js` | CREATE — shared `generateClientCode()` function |
| `backend/models/Booking.js` | MODIFY — add `clientCode` field |
| `backend/models/task.model.js` | MODIFY — add `clientCode` field |
| `backend/models/InspectionNotice.js` | MODIFY — add top-level `clientCode` field |
| `backend/routes/bookings.js` | MODIFY — generate code on POST/PATCH, include in formatBookingSummary, copy to Task on assign |
| `backend/controllers/inspectionNotice.controller.js` | MODIFY — generate code on create and after update |
| `backend/services/noticeToBooking.service.js` | MODIFY — copy clientCode to Booking and Task when provisioning from notice |
| `frontend/src/dashboards/admin/AdminDashboard.jsx` | MODIFY — include `clientCode` in `bookingRows` mapping |
| `frontend/src/dashboards/admin/components/BookingsQueue.jsx` | MODIFY — render gray pill next to client name |
| `frontend/src/dashboards/inspector/components/TaskGrid.jsx` | MODIFY — replace h3 client name with clientCode badge |

---

### Task 1: Shared utility function

**Files:**
- Create: `backend/utils/clientCode.js`

- [ ] **Step 1: Create the utility file**

```js
function generateClientCode(clientName, location) {
  const namePart = (clientName || '').trim().replace(/[^a-zA-Z ]/g, '')
    .split(' ')[0].substring(0, 2).toUpperCase();
  const locPart = (location || '').trim().replace(/[^a-zA-Z ]/g, '')
    .split(' ')[0].substring(0, 2).toUpperCase();
  return namePart + locPart;
}

module.exports = { generateClientCode };
```

- [ ] **Step 2: Quick sanity check in Node REPL**

Run: `node -e "const {generateClientCode}=require('./backend/utils/clientCode'); console.log(generateClientCode('Walmart','USA'), generateClientCode('FRIN Trading','Germany'), generateClientCode('',''), generateClientCode('A',''))"`

Expected output: `WAUS FRGE  A`

---

### Task 2: Add `clientCode` field to Mongoose models

**Files:**
- Modify: `backend/models/Booking.js`
- Modify: `backend/models/task.model.js`
- Modify: `backend/models/InspectionNotice.js`

- [ ] **Step 1: Add to Booking model**

In `backend/models/Booking.js`, add one line to the schema (after the existing `onlineBookingId` line):

```js
  clientCode:           { type: String, default: '' },
```

- [ ] **Step 2: Add to Task model**

In `backend/models/task.model.js`, add one line to the schema (after `adminInstructions`):

```js
  clientCode: { type: String, default: '' },
```

- [ ] **Step 3: Add to InspectionNotice model**

In `backend/models/InspectionNotice.js`, add one line at the top level of the schema (before the closing `}, { timestamps: true }`):

```js
  clientCode: { type: String, default: '' },
```

---

### Task 3: Generate clientCode in booking routes (POST and PATCH)

**Files:**
- Modify: `backend/routes/bookings.js`

- [ ] **Step 1: Import the utility at the top of the file**

Add this import after the existing requires in `backend/routes/bookings.js`:

```js
const { generateClientCode } = require('../utils/clientCode');
```

- [ ] **Step 2: Add `clientCode` to `formatBookingSummary`**

In the `formatBookingSummary` function, add `clientCode` to the returned object (add after the `onlineBookingId` line):

```js
  clientCode:            booking.clientCode            || '',
```

- [ ] **Step 3: Generate clientCode in POST /api/bookings**

In the `POST /` route handler, replace:

```js
    const booking = new Booking({ ...req.body, adminId: req.user.id });
```

With:

```js
    const clientCode = generateClientCode(req.body.clientName || '', req.body.countryOfOrigin || '');
    const booking = new Booking({ ...req.body, adminId: req.user.id, clientCode });
```

- [ ] **Step 4: Generate clientCode in PATCH /api/bookings/:id**

In the `PATCH /:id` route handler, after the block that builds `updates` from `allowed` fields, add clientCode regeneration:

```js
    // Regenerate clientCode whenever clientName or countryOfOrigin changes
    if (req.body.clientName !== undefined || req.body.countryOfOrigin !== undefined) {
      const existing = await Booking.findById(req.params.id).select('clientName countryOfOrigin').lean();
      const name = req.body.clientName     ?? existing?.clientName     ?? '';
      const loc  = req.body.countryOfOrigin ?? existing?.countryOfOrigin ?? '';
      updates.clientCode = generateClientCode(name, loc);
    }
```

Place this block right before the `Booking.findByIdAndUpdate(...)` call.

- [ ] **Step 5: Copy clientCode to Task when assigning**

In the `POST /:id/assign` route handler, in the `Task.create({...})` call, add `clientCode`:

```js
      clientCode: booking.clientCode || '',
```

Add it alongside `bookingId: booking._id`.

---

### Task 4: Generate clientCode in InspectionNotice controller

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`

- [ ] **Step 1: Import the utility**

Add at the top of the file:

```js
const { generateClientCode } = require('../utils/clientCode');
```

- [ ] **Step 2: Generate clientCode in `createNotice`**

In `exports.createNotice`, before `const newNotice = new InspectionNotice({...})`, add:

```js
    const clientCode = generateClientCode(
      req.body.basicInfo?.customerName || '',
      req.body.basicInfo?.inspectionLocation || ''
    );
```

Then add `clientCode` to the `InspectionNotice` constructor:

```js
    const newNotice = new InspectionNotice({
      ...req.body,
      createdBy: req.user.id || req.user._id,
      clientCode,
    });
```

- [ ] **Step 3: Regenerate clientCode after `updateNotice`**

In `exports.updateNotice`, after getting `updatedNotice` from `findByIdAndUpdate`, add:

```js
    // Recompute clientCode if basicInfo changed
    const newCode = generateClientCode(
      updatedNotice.basicInfo?.customerName || '',
      updatedNotice.basicInfo?.inspectionLocation || ''
    );
    if (newCode !== updatedNotice.clientCode) {
      await InspectionNotice.findByIdAndUpdate(id, { $set: { clientCode: newCode } });
      updatedNotice.clientCode = newCode;
    }
```

Place this block before the provisioning logic (before the `if (!wasScheduledBefore && updatedNotice.status === 'scheduled')` block).

---

### Task 5: Copy clientCode when provisioning Booking+Task from a notice

**Files:**
- Modify: `backend/services/noticeToBooking.service.js`

- [ ] **Step 1: Import the utility**

Add at the top of the file after existing requires:

```js
const { generateClientCode } = require('../utils/clientCode');
```

- [ ] **Step 2: Compute clientCode before the loop**

In `provisionFromNotice`, after the line `const prefillData = buildPrefillData(notice);`, add:

```js
  const clientCode = notice.clientCode || generateClientCode(
    bi.customerName || '',
    bi.inspectionLocation || ''
  );
```

- [ ] **Step 3: Set clientCode on the new Booking**

In the `new Booking({...})` constructor inside the loop, add:

```js
      clientCode,
```

alongside the other fields (e.g. after `onlineBookingId`).

- [ ] **Step 4: Set clientCode on the new Task**

In the `Task.create({...})` call, add:

```js
        clientCode,
```

alongside `adminInstructions`.

---

### Task 6: Admin dashboard — include clientCode in bookingRows

**Files:**
- Modify: `frontend/src/dashboards/admin/AdminDashboard.jsx`

- [ ] **Step 1: Add `clientCode` to the `bookingRows` useMemo**

In the `bookingRows` useMemo (around line 130), add `clientCode` to the mapped object:

```js
      clientCode: booking.clientCode || '',
```

Add it after the `linkedNoticeId` line so the full row now includes the field.

---

### Task 7: Admin bookings list — show clientCode pill

**Files:**
- Modify: `frontend/src/dashboards/admin/components/BookingsQueue.jsx`

- [ ] **Step 1: Add clientCode pill in the Client / PO column**

In the `activeView === 'bookings'` table, find the "Client / PO" `<td>` (around line 208):

```jsx
<td className="px-6 py-4">
  <p className="font-bold text-slate-700">{booking.clientName}</p>
  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{booking.poNumber}</p>
</td>
```

Replace with:

```jsx
<td className="px-6 py-4">
  <div className="flex items-center gap-2">
    <p className="font-bold text-slate-700">{booking.clientName}</p>
    {booking.clientCode && (
      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold tracking-wider">
        {booking.clientCode}
      </span>
    )}
  </div>
  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{booking.poNumber}</p>
</td>
```

---

### Task 8: Inspector task card — show clientCode as primary badge

**Files:**
- Modify: `frontend/src/dashboards/inspector/components/TaskGrid.jsx`

- [ ] **Step 1: Replace h3 client name with clientCode badge**

Find the `<h3>` that renders `{task.clientName}` (around line 64):

```jsx
<h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
  {task.clientName}
</h3>
```

Replace with:

```jsx
{task.clientCode ? (
  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
    {task.clientCode}
  </span>
) : (
  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
    {task.clientName}
  </h3>
)}
```

This shows the clientCode badge when available, and falls back to the full client name for older tasks that pre-date this feature.

---

## Self-Review

**Spec coverage check:**
1. ✅ `clientCode` field added to Booking, Task, InspectionNotice models (Task 2)
2. ✅ `generateClientCode()` called server-side in all create paths — POST booking, create notice, provisionFromNotice (Tasks 3, 4, 5)
3. ✅ `generateClientCode()` called server-side in all update paths — PATCH booking, updateNotice (Tasks 3, 4)
4. ✅ `clientCode` returned in GET /api/bookings via `formatBookingSummary` (Task 3)
5. ✅ InspectionNotice controller returns the updated notice with clientCode (Task 4)
6. ✅ Admin bookings list shows gray pill (Task 7) — fed by AdminDashboard `bookingRows` mapping (Task 6)
7. ✅ Inspector task card shows clientCode badge as primary identifier (Task 8)
8. ✅ Fallback: empty clientName/location → empty namePart/locPart → short code, never crashes (Task 1, Step 2 verifies this)
9. ✅ Client input never trusted — `clientCode` stripped from PATCH allowed-fields list; generated purely server-side

**Placeholder scan:** No TBD, TODO, or vague "add appropriate..." phrases found.

**Type consistency:** `clientCode` is consistently typed as `String` with `default: ''` across all three models. The utility function always returns a string (including empty string for empty inputs). Frontend checks `booking.clientCode` and `task.clientCode` with the same field name across all files.
