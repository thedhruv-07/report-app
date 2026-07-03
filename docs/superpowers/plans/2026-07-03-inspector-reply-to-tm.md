# Inspector Can Reply Back in Help Request Threads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the inspector send follow-up replies inside their own help-request thread (currently read-only — confirmed via screenshot: they can see the TM's replies but have no input to respond).

**Architecture:** One new backend endpoint reusing the existing `InspectorHelpRequest.replies` array (no new field — a reply's origin is derived by comparing `repliedBy` against the viewer's own id), gated so an inspector can only reply to their own thread. One frontend change: add a reply box to the existing read-only `MessageDetailModal` inside `MessagesPanel.jsx`, mirroring the reply UI the Technical Manager side already has in `HelpRequestsPanel.jsx`.

**Tech Stack:** Express 5, Mongoose, React.

**No automated test suite exists in this project.** Verification is `node --check`/lint plus exact manual actions with expected observable results.

---

### Task 1: Backend — inspector-scoped reply endpoint

**Files:**
- Modify: `backend/controllers/helpRequest.controller.js`
- Modify: `backend/routes/inspector.routes.js`

- [ ] **Step 1: Add the new function**

Find the end of the existing `replyToHelpRequest` function and the `module.exports` block:
```js
module.exports = {
  createHelpRequest,
  getHelpRequestsForInspector,
  getHelpRequestsForManager,
  replyToHelpRequest,
};
```

Replace it with (adding the new function directly above the exports, and adding it to the export list):
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

module.exports = {
  createHelpRequest,
  getHelpRequestsForInspector,
  getHelpRequestsForManager,
  replyToHelpRequest,
  inspectorReplyToHelpRequest,
};
```

- [ ] **Step 2: Wire the route**

Find in `backend/routes/inspector.routes.js`:
```js
router.post("/contact-technical-manager", helpRequestController.createHelpRequest);
router.get("/help-requests", helpRequestController.getHelpRequestsForInspector);
```

Replace with:
```js
router.post("/contact-technical-manager", helpRequestController.createHelpRequest);
router.get("/help-requests", helpRequestController.getHelpRequestsForInspector);
router.post("/help-requests/:id/reply", helpRequestController.inspectorReplyToHelpRequest);
```

- [ ] **Step 3: Syntax check**

Run:
```bash
cd backend
node --check controllers/helpRequest.controller.js
node --check routes/inspector.routes.js
```
Expected: no output from either.

- [ ] **Step 4: Manual verification (backend only, via curl or a REST client)**

With a valid inspector JWT and an existing help request `_id` belonging to that inspector, confirm `POST /api/inspector/help-requests/<id>/reply` with body `{"message": "test reply"}` returns `200` with the updated `helpRequest` including the new entry in `replies`. Then confirm that the *same* request, using a JWT for a **different** inspector account (not the thread's owner), returns `403` with `{"error": "Not your help request"}`.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/helpRequest.controller.js backend/routes/inspector.routes.js
git commit -m "feat: let inspectors reply to their own help request threads"
```

---

### Task 2: Frontend — reply box in the inspector's message modal

**Files:**
- Modify: `frontend/src/config/api.js`
- Modify: `frontend/src/dashboards/inspector/components/MessagesPanel.jsx`

- [ ] **Step 1: Add the new endpoint constant**

Find in `frontend/src/config/api.js`:
```js
    CONTACT_TM: `${API_BASE_URL}/api/inspector/contact-technical-manager`,
    HELP_REQUESTS: `${API_BASE_URL}/api/inspector/help-requests`,
```

Replace with:
```js
    CONTACT_TM: `${API_BASE_URL}/api/inspector/contact-technical-manager`,
    HELP_REQUESTS: `${API_BASE_URL}/api/inspector/help-requests`,
    REPLY_HELP_REQUEST: (id) => `${API_BASE_URL}/api/inspector/help-requests/${id}/reply`,
```

- [ ] **Step 2: Add `user` to the existing `useAuth()` call and add reply state**

Find in `frontend/src/dashboards/inspector/components/MessagesPanel.jsx`:
```js
export default function MessagesPanel() {
  const { token } = useAuth();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
```

