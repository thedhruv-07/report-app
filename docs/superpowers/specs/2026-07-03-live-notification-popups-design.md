# Live Notification Popups on Admin, Technical Manager, and Inspector Dashboards

## Context

Today, no dashboard shows a visible popup the instant a notification-worthy event happens — only a silent bell/badge update, except a one-shot "N unread notifications" banner on first login per session. Investigation found:

- `frontend/src/context/NotificationContext.jsx` already has a fully working banner-popup mechanism (lines 36-67: on `fetchNotifications()`, diffs against previously-seen unread IDs and pushes a slide-down banner for anything newly unread) — it's just never triggered by the right events, and the socket connection is never in the right room to receive them.
- Its `getMyNotifications` backend call (`backend/controllers/notification.controller.js:25-44`) already queries `SystemNotification` (not a separate model) for **every role** — admin, manager, and inspector all already go through this same context and endpoint today.
- The only role-based Socket.io room that exists anywhere in the backend is `manager_room` (joined client-side by `frontend/src/dashboards/manager/hooks/useManagerNotifications.js:12-14`). There is no `admin_room`. `NotificationContext.jsx` itself only ever joins a per-user room, `` `user_${user.id}` `` (line 101).
- `new_report_submitted` and `report_status_changed` are separate, non-`SystemNotification`-backed socket events, currently only consumed by `useManagerNotifications.js` to build a local, non-persisted list for the Technical Manager's own bell UI.

So this is a smaller fix than "build a popup system from scratch" — it's wiring the existing banner mechanism to the right events and rooms, plus surfacing two report-lifecycle events that currently only reach the Technical Manager.

## Design

### 1. New `admin_room`, and broadening existing emits

`backend/socket.js` needs no change (it already joins whatever room a client asks for — `socket.on("join", (room) => socket.join(room))`). The six existing emit call sites that currently only target `'manager_room'` are updated to target both rooms:

- `backend/controllers/inspectionNotice.controller.js` (TM-scheduling alert)
- `backend/controllers/helpRequest.controller.js` (help request created)
- `backend/controllers/manager.controller.js` (×3 — status change events)
- `backend/controllers/report.controller.js` (report submitted)
- `backend/controllers/factoryAudit.controller.js` (factory audit submitted)
- `backend/controllers/webhook.controller.js` (booking webhook system notification)

Each changes from:
```js
getIO().to('manager_room').emit('new_system_notification', { ... });
```
to:
```js
getIO().to(['manager_room', 'admin_room']).emit('new_system_notification', { ... });
```
(Socket.io's `.to()` accepts an array of room names natively — no loop needed.)

### 2. `NotificationContext.jsx` joins the right room and listens for more events

In the existing socket `useEffect` (lines 97-107), after the existing `user_${user.id}` join, add a role-based join:
```js
socket.on('connect', () => {
  socket.emit('join', `user_${user.id || user._id}`);
  if (user.role === 'admin') socket.emit('join', 'admin_room');
  if (user.role === 'manager') socket.emit('join', 'manager_room');
});
```
And listen for the additional event name that already carries `SystemNotification`-backed data:
```js
socket.on('new_notification', () => { fetchNotifications(); });
socket.on('new_system_notification', () => { fetchNotifications(); });
```
Both call the exact same `fetchNotifications()` — no new banner logic needed, since that function already detects and displays newly-unread items (the existing lines 36-67 logic is reused verbatim). This one change alone fixes: Admin (currently gets zero live events) and Manager (currently gets the DB write + a silent bell update, but no banner).

### 3. Surfacing `new_report_submitted` / `report_status_changed` as banners too

These aren't `SystemNotification` documents, so they can't go through `fetchNotifications()`. Add two more listeners in the same `useEffect`, building a banner directly from the socket payload, reusing the exact banner-push pattern already in the file (the `bannerId` + `setActiveBanners` + `setTimeout` auto-dismiss block already used at lines 41-47):
```js
socket.on('new_report_submitted', (data) => {
  const bannerId = Math.random().toString(36).slice(2, 11);
  setActiveBanners(prev => [...prev, {
    bannerId,
    title: 'New Report Submitted',
    message: `${data.inspectorName || 'An inspector'} submitted a ${data.reportType || 'report'}${data.client ? ` for ${data.client}` : ''}.`,
  }]);
  setTimeout(() => setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId)), 5000);
});
socket.on('report_status_changed', (data) => {
  const bannerId = Math.random().toString(36).slice(2, 11);
  setActiveBanners(prev => [...prev, {
    bannerId,
    title: 'Report Status Changed',
    message: `Report ${(data.reportId?.toString() || '').slice(-6)} is now "${data.status}".`,
  }]);
  setTimeout(() => setActiveBanners(prev => prev.filter(b => b.bannerId !== bannerId)), 5000);
});
```
`useManagerNotifications.js` is **not modified** — it keeps building its own separate local list for the Technical Manager dashboard's own bell UI exactly as it does today. This is purely additive: the same two events now *also* produce a global banner, on top of whatever the TM-specific hook already does with them.

## Out of scope

- Unifying `NotificationContext`'s socket connection with `useManagerNotifications`'s separate one (two independent Socket.io connections per Technical Manager session already exist today; this spec doesn't reduce that to one — that's an unrelated refactor).
- An `inspector_room` — nothing currently targets `SystemNotification.targetRoles: ['inspector']` anywhere in the codebase, so there's no live event an inspector-role room would currently carry that isn't already reaching them via their personal `user_<id>` room.

## Testing

No automated test suite exists in this project. Manual verification: with an admin, a manager, and an inspector all logged in simultaneously (three sessions), trigger each of the following and confirm a banner appears live (not just a bell-count change) on the expected dashboard(s) within a second or two: submit a report (banner on Admin + Manager), have a manager change a report's status (banner on Admin + Manager), schedule an inspection notice (banner on Admin + Manager), send a help request as an inspector (banner on Admin + Manager), reply to a help request as a manager (confirm the inspector's *existing* `new_notification` path now also produces a banner, not just a silent bell update).
