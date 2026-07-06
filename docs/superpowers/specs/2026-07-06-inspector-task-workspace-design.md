# Inspector Task Workspace (Notice / Expense / Report Tabs) — Design Spec

## Problem

Today, once an inspector accepts a task, clicking "Start Report" takes them straight into the full multi-step PSI/CLS/DPI/Factory Audit report form. They never see the details CS entered on the Inspection Notice (factory info, product info, AQL standards, on-site test requirements, defect classifications, attachments/documents CS uploaded, etc.) in a clean, dedicated view — they only get whatever subset was copied into `prefillData` and silently applied to form fields. If the inspector has a question about the assignment, there's no way to raise it against that specific notice. There's also no way for an inspector to submit expense-related files/notes for a job.

## Goals

- After accepting a task, the inspector lands on a new tabbed workspace — **Notice / Expense / Report** — before going into the report form.
- **Notice** tab: a read-only, compact summary of everything CS filled in on the Inspection Notice, plus a way to leave a remark/query that CS sees on their side.
- **Expense** tab: upload expense-related files (doc/img) and free-text remarks — a brand new capability, nothing like it exists today.
- **Report** tab: does exactly what "Start Report" does today — opens the existing, unchanged report form.
- Compact, non-bold, on-screen-fitted visual style throughout the new workspace.

## Non-goals


- No changes to the PSI/CLS/DPI/Factory Audit report forms themselves.
- No approval/rejection workflow for expenses (upload-and-store only, for now).
- No change to how the Technical Manager's existing correction/review flow works.
- Not building this for tasks with no linked notice beyond a simple fallback message — no attempt to reconstruct notice-like data from `prefillData` for those cases.

## Current-state findings (relevant to this design)

- The admin's `InspectionNoticeForm.jsx` already has a "Notice / Expense / Report (Online)" tab bar (this is what the screenshot in the request shows) — but the admin's "Report (Online)" tab is a *different* thing (Section 17/18: execution-info, time-clock records, online-report file tracking), not the actual PSI/CLS report form. The admin's "Expense" tab (`ExpenseTab.jsx`) is a placeholder stub — nothing is implemented there today.
- `GET /api/inspection-notices/:id` (`getNoticeById`) has no role restriction today — any authenticated user, including inspectors, can already fetch any notice by ID. `resolveDocumentUrl` (used to get signed URLs for attachment downloads) is restricted to `admin`/`manager` only.
- A `Task` created from a notice via `provisionFromNotice()` stores `prefillData.noticeId`, which is the direct foreign key back to the originating `InspectionNotice.noticeId`. Tasks not created this way (legacy/ad-hoc) have no such link.

## Architecture

### Routing change

New frontend route `/dashboard/inspector/task/:taskId` rendering a new page component `frontend/src/dashboards/inspector/pages/TaskWorkspace.jsx`.

- `InspectorDashboard.jsx`'s `handleStartReport(task)` is renamed in spirit but not necessarily in name — it now navigates to `/dashboard/inspector/task/${task._id}` (passing `{ state: { task } }` same as today) instead of navigating directly into the report route. The report route navigation logic itself moves into the new page's Report tab.
- The existing "Accept" action and its modal (`TaskDetailsModal.jsx`) are unchanged — accepting a `Pending Acceptance` task still happens the same way. Once a task's status is `Accepted` (or beyond — `Report Submitted`, `Under Review`, `Correction Requested`, `Finalized`), clicking into it opens `TaskWorkspace` instead of jumping straight to the report form or showing the old read-only modal content. `TaskDetailsModal` continues to exist and continues to be what's shown for `Pending Acceptance` tasks (where "Accept" lives).
- `TaskWorkspace` reads `location.state?.task` the same way report forms do today, plus fetches live Notice/Expense data from the new endpoints below.

### Notice tab

Default active tab. Read-only. Backend endpoint:

`GET /api/inspector/tasks/:taskId/notice` (new, in `backend/controllers/inspector.controller.js` + `backend/routes/inspector.routes.js`)

- Loads the `Task`, verifies `task.assignedInspectorId === req.user.id` (403 if not — inspectors can only view notices for their own tasks).
- If `task.prefillData?.noticeId` is missing, or no `InspectionNotice` matches it, responds `{ notice: null }`. Frontend renders "No notice on file for this task."
- Otherwise loads the `InspectionNotice` by `noticeId`, and for every file/document field (attachments, `onlineWI`, `reportTemplate`, `onlineCustomerClaimForm`), resolves a signed Wasabi URL server-side (reusing `wasabiService.getSignedUrl`) and returns them pre-resolved — the frontend never calls `resolve-document-url` directly, so no permission change is needed on that admin-only endpoint.
- Response includes only Sections 1–14 of the notice (Basic Info, Team Assignment, Product Info, AQL, Inspection Requirements, Special Client Requirements, Customer Samples, Inspection Info, Attachments, Inspection Tools & Equipment, On-Site Tests, Defect Classifications, Supplier Info, Factory Info). Sections 15–18 (Recent Records, Submission Records, Execution Info, Report Uploads) are omitted — they're CS/TM operational tracking, not relevant to what the inspector needs to know about the assignment.

Frontend component `frontend/src/dashboards/inspector/components/NoticeSummary.jsx` renders each section as plain label/value pairs (no inputs), mirroring the admin `NoticeTab.jsx`'s section structure and field set, but read-only and visually compact (see Style section below). Attachments/documents render as a filename + "Open" link (using the pre-signed URL from the response, same pattern as the admin side's `openDocumentLink`).