Replace with:
```js
export default function MessagesPanel() {
  const { token, user } = useAuth();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [sending, setSending] = useState(false);
```

- [ ] **Step 3: Add the reply handler**

Find the `useEffect` that fetches help requests (right after the state declarations, before `if (loading || helpRequests.length === 0) return null;`):
```js
  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.INSPECTOR.HELP_REQUESTS, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHelpRequests(data.helpRequests || []))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || helpRequests.length === 0) return null;
```

Replace with:
```js
  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.INSPECTOR.HELP_REQUESTS, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHelpRequests(data.helpRequests || []))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReply = async () => {
    const text = replyDraft.trim();
    if (!text || sending || !selected) return;
    setSending(true);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.REPLY_HELP_REQUEST(selected._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setHelpRequests(prev => prev.map(h => h._id === selected._id ? data.helpRequest : h));
        setSelected(data.helpRequest);
        setReplyDraft('');
      }
    } catch {
      // silently ignore — the textarea keeps the draft so the inspector can retry
    } finally {
      setSending(false);
    }
  };

  if (loading || helpRequests.length === 0) return null;
```

- [ ] **Step 4: Style replies by sender and add the reply box to `MessageDetailModal`**

Find the `MessageDetailModal` function signature and its replies-rendering block:
```js
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
```

Replace with:
```js
function MessageDetailModal({ helpRequest, onClose, currentUserId, replyDraft, onReplyDraftChange, onSend, sending }) {
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
              {helpRequest.replies.map((r, idx) => {
                const isMine = currentUserId && r.repliedBy === currentUserId;
                return (
                  <div
                    key={idx}
                    className={`border rounded-xl p-3 text-sm ${isMine ? 'bg-emerald-50/40 border-emerald-100' : 'bg-blue-50/40 border-blue-100'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isMine ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {isMine ? 'You' : r.repliedByName}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(r.repliedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{r.message}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No reply yet — check back later.</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-2">
          <input
            type="text"
            value={replyDraft}
            onChange={e => onReplyDraftChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
            placeholder="Type a reply…"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            onClick={onSend}
            disabled={sending || !replyDraft.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
          >
            {sending ? 'Sending…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

`currentUserId` is compared against `r.repliedBy` directly as strings — confirm this works by checking what shape `repliedBy` comes back as in the JSON response (Mongoose `ObjectId` fields serialize to plain strings over JSON, so a direct `===` against `user.id`, which is also a string, is correct — no `.toString()` needed on the frontend side).

- [ ] **Step 5: Wire the new props where `MessageDetailModal` is rendered**

Find the bottom of `MessagesPanel`'s return statement:
```js
      <MessageDetailModal helpRequest={selected} onClose={() => setSelected(null)} />
```

Replace with:
```js
      <MessageDetailModal
        helpRequest={selected}
        onClose={() => { setSelected(null); setReplyDraft(''); }}
        currentUserId={user?.id}
        replyDraft={replyDraft}
        onReplyDraftChange={setReplyDraft}
        onSend={handleReply}
        sending={sending}
      />
```

- [ ] **Step 6: Lint check**

Run: `cd frontend && npx eslint src/config/api.js src/dashboards/inspector/components/MessagesPanel.jsx`
Expected: no output.

- [ ] **Step 7: Manual verification**

As an inspector, open a help-request thread that already has at least one Technical Manager reply. Type a follow-up in the new input at the bottom of the modal and send it — confirm it appears immediately, styled in green and labeled "You" (not your own name), while the TM's earlier reply stays blue and labeled "Technical Manager". Close and reopen the modal (re-fetching from the server) and confirm the same follow-up is still there in the same position. As the Technical Manager, open the "Help Requests" panel and confirm the inspector's follow-up shows up in that thread too, then send another reply — reopen the inspector's modal and confirm that second TM reply now appears after the inspector's own message, in the correct chronological order.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/config/api.js frontend/src/dashboards/inspector/components/MessagesPanel.jsx
git commit -m "feat: let inspectors reply inside their own help request thread"
```
