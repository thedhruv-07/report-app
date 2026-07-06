# Inspector Dashboard Report Archival Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reports the inspector has submitted disappear from their dashboard's task list 72 hours after submission (except `Correction Requested`, which stays visible until fixed), while the dashboard's stat cards keep showing true totals and a new count-only search lets the inspector check historical submission volume by month/year or date.

**Architecture:** Add a `reportSubmittedAt` timestamp to `Task`, set at submission time in both report-generation controllers. `GET /api/inspector/tasks` filters archived tasks server-side so the data never reaches the browser. A new `GET /api/inspector/tasks/archived-count` endpoint answers month/year/date lookups with a bare count. The existing `/dashboard/summary` endpoint is untouched, since it already counts independently of the task list.

**Tech Stack:** Express 5 + Mongoose (backend), React 19 (frontend). No test suite exists in this repo — verification steps below use direct `node -` one-off Mongo queries and `curl` against the running dev server instead of an automated test framework.

---

### Task 1: Add `reportSubmittedAt` to the Task model

**Files:**
- Modify: `backend/models/task.model.js:16-17`

- [ ] **Step 1: Confirm the current schema has no submission timestamp**

Run: `grep -n "reportSubmittedAt" backend/models/task.model.js`
Expected: no output (field doesn't exist yet)

- [ ] **Step 2: Add the field**

In `backend/models/task.model.js`, the schema currently reads:

```js
  adminInstructions: { type: String },
  clientCode: { type: String, default: '' },
  prefillData: { type: mongoose.Schema.Types.Mixed, default: null },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
```

Change it to:

```js
  adminInstructions: { type: String },
  clientCode: { type: String, default: '' },
  prefillData: { type: mongoose.Schema.Types.Mixed, default: null },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  reportSubmittedAt: { type: Date, default: null },
```

- [ ] **Step 3: Verify the field is present**

Run: `grep -n "reportSubmittedAt" backend/models/task.model.js`
Expected: `  reportSubmittedAt: { type: Date, default: null },`

- [ ] **Step 4: Commit**

```bash
git add backend/models/task.model.js
git commit -m "feat: add reportSubmittedAt timestamp to Task model"
```

---

### Task 2: Stamp `reportSubmittedAt` when a report is submitted

Both report-generation controllers already flip a task's status to `'Report Submitted'` in one place each. Add the timestamp at both call sites — this naturally also refreshes the timestamp on every resubmission after a correction, since resubmission goes through the same code path.

**Files:**
- Modify: `backend/controllers/report.controller.js:231-234`
- Modify: `backend/controllers/factoryAudit.controller.js:133`

- [ ] **Step 1: Update `report.controller.js`**

Current code (line 231-234):

```js
          await Task.findByIdAndUpdate(data.taskId, {
            status: 'Report Submitted',
            reportId: report._id,
          });
```

Change to:

```js
          await Task.findByIdAndUpdate(data.taskId, {
            status: 'Report Submitted',
            reportId: report._id,
            reportSubmittedAt: new Date(),
          });
```

- [ ] **Step 2: Update `factoryAudit.controller.js`**

Current code (line 133):

```js
        await Task.findByIdAndUpdate(taskId, { status: 'Report Submitted', reportId: report._id });
```

Change to:

```js
        await Task.findByIdAndUpdate(taskId, { status: 'Report Submitted', reportId: report._id, reportSubmittedAt: new Date() });
```

- [ ] **Step 3: Verify both call sites were updated**

Run: `grep -n "reportSubmittedAt" backend/controllers/report.controller.js backend/controllers/factoryAudit.controller.js`
Expected: one match per file, both inside their respective `Task.findByIdAndUpdate` calls.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/report.controller.js backend/controllers/factoryAudit.controller.js
git commit -m "feat: stamp reportSubmittedAt on report submission"
```

---

### Task 3: Filter archived tasks out of the inspector's task list

**Files:**
- Modify: `backend/controllers/inspector.controller.js:1-42`

- [ ] **Step 1: Write a one-off check confirming today's (pre-fix) behavior returns every task regardless of age**

This assumes you have at least one `Task` document with `status: 'Report Submitted'` in your dev database (from earlier testing in this repo). Find one and note its `_id`, then manually backdate it to simulate an old submission:

Run (replace `<TASK_ID>` with a real id, e.g. from `mongosh` or Compass):

```bash
node - <<'EOF'
require('dotenv').config({ path: __dirname + '/backend/.env' });
const mongoose = require('mongoose');
const Task = require('./backend/models/task.model');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const task = await Task.findOne({ status: 'Report Submitted' });
  if (!task) { console.log('No Report Submitted task found — create one first.'); process.exit(0); }
  task.reportSubmittedAt = new Date(Date.now() - 96 * 60 * 60 * 1000); // 96h ago, past the 72h window
  await task.save();
  console.log('Backdated task', task._id.toString(), 'to', task.reportSubmittedAt);
  process.exit(0);
})();
EOF
```

Then hit the endpoint as that inspector (replace `<TOKEN>` with a real JWT from logging in as that inspector):

Run: `curl -s http://localhost:5000/api/inspector/tasks -H "Authorization: Bearer <TOKEN>" | node -e "const d=JSON.parse(require('fs').readFileSync(0)); console.log(d.tasks.length)"`
Expected (before the fix): the backdated task's id is still present in the response — count includes it.

