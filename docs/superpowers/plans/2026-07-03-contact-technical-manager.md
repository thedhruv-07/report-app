# Contact Technical Manager Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an inspector, while filling in any of the 4 report forms, send a one-way "I need help" alert to every Technical Manager, per `docs/superpowers/specs/2026-07-03-contact-technical-manager-design.md`.

**Architecture:** One new backend endpoint (`POST /api/inspector/contact-technical-manager`) reusing the exact `SystemNotification` + `manager_room` socket pattern from the TM-scheduling-notification feature. One new self-contained frontend component (`ContactTechnicalManagerButton.jsx`) — button + modal + its own `useToast()`/`ToastList` instance, so it needs nothing from its host form except `reportType`/`sectionLabel`/`taskId`. Wired into the header row of all 4 report forms (PSI, CLS, DPI, Factory Audit) with a single import + one JSX line each.

**Tech Stack:** Express 5, Mongoose, Socket.io (backend); React 19, existing `useAuth()`/`useToast()`/`ToastList` (frontend).

**No automated test suite exists in this project.** Verification is `node --check`/lint plus the exact manual two-session walkthrough from the spec.

---

## Task 1: Backend — `contactTechnicalManager` controller + route

**Files:**
- Modify: `backend/controllers/inspector.controller.js`
- Modify: `backend/routes/inspector.routes.js`

- [ ] **Step 1: Add the controller function**

Add in `backend/controllers/inspector.controller.js`, right before `addSectionSkipReason` (or immediately after it — either position is fine, just keep it grouped with the other named-function-then-module.exports style already used in this file):

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

`taskId` is accepted for traceability in logs/future use but not stored on the notification (`SystemNotification` has no `relatedTaskId` field, and adding one is out of scope — report type + section in the message text is enough context). Both `require`s are inline, matching `manager.controller.js:217,289`'s existing convention for `systemNotification.model`.

- [ ] **Step 2: Export it**

Find the `module.exports` block at the end of the file:

