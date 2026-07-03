# Notice-Scheduled and Help-Request Email Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send email alerts for the two recently-built features that currently only produce in-app notifications: the TM-scheduling alert and the Inspector Help Request (both creation and reply).

**Architecture:** Reuse `backend/utils/notifyStaff.js` (already creates a `SystemNotification` targeting `['admin', 'manager']` and emails every admin+manager user) for the two staff-facing alerts, replacing the manual `SystemNotification.create({...})` calls already in place. Add one new generic, reusable email template (`system-alert.html`) rather than several near-identical ones. Add a direct single-recipient email for the help-request-reply case, since that targets one specific inspector, not staff broadly.

**Tech Stack:** Existing `email.service.js` (`renderTemplate`), `email.queue.js` (`enqueueEmail`), `notifyStaff.js`.

**No automated test suite exists in this project.** Verification steps are `node --check` plus exact manual actions with expected email inbox results.

---

### Task 1: New generic email template

**Files:**
- Create: `backend/email_templates/system-alert.html`

- [ ] **Step 1: Create the template**

```html
<div style="font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#0f172a; max-width:680px; margin:0 auto; padding:20px; background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6edf3;box-shadow:0 18px 40px rgba(15,23,42,0.08);">
    <tr><td style="height:8px;background:linear-gradient(90deg,#1d4ed8 0%,#7c3aed 100%);"></td></tr>
    <tr>
      <td style="padding:24px 24px 10px;background:#ffffff;text-align:center;">
        <div style="display:inline-block;padding:10px 16px;border:1px solid #dbe7f3;border-radius:12px;background:#fbfdff;">
          {{logoHtml}}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 8px;">
        <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;color:#16325c;text-align:center;">{{title}}</h1>
        <div style="background:#f8fbff;border:1px solid #dbe7f3;border-radius:14px;padding:18px 20px;color:#334155;line-height:1.75;text-align:center;">
          {{message}}
        </div>
        <div style="text-align:center;margin:28px 0 18px;">
          <a href="{{dashboardUrl}}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:13px 28px;border-radius:12px;text-decoration:none;font-weight:700;box-shadow:0 12px 24px rgba(29,78,216,0.20);">Open Dashboard</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px 22px;background:#fbfdff;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #eef2f7;">© {{year}} Absolute Veritas • <a href="mailto:cs@absoluteveritas.com" style="color:#1d4ed8;text-decoration:none;">cs@absoluteveritas.com</a></td>
    </tr>
  </table>
</div>
```

Note the `•` and `©` characters are typed directly as proper UTF-8 (not left as literal HTML entities or, worse, mojibake) — matching the fix already applied to every other template in this directory.

- [ ] **Step 2: Verify it renders without errors**

Run:
```bash
cd backend
node -e "
const { renderTemplate } = require('./services/email.service.js');
const html = renderTemplate('system-alert.html', {
  title: 'Test Title',
  message: 'Test message body',
  dashboardUrl: 'http://localhost:5173/dashboard',
});
console.log(html.includes('Test Title') && html.includes('Test message body') ? 'OK' : 'FAILED');
"
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add backend/email_templates/system-alert.html
git commit -m "feat: add generic system-alert email template"
```

---

### Task 2: Notice-scheduled email via `notifyStaff`

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js` (the block added in the earlier TM-notification feature, currently creating a manual `SystemNotification`)

- [ ] **Step 1: Read the current block to confirm exact text before editing**

Run: `grep -n "SystemNotification.create" -B 5 -A 10 backend/controllers/inspectionNotice.controller.js`

You should see a block resembling:
```js
      try {
        const SystemNotification = require('../models/systemNotification.model');
        const { getIO } = require('../socket');

        const inspectorName = updatedNotice.teamAssignment?.inspectors?.[0]?.name || 'an inspector';
        const notification = await SystemNotification.create({
          title: 'Inspection Notice Scheduled',
          message: `${updatedNotice.noticeId} — ${updatedNotice.basicInfo?.customerName || 'Unknown Client'} — assigned to ${inspectorName}`,
          type: 'info',
          priority: 2,
          targetRoles: ['manager'],
          createdBy: req.user.id || req.user._id,
        });

        getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          createdAt: notification.createdAt,
        });
      } catch (notifErr) {
        console.warn('[notice] Failed to notify managers of scheduling:', notifErr.message);
      }
