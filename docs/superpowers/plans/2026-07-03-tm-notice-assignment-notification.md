# Technical Manager Notification on Inspector Assignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When an Inspection Notice's status transitions to `'scheduled'` (i.e. CS assigns an inspector and submits), notify every Technical Manager (`role: 'manager'`) via the existing notification bell.

**Architecture:** A single backend change in `inspectionNotice.controller.js`'s `updateNotice` handler, piggybacking on a transition check that already exists there for a different purpose (`!wasScheduledBefore && updatedNotice.status === 'scheduled'`, currently used to trigger `provisionFromNotice`). Reuses the existing `SystemNotification` model and the existing `manager_room` socket broadcast pattern — no new model, no new frontend code.

**Tech Stack:** Express 5, Mongoose, Socket.io (existing `backend/socket.js` `getIO()` helper).

**No automated test suite exists in this project** (per `CLAUDE.md`). Verification steps are a syntax check (`node --check`) plus an exact manual action with expected observable result.

---

### Task 1: Fire a Technical Manager notification when a notice becomes scheduled

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js:129-138` (inside the existing `updateNotice` function)

- [ ] **Step 1: Add the notification inside the existing scheduling-transition block**

Find this exact block (already in the file):

```js
    // Provision bookings/tasks when notice transitions INTO 'scheduled' for the first time
    let provisioned = null;
    if (!wasScheduledBefore && updatedNotice.status === 'scheduled') {
      try {
        provisioned = await provisionFromNotice(updatedNotice, req.user.id || req.user._id);
        console.log(`[notice] Provisioned ${provisioned.bookings.length} booking(s) for notice ${updatedNotice.noticeId}`);
      } catch (provErr) {
        console.error("[notice] provisionFromNotice failed on update:", provErr.message);
      }
    }
```

Replace it with:

```js
    // Provision bookings/tasks when notice transitions INTO 'scheduled' for the first time
    let provisioned = null;
    if (!wasScheduledBefore && updatedNotice.status === 'scheduled') {
      try {
        provisioned = await provisionFromNotice(updatedNotice, req.user.id || req.user._id);
        console.log(`[notice] Provisioned ${provisioned.bookings.length} booking(s) for notice ${updatedNotice.noticeId}`);
      } catch (provErr) {
        console.error("[notice] provisionFromNotice failed on update:", provErr.message);
      }

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

        getIO().to('manager_room').emit('new_system_notification', {
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
    }
```

Both `require`s are placed inline inside the block (matching the existing convention in `backend/controllers/manager.controller.js:217,289`, which also does `require('../models/systemNotification.model')` inline rather than at the top of the file). The notification step is wrapped in its own try/catch, separate from the `provisionFromNotice` try/catch above it — a notification failure must never be confused with (or block) the booking/task provisioning that already happens in this block, and vice versa.

- [ ] **Step 2: Syntax check**

Run: `cd backend && node --check controllers/inspectionNotice.controller.js`
Expected: no output (clean).

- [ ] **Step 3: Manual verification**

Start the app (`npm run dev:all` from the repo root). Log in as admin in one browser tab and as a manager-role user in a second (or an incognito window). On the admin side, open an Inspection Notice, assign at least one inspector in Section 2 (Team Assignment), and click "Submit Notice" (this sets status to `scheduled` — confirmed by the status badge next to the notice ID changing to "scheduled"). On the manager side (already logged in when this happens), confirm a new notification appears in the bell in real time with the message `"<noticeId> — <customerName> — assigned to <inspectorName>"`. Then refresh the manager's browser and confirm the same notification is still there (proving it's persisted via `SystemNotification`, not just a transient socket event). Also confirm assigning an inspector to a *second* notice, or re-saving the *same* already-scheduled notice, does **not** produce a duplicate notification — the `!wasScheduledBefore` guard should prevent that, since it only fires on the first transition into `scheduled`.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js
git commit -m "feat: notify technical managers when CS schedules an inspection notice"
```
