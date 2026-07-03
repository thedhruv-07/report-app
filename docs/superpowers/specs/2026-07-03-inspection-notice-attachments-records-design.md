# Inspection Notice — Attachments, Recent Records & Reading Records

## Context

This is the second of the Inspection Notice gap-closing rounds (see `2026-07-03-inspection-notice-report-gaps-design.md` for the first). It covers three of the gaps identified when comparing our Inspection Notice feature against the V-Trust MIS reference: real file upload/download for Attachments (Section 9), an auto-populated Recent Inspection Records list (Section 15), and Reading Records tracking (Section 16).

Remaining gaps not covered here (Section 18 Upload & Report, Historical Complaints, Expense tab) are deferred to future rounds.

## 1. Attachments (Section 9)

### Backend

New routes on the existing `InspectionNotice` resource, added to `backend/routes/inspectionNotice.routes.js`:

- `POST /api/inspection-notices/:id/attachments` — `roleCheck(["admin", "manager"])`, `upload.single('file')` (reusing the existing `backend/middleware/upload.middleware.js`, memory storage). Body also includes a `type` field: `'client'` or `'supplier'`. Handler:
  1. Validates `type` is one of the two allowed values.
  2. Calls `wasabiService.uploadFile(req.file)` (existing method, already used elsewhere in the codebase) to get `{ key, url, originalName }`.
  3. Pushes `{ fileName: req.file.originalname, size: <human-readable size string>, uploadDate: new Date(), url }` into `attachments.clientFiles` or `attachments.supplierFiles` on the notice.
  4. Saves and returns the updated notice.
- `DELETE /api/inspection-notices/:id/attachments/:fileId` — `roleCheck(["admin", "manager"])`, query param `?type=client|supplier`. Handler:
  1. Finds the subdocument by `_id` in the relevant array.
  2. Calls `wasabiService.deleteFile(wasabiService.extractKey(entry.url))` to remove the object from Wasabi.
  3. Pulls the subdocument from the array, saves, and returns the updated notice.

Human-readable size is computed server-side from `req.file.size` (bytes) using a small formatter: `< 1024` → `"<n> B"`, `< 1024*1024` → `"<n/1024 to 1 decimal> KB"`, otherwise `"<n/1024/1024 to 1 decimal> MB"`.

### Frontend

`NoticeTab.jsx`'s Section 9 currently renders two decorative boxes with non-functional "Upload File" buttons. Replace each with:
- A list of already-uploaded files (name, size, a download link using the stored `url`, and a delete ✕ button).
- A working "Upload File" button wired to a hidden `<input type="file">`; on change, POSTs a `FormData` (file + `type`) to the new endpoint with the auth token, then replaces the relevant array in `formData` with the response.

**New props required:** `NoticeTab` currently only receives `formData, updateSection, updateRootField, inspectorOptions`. It has no access to the auth `token` or the notice's Mongo `_id` (both live in the parent `InspectionNoticeForm.jsx`). Add two new props: `token` and `recordId` (the Mongo `_id`, named distinctly from the human-readable `formData.noticeId` field to avoid confusion).

**Edge case:** a brand-new notice (`isNew` in `InspectionNoticeForm.jsx`) has no `_id` until the first save. While `recordId` is empty, the Upload File buttons are disabled and show "Save as draft first" as a tooltip/inline note instead of silently failing.

## 2. Recent Inspection Records (Section 15)

### Backend

New route: `GET /api/inspection-notices/:id/recent-by-factory`. Open to any authenticated user (matching the existing `getNoticeById` access level — no role restriction). Handler:
1. Loads the current notice to get its `factoryInfo.factoryName`.
2. If the factory name is empty, returns `{ records: [] }` immediately.
3. Otherwise queries other `InspectionNotice` documents (`_id: { $ne: id }`) where `factoryInfo.factoryName` matches case-insensitively. Build the pattern with a small inline helper that escapes regex special characters in the factory name (`name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) before wrapping it as `new RegExp('^' + escaped + '$', 'i')` — factory names are free text and may contain characters like `(`, `)`, or `.`. Sorted by `basicInfo.inspectionDateFrom` descending, limited to 5.
4. Returns `{ records: [{ inspectionDate: basicInfo.inspectionDateFrom, inspectorName: <first inspector's name from teamAssignment.inspectors, or "—">, noticeId }] }`.

This is a read-only derived query — nothing is written back to the `recentRecords` schema field (that field is left in the schema unused, since the data is now computed on demand rather than stored).

### Frontend

`NoticeTab.jsx`'s Section 15 currently shows a hardcoded "No recent inspection records available" message. Replace with:
- A `useEffect` that fires when `recordId` and `factoryInfo.factoryName` are both truthy, calling the new endpoint and storing the result in local component state (`recentFactoryRecords`, not part of `formData` — it's derived, not saved).
- Re-fires when `factoryInfo.factoryName` changes (debounced is unnecessary — this only matters when the field loses focus in practice, but a plain dependency-array `useEffect` is simplest and sufficient).
- Renders a table (Inspection Date, Inspector) when records exist, otherwise the existing "no records" message.

## 3. Reading Records (Section 16)

### Backend only

`getNoticeById` in `backend/controllers/inspectionNotice.controller.js` currently does a plain `findById(id).lean()` and returns it. Change it to:
1. Fetch the notice (non-lean, since we need to save).
2. Push `{ inspectorName: req.user.name, timeViewed: new Date() }` into `readingRecords`.
3. Save.
4. Return the updated notice.

Since `InspectionNoticeForm.jsx`'s `useEffect` that fetches the notice only runs once per mount (dependency array `[id, isNew, token]`), this naturally logs one entry per page-open rather than spamming on every re-render. `getNotices` (the list endpoint) is untouched — list views must not trigger a reading-record log, only opening the individual detail page does.

**Note:** this logs *any* authenticated viewer who opens the page (admin, manager, or — in the future, if inspector access is ever added — inspector), not specifically "the assigned inspector confirmed reading it via mobile," which is what V-Trust's version means. This is a deliberate scope simplification agreed on during brainstorming, since we have no inspector-facing view of Inspection Notices to log a more precise signal from.

### Frontend

`NoticeTab.jsx`'s Section 16 currently shows a hardcoded "No reading records logged yet" message. Replace with a simple read-only list rendering `formData.readingRecords` (inspector name + formatted `timeViewed`), falling back to the existing placeholder when the array is empty.

## Data flow summary

```
InspectionNoticeForm.jsx (has token, id/_id)
  │
  ├─ passes token, recordId ──▶ NoticeTab.jsx
  │                                │
  │                                ├─ Section 9: POST/DELETE .../attachments (needs token, recordId)
  │                                ├─ Section 15: GET .../recent-by-factory (needs recordId; read-only local state)
  │                                └─ Section 16: renders formData.readingRecords (no new fetch — comes free
  │                                   with the notice payload, populated server-side on every GET .../:id)
```

## Out of scope (unchanged from the first spec)

Section 18 Upload & Report, Historical Complaints, Expense tab.

## Testing

No automated test suite exists in this project. Manual verification: upload/delete files of both types and confirm they appear/disappear and download correctly; open a notice for a factory name shared with another existing notice and confirm the Recent Records table shows the other notice; open a notice, close it, reopen it, and confirm a new Reading Record entry appears each time with the current user's name and a fresh timestamp.