- [ ] **Step 2: Implement the filter**

Current code in `backend/controllers/inspector.controller.js`:

```js
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const tasks = await Task.find({ assignedInspectorId: userId }).sort({ scheduledDate: 1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
```

Change to:

```js
const ARCHIVABLE_STATUSES = ['Report Submitted', 'Under Review', 'Finalized'];
const ARCHIVE_WINDOW_MS = 72 * 60 * 60 * 1000;

const getTasks = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const cutoff = new Date(Date.now() - ARCHIVE_WINDOW_MS);
    const tasks = await Task.find({
      assignedInspectorId: userId,
      $or: [
        { status: { $nin: ARCHIVABLE_STATUSES } },  // not yet submitted, or Correction Requested — always visible
        { reportSubmittedAt: { $gt: cutoff } },      // submitted, still within the 72h window
        { reportSubmittedAt: null },                 // legacy data safety net — never hide if we don't know when it was submitted
      ],
    }).sort({ scheduledDate: 1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
```

Place the two new `const` declarations directly above `getTasks`, below the existing `const Notification = require(...)` / `const notifyStaff = require(...)` lines at the top of the file.

- [ ] **Step 3: Re-run the same check to confirm the archived task is now excluded**

Run the same `curl` command from Step 1.
Expected (after the fix): response no longer includes the backdated task; count is one less than before.

- [ ] **Step 4: Confirm a `Correction Requested` task is never hidden regardless of age**

Run:

```bash
node - <<'EOF'
require('dotenv').config({ path: __dirname + '/backend/.env' });
const mongoose = require('mongoose');
const Task = require('./backend/models/task.model');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const task = await Task.findOne({ status: 'Report Submitted' });
  task.status = 'Correction Requested';
  task.reportSubmittedAt = new Date(Date.now() - 240 * 60 * 60 * 1000); // 10 days ago
  await task.save();
  console.log('Set task', task._id.toString(), 'to Correction Requested, 10 days old');
  process.exit(0);
})();
EOF
```

Run: `curl -s http://localhost:5000/api/inspector/tasks -H "Authorization: Bearer <TOKEN>" | node -e "const d=JSON.parse(require('fs').readFileSync(0)); console.log(d.tasks.map(t=>t.status))"`
Expected: `'Correction Requested'` appears in the list even though `reportSubmittedAt` is 10 days old.

- [ ] **Step 5: Restore the test task to a clean state**

Run:

```bash
node - <<'EOF'
require('dotenv').config({ path: __dirname + '/backend/.env' });
const mongoose = require('mongoose');
const Task = require('./backend/models/task.model');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const task = await Task.findOne({ status: 'Correction Requested' });
  task.status = 'Report Submitted';
  task.reportSubmittedAt = new Date();
  await task.save();
  console.log('Reset task', task._id.toString());
  process.exit(0);
})();
EOF
```

- [ ] **Step 6: Confirm the summary endpoint is unaffected**

