# Inspector Dashboard Report Archival — Design Spec

## Problem

The Inspector Dashboard's "Inspection Tasks" list shows every task ever assigned to the inspector, forever. Completed reports pile up indefinitely, cluttering the view. The inspector wants completed reports to age out of the visible list automatically, while the top-of-dashboard stat cards keep reflecting true totals, and while still being able to check historical volume by date without seeing the actual report content again.

## Goals

- A report that's been submitted (and not sent back for correction) disappears from the inspector's visible task list 72 hours after submission.
- The top stat cards (Total Assigned, Pending Actions, Reports Submitted, Review/Finalized) are unaffected — they always reflect true totals, including archived reports.
- The inspector can look up how many reports they submitted in a given month/year or on a specific date, as a count only — no list, no way to open the individual reports from that search.

## Non-goals

- No change to admin/manager visibility of reports — this only affects what the inspector's own dashboard task list returns.
- No data deletion. "Archived" tasks still exist in full in the database; they're just excluded from the inspector's `GET /tasks` response.
- No change to how reports are generated, reviewed, or finalized.

## Data model change

Add to `backend/models/task.model.js`:

```js
reportSubmittedAt: { type: Date, default: null },
```

Set every time a task's status transitions **into** `'Report Submitted'` — including on resubmission after a correction, not just the first time:

- `backend/controllers/report.controller.js` (~line 231), inside the `Task.findByIdAndUpdate(data.taskId, { status: 'Report Submitted', reportId: report._id })` call — add `reportSubmittedAt: new Date()`.
- `backend/controllers/factoryAudit.controller.js` (~line 133), same addition to its `Task.findByIdAndUpdate(taskId, { status: 'Report Submitted', reportId: report._id })` call.

Re-setting it on every resubmission means a task that comes back from `Correction Requested` gets a fresh 72-hour visibility window on its latest submission, rather than immediately re-archiving using a stale original timestamp. (See Edge Cases.)

`reportSubmittedAt` stays `null` for tasks in `Pending Acceptance` / `Accepted` — they have no timer and are always visible.

## Visibility rule (backend-enforced)

In `backend/controllers/inspector.controller.js`, `getTasks` currently does:

```js
const tasks = await Task.find({ assignedInspectorId: userId }).sort({ scheduledDate: 1 });
```

Change to exclude archived tasks server-side (never sent to the client at all):

```js
const ARCHIVABLE_STATUSES = ['Report Submitted', 'Under Review', 'Finalized'];
const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

const tasks = await Task.find({
  assignedInspectorId: userId,
  $or: [
    { status: { $nin: ARCHIVABLE_STATUSES } },              // not yet submitted, or Correction Requested — always visible
    { reportSubmittedAt: { $gt: cutoff } },                  // submitted, but still within the 72h window
    { reportSubmittedAt: null },                             // submitted-status but no timestamp (legacy data safety net)
  ],
}).sort({ scheduledDate: 1 });
```

Note `'Correction Requested'` is deliberately absent from `ARCHIVABLE_STATUSES`, so it always matches the first `$or` branch regardless of `reportSubmittedAt` age — it's never archived while the inspector still owes a fix.

`getSummary` (the endpoint behind the four stat cards) is **not modified** — it already counts directly from the database independent of the task list, so it continues to reflect true totals automatically.

## Frontend changes

`frontend/src/dashboards/inspector/InspectorDashboard.jsx`:
- No changes needed to stat-card rendering or `fetchDashboardData` — the existing `/dashboard/summary` and `/tasks` calls already point at the right places; the backend filtering above is transparent to this file.
- Existing behavior (search, status pills, task grid) operates only on whatever `/tasks` returns, so archived tasks simply won't appear — no frontend filtering logic needed.

New: an "Archived Reports" count-search panel, placed between the status pill filters and the task grid.

- Two inputs: a month+year picker (e.g. `<input type="month">`) OR a specific date picker (e.g. `<input type="date">`) — either one, not both at once. A small toggle or two side-by-side inputs where filling one clears the other.
- A "Search" button calls the new endpoint (below) and displays the result as plain text, e.g.:
  > **12 reports** submitted in June 2026
- No list, no cards, no click-through — exactly the count, nothing else.

## New endpoint

`GET /api/inspector/tasks/archived-count` in `backend/controllers/inspector.controller.js`, routed in `backend/routes/inspector.routes.js`.

Query params: `month` + `year` (both required together, e.g. `?month=6&year=2026`) OR `date` (e.g. `?date=2026-06-15`) — mutually exclusive.

```js
const getArchivedCount = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { month, year, date } = req.query;

    let start, end;
    if (date) {
      start = new Date(`${date}T00:00:00.000Z`);
      end = new Date(`${date}T23:59:59.999Z`);
    } else if (month && year) {
      start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));
    } else {
      return res.status(400).json({ error: 'Provide either date, or month and year' });
    }

    const count = await Task.countDocuments({
      assignedInspectorId: userId,
      status: { $in: ['Report Submitted', 'Under Review', 'Finalized', 'Correction Requested'] },
      reportSubmittedAt: { $gte: start, $lte: end },
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
};
```

This counts *all* reports submitted in the period, whether or not they're currently archived or still within the visible 72-hour window — it's a historical lookup tool, not a duplicate of the archived-only set.

## Edge cases

- **Correction Requested after the 72h window already passed**: the task is exempt while in that status (see visibility rule), so it stays visible the whole time. Once resubmitted, `reportSubmittedAt` is refreshed to the resubmission time (per the Data Model Change section above), giving it a new 72-hour window rather than immediately re-archiving off a stale original timestamp.
- **Legacy tasks with no `reportSubmittedAt`** (created before this change, already in `Report Submitted`/`Under Review`/`Finalized`): the `reportSubmittedAt: null` branch in the visibility query keeps them visible indefinitely rather than immediately archiving or crashing. No backfill migration is planned — they'll get a real timestamp the next time (if ever) their status changes through the submission path, or otherwise just remain visible, which is a safe default (fails open, not closed).
- **Deep links** (`?task=<id>` from notifications/emails) to an already-archived task: confirmed acceptable — the task-details modal just won't find it and won't open.

## Testing

- Manual verification (no test suite in this repo per CLAUDE.md): submit a report, confirm it's visible; manually backdate `reportSubmittedAt` in MongoDB to >72h ago, confirm it disappears from `/tasks` but stat cards are unchanged; set status to `Correction Requested` on an old task, confirm it's visible regardless of age; hit the new archived-count endpoint with a known month, confirm the count matches a direct DB query.
