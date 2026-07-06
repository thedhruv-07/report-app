# Inspector Task Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After accepting a task, the inspector lands on a new `/dashboard/inspector/task/:taskId` workspace with three tabs — Notice (read-only CS-filled summary + a query box), Expense (new upload+remarks feature), Report (unchanged, opens the existing report form) — instead of jumping straight into the report form.

**Architecture:** Two new backend surfaces (inspector-scoped Notice/Expense endpoints with ownership checks, plus a small CS-facing Expense endpoint), one new Mongoose model (`Expense`), one new field on `InspectionNotice` (`inspectorQueries`), and a new frontend page (`TaskWorkspace.jsx`) that becomes the single entry point for opening any task beyond `Pending Acceptance`.

**Tech Stack:** Express 5 + Mongoose (backend), React 19 + React Router (frontend). No test suite exists in this repo — verification uses `node -c` syntax checks, `curl`/`node -` one-off DB queries, `eslint`, and manual browser checks, consistent with the rest of this repo's verification approach.

---

### Task 1: Expense model

**Files:**
- Create: `backend/models/expense.model.js`

- [ ] **Step 1: Confirm no Expense model exists yet**

Run: `ls backend/models/expense.model.js 2>&1`
Expected: `No such file or directory` (or Windows equivalent "cannot find")

- [ ] **Step 2: Create the model**

```js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
  noticeId: { type: String, default: null },
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{
    fileName: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  remarks: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);
```

- [ ] **Step 3: Verify it loads without error**

Run: `node -e "require('./backend/models/expense.model.js'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/models/expense.model.js
git commit -m "feat: add Expense model for inspector task expense uploads"
```

---

### Task 2: Add inspectorQueries to InspectionNotice

**Files:**
- Modify: `backend/models/InspectionNotice.js:192-198`

- [ ] **Step 1: Add the field**

Current code (right after `submissionRecords`, before the `// REPORT (ONLINE) TAB` comment):

```js
  // SECTION 16: Instructional Letters Reading Record — logs each time the
  // notice is actually submitted (status set to 'scheduled'), not page views.
  submissionRecords: [{
    submittedBy: String,
    timeSubmitted: Date
  }],

  // REPORT (ONLINE) TAB
```

Change to:

```js
  // SECTION 16: Instructional Letters Reading Record — logs each time the
  // notice is actually submitted (status set to 'scheduled'), not page views.
  submissionRecords: [{
    submittedBy: String,
    timeSubmitted: Date
  }],

  // Queries/remarks an assigned inspector raises against this notice from
  // their Task Workspace's Notice tab. One-way — CS sees these, no reply flow.
  inspectorQueries: [{
    inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inspectorName: String,
    message: String,
    raisedAt: { type: Date, default: Date.now },
  }],

  // REPORT (ONLINE) TAB
```

- [ ] **Step 2: Verify**

Run: `grep -n "inspectorQueries" backend/models/InspectionNotice.js`
Expected: shows the new field block.

- [ ] **Step 3: Commit**

```bash
git add backend/models/InspectionNotice.js
git commit -m "feat: add inspectorQueries field to InspectionNotice model"
```

---

### Task 3: Inspector-scoped Notice endpoint + query submission

**Files:**
- Modify: `backend/controllers/inspector.controller.js` (add `getTaskNotice`, `submitNoticeQuery`; add requires + export)

- [ ] **Step 1: Add requires at the top of the file**

Current top of `backend/controllers/inspector.controller.js`:

```js
const Task = require('../models/task.model');
const Notification = require('../models/notification.model');
const notifyStaff = require('../utils/notifyStaff');
```

Change to:

```js
const Task = require('../models/task.model');
const Notification = require('../models/notification.model');
const notifyStaff = require('../utils/notifyStaff');
const InspectionNotice = require('../models/InspectionNotice');
const wasabiService = require('../services/wasabiService');

const NOTICE_SUMMARY_FIELDS = 'basicInfo teamAssignment productInfo aql inspectionRequirements specialClientRequirements customerSamples inspectionInfo attachments inspectionTools onSiteTests defectClassifications supplierInfo factoryInfo noticeId';

async function resolveNoticeDocUrls(notice) {
  const resolve = async (entry) => {
    if (!entry || !entry.url) return entry;
    try {
      const key = wasabiService.extractKey(entry.url);
      const signedUrl = await wasabiService.getSignedUrl(key);
      return { ...entry, url: signedUrl };
    } catch (err) {
      // This bucket has public-read ACLs blocked account-wide, so falling back
      // to the original unsigned URL would hand the frontend a link that's
      // guaranteed to 403. Null it out instead so DocLink renders "—".
      console.error('[getTaskNotice] Failed to resolve signed URL:', err.message);
      return { ...entry, url: null };
    }
  };

  const info = notice.inspectionInfo || {};
  const att = notice.attachments || {};

  const [onlineWI, onlineCustomerClaimForm, reportTemplate, clientFiles, supplierFiles] = await Promise.all([
    resolve(info.onlineWI),
    resolve(info.onlineCustomerClaimForm),
    Promise.all((info.reportTemplate || []).map(resolve)),
    Promise.all((att.clientFiles || []).map(resolve)),
    Promise.all((att.supplierFiles || []).map(resolve)),
  ]);

  return {
    ...notice.toObject(),
    inspectionInfo: { ...info, onlineWI, onlineCustomerClaimForm, reportTemplate },
    attachments: { ...att, clientFiles, supplierFiles },
  };
}
```

- [ ] **Step 2: Add `getTaskNotice`**

Add directly below `getTaskById`:

```js
const getTaskNotice = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const noticeId = task.prefillData?.noticeId;
    if (!noticeId) return res.json({ notice: null });

    const notice = await InspectionNotice.findOne({ noticeId }).select(NOTICE_SUMMARY_FIELDS + ' inspectorQueries');
    if (!notice) return res.json({ notice: null });

    const resolved = await resolveNoticeDocUrls(notice);
    res.json({ notice: resolved });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
```

- [ ] **Step 3: Add `submitNoticeQuery`**

Add directly below `getTaskNotice`:

```js
const submitNoticeQuery = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: "message is required" });

    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const noticeId = task.prefillData?.noticeId;
    if (!noticeId) return res.status(400).json({ error: "This task has no linked notice" });

    const notice = await InspectionNotice.findOneAndUpdate(
      { noticeId },
      { $push: { inspectorQueries: { inspectorId: userId, inspectorName: req.user.name, message: message.trim(), raisedAt: new Date() } } },
      { new: true }
    ).select('inspectorQueries');
    if (!notice) return res.status(404).json({ error: "Notice not found" });

    res.json({ inspectorQueries: notice.inspectorQueries });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
```

