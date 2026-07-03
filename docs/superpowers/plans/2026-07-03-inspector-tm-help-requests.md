# Inspector ↔ Technical Manager Help Requests (Two-Way) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Technical Manager reply to an inspector's "Contact Technical Manager" message, and let the inspector see the reply, per `docs/superpowers/specs/2026-07-03-inspector-tm-help-requests-design.md`. The existing one-way bell alert (already implemented) is untouched.

**Architecture:** New `InspectorHelpRequest` model + a single new `helpRequest.controller.js` (four functions) shared by both `inspector.routes.js` and `manager.routes.js`. The existing `contactTechnicalManager` function moves out of `inspector.controller.js` into this new file (renamed `createHelpRequest`) — same endpoint, same request/response shape, so the already-implemented frontend button needs zero changes. Two new frontend panels: `HelpRequestsPanel` (manager side, view + reply) and `MessagesPanel` (inspector side, view thread in a modal), wired into the existing `activeView` switch patterns already used by both dashboards.

**Tech Stack:** Express 5, Mongoose, React 19, existing `useToast()`, existing lazy-loaded view-switch pattern in both dashboards.

**No automated test suite exists in this project.** Verification is `node --check`/lint plus the exact manual two-session walkthrough from the spec.

---

## Task 1: `InspectorHelpRequest` model

**Files:**
- Create: `backend/models/inspectorHelpRequest.model.js`

- [ ] **Step 1: Create the model**

```js
const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  message: { type: String, required: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repliedByName: { type: String, required: true },
  repliedAt: { type: Date, default: Date.now },
}, { _id: false });

const inspectorHelpRequestSchema = new mongoose.Schema({
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inspectorName: { type: String, required: true },
  reportType: { type: String, default: '' },
  sectionLabel: { type: String, default: '' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  message: { type: String, required: true },
  replies: [replySchema],
}, { timestamps: true });

module.exports = mongoose.model("InspectorHelpRequest", inspectorHelpRequestSchema);
```

- [ ] **Step 2: Verify it loads**

Run: `cd backend && node -e "require('dotenv').config({ path: '../.env' }); require('./models/inspectorHelpRequest.model.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/models/inspectorHelpRequest.model.js
git commit -m "feat: add InspectorHelpRequest model"
```

---

## Task 2: `helpRequest.controller.js` — move `contactTechnicalManager` in as `createHelpRequest`, add the other 3 functions

**Files:**
- Create: `backend/controllers/helpRequest.controller.js`
- Modify: `backend/controllers/inspector.controller.js` (remove `contactTechnicalManager`)
- Modify: `backend/routes/inspector.routes.js` (repoint the route, add the new list route)
- Modify: `backend/routes/manager.routes.js` (add the two manager-side routes)

- [ ] **Step 1: Create the new controller file**

```js
const InspectorHelpRequest = require('../models/inspectorHelpRequest.model');
const SystemNotification = require('../models/systemNotification.model');
const { getIO } = require('../socket');

const createHelpRequest = async (req, res) => {
  try {
    const { reportType, sectionLabel, taskId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const context = [reportType, sectionLabel].filter(Boolean).join(' — Section: ');
    const notification = await SystemNotification.create({
      title: 'Inspector Needs Help',
      message: `${req.user.name} needs help${context ? ` (${context})` : ''}: "${message.trim()}"`,
      type: 'urgent',
      priority: 1,
      targetRoles: ['manager'],
      createdBy: req.user.id || req.user._id,
    });

    getIO().to('manager_room').emit('new_system_notification', {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      createdAt: notification.createdAt,
    });

    await InspectorHelpRequest.create({
      inspectorId: req.user.id || req.user._id,
      inspectorName: req.user.name,
      reportType,
      sectionLabel,
      taskId: taskId || null,
      message: message.trim(),
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHelpRequestsForInspector = async (req, res) => {
  try {
    const helpRequests = await InspectorHelpRequest.find({ inspectorId: req.user.id || req.user._id }).sort({ createdAt: -1 });
    res.json({ helpRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getHelpRequestsForManager = async (req, res) => {
  try {
    const helpRequests = await InspectorHelpRequest.find({}).sort({ createdAt: -1 }).limit(50);
    res.json({ helpRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const replyToHelpRequest = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const helpRequest = await InspectorHelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ error: 'Help request not found' });

    helpRequest.replies.push({
      message: message.trim(),
      repliedBy: req.user.id || req.user._id,
      repliedByName: req.user.name,
      repliedAt: new Date(),
    });
    await helpRequest.save();

    res.json({ helpRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createHelpRequest,
  getHelpRequestsForInspector,
  getHelpRequestsForManager,
  replyToHelpRequest,
};
```

