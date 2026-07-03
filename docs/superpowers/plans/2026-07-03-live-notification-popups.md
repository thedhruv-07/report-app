# Live Notification Popups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Admin, Technical Manager, and Inspector dashboards all show a live popup banner the instant a notification-worthy event happens, instead of only silently updating a bell/badge.

**Architecture:** Add a new `admin_room` Socket.io room (server needs no change — `backend/socket.js` already joins whatever room a client requests); broaden 6 existing emit call sites from `manager_room` only to `['manager_room', 'admin_room']`; extend `frontend/src/context/NotificationContext.jsx` (already wraps every logged-in user regardless of role) to join the role-appropriate room and to react to `new_system_notification` (reusing its existing, already-working banner logic) plus `new_report_submitted`/`report_status_changed` (new lightweight banner push built directly from the event payload).

**Tech Stack:** Socket.io (existing `backend/socket.js` `getIO()` helper), React Context.

**No automated test suite exists in this project.** Verification steps are `node --check`/lint plus an exact manual multi-session test with expected observable result.

---

### Task 1: Broaden the 6 existing `manager_room`-only emits to also reach `admin_room`

**Files:**
- Modify: `backend/controllers/helpRequest.controller.js:22`
- Modify: `backend/controllers/inspectionNotice.controller.js:153`
- Modify: `backend/controllers/factoryAudit.controller.js:13`
- Modify: `backend/controllers/report.controller.js:259`
- Modify: `backend/controllers/manager.controller.js:150,233,305`
- Modify: `backend/controllers/webhook.controller.js:312`

- [ ] **Step 1: `helpRequest.controller.js`**

Find:
```js
    getIO().to('manager_room').emit('new_system_notification', {
```
Replace with:
```js
    getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', {
```

- [ ] **Step 2: `inspectionNotice.controller.js`**

Find:
```js
        getIO().to('manager_room').emit('new_system_notification', {
```
Replace with:
```js
        getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', {
```

- [ ] **Step 3: `factoryAudit.controller.js`**

Find:
```js
    getIO().to("manager_room").emit("new_report_submitted", {
```
Replace with:
```js
    getIO().to(["manager_room", "admin_room"]).emit("new_report_submitted", {
```

- [ ] **Step 4: `report.controller.js`**

Find:
```js
          getIO().to("manager_room").emit("new_report_submitted", {
```
Replace with:
```js
          getIO().to(["manager_room", "admin_room"]).emit("new_report_submitted", {
```

- [ ] **Step 5: `manager.controller.js` — three separate call sites**

Find (first occurrence, `updateStatus`):
```js
    // Emit real-time update to manager room only
    getIO().to("manager_room").emit("report_status_changed", {
```
Replace with:
```js
    // Emit real-time update to manager + admin rooms
    getIO().to(["manager_room", "admin_room"]).emit("report_status_changed", {
```

Find (second occurrence, `requestCorrection`):
```js
    // Emit real-time update to manager room only
    getIO().to("manager_room").emit("report_status_changed", {
```
Replace with:
```js
    // Emit real-time update to manager + admin rooms
    getIO().to(["manager_room", "admin_room"]).emit("report_status_changed", {
```

Find (third occurrence, `finalizeReport`):
```js
    // Emit real-time update to manager room only
    getIO().to("manager_room").emit("report_status_changed", {
```
Replace with:
```js
    // Emit real-time update to manager + admin rooms
    getIO().to(["manager_room", "admin_room"]).emit("report_status_changed", {
```

(All three occurrences have identical surrounding text; replace each one individually in place, in order, so all three get updated — do not use a blind find-and-replace-all without confirming each one's context, since there's also a fourth `report_status_changed` emit at line 358 in the same file that must **not** be touched, see Step 6.)

- [ ] **Step 6: `manager.controller.js` — leave the global broadcast alone**

Confirm this line (in `deliverReport`) is left exactly as-is — it already reaches everyone via a global broadcast, no room targeting needed:
```js
    getIO().emit('report_status_changed', { reportId: report._id, status: report.delivery.status });
```

- [ ] **Step 7: `webhook.controller.js`**

