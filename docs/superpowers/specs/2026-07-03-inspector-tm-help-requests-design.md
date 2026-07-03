# Inspector ↔ Technical Manager Help Requests (Two-Way)

## Context

This supersedes the "one-way alert only" scope from `2026-07-03-contact-technical-manager-design.md` (already implemented and confirmed working — the Technical Manager receives a real-time bell notification when an inspector clicks "Contact Technical Manager" on a report form). That part is **not being removed or changed** — it remains the instant "heads up" signal. This spec adds the missing piece: a way for the Technical Manager to actually reply, and for the inspector to see that reply.

## Data model

New file: `backend/models/inspectorHelpRequest.model.js`

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

`replies` is an array (not a single nullable field) because the confirmed scope is "any manager can reply, no claiming" — more than one Technical Manager could independently respond, and the inspector should see all of them, not just the latest. This mirrors the existing array-of-history pattern already used elsewhere in this codebase (e.g. `Task.sectionSkipReasons`, `Report.correctionFeedback`).

## Backend

### New controller: `backend/controllers/helpRequest.controller.js`

Single file, four functions, used by both the inspector and manager route files (this is one cohesive subsystem — "help request lifecycle" — not two unrelated features that happen to share a model):

- `createHelpRequest(req, res)` — the existing `contactTechnicalManager` function moves out of `inspector.controller.js` into this new file entirely (renamed to `createHelpRequest`), and `backend/routes/inspector.routes.js`'s `POST /contact-technical-manager` route is repointed from `inspectorController.contactTechnicalManager` to `helpRequestController.createHelpRequest`. The endpoint URL, request body shape, and response shape are all unchanged from the already-implemented version — only where the function physically lives changes, so nothing on the frontend needs to change for this part. In addition to the existing `SystemNotification` + socket emit (copied over verbatim, untouched behavior), it now also does:
  ```js
  const InspectorHelpRequest = require('../models/inspectorHelpRequest.model');
  await InspectorHelpRequest.create({
    inspectorId: req.user.id || req.user._id,
    inspectorName: req.user.name,
    reportType,
    sectionLabel,
    taskId: taskId || null,
    message: message.trim(),
  });
  ```
- `getHelpRequestsForInspector(req, res)` — `InspectorHelpRequest.find({ inspectorId: req.user.id || req.user._id }).sort({ createdAt: -1 })`. Mounted as `GET /api/inspector/help-requests` in `backend/routes/inspector.routes.js` (inside the existing auth-gated block).
- `getHelpRequestsForManager(req, res)` — `InspectorHelpRequest.find({}).sort({ createdAt: -1 }).limit(50)`. Mounted as `GET /api/manager/help-requests` in `backend/routes/manager.routes.js` (inside the existing `roleCheck(["manager", "admin"])` block).
- `replyToHelpRequest(req, res)` — takes `{ message }` in the body, pushes `{ message, repliedBy: req.user.id, repliedByName: req.user.name, repliedAt: new Date() }` into the matching document's `replies` array, saves, returns the updated document. Mounted as `POST /api/manager/help-requests/:id/reply` in `manager.routes.js`.

No socket push on reply for this round — the inspector will see new replies the next time they view their Messages section (matches the existing precedent that most of this app's list views are fetch-on-load, not push-driven; the bell/socket infrastructure is reserved for the "someone needs immediate attention" alert, which already exists and isn't being duplicated here).

## Frontend

### Technical Manager side

- `frontend/src/dashboards/manager/components/ManagerChrome.jsx` — add a new nav button "Help Requests" alongside the existing Dashboard/Report Queue/Notifications/Profile buttons, setting `activeView('help-requests')`.
- `frontend/src/dashboards/manager/TechnicalManagerDashboard.jsx` — render a new `HelpRequestsPanel` component when `activeView === 'help-requests'`.
- New component `frontend/src/dashboards/manager/components/HelpRequestsPanel.jsx` — fetches `GET /api/manager/help-requests` on mount, renders each as a card (inspector name, report type/section, original message, any existing replies, timestamps) with a reply textarea + Send button at the bottom of each card. Sending POSTs to the reply endpoint and updates that card's `replies` array in local state (no full re-fetch needed).

### Inspector side

- `frontend/src/dashboards/inspector/InspectorDashboard.jsx` — add a new "Messages" section appended directly after the existing status-filter pill row (after the block ending around line 291), before the task grid.
- New component `frontend/src/dashboards/inspector/components/MessagesPanel.jsx` — fetches `GET /api/inspector/help-requests` on mount, renders a compact list (question + report/section context + reply count if any), clicking an item opens a detail modal showing the full thread (original message + all replies with names/timestamps), following the existing `TaskGrid` → `TaskDetailsModal` click-to-detail pattern already used elsewhere in this same dashboard.

## Out of scope

- Real-time push of replies to the inspector (fetch-on-load is sufficient for this round).
- "Claiming" a help request so only one TM handles it — explicitly not needed per the confirmed scope.
- Marking a thread as "resolved"/closed — no status field on the model; threads just accumulate history.
- Any change to the existing one-way bell alert — it stays exactly as already implemented.

## Testing

No automated test suite exists in this project. Manual verification: as an inspector, use the existing "Contact Technical Manager" button on any report form to send a message. As a manager, confirm the existing bell alert still fires (unchanged), then open the new "Help Requests" tab and confirm the message appears with a reply box; send a reply. Back on the inspector's dashboard, open the new "Messages" section and confirm the reply appears attached to the original question. Repeat with a second manager-role account replying to the same thread and confirm both replies show up for the inspector, in order.
