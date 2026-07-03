# Technical Manager Notification on Inspector Assignment

## Context

When CS/admin assigns an inspector to an Inspection Notice (the notice's `status` transitions to `'scheduled'`, per the existing Submit Notice logic in `InspectionNoticeForm.jsx`), nothing currently informs the Technical Manager. This is the smallest slice of a larger set of ideas discussed (TM dashboard visibility, inspector↔TM messaging, skip-reason routing) — those are explicitly deferred; this spec covers only the notification.

## Design

**Backend only.** In `backend/controllers/inspectionNotice.controller.js`, `updateNotice`:

1. The handler already fetches the notice's prior state (`before`) to detect other changes (e.g. `clientCode` recompute). Add a check: if `before.status !== 'scheduled'` and the newly-updated notice's `status === 'scheduled'`, fire a notification.
2. Create a `SystemNotification` (existing model, `backend/models/systemNotification.model.js` — already supports `targetRoles: ['manager']`, no schema change needed):
   ```js
   const inspectorName = updatedNotice.teamAssignment?.inspectors?.[0]?.name || 'an inspector';
   await SystemNotification.create({
     title: 'Inspection Notice Scheduled',
     message: `${updatedNotice.noticeId} — ${updatedNotice.basicInfo?.customerName || 'Unknown Client'} — assigned to ${inspectorName}`,
     type: 'info',
     priority: 2,
     targetRoles: ['manager'],
     createdBy: req.user._id,
   });
   ```
3. Emit the matching real-time socket event so it also appears instantly for any TM currently online, mirroring the existing pattern in `backend/controllers/webhook.controller.js:310-322`:
   ```js
   getIO().to('manager_room').emit('new_system_notification', {
     id: notification._id.toString(),
     title: notification.title,
     message: notification.message,
     type: notification.type,
     priority: notification.priority,
     createdAt: notification.createdAt,
   });
   ```

No frontend changes at all — the Technical Manager's existing notification bell (`useNotifications()` context, already shared with the Admin dashboard, already reads from `SystemNotification`) picks this up automatically the moment a matching document exists with `targetRoles: ['manager']`.

## Explicitly not included (deferred)

- Technical Manager gaining access to open/view the Inspection Notice page itself.
- Any new nav tab/dashboard section for Technical Managers.
- Per-TM assignment (multiple technical managers, picking a specific one) — every manager-role user gets this notification.
- Inspector↔TM messaging, and routing of inspector "skip reason" popups — both remain separate, un-spec'd future items.

## Testing

No automated test suite exists in this project. Manual verification: as admin, open an Inspection Notice, assign an inspector, click "Submit Notice" (status should become "scheduled"). Log in as a manager-role user in a second browser/session and confirm a new notification appears in their bell with the expected message, both via a live socket push (if already logged in when the assignment happens) and via a page refresh (confirming it's persisted, not just a transient socket event).
