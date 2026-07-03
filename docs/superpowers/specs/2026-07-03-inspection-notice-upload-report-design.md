# Inspection Notice — Section 18: Upload & Report

## Context

This is the third of the Inspection Notice gap-closing rounds:
1. `2026-07-03-inspection-notice-report-gaps-design.md` — Report tab fields + Factory/Supplier status tables
2. `2026-07-03-inspection-notice-attachments-records-design.md` — Attachments, Recent Inspection Records, Reading Records
3. This spec — Section 18 (Upload & Report) in `ReportTab.jsx`

Remaining gaps not covered here (Historical Complaints, Expense tab) are deferred to future rounds — both need their own discovery before a spec makes sense, since neither has any existing data model.

## Backend impact

Two new routes on the `InspectionNotice` resource (added to `backend/routes/inspectionNotice.routes.js`), reusing the existing `wasabiService` and `upload.middleware.js` exactly as established in the Attachments spec. No schema changes — `reportUploads` (`inspectorUploads`, `auditorUploads`, `inspectorReports`, `tmReports`) already exists in `backend/models/InspectionNotice.js`.

## 1. Inspector/Auditor Uploads

### Backend

- `POST /api/inspection-notices/:id/report-uploads` — `roleCheck(["admin", "manager"])`, `upload.single('file')`, body field `type`: `'inspector'`|`'auditor'`. Handler:
  1. Validates `type`.
  2. Uploads via `wasabiService.uploadFile(req.file)`.
  3. Pushes `{ fileName: req.file.originalname, size: <formatted, same helper as the Attachments spec>, uploadTime: new Date(), uploadedBy: req.user.name, url }` into `reportUploads.inspectorUploads` or `.auditorUploads`.
  4. Saves and returns the updated notice.
- `POST /api/inspection-notices/:id/report-uploads/:fileId/log-view` — any authenticated user (matching `getNoticeById`'s access level), body `{ type: 'inspector'|'auditor' }`. Handler:
  1. Finds the subdocument by `_id` in the relevant array.
  2. Sets `timeViewed: new Date()`, `viewedBy: req.user.name`.
  3. Saves and returns `{ url: entry.url }`.

**Deliberately no delete route.** V-Trust's own UI caption for this section reads "these files are attachments within the online report — they can only be deleted from within the report." We have no such "within the report" view, so rather than inventing a delete path that doesn't match that constraint, uploads here are add-only in this round.

### Frontend (`ReportTab.jsx`)

Replace the two decorative "No files uploaded yet." boxes under Section 18 with:
- A table (File name, Size, Upload time, Uploaded by, Time viewed, Viewed by) listing existing entries from `formData.reportUploads.inspectorUploads` / `.auditorUploads`.
- A working "Upload File" button (hidden `<input type="file">`, same pattern as the Attachments spec) that POSTs to the new upload endpoint and merges the response into `formData`.
- A "Download" link per row that POSTs to `log-view` first, then `window.open(response.url, '_blank')` — never a raw `<a href>` pointing at the Wasabi URL directly, since that would skip the view-logging step.

**New props required:** `ReportTab` currently only receives `formData, updateSection`. Add `token` and `recordId` (the notice's Mongo `_id`), matching what `NoticeTab` needed for Section 9 in the previous spec. Same edge case applies: a brand-new, unsaved notice has no `recordId`, so Upload buttons are disabled with a "Save as draft first" note until it exists.

## 2. Online Report (Inspector Report / Technical Manager Report)

Manual metadata-tracking tables — no automatic report generation. Bound to `reportUploads.inspectorReports` and `reportUploads.tmReports`.

- "Create Report" button appends a new row with `reportNo` auto-generated (`` `IR-${Date.now()}` `` for Inspector Report, `` `TMR-${Date.now()}` `` for Technical Manager Report) and `creationDate: new Date()` pre-filled.
- `finishDate`, `confirmationTime`, and `url` are then editable inline (date input, text input, text input respectively).
- A ✕ button removes a row (unlike the file uploads above, these are plain data rows we own entirely, not files with external storage — no note in V-Trust restricts editing/removing them from this view, and there's no Wasabi object behind them to also clean up).

This is deliberately just record-keeping ("a report exists somewhere, here's its number and a link to it") rather than building actual report-generation into the admin dashboard — that's a much bigger feature, and inspectors already create real reports from their own dashboard flows, not admins from this screen.

## New shared helpers in `ReportTab.jsx`

To avoid writing four more bespoke add/update/remove function trios (one per new array: `inspectorUploads`, `auditorUploads`, `inspectorReports`, `tmReports`), introduce one generic, parameterized set:

```js
const addToSection = (section, arrayField, newItem) => {
  const current = formData[section]?.[arrayField] || [];
  updateSection(section, { [arrayField]: [...current, newItem] });
};
const updateInSection = (section, arrayField, idx, field, value) => {
  const current = [...(formData[section]?.[arrayField] || [])];
  current[idx] = { ...current[idx], [field]: value };
  updateSection(section, { [arrayField]: current });
};
const removeFromSection = (section, arrayField, idx) => {
  updateSection(section, { [arrayField]: (formData[section]?.[arrayField] || []).filter((_, i) => i !== idx) });
};
```

These are used for `inspectorReports`/`tmReports` (`section = 'reportUploads'`). The file-upload arrays (`inspectorUploads`/`auditorUploads`) are populated by the backend response on upload, not by these helpers, since there's no client-side "add empty row" concept for a file — you either have a file or you don't.

**Not retroactively applied** to the bespoke `addTimeClockRecord`/`updateTimeClockRecord`/`removeTimeClockRecord` and `addInspectionDate`/`updateInspectionDate`/`removeInspectionDate` helpers from the previous spec's plan — that plan is already written and, once executed, its code should be left as-is rather than churned for a DRY win that isn't strictly necessary. This is a deliberate scope boundary, not an oversight.

## Testing

No automated test suite exists in this project. Manual verification: upload a file as an "Inspector Upload" and as an "Auditor Upload," confirm both list correctly with uploader name and time; click Download on each and confirm a Time Viewed / Viewed By pair appears after the click, and the file actually opens/downloads; click "Create Report" for both Inspector Report and Technical Manager Report, fill in Finish Date / Confirmation Time / URL by hand, remove one row, save, reload, and confirm everything persisted exactly.
