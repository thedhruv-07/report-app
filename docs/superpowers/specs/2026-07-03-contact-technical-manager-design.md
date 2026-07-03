# Contact Technical Manager Button (Inspector Report Forms)

## Context

Part of a larger set of Inspector↔Technical Manager workflow ideas discussed alongside the TM-scheduling-notification feature (`2026-07-03-tm-notice-assignment-notification-design.md`). This is the "inspector needs help while filling a report" piece — a one-way alert (not a two-way in-app chat), matching the confirmed scope.

Research confirmed: no messaging/contact mechanism between Inspector and Technical Manager exists anywhere in the codebase today. This spec builds it from scratch, but reuses the exact `SystemNotification` + `manager_room` socket pattern already established for the TM-scheduling notification, so the Technical Manager sees it in the same notification bell they already use — no new delivery mechanism.

## Backend

### New endpoint: `POST /api/inspector/contact-technical-manager`

Added to `backend/routes/inspector.routes.js` (inside the existing `router.use(authMiddleware); router.use(requireOnboardingComplete);` block, alongside the other inspector routes):

```js
router.post("/contact-technical-manager", inspectorController.contactTechnicalManager);
```

New controller function in `backend/controllers/inspector.controller.js`, following the exact style of the existing `addSectionSkipReason` (named function, validation, try/catch, `module.exports` at the bottom):

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
```

`taskId` is accepted in the request body for traceability but is not required and not currently stored on the notification itself (the `SystemNotification` schema has no `relatedTaskId` field, and adding one is out of scope — the message text alone, including report type and section, is enough context for a TM to know what's being asked about). `priority: 1` and `type: 'urgent'` (vs. `2`/`'info'` used for the scheduling notification) are used deliberately — an inspector actively stuck mid-report is more time-sensitive than a routine assignment notice.

## Frontend

### New component: `frontend/src/components/shared/ContactTechnicalManagerButton.jsx`

A self-contained button + modal, no generic modal component exists in this codebase to build on, so this follows the overlay/escape-key pattern already used by `frontend/src/components/shared/Lightbox.jsx`.

Props: `reportType` (string, e.g. `"Pre-Shipment Inspection"`), `sectionLabel` (string, current step's human-readable label), `taskId` (string or `null`).

Behavior:
1. Renders a small button (e.g. "Contact Technical Manager" with a help/support icon).
2. Clicking opens a centered modal overlay with a textarea ("What do you need help with?") and Send/Cancel buttons. Escape key or backdrop click closes it (matching `Lightbox.jsx`'s existing dismiss behavior).
3. Send POSTs to `ENDPOINTS.INSPECTOR.CONTACT_TM` (new constant, added to `frontend/src/config/api.js` under the existing `INSPECTOR` block, following the `SECTION_SKIP` pattern) with `{ reportType, sectionLabel, taskId, message }` and the auth token from `useAuth()`.
4. On success: shows a toast ("Message sent to Technical Manager") and closes the modal. On failure: shows an inline error in the modal instead of closing, so the inspector doesn't lose what they typed.

### Wiring into the 4 report forms

Each form already renders a "Step X of Y" label inside a header/breadcrumb row; the button is added into that same flex row, right next to it:

- `frontend/src/reports/PSI/PSIForm.jsx` (header row ~1145-1160): `reportType="Pre-Shipment Inspection"`, `sectionLabel={stepNavItems.find(i => i.id === step)?.label}`, `taskId={taskId}` (already in scope at line 327).
- `frontend/src/reports/CLS/CLSForm.jsx` (header row ~388-395): `reportType="Container Loading Supervision"`, `sectionLabel={currentStep?.label}` (already computed at line 375), `taskId` (already in scope at line 35).
- `frontend/src/reports/DPI/DPIForm.jsx` (header row ~381-388): `reportType="During Production Inspection"`, `sectionLabel={currentStep?.label}` (line 365), `taskId` (line 37).
- `frontend/src/reports/FactoryAudit/FactoryAuditForm.jsx` (header row ~770-777): `reportType="Factory Audit"`, `sectionLabel={currentStep?.label}` (line 759), `taskId` (line 37).

No other changes to any of the 4 forms — this is a single new import + one JSX line per file.

## Out of scope

- Two-way reply from the Technical Manager back to the specific inspector (confirmed one-way for this round).
- Any change to the existing `sectionSkipReasons` capture-and-nowhere-to-see-it gap — that's a separate, still-unaddressed item.
- Rate-limiting/cooldown on repeated messages — not needed for an internal tool at this scale (YAGNI).

## Testing

No automated test suite exists in this project. Manual verification: log in as an inspector, open any of the 4 report forms, click "Contact Technical Manager," type a message, send it, and confirm the toast appears. Log in as a manager-role user (in a second session) and confirm the notification appears in their bell in real time, with the correct report type, section label, and message text. Repeat for a form where the inspector arrived without a linked task (`taskId` is `null`) and confirm the request still succeeds.