```
(The `['manager_room', 'admin_room']` array already reflects the popups plan being applied first — if that plan hasn't run yet, it may still say `'manager_room'` alone; either way, this task only changes the `SystemNotification.create` part, not the `getIO()` line.)

- [ ] **Step 2: Replace the manual SystemNotification.create with notifyStaff**

Replace:
```js
        const SystemNotification = require('../models/systemNotification.model');
        const { getIO } = require('../socket');

        const inspectorName = updatedNotice.teamAssignment?.inspectors?.[0]?.name || 'an inspector';
        const notification = await SystemNotification.create({
          title: 'Inspection Notice Scheduled',
          message: `${updatedNotice.noticeId} — ${updatedNotice.basicInfo?.customerName || 'Unknown Client'} — assigned to ${inspectorName}`,
          type: 'info',
          priority: 2,
          targetRoles: ['manager'],
          createdBy: req.user.id || req.user._id,
        });
```
with:
```js
        const notifyStaff = require('../utils/notifyStaff');
        const { getIO } = require('../socket');
        const SystemNotification = require('../models/systemNotification.model');

        const inspectorName = updatedNotice.teamAssignment?.inspectors?.[0]?.name || 'an inspector';
        const title = 'Inspection Notice Scheduled';
        const message = `${updatedNotice.noticeId} — ${updatedNotice.basicInfo?.customerName || 'Unknown Client'} — assigned to ${inspectorName}`;

        await notifyStaff({
          title,
          message,
          type: 'info',
          priority: 2,
          emailSubject: '[Absolute Veritas] Inspection Notice Scheduled',
          templateName: 'system-alert.html',
          templateVars: { title, message },
        });

        const notification = await SystemNotification.findOne({ title, message }).sort({ createdAt: -1 });
```
(`notifyStaff` already creates the `SystemNotification` document internally with `targetRoles: ['admin', 'manager']`, so this task doesn't create a second one — the `findOne` re-fetches the one `notifyStaff` just made, purely so the very next lines in the function, which build the socket payload from `notification._id`/`notification.createdAt`, keep working unchanged.)

Leave the `getIO().to(['manager_room', 'admin_room']).emit(...)` block immediately below completely unchanged.

- [ ] **Step 3: Syntax check**

Run: `cd backend && node --check controllers/inspectionNotice.controller.js`
Expected: no output.

- [ ] **Step 4: Manual verification**

As admin, assign an inspector to an Inspection Notice and click "Submit Notice." Confirm every manager-role user's email inbox (and any address in `NOTIFICATION_ADMIN_EMAILS`, if configured) receives an email titled "Inspection Notice Scheduled" with the correct notice ID/client/inspector name, and that the existing in-app bell notification + live banner (from the popups plan) still work exactly as before.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js
git commit -m "feat: email managers when an inspection notice is scheduled"
```

---

### Task 3: Help-request-created email via `notifyStaff`

**Files:**
- Modify: `backend/controllers/helpRequest.controller.js` — add a top-level require, and update `createHelpRequest`

- [ ] **Step 1: Add `notifyStaff` to the top-level requires**

Find the top of the file:
```js
const InspectorHelpRequest = require('../models/inspectorHelpRequest.model');
const SystemNotification = require('../models/systemNotification.model');
const { getIO } = require('../socket');
```

Replace with:
```js
const InspectorHelpRequest = require('../models/inspectorHelpRequest.model');
const SystemNotification = require('../models/systemNotification.model');
const { getIO } = require('../socket');
const notifyStaff = require('../utils/notifyStaff');
```

- [ ] **Step 2: Replace the manual SystemNotification.create with notifyStaff**