- [ ] **Step 2: Remove `contactTechnicalManager` from `inspector.controller.js`**

Find:

```js
const contactTechnicalManager = async (req, res) => {
  try {
    const { reportType, sectionLabel, taskId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const SystemNotification = require('../models/systemNotification.model');
    const { getIO } = require('../socket');

    const context = [reportType, sectionLabel].filter(Boolean).join(' — Section: ');
    const notification = await SystemNotification.create({
      title: 'Inspector Needs Help',
      message: `${req.user.name} needs help${context ? ` (${context})` : ''}: "${message.trim()}"`,
      type: 'urgent',
      priority: 1,
      targetRoles: ['manager'],
      createdBy: req.user.id || req.user._id,
    });

    getIO().to('manager_room').emit('new_system_notification', {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      createdAt: notification.createdAt,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSummary,
  getTasks,
  getTaskById,
  acceptTask,
  addSectionSkipReason,
  contactTechnicalManager,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

Replace with:

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

- [ ] **Step 3: Repoint the inspector route and add the list route**

Find in `backend/routes/inspector.routes.js`:

```js
const inspectorController = require("../controllers/inspector.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
```

Replace with:

```js
const inspectorController = require("../controllers/inspector.controller");
const helpRequestController = require("../controllers/helpRequest.controller");
const { authMiddleware } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
```

Then find:

```js
router.post("/contact-technical-manager", inspectorController.contactTechnicalManager);
```

Replace with:

```js
router.post("/contact-technical-manager", helpRequestController.createHelpRequest);
router.get("/help-requests", helpRequestController.getHelpRequestsForInspector);
```

- [ ] **Step 4: Add the manager-side routes**

Find in `backend/routes/manager.routes.js`:

```js
const managerController = require("../controllers/manager.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
```

Replace with:

```js
const managerController = require("../controllers/manager.controller");
const helpRequestController = require("../controllers/helpRequest.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
```

Then find:

```js
router.post("/reports/:id/remarks", managerController.addRemarks);

module.exports = router;
```

Replace with:

```js
router.post("/reports/:id/remarks", managerController.addRemarks);

// Inspector help requests
router.get("/help-requests", helpRequestController.getHelpRequestsForManager);
router.post("/help-requests/:id/reply", helpRequestController.replyToHelpRequest);

module.exports = router;
```

- [ ] **Step 5: Verify everything loads**

Run:
```bash
cd backend
node --check controllers/helpRequest.controller.js
node --check controllers/inspector.controller.js
node -e "require('dotenv').config({ path: '../.env' }); require('./routes/inspector.routes.js'); console.log('inspector routes OK');"
node -e "require('dotenv').config({ path: '../.env' }); require('./routes/manager.routes.js'); console.log('manager routes OK');"
```
Expected: no output from the `--check` calls, then both `OK` lines.

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/helpRequest.controller.js backend/controllers/inspector.controller.js backend/routes/inspector.routes.js backend/routes/manager.routes.js
git commit -m "feat: move contact-technical-manager into helpRequest controller, add reply/list endpoints"
```

---

## Task 3: Frontend — endpoint constants

**Files:**
- Modify: `frontend/src/config/api.js`

- [ ] **Step 1: Add `HELP_REQUESTS` under `INSPECTOR`**

Find:

```js
    CONTACT_TM: `${API_BASE_URL}/api/inspector/contact-technical-manager`,
    NOTIFICATIONS: `${API_BASE_URL}/api/inspector/notifications`,
```

Replace with:

```js
    CONTACT_TM: `${API_BASE_URL}/api/inspector/contact-technical-manager`,
    HELP_REQUESTS: `${API_BASE_URL}/api/inspector/help-requests`,
    NOTIFICATIONS: `${API_BASE_URL}/api/inspector/notifications`,
```

- [ ] **Step 2: Add `HELP_REQUESTS`/`REPLY_HELP_REQUEST` under `MANAGER`**

Find:

```js
    ADD_REMARK: (id) => `${API_BASE_URL}/api/manager/reports/${id}/remarks`,
  },
```

Replace with:

```js
    ADD_REMARK: (id) => `${API_BASE_URL}/api/manager/reports/${id}/remarks`,
    HELP_REQUESTS: `${API_BASE_URL}/api/manager/help-requests`,
    REPLY_HELP_REQUEST: (id) => `${API_BASE_URL}/api/manager/help-requests/${id}/reply`,
  },
```

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/config/api.js`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/config/api.js
git commit -m "feat: add help-requests endpoint constants"
```

---

## Task 4: Frontend — `HelpRequestsPanel` (manager side)

**Files:**
- Create: `frontend/src/dashboards/manager/components/HelpRequestsPanel.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';

export default function HelpRequestsPanel() {
  const { token } = useAuth();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.MANAGER.HELP_REQUESTS, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHelpRequests(data.helpRequests || []))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReply = async (id) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text || sendingId) return;
    setSendingId(id);
    try {
      const res = await fetch(ENDPOINTS.MANAGER.REPLY_HELP_REQUEST(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setHelpRequests(prev => prev.map(h => h._id === id ? data.helpRequest : h));
        setReplyDrafts(prev => ({ ...prev, [id]: '' }));
      }
    } catch {
      // silently ignore — the textarea keeps the draft so the manager can retry
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return <div className="px-6 py-8"><div className="max-w-3xl mx-auto animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white border border-slate-200 rounded-3xl" />)}</div></div>;
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-300">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Inspector Help Requests</h3>
          <p className="text-slate-400 text-xs mt-0.5">Messages inspectors have sent while filling in report forms.</p>
        </div>

        {helpRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm">
            No help requests yet.
          </div>
        ) : (
          helpRequests.map(hr => (
            <div key={hr._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{hr.inspectorName}</p>
                    <p className="text-[11px] text-slate-400">
                      {[hr.reportType, hr.sectionLabel].filter(Boolean).join(' — Section: ') || 'No report context'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{new Date(hr.createdAt).toLocaleString()}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700">
                {hr.message}
              </div>

              {hr.replies?.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-blue-100">
                  {hr.replies.map((r, idx) => (
                    <div key={idx} className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-700">{r.repliedByName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(r.repliedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyDrafts[hr._id] || ''}
                  onChange={e => setReplyDrafts(prev => ({ ...prev, [hr._id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleReply(hr._id); }}
                  placeholder="Type a reply…"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={() => handleReply(hr._id)}
                  disabled={sendingId === hr._id || !(replyDrafts[hr._id] || '').trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingId === hr._id ? 'Sending…' : 'Reply'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

Note: `MessageSquare` icon is imported but unused if not shown elsewhere in this file — it's used as the nav icon in `ManagerChrome.jsx` (Task 5), not here, so remove it from this file's import list to avoid an unused-import lint warning.

- [ ] **Step 2: Fix the import to only include icons actually used in this file**

Find:

```jsx
import { MessageSquare, Send, User } from 'lucide-react';
```

Replace with:

```jsx
import { Send, User } from 'lucide-react';
```

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/dashboards/manager/components/HelpRequestsPanel.jsx`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/manager/components/HelpRequestsPanel.jsx
git commit -m "feat: add HelpRequestsPanel for Technical Manager dashboard"
```

---

## Task 5: Frontend — wire `HelpRequestsPanel` into `ManagerChrome` + `TechnicalManagerDashboard`

**Files:**
- Modify: `frontend/src/dashboards/manager/components/ManagerChrome.jsx`
- Modify: `frontend/src/dashboards/manager/TechnicalManagerDashboard.jsx`

- [ ] **Step 1: `ManagerChrome.jsx` — add the icon import**

Find:

```jsx
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
```

Replace with:

```jsx
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  User,
  LogOut,
  Check,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
```

- [ ] **Step 2: `ManagerChrome.jsx` — add the nav button**

Find:

```jsx
            <button
              onClick={() => { setActiveView('notifications'); setActiveReportId(null); }}
```

Replace with:

```jsx
            <button
              onClick={() => { setActiveView('help-requests'); setActiveReportId(null); }}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeView === 'help-requests' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Help Requests</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveView('notifications'); setActiveReportId(null); }}
```

- [ ] **Step 3: `TechnicalManagerDashboard.jsx` — lazy-import the panel**

Find:

```jsx
const ManagerChrome = lazy(() => import('./components/ManagerChrome'));
```

Replace with:

```jsx
const ManagerChrome = lazy(() => import('./components/ManagerChrome'));
const HelpRequestsPanel = lazy(() => import('./components/HelpRequestsPanel'));
```

- [ ] **Step 4: `TechnicalManagerDashboard.jsx` — render it when active**

Find:

```jsx
          {/* VIEW: NOTIFICATIONS (Full list view) */}
          {activeView === "notifications" && !activeReportId && (
```

Replace with:

```jsx
          {/* VIEW: HELP REQUESTS */}
          {activeView === "help-requests" && !activeReportId && (
            <Suspense fallback={<div className="max-w-3xl mx-auto px-6 py-8"><div className="h-96 bg-white border border-slate-200 rounded-3xl animate-pulse" /></div>}>
              <HelpRequestsPanel />
            </Suspense>
          )}

          {/* VIEW: NOTIFICATIONS (Full list view) */}
          {activeView === "notifications" && !activeReportId && (
```

- [ ] **Step 5: Lint check both files**

Run: `cd frontend && npx eslint src/dashboards/manager/components/ManagerChrome.jsx src/dashboards/manager/TechnicalManagerDashboard.jsx`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/dashboards/manager/components/ManagerChrome.jsx frontend/src/dashboards/manager/TechnicalManagerDashboard.jsx
git commit -m "feat: wire Help Requests tab into Technical Manager dashboard"
```

---

## Task 6: Frontend — `MessagesPanel` (inspector side) + detail modal

**Files:**
- Create: `frontend/src/dashboards/inspector/components/MessagesPanel.jsx`

- [ ] **Step 1: Create the component (list + inline detail modal, same file — small enough not to split)**

```jsx
import { useState, useEffect } from 'react';
import { MessageCircle, X, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';

function MessageDetailModal({ helpRequest, onClose }) {
  if (!helpRequest) return null;
  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Question</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {[helpRequest.reportType, helpRequest.sectionLabel].filter(Boolean).join(' — Section: ') || 'No report context'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700">
            {helpRequest.message}
            <div className="text-[11px] text-slate-400 mt-2">{new Date(helpRequest.createdAt).toLocaleString()}</div>
          </div>

          {helpRequest.replies?.length > 0 ? (
            <div className="space-y-2 pl-4 border-l-2 border-blue-100">
              {helpRequest.replies.map((r, idx) => (
                <div key={idx} className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-700">{r.repliedByName}</span>
                    <span className="text-[10px] text-slate-400">{new Date(r.repliedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700">{r.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No reply yet — check back later.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPanel() {
  const { token } = useAuth();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.INSPECTOR.HELP_REQUESTS, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHelpRequests(data.helpRequests || []))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || helpRequests.length === 0) return null;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800">Messages</h3>
          <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full">{helpRequests.length}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {helpRequests.map(hr => (
            <button
              key={hr._id}
              onClick={() => setSelected(hr)}
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{hr.message}</p>
                  <p className="text-[11px] text-slate-400">
                    {[hr.reportType, hr.sectionLabel].filter(Boolean).join(' — Section: ') || 'No report context'}
                    {hr.replies?.length > 0 && ` · ${hr.replies.length} repl${hr.replies.length === 1 ? 'y' : 'ies'}`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <MessageDetailModal helpRequest={selected} onClose={() => setSelected(null)} />
    </>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/inspector/components/MessagesPanel.jsx`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/inspector/components/MessagesPanel.jsx
git commit -m "feat: add MessagesPanel for inspector dashboard"
```

---

## Task 7: Wire `MessagesPanel` into `InspectorDashboard.jsx`

**Files:**
- Modify: `frontend/src/dashboards/inspector/InspectorDashboard.jsx`

- [ ] **Step 1: Lazy-import the panel**

Find:

```jsx
const TaskGrid = lazy(() => import('./components/TaskGrid'));
const TaskDetailsModal = lazy(() => import('./components/TaskDetailsModal'));
```

Replace with:

```jsx
const TaskGrid = lazy(() => import('./components/TaskGrid'));
const TaskDetailsModal = lazy(() => import('./components/TaskDetailsModal'));
const MessagesPanel = lazy(() => import('./components/MessagesPanel'));
```

- [ ] **Step 2: Render it after the status-filter pill row, before the task grid**

Find:

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

        <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"><div className="h-1 bg-slate-100" /><div className="p-5 space-y-4"><div className="flex justify-between"><div className="h-5 bg-slate-100 rounded-lg w-12" /><div className="h-5 bg-slate-100 rounded-lg w-24" /></div><div className="h-5 bg-slate-100 rounded w-3/4" /><div className="space-y-2"><div className="h-4 bg-slate-100 rounded w-full" /><div className="h-4 bg-slate-100 rounded w-5/6" /><div className="h-4 bg-slate-100 rounded w-1/2" /></div></div><div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between"><div className="h-4 bg-slate-100 rounded w-12" /><div className="h-4 bg-slate-100 rounded w-20" /></div></div>)}</div>}>
```

Replace with:

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

        <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse"><div className="h-1 bg-slate-100" /><div className="p-5 space-y-4"><div className="flex justify-between"><div className="h-5 bg-slate-100 rounded-lg w-12" /><div className="h-5 bg-slate-100 rounded-lg w-24" /></div><div className="h-5 bg-slate-100 rounded w-3/4" /><div className="space-y-2"><div className="h-4 bg-slate-100 rounded w-full" /><div className="h-4 bg-slate-100 rounded w-5/6" /><div className="h-4 bg-slate-100 rounded w-1/2" /></div></div><div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between"><div className="h-4 bg-slate-100 rounded w-12" /><div className="h-4 bg-slate-100 rounded w-20" /></div></div>)}</div>}>
```

`MessagesPanel` renders `null` while loading or when there are zero help requests, so it adds no visual clutter for inspectors who've never used "Contact Technical Manager."

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/dashboards/inspector/InspectorDashboard.jsx`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/inspector/InspectorDashboard.jsx
git commit -m "feat: show Messages panel on inspector dashboard"
```

---

## Task 8: Full round-trip verification

**Files:** none (verification only)

- [ ] **Step 1:** `npm run dev:all` from repo root.
- [ ] **Step 2:** As an inspector, use the existing "Contact Technical Manager" button on any report form to send a message.
- [ ] **Step 3:** As a manager (second session), confirm the existing bell alert still fires unchanged, then open the new "Help Requests" tab and confirm the message appears with a reply box. Send a reply.
- [ ] **Step 4:** Back on the inspector's dashboard, confirm the new "Messages" section shows the question, open it, and confirm the reply appears attached.
- [ ] **Step 5:** Repeat with a second manager-role account replying to the same thread and confirm both replies show up for the inspector, in order.
- [ ] **Step 6:** If anything is off, fix it in the relevant file from the task above, re-verify, and commit with a `fix:` prefixed message.