Find:
```js
      io.to("manager_room").emit("new_system_notification", {
```
Replace with:
```js
      io.to(["manager_room", "admin_room"]).emit("new_system_notification", {
```

- [ ] **Step 8: Syntax check all six modified files**

Run:
```bash
cd backend
node --check controllers/helpRequest.controller.js
node --check controllers/inspectionNotice.controller.js
node --check controllers/factoryAudit.controller.js
node --check controllers/report.controller.js
node --check controllers/manager.controller.js
node --check controllers/webhook.controller.js
```
Expected: no output from any of the six (clean).

- [ ] **Step 9: Commit**

```bash
git add backend/controllers/helpRequest.controller.js backend/controllers/inspectionNotice.controller.js backend/controllers/factoryAudit.controller.js backend/controllers/report.controller.js backend/controllers/manager.controller.js backend/controllers/webhook.controller.js
git commit -m "feat: broadcast system notifications to admin_room in addition to manager_room"
```

---

### Task 2: `NotificationContext.jsx` — join the right room and react to more events

**Files:**
- Modify: `frontend/src/context/NotificationContext.jsx:96-107`

- [ ] **Step 1: Update the socket `useEffect`**

Find this exact block:
```js
  // Socket: join user room and refresh on new_notification event
  useEffect(() => {
    if (!user || !token) return;
    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('join', `user_${user.id || user._id}`);
    });
    socket.on('new_notification', () => {
      fetchNotifications();
    });
    return () => socket.disconnect();
  }, [user, token, fetchNotifications]);
```

Replace it with:
```js
  // Socket: join user room (+ role room) and refresh on notification/system events
  useEffect(() => {
    if (!user || !token) return;
    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'], auth: { token } });
    socket.on('connect', () => {
      socket.emit('join', `user_${user.id || user._id}`);
      if (user.role === 'admin') socket.emit('join', 'admin_room');
      if (user.role === 'manager') socket.emit('join', 'manager_room');
    });
    socket.on('new_notification', () => {
      fetchNotifications();
    });
    socket.on('new_system_notification', () => {
      fetchNotifications();
    });

    const pushBanner = (title, message) => {
      const bannerId = Math.random().toString(36).slice(2, 11);
      setActiveBanners(prev => [...prev, { bannerId, title, message }]);
      setTimeout(() => {
        setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId));
      }, 5000);
    };

    socket.on('new_report_submitted', (data) => {
      pushBanner(
        'New Report Submitted',
        `${data.inspectorName || 'An inspector'} submitted a ${data.reportType || 'report'}${data.client ? ` for ${data.client}` : ''}.`
      );
    });
    socket.on('report_status_changed', (data) => {
      pushBanner(
        'Report Status Changed',
        `Report ${(data.reportId?.toString() || '').slice(-6)} is now "${data.status}".`
      );
    });

    return () => socket.disconnect();
  }, [user, token, fetchNotifications]);
```

Note the new `pushBanner` helper is defined inside the effect (not hoisted elsewhere) since it only needs `setActiveBanners`, which is already in scope — no new imports needed.

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/context/NotificationContext.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification — three simultaneous sessions**

Open three browser sessions (or one regular + two incognito/private windows) logged in as: an admin, a manager, and an inspector. Keep all three visible at once.

1. As the inspector, submit any report. Confirm a banner titled "New Report Submitted" appears on **both** the admin and manager sessions within a couple of seconds (previously only the manager would have gotten anything, and even then only a silent bell update).
2. As the manager, change that report's status (e.g. request a correction or finalize it). Confirm a "Report Status Changed" banner appears on both admin and manager sessions.
3. As the admin, schedule an inspection notice (assign an inspector, click Submit Notice). Confirm a banner appears on **both** the admin's own session and the manager session (previously this reached neither dashboard live).
4. As the inspector, use "Contact Technical Manager" on any report form to send a help request. Confirm a banner appears on both admin and manager sessions.
5. As the manager, reply to that help request. Confirm the inspector's session — which already received a real `new_notification` event for this today — now also shows a live banner (previously this silently updated only the bell).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/context/NotificationContext.jsx
git commit -m "feat: live popup banners for admin/manager/inspector on more notification events"
```