Find:
```js
    const context = [reportType, sectionLabel].filter(Boolean).join(' — Section: ');
    const notification = await SystemNotification.create({
      title: 'Inspector Needs Help',
      message: `${req.user.name} needs help${context ? ` (${context})` : ''}: "${message.trim()}"`,
      type: 'urgent',
      priority: 1,
      targetRoles: ['manager'],
      createdBy: req.user.id || req.user._id,
    });
```

Replace with:
```js
    const context = [reportType, sectionLabel].filter(Boolean).join(' — Section: ');
    const title = 'Inspector Needs Help';
    const helpMessage = `${req.user.name} needs help${context ? ` (${context})` : ''}: "${message.trim()}"`;

    await notifyStaff({
      title,
      message: helpMessage,
      type: 'urgent',
      priority: 1,
      emailSubject: '[Absolute Veritas] Inspector Needs Help',
      templateName: 'system-alert.html',
      templateVars: { title, message: helpMessage },
    });

    const notification = await SystemNotification.findOne({ title, message: helpMessage }).sort({ createdAt: -1 });
```

(The variable was renamed from `message` to `helpMessage` inside this block only to avoid shadowing the `message` destructured from `req.body` at the top of the function — check the top of `createHelpRequest` to confirm `const { reportType, sectionLabel, taskId, message } = req.body;` is still there; if so, `helpMessage` is the correct name to use here instead of reusing `message`, and the following `getIO().to(...).emit(...)` block below — which references `notification.message` — needs no change since it reads off the `notification` object, not the local variable name.)

- [ ] **Step 3: Syntax check**

Run: `cd backend && node --check controllers/helpRequest.controller.js`
Expected: no output.

- [ ] **Step 4: Manual verification**

As an inspector, send a help request from any report form. Confirm every manager-role user's email inbox receives an email titled "Inspector Needs Help" with the correct inspector name/report context/message, and that the existing in-app bell + live banner still work.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/helpRequest.controller.js
git commit -m "feat: email managers when an inspector sends a help request"
```

---

### Task 4: Help-request-reply email to the specific inspector

**Files:**
- Modify: `backend/controllers/helpRequest.controller.js`, `replyToHelpRequest` function only (**not** `inspectorReplyToHelpRequest`)

- [ ] **Step 1: Add the email send after the reply is saved**

Find:
```js
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
```

Replace with:
```js
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

    try {
      const { User } = require('../models/user.model');
      const { renderTemplate } = require('../services/email.service');
      const { enqueueEmail } = require('../services/email.queue');

      const inspector = await User.findById(helpRequest.inspectorId).select('email name').lean();
      if (inspector?.email) {
        const html = renderTemplate('system-alert.html', {
          title: 'Technical Manager Replied',
          message: `${req.user.name} replied to your question: "${message.trim()}"`,
          dashboardUrl: (process.env.FRONTEND_URL || 'https://absolute-veritas.netlify.app') + '/dashboard',
        });
        enqueueEmail({ recipient: inspector.email, subject: '[Absolute Veritas] Technical Manager Replied', type: 'help_request_reply', html });
      }
    } catch (emailErr) {
      console.warn('[helpRequest] Failed to email inspector about reply:', emailErr.message);
    }

    res.json({ helpRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

The email-sending block is wrapped in its own try/catch so an email failure (e.g. bad SMTP config) never turns the reply itself into a failed request — the reply is already saved by the time this code runs.

- [ ] **Step 2: Syntax check**

Run: `cd backend && node --check controllers/helpRequest.controller.js`
Expected: no output.

- [ ] **Step 3: Manual verification**

As a manager, reply to an inspector's help request. Confirm exactly that one inspector's email inbox receives an email titled "Technical Manager Replied" with the correct manager name and reply text — and confirm no other manager or inspector receives this email. Then, as the inspector, reply back to the same thread (via `inspectorReplyToHelpRequest`) and confirm **no** email is sent to anyone for that follow-up (this function was deliberately not touched).

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/helpRequest.controller.js
git commit -m "feat: email the inspector when a technical manager replies to their help request"
```