### Remarks/query to CS

- New field on `InspectionNotice` model: `inspectorQueries: [{ inspectorId: ObjectId, inspectorName: String, message: String, createdAt: Date }]`.
- New endpoint `POST /api/inspector/tasks/:taskId/notice-query` — same ownership check as above (task must belong to the requesting inspector, and must have a linked notice), appends `{ inspectorId: req.user.id, inspectorName: req.user.name, message: req.body.message, createdAt: new Date() }` to `inspectorQueries` and saves.
- Simple textarea + "Send" button under the Notice tab's content. Submitted messages appear in a running list beneath the box (most recent first), so the inspector can see their own query history for this task.
- On the CS side, `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx` gets a new small "Inspector Queries" panel (near the top, since it's actionable info) listing `inspectorQueries` entries — name, message, timestamp. Read-only for CS in this iteration (no reply mechanism — matches your choice of a simple one-way note rather than extending the help-request/chat system).

### Expense tab

New Mongoose model `backend/models/expense.model.js`:

```js
const expenseSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
  noticeId: { type: String, default: null }, // InspectionNotice.noticeId, for CS-side lookup by notice
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{ fileName: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  remarks: { type: String, default: '' },
}, { timestamps: true });
```

One `Expense` document per task (`taskId` unique — created lazily on first upload or remarks save, upserted thereafter).

New endpoints (`backend/controllers/inspector.controller.js`):
- `GET /api/inspector/tasks/:taskId/expense` — fetch the current Expense doc for this task (ownership-checked same as Notice), or an empty shape if none exists yet.
- `POST /api/inspector/tasks/:taskId/expense/upload` (multer, single file) — uploads to Wasabi (reusing the existing upload pattern from `wasabiService.js`), appends `{ fileName, url, uploadedAt }` to `files`, upserting the Expense doc if it doesn't exist yet.
- `PATCH /api/inspector/tasks/:taskId/expense/remarks` — sets `remarks` to the provided text, upserting if needed.

Frontend `frontend/src/dashboards/inspector/components/ExpensePanel.jsx`: an upload button (multi-file, matches the upload-with-progress pattern already used elsewhere in the app) and a remarks textarea with a "Save" button. Lists already-uploaded files with an "Open" link.

CS-side: `frontend/src/dashboards/admin/components/inspection-notice/ExpenseTab.jsx` (currently an empty stub) gets built out to fetch and display Expense records for the current notice (`GET /api/inspection-notices/:id/expenses`, new endpoint querying `Expense.find({ noticeId })`), showing each inspector's uploaded files (with Open links, resolved server-side the same way) and remarks, grouped by inspector if more than one is assigned.

### Report tab

No new logic. Clicking this tab calls the exact same function `InspectorDashboard.jsx` uses today (`handleStartReport(task)` — clears stale localStorage only if switching tasks, then `navigate(getInspectionRoute(task.inspectionType), { state: { task } })`), which now lives in `TaskWorkspace.jsx` instead. The report forms themselves are completely untouched.

### Visual style

Compact and low-emphasis throughout `TaskWorkspace.jsx` and its children:
- Section headings: `text-sm font-bold text-slate-700` (not `text-xl`/`text-2xl`).
- Field labels: `text-xs font-semibold text-slate-500 uppercase tracking-wide`.
- Field values: `text-sm text-slate-700` (not bold).
- Tight padding (`p-3`/`p-4` rather than `p-6`/`p-8`), `space-y-3`/`space-y-4` between sections rather than `space-y-6`.
- Tab bar matches the style in the shared screenshot: underline-on-active (`border-b-2 border-[#6C47FF] text-[#6C47FF]` for the active tab, `border-transparent text-slate-500` otherwise), no pill backgrounds.

## Edge cases

- **Task has no linked notice**: Notice tab shows "No notice on file for this task." Expense and Report tabs are unaffected (Expense doesn't depend on a notice existing — `noticeId` is just `null` in that case; Report tab always works since it only needs the task itself).
- **Inspector tries to access another inspector's task workspace** (e.g., by guessing a taskId in the URL): both new endpoints check `task.assignedInspectorId === req.user.id` and return 403/404 otherwise.
- **Multiple inspectors assigned to one notice** (`teamAssignment.inspectors` has more than one entry, each with their own `Task`): each inspector has their own `Expense` document (keyed by `taskId`), but all share the same notice's `inspectorQueries` list — the admin sees all inspectors' queries in one panel, distinguished by `inspectorName`. The CS-side Expense tab groups by inspector so it's clear whose receipts are whose.
- **Correction Requested / Report Submitted tasks reopening the workspace**: works the same way — Notice tab still shows the (unchanged) notice info, Expense tab still shows/accepts uploads, Report tab still navigates into the report form (which is how resubmission already works today).

## Testing

No test suite exists in this repo. Manual verification: as an inspector, accept a notice-originated task and confirm the workspace opens with Notice tab showing the correct read-only data and "Open" links working; submit a query and confirm it shows up in the admin's `NoticeTab.jsx`; upload an expense file and remarks, confirm they appear via the admin's `ExpenseTab.jsx`; click Report tab and confirm it opens the exact same report form as today's "Start Report" did. Also verify a task with no linked notice shows the fallback message, and that requesting another inspector's task workspace via direct API call returns 403.
