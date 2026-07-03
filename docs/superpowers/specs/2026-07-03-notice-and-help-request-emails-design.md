# Email Alerts for Notice-Scheduled and Help-Request Events

## Context

Part of the same round as `2026-07-03-live-notification-popups-design.md`. Two recently built features — the TM-scheduling alert (`inspectionNotice.controller.js`) and the Inspector Help Request feature (`helpRequest.controller.js`) — currently only produce in-app `SystemNotification`s, no emails, unlike older features (report submission, approval/rejection/delivery) which already have full email coverage via `backend/utils/notifyStaff.js` and `backend/services/email.service.js`.

## Design

### Reusing `notifyStaff` for the two staff-facing alerts

`backend/utils/notifyStaff.js` already does exactly what's needed for both "notice scheduled" and "help request created": it creates a `SystemNotification` (with `targetRoles: ['admin', 'manager']` — note this is *broader* than the current manual `targetRoles: ['manager']` in both controllers today, which conveniently also serves the "Admin should see this too" goal from the popups spec) and emails every admin+manager user plus anything in `NOTIFICATION_ADMIN_EMAILS`, using `renderTemplate`.

Both `inspectionNotice.controller.js` and `helpRequest.controller.js` replace their manual `SystemNotification.create({...})` call with:

```js
const notifyStaff = require('../utils/notifyStaff');
await notifyStaff({
  title: 'Inspection Notice Scheduled', // or 'Inspector Needs Help'
  message: /* same message string already being built */,
  type: 'info', // or 'urgent' for the help request
  priority: 2,  // or 1 for the help request
  emailSubject: '[Absolute Veritas] Inspection Notice Scheduled', // or '[Absolute Veritas] Inspector Needs Help'
  templateName: 'system-alert.html',
  templateVars: { title: /* same as SystemNotification title */, message: /* same as SystemNotification message */ },
});
```

The separate real-time socket emit (`getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', ...)`, per the popups spec) stays as its own explicit line right after — `notifyStaff` only handles the DB write + email, not the live push.

### New generic template: `backend/email_templates/system-alert.html`

One reusable template instead of two near-identical ones — these are pure "here's a title and a message" notifications with no unique visual needs per event type:

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

Note: no mojibake characters (`•`, `©` typed directly as proper UTF-8, matching the earlier fix to every other template), and `dashboardUrl` is already provided automatically by `notifyStaff` itself (line 6/28 of that file), so no extra wiring needed for that placeholder.

### Help-request-replied email — direct to the specific inspector

This one doesn't fit `notifyStaff` (which always targets admin+manager broadly) — it needs to go to exactly one person, the inspector who asked the question. Added to `helpRequestController.replyToHelpRequest` (not `inspectorReplyToHelpRequest` — an inspector replying to their own thread should never trigger an email to themselves):

```js
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
```

This reuses the same `system-alert.html` template — same visual treatment, different title/message, consistent with the DRY reasoning above.

## Out of scope

- Emailing the manager when an *inspector* sends a follow-up reply in an already-open thread (only the original help-request-created event emails staff; back-and-forth follow-ups stay in-app only, matching the "don't email on every message in a thread" restraint already implicit in how report status changes don't re-email on every minor update either).
- Any change to the existing, already-working email flows (report submission, approval, rejection, delivery) — those are untouched.

## Testing

No automated test suite exists in this project. Manual verification: schedule an inspection notice and confirm an email arrives at every manager's inbox (plus `NOTIFICATION_ADMIN_EMAILS` if configured) with the correct title/message and a working "Open Dashboard" link; send an inspector help request and confirm the same for that event; have a manager reply to a help request and confirm exactly the originating inspector (not all managers, not other inspectors) receives an email about the reply.