- [ ] **Step 4: Export both**

Current export block:

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

Change to:

```js
module.exports = {
  getSummary,
  getTasks,
  getArchivedCount,
  getTaskById,
  getTaskNotice,
  submitNoticeQuery,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

- [ ] **Step 5: Syntax check**

Run: `node -c backend/controllers/inspector.controller.js`
Expected: no output (success)

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/inspector.controller.js
git commit -m "feat: add inspector-scoped notice summary and query endpoints"
```

---

### Task 4: Inspector-scoped Expense endpoints

**Files:**
- Modify: `backend/controllers/inspector.controller.js` (add `getTaskExpense`, `uploadTaskExpenseFile`, `updateTaskExpenseRemarks`; add require + export)

- [ ] **Step 1: Add the Expense model require**

Add alongside the other requires added in Task 3, Step 1:

```js
const Expense = require('../models/expense.model');
```

- [ ] **Step 2: Add the three functions**

Add directly below `submitNoticeQuery`:

```js
async function resolveExpenseFileUrls(expense) {
  const plain = expense.toObject ? expense.toObject() : expense;
  const files = await Promise.all((plain.files || []).map(async (f) => {
    try {
      const key = wasabiService.extractKey(f.url);
      const signedUrl = await wasabiService.getSignedUrl(key);
      return { ...f, url: signedUrl };
    } catch (err) {
      console.error('[resolveExpenseFileUrls] Failed to resolve signed URL:', err.message);
      return { ...f, url: null };
    }
  }));
  return { ...plain, files };
}

const getTaskExpense = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const expense = await Expense.findOne({ taskId: task._id });
    const resolved = await resolveExpenseFileUrls(expense || { taskId: task._id, files: [], remarks: '' });
    res.json({ expense: resolved });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const uploadTaskExpenseFile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { url } = await wasabiService.uploadFile(req.file);
    const entry = { fileName: req.file.originalname, url, uploadedAt: new Date() };

    const expense = await Expense.findOneAndUpdate(
      { taskId: task._id },
      {
        $push: { files: entry },
        $setOnInsert: { taskId: task._id, inspectorId: userId, noticeId: task.prefillData?.noticeId || null },
      },
      { new: true, upsert: true }
    );
    const resolved = await resolveExpenseFileUrls(expense);
    res.json({ expense: resolved });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};

const updateTaskExpenseRemarks = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { remarks } = req.body;
    const task = await Task.findOne({ _id: req.params.taskId, assignedInspectorId: userId });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const expense = await Expense.findOneAndUpdate(
      { taskId: task._id },
      {
        remarks: remarks || '',
        $setOnInsert: { taskId: task._id, inspectorId: userId, noticeId: task.prefillData?.noticeId || null },
      },
      { new: true, upsert: true }
    );
    const resolved = await resolveExpenseFileUrls(expense);
    res.json({ expense: resolved });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};
```

(This differs from the original Task 4 draft — a `resolveExpenseFileUrls` helper was added after Task 10's review found the original version returned raw, unsigned Wasabi URLs that 403 given this bucket's public-read-blocked account, mirroring the fix already applied to `resolveNoticeDocUrls`/`getNoticeExpenses`.)

- [ ] **Step 3: Export the three new functions**

Change the export block from Task 3 to:

```js
module.exports = {
  getSummary,
  getTasks,
  getArchivedCount,
  getTaskById,
  getTaskNotice,
  submitNoticeQuery,
  getTaskExpense,
  uploadTaskExpenseFile,
  updateTaskExpenseRemarks,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

- [ ] **Step 4: Syntax check**

Run: `node -c backend/controllers/inspector.controller.js`
Expected: no output (success)

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/inspector.controller.js
git commit -m "feat: add inspector-scoped expense upload and remarks endpoints"
```

---

### Task 5: Wire up the new inspector routes

**Files:**
- Modify: `backend/routes/inspector.routes.js`

- [ ] **Step 1: Add the upload middleware require**

Current top of file:

```js
const express = require("express");
const router = express.Router();
const inspectorController = require("../controllers/inspector.controller");
const helpRequestController = require("../controllers/helpRequest.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
```

Change to:

```js
const express = require("express");
const router = express.Router();
const inspectorController = require("../controllers/inspector.controller");
const helpRequestController = require("../controllers/helpRequest.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
const upload = require("../middleware/upload.middleware");
```

- [ ] **Step 2: Add the new routes**

Current Tasks section:

```js
// Tasks
router.get("/tasks", inspectorController.getTasks);
router.get("/tasks/archived-count", inspectorController.getArchivedCount);
router.get("/tasks/:taskId", inspectorController.getTaskById);
router.post("/tasks/:taskId/accept", inspectorController.acceptTask);
router.patch("/tasks/:taskId/section-skip", inspectorController.addSectionSkipReason);
```

Change to:

```js
// Tasks
router.get("/tasks", inspectorController.getTasks);
router.get("/tasks/archived-count", inspectorController.getArchivedCount);
router.get("/tasks/:taskId/notice", inspectorController.getTaskNotice);
router.post("/tasks/:taskId/notice-query", inspectorController.submitNoticeQuery);
router.get("/tasks/:taskId/expense", inspectorController.getTaskExpense);
router.post("/tasks/:taskId/expense/upload", upload.single('file'), inspectorController.uploadTaskExpenseFile);
router.patch("/tasks/:taskId/expense/remarks", inspectorController.updateTaskExpenseRemarks);
router.get("/tasks/:taskId", inspectorController.getTaskById);
router.post("/tasks/:taskId/accept", inspectorController.acceptTask);
router.patch("/tasks/:taskId/section-skip", inspectorController.addSectionSkipReason);
```

Note the ordering: all the specific `/tasks/:taskId/<segment>` routes are registered before the bare `/tasks/:taskId` route, for the same reason `archived-count` had to come before it — Express matches in registration order, and `:taskId` would otherwise swallow literal segments like `notice` or `expense`.

- [ ] **Step 3: Syntax check**

Run: `node -c backend/routes/inspector.routes.js`
Expected: no output (success)

- [ ] **Step 4: Verify route ordering doesn't break existing routes**

Run: `grep -n "router.get\|router.post\|router.patch" backend/routes/inspector.routes.js`
Expected: `/tasks/:taskId` (bare) appears AFTER `/tasks/:taskId/notice`, `/tasks/:taskId/expense`, etc. in the list.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/inspector.routes.js
git commit -m "feat: wire up inspector notice and expense routes"
```

---

### Task 6: CS-side endpoint to view expenses for a notice

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js` (add `getNoticeExpenses` + export)
- Modify: `backend/routes/inspectionNotice.routes.js:20-21`