Run: `curl -s http://localhost:5000/api/inspector/dashboard/summary -H "Authorization: Bearer <TOKEN>"`
Expected: `totalTasks` includes the archived task (unchanged by Task 3's filtering, since `getSummary` was not modified).

- [ ] **Step 7: Commit**

```bash
git add backend/controllers/inspector.controller.js
git commit -m "fix: hide reports 72h after submission from inspector task list"
```

---

### Task 4: Add the archived-count search endpoint

**Files:**
- Modify: `backend/controllers/inspector.controller.js` (add `getArchivedCount`, export it)
- Modify: `backend/routes/inspector.routes.js:15-17`

- [ ] **Step 1: Add the controller function**

In `backend/controllers/inspector.controller.js`, add this function directly below `getTasks`:

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
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
```

- [ ] **Step 2: Export it**

Current export block at the bottom of `backend/controllers/inspector.controller.js`:

```js
module.exports = {
  getSummary,
  getTasks,
  getTaskById,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

Change to:

```js
module.exports = {
  getSummary,
  getTasks,
  getArchivedCount,
  getTaskById,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

- [ ] **Step 3: Register the route — BEFORE `/tasks/:taskId`**

Current routes in `backend/routes/inspector.routes.js`:

```js
// Tasks
router.get("/tasks", inspectorController.getTasks);
router.get("/tasks/:taskId", inspectorController.getTaskById);
```

Change to:

```js
// Tasks
router.get("/tasks", inspectorController.getTasks);
router.get("/tasks/archived-count", inspectorController.getArchivedCount);
router.get("/tasks/:taskId", inspectorController.getTaskById);
```

This ordering matters: Express matches routes in registration order, so `/tasks/archived-count` must be registered before the `/tasks/:taskId` param route, otherwise Express would treat `"archived-count"` as a `taskId` value and route the request to `getTaskById` instead.

- [ ] **Step 4: Verify with a real request**

With the dev server running (`npm run dev` from repo root) and a valid inspector JWT:

Run: `curl -s "http://localhost:5000/api/inspector/tasks/archived-count?month=7&year=2026" -H "Authorization: Bearer <TOKEN>"`
Expected: `{"count":<some number>}` — a number, not a 404 or the `getTaskById` "Task not found" error.

Run: `curl -s "http://localhost:5000/api/inspector/tasks/archived-count?date=2026-07-06" -H "Authorization: Bearer <TOKEN>"`
Expected: `{"count":<some number>}`

Run: `curl -s "http://localhost:5000/api/inspector/tasks/archived-count" -H "Authorization: Bearer <TOKEN>"`
Expected: `{"error":"Provide either date, or month and year"}`

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/inspector.controller.js backend/routes/inspector.routes.js
git commit -m "feat: add archived report count-search endpoint"
```

---

### Task 5: Add the Archived Reports search panel to the frontend

**Files:**
- Modify: `frontend/src/config/api.js:32-44`
- Modify: `frontend/src/dashboards/inspector/InspectorDashboard.jsx`

- [ ] **Step 1: Add the endpoint helper**

Current block in `frontend/src/config/api.js`:

```js
  INSPECTOR: {
    SUMMARY: `${API_BASE_URL}/api/inspector/dashboard/summary`,
    TASKS: `${API_BASE_URL}/api/inspector/tasks`,
    TASK_BY_ID: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}`,
```

Change to:

```js
  INSPECTOR: {
    SUMMARY: `${API_BASE_URL}/api/inspector/dashboard/summary`,
    TASKS: `${API_BASE_URL}/api/inspector/tasks`,
    ARCHIVED_COUNT: `${API_BASE_URL}/api/inspector/tasks/archived-count`,
    TASK_BY_ID: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}`,
```

- [ ] **Step 2: Add state and the search handler**

In `frontend/src/dashboards/inspector/InspectorDashboard.jsx`, directly below the existing:

```js
  const [selectedTask, setSelectedTask] = useState(null);
  const [acceptingTaskId, setAcceptingTaskId] = useState(null);
```

Add:

```js
  const [archiveMonthYear, setArchiveMonthYear] = useState(""); // "YYYY-MM" from <input type="month">
  const [archiveDate, setArchiveDate] = useState("");           // "YYYY-MM-DD" from <input type="date">
  const [archiveResult, setArchiveResult] = useState(null);     // number | null
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState(null);
```

Directly below the existing `handleAcceptTask` function, add:

```js
  const handleArchiveSearch = async () => {
    if (!archiveMonthYear && !archiveDate) return;
    setArchiveLoading(true);
    setArchiveError(null);
    setArchiveResult(null);
    try {
      const params = new URLSearchParams();
      if (archiveDate) {
        params.set('date', archiveDate);
      } else {
        const [year, month] = archiveMonthYear.split('-');
        params.set('year', year);
        params.set('month', String(Number(month)));
      }
      const res = await fetch(`${ENDPOINTS.INSPECTOR.ARCHIVED_COUNT}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setArchiveResult(data.count);
    } catch {
      setArchiveError('Could not fetch archived report count.');
    } finally {
      setArchiveLoading(false);
    }
  };
