# Inspector Can Reply Back in Help Request Threads

## Context

Follow-up to `2026-07-03-inspector-tm-help-requests-design.md` (implemented and verified). That spec only gave the Technical Manager a reply box (`HelpRequestsPanel.jsx`) — the inspector's side (`MessagesPanel.jsx`'s `MessageDetailModal`) was read-only by design (view the thread, no reply input). Confirmed via screenshot: the inspector sees the TM's reply but has no way to respond. This spec adds that, as a full unlimited back-and-forth — both sides can keep replying in the same thread.

## Design

No new data model — `InspectorHelpRequest.replies` (existing array, `{ message, repliedBy, repliedByName, repliedAt }`) already supports either side pushing into it. The only distinction needed is *whose* reply it is, which is already derivable by comparing `repliedBy` against the viewer's own user id — no new field required.

### Backend

New endpoint: `POST /api/inspector/help-requests/:id/reply`, added to `backend/routes/inspector.routes.js`:
```js
router.post("/help-requests/:id/reply", helpRequestController.inspectorReplyToHelpRequest);
```

New function in `backend/controllers/helpRequest.controller.js`, `inspectorReplyToHelpRequest` — identical body to the existing `replyToHelpRequest`, with one added check: the request is only allowed if the help request belongs to the requesting inspector (`helpRequest.inspectorId.toString() === (req.user.id || req.user._id).toString()`), returning `403` otherwise. This prevents an inspector from replying to someone else's thread if they ever guess another thread's id.

```js
const inspectorReplyToHelpRequest = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const helpRequest = await InspectorHelpRequest.findById(req.params.id);
    if (!helpRequest) return res.status(404).json({ error: 'Help request not found' });

    const requesterId = (req.user.id || req.user._id).toString();
    if (helpRequest.inspectorId.toString() !== requesterId) {
      return res.status(403).json({ error: 'Not your help request' });
    }

    helpRequest.replies.push({
      message: message.trim(),
      repliedBy: requesterId,
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
Added to the `module.exports` list alongside the existing four functions.

### Frontend

- `frontend/src/config/api.js` — add `REPLY_HELP_REQUEST: (id) => \`${API_BASE_URL}/api/inspector/help-requests/${id}/reply\`` under the existing `INSPECTOR` block (mirrors the manager one already there).
- `frontend/src/dashboards/inspector/components/MessagesPanel.jsx`:
  - `MessageDetailModal` gains a reply textarea + Send button at the bottom, functionally identical to `HelpRequestsPanel.jsx`'s existing reply UI (local `replyDraft` state, POST on send, merge the returned `helpRequest` back into `selected`/the list).
  - Needs `user` from `useAuth()` (currently only destructures `token`) to determine, for each entry in `replies`, whether `r.repliedBy === user.id` (styled as "You", e.g. right-aligned or a distinct color) vs. anyone else (styled as "Technical Manager", same blue style as today). If `repliedBy` doesn't match the current user for some reason (shouldn't happen in practice since only the TM and this one inspector can ever reply), fall back to showing `r.repliedByName` as-is — never hide a message due to an unexpected sender.

## Out of scope

- Real-time push of new replies while the modal is open (still fetch-on-load/fetch-on-reply, consistent with the rest of this feature).
- Read receipts / unread indicators for either side.

## Testing

No automated test suite exists in this project. Manual verification: as an inspector, open a thread with an existing TM reply, type a follow-up, send it, confirm it appears styled as "You" in the same modal. As the TM, refresh the Help Requests panel and confirm the inspector's follow-up appears in that thread too, then reply again — confirm the inspector sees the second TM reply after reopening the modal. Also confirm a second, unrelated inspector account cannot reply to the first inspector's thread (expect a 403 if attempted directly against the API).