```js
module.exports = {
  getSummary,
  getTasks,
  getTaskById,
  acceptTask,
  addSectionSkipReason,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

Replace with:

```js
module.exports = {
  getSummary,
  getTasks,
  getTaskById,
  acceptTask,
  addSectionSkipReason,
  contactTechnicalManager,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
```

- [ ] **Step 3: Add the route**

Find in `backend/routes/inspector.routes.js`:

```js
router.patch("/tasks/:taskId/section-skip", inspectorController.addSectionSkipReason);

// Notifications
```

Replace with:

```js
router.patch("/tasks/:taskId/section-skip", inspectorController.addSectionSkipReason);
router.post("/contact-technical-manager", inspectorController.contactTechnicalManager);

// Notifications
```

- [ ] **Step 4: Verify both files load**

Run:
```bash
cd backend
node --check controllers/inspector.controller.js
node -e "require('dotenv').config({ path: '../.env' }); require('./routes/inspector.routes.js'); console.log('OK');"
```
Expected: no output from `node --check`, then `OK`.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/inspector.controller.js backend/routes/inspector.routes.js
git commit -m "feat: add contact-technical-manager endpoint for inspectors"
```

---

## Task 2: Frontend — `ENDPOINTS.INSPECTOR.CONTACT_TM` constant

**Files:**
- Modify: `frontend/src/config/api.js`

- [ ] **Step 1: Add the constant**

Find:

```js
    SECTION_SKIP: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/section-skip`,
    NOTIFICATIONS: `${API_BASE_URL}/api/inspector/notifications`,
```

Replace with:

```js
    SECTION_SKIP: (id) => `${API_BASE_URL}/api/inspector/tasks/${id}/section-skip`,
    CONTACT_TM: `${API_BASE_URL}/api/inspector/contact-technical-manager`,
    NOTIFICATIONS: `${API_BASE_URL}/api/inspector/notifications`,
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/config/api.js`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/config/api.js
git commit -m "feat: add CONTACT_TM endpoint constant"
```

---

## Task 3: Frontend — `ContactTechnicalManagerButton.jsx`

**Files:**
- Create: `frontend/src/components/shared/ContactTechnicalManagerButton.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useState, useEffect } from 'react';
import { LifeBuoy, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import useToast from '../../hooks/useToast';
import ToastList from './ToastList';

export default function ContactTechnicalManagerButton({ reportType, sectionLabel, taskId }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, addToast, dismiss } = useToast();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.CONTACT_TM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportType, sectionLabel, taskId, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send message');
      }
      addToast('Message sent to Technical Manager', 'success');
      setOpen(false);
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px',
          border: '1px solid #f59e0b', background: '#fffbeb', color: '#b45309',
          fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <LifeBuoy size={13} />
        Contact Technical Manager
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(92vw, 440px)', background: '#fff', borderRadius: '14px',
              padding: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>Contact Technical Manager</h3>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
              What do you need help with?
            </label>
            <textarea
              autoFocus
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you're stuck on..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px',
                fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }}
            />
            {error && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>{error}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: sending || !message.trim() ? '#94a3b8' : '#6C47FF', color: '#fff',
                  fontSize: '13px', fontWeight: 700, cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastList toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/components/shared/ContactTechnicalManagerButton.jsx`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/ContactTechnicalManagerButton.jsx
git commit -m "feat: add ContactTechnicalManagerButton component"
```

---

## Task 4: Wire the button into all 4 report forms

**Files:**
- Modify: `frontend/src/reports/PSI/PSIForm.jsx`
- Modify: `frontend/src/reports/CLS/CLSForm.jsx`
- Modify: `frontend/src/reports/DPI/DPIForm.jsx`
- Modify: `frontend/src/reports/FactoryAudit/FactoryAuditForm.jsx`

- [ ] **Step 1: PSIForm.jsx — add the import**

Find:

```jsx
import PrefillToast from '../shared/components/PrefillToast';
```

Replace with:

```jsx
import PrefillToast from '../shared/components/PrefillToast';
import ContactTechnicalManagerButton from '../../components/shared/ContactTechnicalManagerButton';
```

- [ ] **Step 2: PSIForm.jsx — add the button next to the step indicator**

Find:

```jsx
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {lastSaved && (
                <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of 14</span>
            </div>
```

Replace with:

```jsx
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {lastSaved && (
                <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  Auto-saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <ContactTechnicalManagerButton
                reportType="Pre-Shipment Inspection"
                sectionLabel={stepNavItems.find(i => i.id === step)?.label}
                taskId={taskId}
              />
              <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of 14</span>
            </div>
```

- [ ] **Step 3: CLSForm.jsx — add the import**

Find:

```jsx
import { useAuth } from "../../context/AuthContext";
```

Replace with:

```jsx
import { useAuth } from "../../context/AuthContext";
import ContactTechnicalManagerButton from '../../components/shared/ContactTechnicalManagerButton';
```

- [ ] **Step 4: CLSForm.jsx — add the button**

Find:

```jsx
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Container Loading Supervision</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
        </div>
```

Replace with:

```jsx
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Container Loading Supervision</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ContactTechnicalManagerButton
              reportType="Container Loading Supervision"
              sectionLabel={currentStep?.label}
              taskId={taskId}
            />
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
          </div>
        </div>
```

- [ ] **Step 5: DPIForm.jsx — add the import**

Find:

```jsx
import { useAuth } from "../../context/AuthContext";
```

Replace with:

```jsx
import { useAuth } from "../../context/AuthContext";
import ContactTechnicalManagerButton from '../../components/shared/ContactTechnicalManagerButton';
```

- [ ] **Step 6: DPIForm.jsx — add the button**

Find:

```jsx
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>During Production Inspection</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {totalSteps}</span>
        </div>
```

Replace with:

```jsx
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>During Production Inspection</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ContactTechnicalManagerButton
              reportType="During Production Inspection"
              sectionLabel={currentStep?.label}
              taskId={taskId}
            />
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {totalSteps}</span>
          </div>
        </div>
```

- [ ] **Step 7: FactoryAuditForm.jsx — add the import**

Find:

```jsx
import { useAuth } from "../../context/AuthContext";
```

Replace with:

```jsx
import { useAuth } from "../../context/AuthContext";
import ContactTechnicalManagerButton from '../../components/shared/ContactTechnicalManagerButton';
```

- [ ] **Step 8: FactoryAuditForm.jsx — add the button**

Find:

```jsx
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Factory Audit</span>
          </div>
          <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
        </div>
```

Replace with:

```jsx
            <span style={{ fontSize: "12px", fontWeight: "700", color: colors.header }}>Factory Audit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ContactTechnicalManagerButton
              reportType="Factory Audit"
              sectionLabel={currentStep?.label}
              taskId={taskId}
            />
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>Step {step} of {steps.length}</span>
          </div>
        </div>
```

- [ ] **Step 9: Lint check all 4 files**

Run:
```bash
cd frontend
npx eslint src/reports/PSI/PSIForm.jsx src/reports/CLS/CLSForm.jsx src/reports/DPI/DPIForm.jsx src/reports/FactoryAudit/FactoryAuditForm.jsx
```
Expected: no output.

- [ ] **Step 10: Manual verification**

Run `npm run dev:all`. Log in as an inspector, open each of the 4 report forms in turn, confirm the "Contact Technical Manager" button appears in the header row next to the step indicator. Click it, type a message, click Send, confirm the toast "Message sent to Technical Manager" appears and the modal closes. In a second session logged in as a manager-role user, confirm the notification bell shows the message live (via socket) with the correct report type, section label, and message text. Also test Escape-key and backdrop-click to dismiss the modal without sending, and confirm a failed send (e.g. stop the backend briefly) shows the inline error without closing the modal or losing the typed message.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/reports/PSI/PSIForm.jsx frontend/src/reports/CLS/CLSForm.jsx frontend/src/reports/DPI/DPIForm.jsx frontend/src/reports/FactoryAudit/FactoryAuditForm.jsx
git commit -m "feat: wire Contact Technical Manager button into all 4 report forms"
```