- [ ] **Step 1: Add the controller function**

Add near the top of `backend/controllers/inspectionNotice.controller.js`, after the existing `resolveDocumentUrl` export (around line 132):

Also add `const Expense = require("../models/expense.model");` to the top-of-file requires (`wasabiService` is already required there — reuse it, don't re-require it inline).

```js
exports.getNoticeExpenses = async (req, res) => {
  try {
    const { id } = req.params;

    const expenses = await Expense.find({ noticeId: id }).populate('inspectorId', 'name email');

    const resolved = await Promise.all(expenses.map(async (exp) => {
      const files = await Promise.all((exp.files || []).map(async (f) => {
        try {
          const key = wasabiService.extractKey(f.url);
          const signedUrl = await wasabiService.getSignedUrl(key);
          return { ...f.toObject(), url: signedUrl };
        } catch (err) {
          // Same reasoning as resolveNoticeDocUrls in Task 3 — the bucket has
          // public-read blocked account-wide, so an unsigned fallback URL is
          // guaranteed to 403. Null it out instead of handing back a dead link.
          console.error('[getNoticeExpenses] Failed to resolve signed URL:', err.message);
          return { ...f.toObject(), url: null };
        }
      }));
      return { ...exp.toObject(), files };
    }));

    res.json({ expenses: resolved });
  } catch (error) {
    console.error("Error fetching notice expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};
```

- [ ] **Step 2: Add the route**

Current lines in `backend/routes/inspectionNotice.routes.js`:

```js
router.get("/:id", inspectionNoticeController.getNoticeById);
router.get("/:id/recent-by-factory", inspectionNoticeController.getRecentByFactory);
```

Change to:

```js
router.get("/:id", inspectionNoticeController.getNoticeById);
router.get("/:id/recent-by-factory", inspectionNoticeController.getRecentByFactory);
router.get("/:id/expenses", roleCheck(["admin", "manager"]), inspectionNoticeController.getNoticeExpenses);
```

- [ ] **Step 3: Syntax check**

Run: `node -c backend/controllers/inspectionNotice.controller.js && node -c backend/routes/inspectionNotice.routes.js`
Expected: no output (success)

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/routes/inspectionNotice.routes.js
git commit -m "feat: add admin endpoint to view inspector expense submissions"
```

---

### Task 7: Frontend endpoint helpers

**Files:**
- Modify: `frontend/src/config/api.js:32-44`

- [ ] **Step 1: Add the new INSPECTOR endpoints**

Current block:

```js
  INSPECTOR: {
    SUMMARY: `${API_BASE_URL}/api/inspector/dashboard/summary`,
    TASKS: `${API_BASE_URL}/api/inspector/tasks`,
    ARCHIVED_COUNT: `${API_BASE_URL}/api/inspector/tasks/archived-count`,
    TASK_BY_ID: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}`,
    ACCEPT_TASK: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/accept`,
    SECTION_SKIP: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/section-skip`,
```

Change to:

```js
  INSPECTOR: {
    SUMMARY: `${API_BASE_URL}/api/inspector/dashboard/summary`,
    TASKS: `${API_BASE_URL}/api/inspector/tasks`,
    ARCHIVED_COUNT: `${API_BASE_URL}/api/inspector/tasks/archived-count`,
    TASK_BY_ID: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}`,
    TASK_NOTICE: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/notice`,
    TASK_NOTICE_QUERY: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/notice-query`,
    TASK_EXPENSE: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/expense`,
    TASK_EXPENSE_UPLOAD: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/expense/upload`,
    TASK_EXPENSE_REMARKS: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/expense/remarks`,
    ACCEPT_TASK: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/accept`,
    SECTION_SKIP: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/section-skip`,
```

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint src/config/api.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/config/api.js
git commit -m "feat: add frontend endpoint helpers for task notice and expense"
```

---

### Task 8: TaskWorkspace page shell + routing

**Files:**
- Create: `frontend/src/dashboards/inspector/pages/TaskWorkspace.jsx`
- Create: `frontend/src/dashboards/inspector/components/CompactCard.jsx`
- Modify: `frontend/src/routes/appRoutes.jsx`
- Modify: `frontend/src/main.jsx:23-43,80-82`

- [ ] **Step 1: Create the shared compact card component**

```jsx
export default function CompactCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
```

Save as `frontend/src/dashboards/inspector/components/CompactCard.jsx`.

- [ ] **Step 2: Create the TaskWorkspace page shell**

```jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { clearFormStorage } from '../../../shared/services';
import { ChevronLeft, FileText, Receipt, ClipboardList } from "lucide-react";
import NoticeSummary from '../components/NoticeSummary';
import ExpensePanel from '../components/ExpensePanel';

const TABS = [
  { key: 'notice', label: 'Notice', icon: ClipboardList },
  { key: 'expense', label: 'Expense', icon: Receipt },
  { key: 'report', label: 'Report', icon: FileText },
];

const INSPECTION_ROUTES = {
  'PSI': '/dashboard/pre-shipment',
  'CLS': '/dashboard/container-loading',
  'Factory Audit': '/dashboard/factory-audit',
  'DPI': '/dashboard/during-production',
  'Social Audit': '/dashboard/social-audit',
};

export default function TaskWorkspace() {
  const { taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [task, setTask] = useState(location.state?.task || null);
  const [activeTab, setActiveTab] = useState('notice');
  const [loading, setLoading] = useState(!location.state?.task);

  useEffect(() => {
    if (task || !token) return;
    fetch(ENDPOINTS.INSPECTOR.TASK_BY_ID(taskId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.task) setTask(data.task); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [task, taskId, token]);

  const handleOpenReport = () => {
    if (!task) return;
    const savedTaskId = localStorage.getItem('inspectionTaskId');
    if (savedTaskId !== task._id) {
      clearFormStorage(INSPECTION_ROUTES[task.inspectionType] || '/dashboard/pre-shipment');
    }
    navigate(INSPECTION_ROUTES[task.inspectionType] || '/dashboard/pre-shipment', { state: { task } });
  };

  const statusLabel = useMemo(() => task?.status === 'Accepted' ? 'Awaiting Report' : task?.status, [task]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading task…</div>;
  }

  if (!task) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Task not found.</p>
        <button onClick={() => navigate('/dashboard/inspector')} className="mt-3 text-sm font-semibold text-blue-600">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={() => navigate('/dashboard/inspector')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">{task.clientName}</h1>
            <p className="text-xs text-slate-500">{task.factoryName} · {task.inspectionType} · {statusLabel}</p>
          </div>
        </div>

        <div className="flex gap-6 mt-4 border-b border-slate-200 -mb-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => tab.key === 'report' ? handleOpenReport() : setActiveTab(tab.key)}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'notice' && <NoticeSummary taskId={task._id} />}
        {activeTab === 'expense' && <ExpensePanel taskId={task._id} />}
      </div>
    </div>
  );
}
```

Save as `frontend/src/dashboards/inspector/pages/TaskWorkspace.jsx`.

- [ ] **Step 3: Register the lazy import**

Current line in `frontend/src/routes/appRoutes.jsx`:

```js
export const Dashboard = lazy(() => import('../dashboards/inspector/InspectorDashboard.jsx'))
```

Change to:

```js
export const Dashboard = lazy(() => import('../dashboards/inspector/InspectorDashboard.jsx'))
export const TaskWorkspace = lazy(() => import('../dashboards/inspector/pages/TaskWorkspace.jsx'))
```

- [ ] **Step 4: Register the route**

In `frontend/src/main.jsx`, current import block:

```js
import {
  Dashboard,
  InspectorOnboarding,
```

Change to:

```js
import {
  Dashboard,
  TaskWorkspace,
  InspectorOnboarding,
```

Current route block:

```js
                  <Route element={<OnboardingGuard />}>
                    <Route path="/dashboard/inspector" element={<Dashboard />} />
                  </Route>
```

Change to:

```js
                  <Route element={<OnboardingGuard />}>
                    <Route path="/dashboard/inspector" element={<Dashboard />} />
                    <Route path="/dashboard/inspector/task/:taskId" element={<TaskWorkspace />} />
                  </Route>
```

- [ ] **Step 5: Lint the new/changed files (NoticeSummary and ExpensePanel don't exist yet, so this will fail on missing-module — expected until Tasks 9-10 are done; skip full lint for now and just syntax-check via a dry Vite build after Task 10)**

Run: `node -c frontend/src/routes/appRoutes.jsx`
Expected: this is a `.jsx` file with ESM syntax, `node -c` isn't suitable — instead just visually confirm the diff is syntactically balanced (matching braces/parens). Move on; full verification happens in Task 10, Step 4 once all three new components exist.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/dashboards/inspector/pages/TaskWorkspace.jsx frontend/src/dashboards/inspector/components/CompactCard.jsx frontend/src/routes/appRoutes.jsx frontend/src/main.jsx
git commit -m "feat: add TaskWorkspace page shell with Notice/Expense/Report tabs"
```

---

### Task 9: NoticeSummary component (read-only Notice tab)

**Files:**
- Create: `frontend/src/dashboards/inspector/components/NoticeSummary.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useEffect } from "react";
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { ExternalLink, Send } from "lucide-react";
import CompactCard from './CompactCard';

const val = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const yn = (v) => (v ? 'Yes' : 'No');
const dateStr = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const Field = ({ label, value }) => (
  <div>
    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
    <div className="text-sm text-slate-700 mt-0.5">{value}</div>
  </div>
);

const FieldGrid = ({ fields }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {fields.map(([label, value]) => <Field key={label} label={label} value={value} />)}
  </div>
);

const DocLink = ({ label, doc }) => (
  <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-slate-600">{label}</span>
    {doc?.url ? (
      <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
        {doc.fileName || 'Open'} <ExternalLink className="w-3 h-3" />
      </a>
    ) : (
      <span className="text-slate-400">—</span>
    )}
  </div>
);

export default function NoticeSummary({ taskId }) {
  const { token } = useAuth();
  const [notice, setNotice] = useState(undefined); // undefined = loading, null = no notice
  const [loadError, setLoadError] = useState(false);
  const [queries, setQueries] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  useEffect(() => {
    fetch(ENDPOINTS.INSPECTOR.TASK_NOTICE(taskId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(data => {
        setNotice(data.notice || null);
        setQueries(data.notice?.inspectorQueries || []);
      })
      .catch(() => setLoadError(true));
  }, [taskId, token]);

  const handleSendQuery = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendError(false);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.TASK_NOTICE_QUERY(taskId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setQueries(data.inspectorQueries || []);
      setMessage('');
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  if (notice === undefined && !loadError) return <div className="text-sm text-slate-500">Loading notice…</div>;

  if (loadError) {
    return <div className="text-sm text-red-600">Couldn't load the notice for this task. Try refreshing the page.</div>;
  }

  if (notice === null) {
    return <div className="text-sm text-slate-500">No notice on file for this task.</div>;
  }

  const b = notice.basicInfo || {};
  const t = notice.teamAssignment || {};
  const p = notice.productInfo || {};
  const aql = notice.aql || {};
  const req = notice.inspectionRequirements || {};
  const special = notice.specialClientRequirements || {};
  const samples = notice.customerSamples || {};
  const info = notice.inspectionInfo || {};
  const att = notice.attachments || {};
  const tools = notice.inspectionTools || {};
  const supplier = notice.supplierInfo || {};
  const factory = notice.factoryInfo || {};

  return (
    <div className="space-y-4 max-w-4xl">
      <CompactCard title="Basic Information">
        <FieldGrid fields={[
          ['Service Type', b.serviceType === 'Others' ? b.serviceTypeOther : val(b.serviceType)],
          ['Inspection Date From', dateStr(b.inspectionDateFrom)],
          ['Inspection Date To', dateStr(b.inspectionDateTo)],
          ['Location', val(b.inspectionLocation)],
          ['Customer', val(b.customerName)],
          ['Product Category', b.productCategory === 'Others' ? b.productCategoryOther : val(b.productCategory)],
          ['Same Day Report', yn(b.sameDayReport)],
          ['Online Report', yn(b.onlineReport)],
          ['Offline Report', yn(b.offlineReport)],
        ]} />
      </CompactCard>

      <CompactCard title="Team Assignment">
        <FieldGrid fields={[
          ['CS', val(t.cs?.name)],
          ['CSE', val(t.cse?.name)],
          ['Preview Manager', val(t.previewManager?.name)],
          ['Scheduler', val(t.scheduler?.name)],
        ]} />
        {(t.inspectors || []).length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Inspectors</div>
            {t.inspectors.map((i, idx) => (
              <div key={idx} className="text-sm text-slate-700">{i.name} — {i.role || 'Member'}{i.manDays ? ` · ${i.manDays} man-days` : ''}</div>
            ))}
          </div>
        )}
      </CompactCard>

      <CompactCard title="Product Information">
        <FieldGrid fields={[
          ['Total Quantity', val(p.totalQuantity)],
          ['Quantity Finished', val(p.quantityFinished)],
          ['Quantity Packed', val(p.quantityPacked)],
          ['Destination', val(p.destination)],
          ['Shipment Date', dateStr(p.shipmentDate)],
        ]} />
        {(p.products || []).length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Order No.</th><th className="py-1 pr-3">Product</th><th className="py-1 pr-3">Item No.</th><th className="py-1 pr-3">Qty</th><th className="py-1">Unit</th>
                </tr>
              </thead>
              <tbody>
                {p.products.map((row, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.orderNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.productName)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.itemNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(row.quantity)}</td>
                    <td className="py-1.5 text-slate-700">{val(row.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {p.orderRemarks && <p className="text-sm text-slate-600 mt-2">{p.orderRemarks}</p>}
      </CompactCard>

      <CompactCard title="AQL">
        <FieldGrid fields={[
          ['Sampling Level', val(aql.samplingLevel)],
          ['Sampled Quantity', val(aql.sampledQuantity)],
        ]} />
        <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3 mt-3 border border-slate-200">
          {['critical', 'major', 'minor'].map(key => (
            <div key={key}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">{key}</div>
              <div className="text-sm text-slate-700">Std: {val(aql.inspectionStandard?.[key])} / Accepted: {val(aql.acceptedQuantity?.[key])}</div>
            </div>
          ))}
        </div>
        {aql.remarks && <p className="text-sm text-slate-600 mt-2">{aql.remarks}</p>}
      </CompactCard>

      <CompactCard title="Inspection Requirements">
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Customer General Requirement:</span> {val(req.customerGeneralRequirement)}</p>
          <p><span className="font-semibold">Technical Manager Remarks:</span> {val(req.technicalManagerRemarks)}</p>
          <p><span className="font-semibold">Customer Service Remarks:</span> {val(req.customerServiceRemarks)}</p>
          <p><span className="font-semibold">Organizer Remarks:</span> {val(req.organizerRemarks)}</p>
        </div>
      </CompactCard>

      <CompactCard title="Special Client Requirements">
        <div className="space-y-2 text-sm text-slate-700">
          <p><span className="font-semibold">Special Requirements:</span> {val(special.customerSpecialRequirements)}</p>
          <p><span className="font-semibold">Color/Material/Finish:</span> {val(special.colorMaterialFinish)}</p>
          <p><span className="font-semibold">Dimension/Weight:</span> {val(special.dimensionWeight)}</p>
          <p><span className="font-semibold">Logo/Label:</span> {val(special.logoLabel)}</p>
          <p><span className="font-semibold">Packing Material:</span> {val(special.packingMaterial)}</p>
          <p><span className="font-semibold">Shipping Mark:</span> {val(special.shippingMark)}</p>
          {special.additionalComments && <p><span className="font-semibold">Additional Comments:</span> {special.additionalComments}</p>}
        </div>
      </CompactCard>

      {(samples.samples || []).length > 0 && (
        <CompactCard title="Customer Samples">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Serial No.</th><th className="py-1 pr-3">Item No.</th><th className="py-1 pr-3">Name</th><th className="py-1 pr-3">Qty</th><th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {samples.samples.map((s, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.serialNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.itemNo)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.name)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(s.quantity)}</td>
                    <td className="py-1.5 text-slate-700">{val(s.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {samples.remarks && <p className="text-sm text-slate-600 mt-2">{samples.remarks}</p>}
        </CompactCard>
      )}

      <CompactCard title="Inspection Info & Documents">
        <FieldGrid fields={[
          ['TM Reviewed', yn(info.technicalManagerReviewed)],
          ['Customer Claim Form', val(info.customerClaimForm)],
        ]} />
        <div className="mt-3">
          <DocLink label="Online WI" doc={info.onlineWI} />
          <DocLink label="Online Customer Claim Form" doc={info.onlineCustomerClaimForm} />
          {(info.reportTemplate || []).map((doc, idx) => (
            <DocLink key={idx} label={`Report Template ${idx + 1}`} doc={doc} />
          ))}
        </div>
      </CompactCard>

      <CompactCard title="Attachments">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Client Files</div>
          {(att.clientFiles || []).length === 0 ? <p className="text-sm text-slate-400">None</p> : att.clientFiles.map((doc, idx) => <DocLink key={idx} label={doc.fileName} doc={doc} />)}
        </div>
        <div className="mt-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Supplier Files</div>
          {(att.supplierFiles || []).length === 0 ? <p className="text-sm text-slate-400">None</p> : att.supplierFiles.map((doc, idx) => <DocLink key={idx} label={doc.fileName} doc={doc} />)}
        </div>
      </CompactCard>

      <CompactCard title="Inspection Tools & Equipment">
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
          <div><span className="font-semibold">Tools:</span> {(tools.tools || []).join(', ') || '—'}</div>
          <div><span className="font-semibold">Equipment:</span> {(tools.equipment || []).join(', ') || '—'}</div>
        </div>
      </CompactCard>

      {(notice.onSiteTests || []).length > 0 && (
        <CompactCard title="On-Site Tests">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Description</th><th className="py-1 pr-3">Method</th><th className="py-1 pr-3">Criteria</th><th className="py-1">Sample Size</th>
                </tr>
              </thead>
              <tbody>
                {notice.onSiteTests.filter(t => t.include).map((t, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(t.description)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(t.method)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{val(t.criteria)}</td>
                    <td className="py-1.5 text-slate-700">{val(t.sampleSize)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CompactCard>
      )}

      {(notice.defectClassifications || []).length > 0 && (
        <CompactCard title="Defect Classification List">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-1 pr-3">Description</th><th className="py-1 pr-3">Critical</th><th className="py-1 pr-3">Major</th><th className="py-1 pr-3">Minor</th><th className="py-1">Photo Req.</th>
                </tr>
              </thead>
              <tbody>
                {notice.defectClassifications.map((d, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 text-slate-700">{val(d.description)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{yn(d.critical)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{yn(d.major)}</td>
                    <td className="py-1.5 pr-3 text-slate-700">{yn(d.minor)}</td>
                    <td className="py-1.5 text-slate-700">{yn(d.photoRequired)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CompactCard>
      )}

      <CompactCard title="Supplier Information">
        <FieldGrid fields={[
          ['Supplier Name', val(supplier.supplierName)],
          ['English Name', val(supplier.englishName)],
        ]} />
      </CompactCard>

      <CompactCard title="Factory Information">
        <FieldGrid fields={[
          ['Factory Name', val(factory.factoryName)],
          ['English Name', val(factory.englishName)],
          ['Address', val(factory.address)],
          ['Main Contact', val(factory.mainContactPerson)],
          ['Phone', val(factory.phone)],
          ['Mobile', val(factory.mobile)],
          ['Working Time', factory.workingTimeStart ? `${factory.workingTimeStart} – ${factory.workingTimeEnd || '?'}` : '—'],
        ]} />
        {factory.googleMapsLink && (
          <a href={factory.googleMapsLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:underline mt-2">
            Open in Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {factory.inspectionNotes && <p className="text-sm text-slate-600 mt-2">{factory.inspectionNotes}</p>}
      </CompactCard>

      <CompactCard title="Have a question for CS?">
        <div className="space-y-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Type your query for CS…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            onClick={handleSendQuery}
            disabled={sending || !message.trim()}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> {sending ? 'Sending…' : 'Send'}
          </button>
          {sendError && <p className="text-xs text-red-600">Couldn't send your query. Please try again.</p>}
          {queries.length > 0 && (
            <div className="mt-3 space-y-2">
              {[...queries].reverse().map((q, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-slate-700">{q.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(q.raisedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CompactCard>
    </div>
  );
}
```

Save as `frontend/src/dashboards/inspector/components/NoticeSummary.jsx`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/inspector/components/NoticeSummary.jsx
git commit -m "feat: add read-only Notice summary with CS query box"
```

---

### Task 10: ExpensePanel component

**Files:**
- Create: `frontend/src/dashboards/inspector/components/ExpensePanel.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { Upload, ExternalLink } from "lucide-react";
import CompactCard from './CompactCard';

export default function ExpensePanel({ taskId }) {
  const { token } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(ENDPOINTS.INSPECTOR.TASK_EXPENSE(taskId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(data => {
        setExpense(data.expense);
        setRemarks(data.expense?.remarks || '');
      })
      .catch(() => setLoadError(true));
  }, [taskId, token]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(false);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(ENDPOINTS.INSPECTOR.TASK_EXPENSE_UPLOAD(taskId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setExpense(data.expense);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRemarks = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.TASK_EXPENSE_REMARKS(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setExpense(data.expense);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return <div className="text-sm text-red-600">Couldn't load expense data for this task. Try refreshing the page.</div>;
  }

  if (!expense) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <CompactCard title="Upload Receipts / Files">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        {uploadError && <p className="text-xs text-red-600 mt-1.5">Upload failed. Please try again.</p>}

        <div className="mt-3 space-y-1.5">
          {(expense.files || []).length === 0 ? (
            <p className="text-sm text-slate-400">No files uploaded yet.</p>
          ) : (
            expense.files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 py-1.5">
                <span className="text-slate-700">{f.fileName}</span>
                <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))
          )}
        </div>
      </CompactCard>

      <CompactCard title="Remarks">
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          placeholder="Expense notes (e.g. taxi fare, meals, lodging)…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <button
          onClick={handleSaveRemarks}
          disabled={saving}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Remarks'}
        </button>
        {saveError && <p className="text-xs text-red-600 mt-1.5">Couldn't save remarks. Please try again.</p>}
      </CompactCard>
    </div>
  );
}
```

Save as `frontend/src/dashboards/inspector/components/ExpensePanel.jsx`.

- [ ] **Step 2: Lint all new frontend files together**

Run: `cd frontend && npx eslint src/dashboards/inspector/pages/TaskWorkspace.jsx src/dashboards/inspector/components/CompactCard.jsx src/dashboards/inspector/components/NoticeSummary.jsx src/dashboards/inspector/components/ExpensePanel.jsx src/routes/appRoutes.jsx src/main.jsx`
Expected: no errors. If `FieldGrid`/unused-var warnings appear, fix them (e.g. remove any accidentally-unused destructured variable) before proceeding.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/inspector/components/ExpensePanel.jsx
git commit -m "feat: add inspector Expense upload and remarks panel"
```

---

### Task 11: Route task-opening through TaskWorkspace, prune dead modal branches

**Files:**
- Modify: `frontend/src/dashboards/inspector/InspectorDashboard.jsx`
- Modify: `frontend/src/dashboards/inspector/components/TaskDetailsModal.jsx`

- [ ] **Step 1: Add a routing-aware task-open handler**

In `frontend/src/dashboards/inspector/InspectorDashboard.jsx`, current:

```js
  const handleAcceptTask = async (taskId) => {
```

Add directly above it:

```js
  const handleSelectTask = (task) => {
    if (task.status === 'Pending Acceptance') {
      setSelectedTask(task);
    } else {
      navigate(`/dashboard/inspector/task/${task._id}`, { state: { task } });
    }
  };

  const handleAcceptTask = async (taskId) => {
```

- [ ] **Step 2: Use it for the deep-link effect**

Current:

```js
  // Auto-open task if ?task= param is present
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length > 0 && !loading) {
      const taskToOpen = tasks.find(t => t._id === taskId);
      if (taskToOpen) {
        setSelectedTask(taskToOpen);
        // Remove param from URL without refreshing so it doesn't re-open on close
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, tasks, loading, setSearchParams]);
```

Change to:

```js
  // Auto-open task if ?task= param is present
  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId && tasks.length > 0 && !loading) {
      const taskToOpen = tasks.find(t => t._id === taskId);
      if (taskToOpen) {
        setSearchParams({}, { replace: true });
        handleSelectTask(taskToOpen);
      }
    }
  }, [searchParams, tasks, loading, setSearchParams]);
```

- [ ] **Step 3: Wire the grid to the new handler**

Current:

```jsx
          <TaskGrid
            loading={loading}
            filteredTasks={filteredTasks}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            getStatusConfig={getStatusConfig}
            getDisplayStatus={getDisplayStatus}
            onSelectTask={setSelectedTask}
            onClearFilters={handleClearFilters}
          />
```

Change to:

```jsx
          <TaskGrid
            loading={loading}
            filteredTasks={filteredTasks}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            getStatusConfig={getStatusConfig}
            getDisplayStatus={getDisplayStatus}
            onSelectTask={handleSelectTask}
            onClearFilters={handleClearFilters}
          />
```

- [ ] **Step 4: Remove the now-unreachable `onStartReport` prop from the modal usage**

Current:

```jsx
      <Suspense fallback={null}>
        <TaskDetailsModal
          selectedTask={selectedTask}
          acceptingTaskId={acceptingTaskId}
          onClose={() => setSelectedTask(null)}
          onAcceptTask={handleAcceptTask}
          onStartReport={handleStartReport}
          getStatusConfig={getStatusConfig}
          getDisplayStatus={getDisplayStatus}
        />
      </Suspense>
```

Change to:

```jsx
      <Suspense fallback={null}>
        <TaskDetailsModal
          selectedTask={selectedTask}
          acceptingTaskId={acceptingTaskId}
          onClose={() => setSelectedTask(null)}
          onAcceptTask={handleAcceptTask}
          getStatusConfig={getStatusConfig}
          getDisplayStatus={getDisplayStatus}
        />
      </Suspense>
```

- [ ] **Step 5: Remove the now-unused `handleStartReport` and `getInspectionRoute` from InspectorDashboard.jsx**

These moved into `TaskWorkspace.jsx` in Task 8 and are no longer called from this file (the modal no longer calls `onStartReport`, and the grid/card click path now goes through `handleSelectTask`). Delete this block entirely:

```js
  const getInspectionRoute = (type) => ({
    'PSI': '/dashboard/pre-shipment',
    'CLS': '/dashboard/container-loading',
    'Factory Audit': '/dashboard/factory-audit',
    'DPI': '/dashboard/during-production',
    'Social Audit': '/dashboard/social-audit',
  })[type] || '/dashboard/pre-shipment';

  const handleStartReport = (task) => {
    // Only wipe storage if the inspector is switching to a DIFFERENT task.
    // If they click "Start Report" for the same task they were already working on,
    // preserve their progress (step, form data, photos, etc.).
    const savedTaskId = localStorage.getItem('inspectionTaskId');
    if (savedTaskId !== task._id) {
      clearFormStorage(getInspectionRoute(task.inspectionType));
    }
    navigate(getInspectionRoute(task.inspectionType), { state: { task } });
  };
```

If `clearFormStorage` is now unused in this file after removing this block, also remove its import line (`import { clearFormStorage } from '../../shared/services';`) — check with the grep in Step 6 below before removing.

- [ ] **Step 6: Verify no leftover references**

Run: `grep -n "handleStartReport\|getInspectionRoute\|clearFormStorage" frontend/src/dashboards/inspector/InspectorDashboard.jsx`
Expected: no output. If `clearFormStorage` still appears, keep its import; if not, its import line should already be removed per Step 5.

- [ ] **Step 7: Prune the now-unreachable status branches in TaskDetailsModal.jsx**

Since `handleSelectTask` only ever calls `setSelectedTask` for `Pending Acceptance` tasks now, the modal's `Accepted` / `Report Submitted`/`Under Review` / `Correction Requested` / `Finalized` branches (and the `onStartReport` prop) can never be reached. Current file (footer section):

```jsx
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
          {selectedTask.status === 'Pending Acceptance' && (
            <>
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Close
              </button>
              <button
                onClick={() => onAcceptTask(selectedTask._id)}
                disabled={acceptingTaskId === selectedTask._id}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {acceptingTaskId === selectedTask._id
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <CheckCircle className="w-4 h-4" />}
                Accept Inspection
              </button>
            </>
          )}

          {selectedTask.status === 'Accepted' && (
            <>
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Close
              </button>
              <button
                onClick={() => onStartReport(selectedTask)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Start Report
              </button>
            </>
          )}

          {(selectedTask.status === 'Report Submitted' || selectedTask.status === 'Under Review') && (
            <>
              <p className="flex-1 text-sm text-slate-500 flex items-center">
                Report submitted. Awaiting Technical Manager review.
              </p>
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Close
              </button>
            </>
          )}

          {selectedTask.status === 'Correction Requested' && (
            <>
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Close
              </button>
              <button
                onClick={() => onStartReport(selectedTask)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Edit Report
              </button>
            </>
          )}

          {selectedTask.status === 'Finalized' && (
            <>
              <p className="flex-1 text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-4 h-4" />
                Report approved and finalized.
              </p>
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Close
              </button>
            </>
          )}
        </div>
```

Change to:

```jsx
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Close
          </button>
          <button
            onClick={() => onAcceptTask(selectedTask._id)}
            disabled={acceptingTaskId === selectedTask._id}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-100 transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {acceptingTaskId === selectedTask._id
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle className="w-4 h-4" />}
            Accept Inspection
          </button>
        </div>
```

This is safe because `TaskDetailsModal` is now only ever opened (via `handleSelectTask`) for `Pending Acceptance` tasks, so the footer no longer needs to branch on status at all.

- [ ] **Step 8: Update the function signature to drop the now-unused `onStartReport` and `getDisplayStatus` props if `getDisplayStatus` is no longer used elsewhere in the file**

Run: `grep -n "getDisplayStatus\|onStartReport" frontend/src/dashboards/inspector/components/TaskDetailsModal.jsx`

If `getDisplayStatus` is still used in the header badge (`{getDisplayStatus(selectedTask.status)}`), keep it — only remove `onStartReport` from the function parameter list:

Current:

```js
export default function TaskDetailsModal({
  selectedTask,
  acceptingTaskId,
  onClose,
  onAcceptTask,
  onStartReport,
  getStatusConfig,
  getDisplayStatus
}) {
```

Change to:

```js
export default function TaskDetailsModal({
  selectedTask,
  acceptingTaskId,
  onClose,
  onAcceptTask,
  getStatusConfig,
  getDisplayStatus
}) {
```

Also remove the now-unreachable `Correction Requested` feedback banner block (it can only ever render for `Pending Acceptance` tasks now, which never have `correctionFeedback`), but leave `adminInstructions` as-is since `Pending Acceptance` tasks can have it:

Current:

```jsx
          {selectedTask.status === 'Correction Requested' && selectedTask.correctionFeedback && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-bold text-red-800">Correction Requested by TM</p>
              </div>
              <p className="text-sm text-red-700 leading-relaxed">{selectedTask.correctionFeedback}</p>
            </div>
          )}
```

Delete this block.

- [ ] **Step 9: Fix the now-inaccurate card footer label in TaskGrid.jsx**

Since clicking any non-`Pending Acceptance` card now opens the workspace (not directly the report form, and not a read-only modal), the label should say so. Current in `frontend/src/dashboards/inspector/components/TaskGrid.jsx`:

```jsx
                  {task.status === 'Pending Acceptance' ? 'Review & Accept' : task.status === 'Accepted' ? 'Start Report' : 'View Details'}
```

Change to:

```jsx
                  {task.status === 'Pending Acceptance' ? 'Review & Accept' : 'Open'}
```

- [ ] **Step 10: Lint both changed files**

Run: `cd frontend && npx eslint src/dashboards/inspector/InspectorDashboard.jsx src/dashboards/inspector/components/TaskDetailsModal.jsx src/dashboards/inspector/components/TaskGrid.jsx`
Expected: no errors. Pay attention to any `no-unused-vars` for `FileText` (icon import in `TaskDetailsModal.jsx`) — if it's no longer used anywhere in that file after removing the "Start/Edit Report" buttons, remove it from the `lucide-react` import too.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/dashboards/inspector/InspectorDashboard.jsx frontend/src/dashboards/inspector/components/TaskDetailsModal.jsx frontend/src/dashboards/inspector/components/TaskGrid.jsx
git commit -m "feat: route task cards to TaskWorkspace, simplify modal to Accept-only"
```

---

### Task 12: Build out the admin ExpenseTab

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ExpenseTab.jsx`

- [ ] **Step 1: Replace the stub**

Current entire file:

```jsx
import React from 'react';

export default function ExpenseTab() {
  return (
    <div className="p-8 text-center text-slate-500">
      <h3 className="text-xl font-bold text-slate-700 mb-2">Expense Tab</h3>
      <p>Expense management functionality will go here.</p>
    </div>
  );
}
```

Replace with:

```jsx
import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { ENDPOINTS } from '../../../../config/api';
import SectionCard from './SectionCard';

export default function ExpenseTab({ recordId, token }) {
  const [expenses, setExpenses] = useState(null);

  useEffect(() => {
    if (!recordId) return;
    fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setExpenses(data.expenses || []))
      .catch(() => setExpenses([]));
  }, [recordId, token]);

  if (!recordId) {
    return <div className="p-8 text-center text-slate-500 text-sm">Save the notice as a draft first to see expense submissions here.</div>;
  }

  if (expenses === null) {
    return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  }

  if (expenses.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-sm">No inspector has submitted expenses for this notice yet.</div>;
  }

  return (
    <div className="space-y-6">
      {expenses.map((exp) => (
        <SectionCard key={exp._id} title={exp.inspectorId?.name || 'Inspector'}>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Files</div>
            {(exp.files || []).length === 0 ? (
              <p className="text-sm text-slate-400">No files uploaded.</p>
            ) : (
              exp.files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 py-1.5">
                  <span className="text-slate-700">{f.fileName}</span>
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-[#6C47FF] font-semibold flex items-center gap-1 hover:underline">
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
          {exp.remarks && (
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</div>
              <p className="text-sm text-slate-700">{exp.remarks}</p>
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Pass the new props from the parent**

Current in `frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx`:

```jsx
          {activeTab === 'Expense' && (
            <ExpenseTab />
          )}
```

Change to:

```jsx
          {activeTab === 'Expense' && (
            <ExpenseTab recordId={id} token={token} />
          )}
```

- [ ] **Step 3: Lint**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ExpenseTab.jsx src/dashboards/admin/pages/InspectionNoticeForm.jsx`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ExpenseTab.jsx frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx
git commit -m "feat: build out admin Expense tab to view inspector submissions"
```

---

### Task 13: Inspector Queries panel on the admin Notice tab

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add the panel before Section 1**

Current (around line 775-779):

```jsx
  return (
    <>
      {/* SECTION 1: Basic Information */}
      <SectionCard title="SECTION 1: Basic Information">
```

Change to:

```jsx
  return (
    <>
      {(formData.inspectorQueries || []).length > 0 && (
        <SectionCard title="Inspector Queries" defaultOpen={true}>
          <div className="space-y-2">
            {[...formData.inspectorQueries].reverse().map((q, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                <p className="text-sm text-slate-700">{q.message}</p>
                <p className="text-[11px] text-slate-500 mt-1">{q.inspectorName} · {new Date(q.raisedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* SECTION 1: Basic Information */}
      <SectionCard title="SECTION 1: Basic Information">
```

Note: `<>` at the top wraps a Fragment, meaning the component currently returns multiple `SectionCard`s directly without a wrapping `<div>` — verify this pattern before saving by checking the return statement is indeed `<>...</>` per the grep in Step 2, so the new panel added as the first child is syntactically valid.

- [ ] **Step 2: Verify the return statement is a Fragment**

Run: `sed -n '775,779p' frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx` (or open the file at that range)
Expected: confirms `return (` is followed by `<>` on the next line, matching what Step 1 assumes.

- [ ] **Step 3: Lint**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: show inspector queries on the admin Notice tab"
```

---

### Task 14: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start both dev servers**

Run (from repo root): `npm run dev:all`

- [ ] **Step 2: Verify the full inspector flow in the browser**

1. Log in as an inspector with at least one `Pending Acceptance` task originating from a notice (`prefillData.noticeId` set).
2. Accept it — confirm the existing modal/Accept flow is unchanged.
3. Click the task card again (now `Accepted`) — confirm it navigates to `/dashboard/inspector/task/<id>` instead of opening a modal or jumping to the report form.
4. On the Notice tab, confirm the read-only sections render CS's data correctly, any document "Open" links resolve and open in a new tab, and submitting a query works (shows up in the list below the box).
5. Switch to the Expense tab, upload a file, confirm it appears in the list with a working "Open" link; type remarks and save; refresh the page and confirm both persist.
6. Click the Report tab — confirm it navigates to the correct report form (matching `task.inspectionType`) with prefill data intact, identical to today's "Start Report" behavior.

- [ ] **Step 3: Verify the CS side**

1. Log in as admin/manager, open that same notice's detail page (`/admin/inspection-notices/<noticeId>`).
2. Confirm the "Inspector Queries" panel appears at the top of the Notice tab showing the submitted query.
3. Switch to the Expense tab, confirm the uploaded file and remarks from Step 2.5 above are visible with a working "Open" link.

- [ ] **Step 4: Verify the no-notice fallback**

Using `node -` against the dev DB, find or create a `Task` with `prefillData` missing `noticeId` (or `prefillData: null`), assigned to a test inspector, status `Accepted`. Open its workspace and confirm the Notice tab shows "No notice on file for this task." instead of erroring.

- [ ] **Step 5: Verify ownership enforcement**

Run: `curl -s http://localhost:5000/api/inspector/tasks/<some-other-inspectors-task-id>/notice -H "Authorization: Bearer <a-different-inspectors-token>"`
Expected: `{"error":"Task not found"}` with a 404, not another inspector's notice data.