```

- [ ] **Step 3: Add the panel to the JSX**

Current JSX has the status pill filters block, immediately followed by the `MessagesPanel` Suspense:

```jsx
        {/* Status pill filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => {
            const count = filterCount(f.value);
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs font-bold ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Suspense fallback={null}>
          <MessagesPanel />
        </Suspense>
```

Insert the new panel between them:

```jsx
        {/* Status pill filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => {
            const count = filterCount(f.value);
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs font-bold ${active ? 'text-blue-200' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Archived Reports count-search — reports older than 72h no longer appear in the grid above;
            this looks up how many were submitted in a given period without exposing their details. */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-sm font-bold text-slate-700 shrink-0">Search Archived Reports</h3>
          <input
            type="month"
            value={archiveMonthYear}
            onChange={(e) => { setArchiveMonthYear(e.target.value); setArchiveDate(""); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <span className="text-xs text-slate-400">or</span>
          <input
            type="date"
            value={archiveDate}
            onChange={(e) => { setArchiveDate(e.target.value); setArchiveMonthYear(""); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleArchiveSearch}
            disabled={archiveLoading || (!archiveMonthYear && !archiveDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {archiveLoading ? 'Searching…' : 'Search'}
          </button>
          {archiveError && <span className="text-sm text-red-600">{archiveError}</span>}
          {archiveResult !== null && !archiveError && (
            <span className="text-sm text-slate-700">
              <strong className="text-blue-600">{archiveResult}</strong> report{archiveResult !== 1 ? 's' : ''} submitted in this period
            </span>
          )}
        </div>

        <Suspense fallback={null}>
          <MessagesPanel />
        </Suspense>
```

- [ ] **Step 4: Lint the changed files**

Run: `cd frontend && npx eslint src/dashboards/inspector/InspectorDashboard.jsx src/config/api.js`
Expected: no errors (pre-existing warnings elsewhere in the repo are fine; there should be none new in these two files).

- [ ] **Step 5: Manual browser check**

Run: `cd frontend && npm run dev` (and separately, from repo root, `npm run dev` for the backend if not already running).

In the browser, log in as an inspector, go to `/dashboard/inspector`, and confirm:
- The "Search Archived Reports" panel appears between the status pills and the Messages panel.
- Picking a month/year and clicking Search shows a count (e.g. "3 reports submitted in this period").
- Picking a specific date instead of month/year also works, and clears the month/year input (and vice versa).
- No list or clickable report data appears from this panel — only the number.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/config/api.js frontend/src/dashboards/inspector/InspectorDashboard.jsx
git commit -m "feat: add Archived Reports count-search panel to inspector dashboard"
```

---

## Self-Review Notes

- **Spec coverage:** Data model change → Task 1. Stamping on submission (incl. resubmission refresh) → Task 2. Visibility rule + Correction Requested exemption + stat cards untouched → Task 3 (Steps 4 and 6 explicitly verify the two trickiest spec requirements). Archive count-search endpoint + panel → Tasks 4-5. All spec sections are covered.
- **Placeholder scan:** No TBD/TODO; every step has literal code or literal commands with expected output.
- **Type/name consistency:** `reportSubmittedAt` (Task 1) is the exact field name used in Tasks 2, 3, and 4. `getArchivedCount` (Task 4's controller function) matches the route wiring in the same task and matches `ENDPOINTS.INSPECTOR.ARCHIVED_COUNT` in Task 5. `ARCHIVABLE_STATUSES` (Task 3, for hiding) intentionally excludes `Correction Requested`, while the separate inline status list in `getArchivedCount` (Task 4, for counting) intentionally includes it — these are different lists for different purposes and are not meant to be the same constant.
