# Code Review Report — report-app-main
**Reviewed:** 2026-06-10  
**Repo:** C:\Projects\report-app-main (local)  
**Scope:** Express 5 + MongoDB backend · React 19 + Vite frontend · Socket.io · Groq AI

---

## Summary

| Category | Count | Severity |
|---|---|---|
| 🔴 Critical bugs | 2 | App-breaking |
| 🟠 Security vulnerabilities | 5 | High |
| 🟡 Logic / hidden bugs | 4 | Medium |
| 🔵 ESLint errors | 13 | Errors |
| 🔵 ESLint warnings | 6 | Warnings |

---

## 🔴 CRITICAL BUGS

### BUG 1 — Hardcoded JWT fallback secret committed to git

**File:** `backend/middleware/auth.middleware.js`  
**Line:** 3

**What's wrong:**  
If `JWT_SECRET` is missing from the environment (e.g. a misconfigured deploy, a CI environment, or a staging server), the app silently falls back to the literal string `"veritas-report-app-secret-key-2026"`. That string is now permanently in git history. Any former developer, contractor, or attacker who reads the source can forge valid JWTs for any user — including admins — on any server where the env var was never set.

```js
// ❌ BEFORE
const JWT_SECRET = process.env.JWT_SECRET || "veritas-report-app-secret-key-2026";

// ✅ AFTER — crash at startup if the secret is missing
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
```

---

### BUG 2 — setState called synchronously inside useEffect (cascade render loop)

**File:** `frontend/src/reports/PSI/PSIForm.jsx`  
**Lines:** 306–312 and 359–370

**What's wrong:**  
Two `useEffect` hooks call multiple `setState` functions directly in their body (not inside async callbacks or event handlers). React batches state updates in event handlers but not in `useEffect` bodies — each `setState` triggers a re-render, which can loop or cause severe performance degradation. ESLint's `react-hooks/set-state-in-effect` rule flagged both.

First occurrence — AQL lock effect:
```jsx
// ❌ BEFORE
useEffect(() => {
  if (prefillData) {
    localStorage.setItem("inspectionAqlLocked", "true");
    setAqlLocked(true);   // ← setState in effect body
  }
}, [prefillData]);

// ✅ AFTER — merge into the prefill effect below, or initialise from localStorage
const [aqlLocked, setAqlLocked] = useState(() =>
  localStorage.getItem("inspectionAqlLocked") === "true" || !!prefillData
);
```

Second occurrence — form reset on new task (lines 359–370): the block calls `setItems`, `setPhotos`, `setPhotoGroups`, `setTestRows`, `setTestNextId`, `setStep`, and `setAqlLocked` synchronously. Consolidate all of these into a single `useReducer` dispatch or wrap them in a `flushSync` / `startTransition` call.

---

## 🟠 SECURITY VULNERABILITIES

### VULN 1 — AI endpoints publicly accessible unless NODE_ENV is exactly 'production'

**File:** `backend/app.js`  
**Line:** 80

**What's wrong:**  
The condition `process.env.NODE_ENV !== 'production'` means the AI endpoints (`/api/ai-describe`, `/api/suggest`) are **unauthenticated** on any server where NODE_ENV is `undefined`, `"staging"`, `"test"`, or any other value. A misconfigured deployment silently drains your Groq API quota.

```js
// ❌ BEFORE
const allowAnonAI = process.env.ALLOW_ANON_AI === 'true' || process.env.NODE_ENV !== 'production';

// ✅ AFTER — opt-in only, never opt-out
const allowAnonAI = process.env.ALLOW_ANON_AI === 'true';
```

---

### VULN 2 — No rate limiting on authentication endpoints

**File:** `backend/routes/auth.routes.js`  
**Lines:** 6–10

**What's wrong:**  
`/api/auth/login`, `/api/auth/signup`, `/api/auth/forgot-password`, and `/api/auth/reset-password` have no rate limiting. An attacker can hammer login with thousands of password guesses per second, or spam forgot-password to flood users' inboxes.

```js
// ✅ FIX — add express-rate-limit
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login",           authLimiter, authController.login);
router.post("/signup",          authLimiter, authController.signup);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password",  authLimiter, authController.resetPassword);
```

---

### VULN 3 — Content Security Policy disabled globally

**File:** `backend/app.js`  
**Line:** 29

**What's wrong:**  
`contentSecurityPolicy: false` strips the single most effective browser-side XSS defence. If any endpoint ever reflects user input (email templates, report titles, booking client names), this leaves every user vulnerable.

```js
// ❌ BEFORE
app.use(helmet({
  contentSecurityPolicy: false,
  ...
}));

// ✅ AFTER — enable a permissive but present policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],  // tighten once inline scripts are removed
      imgSrc:     ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL].filter(Boolean),
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
```

---

### VULN 4 — sendImmediateEmail called without await inside try/catch

**File:** `backend/routes/bookings.js`  
**Line:** 317

**What's wrong:**  
`sendImmediateEmail(...)` is called without `await`. Because the call is not awaited, any rejection escapes the surrounding `catch (emailError)` block entirely and becomes an unhandled promise rejection. On Node 18+ this terminates the process in production.

```js
// ❌ BEFORE
sendImmediateEmail({
  to: inspector.email,
  ...
});

// ✅ AFTER
await sendImmediateEmail({
  to: inspector.email,
  ...
});
```

---

### VULN 5 — Unauthenticated Socket.io connection

**File:** `frontend/src/context/NotificationContext.jsx`  
**Line:** 99

**What's wrong:**  
The socket connects without sending the auth token. Any visitor (including bots) can open a persistent socket connection, join user rooms, and listen to real-time events (new notifications, report submissions). Confirm the backend's socket.io auth middleware is enforcing the token.

```js
// ❌ BEFORE
const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });

// ✅ AFTER — pass auth token
const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  auth: { token },
});
```

Then in `backend/socket.js`, verify the token on the `connection` event:
```js
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = verifyToken(token);
  if (!decoded) return next(new Error("Authentication error"));
  socket.user = decoded;
  next();
});
```

---

## 🟡 LOGIC / HIDDEN BUGS

### BUG 3 — Google OAuth never updates an existing account's googleId or picture

**File:** `backend/models/user.model.js`  
**Lines:** 147–162

**What's wrong:**  
`findOrCreateGoogleUser` returns the existing user record immediately if an email match is found, without storing the `googleId` or updating `picture`. This means:
1. A user who first registered with email/password then signs in with Google — their `googleId` is never saved, so any future flow that checks `user.googleId` (e.g., account unlinking) silently fails.
2. The `picture` URL from Google is never persisted to the DB.

```js
// ❌ BEFORE
if (user) {
  return { id: user._id.toString(), name: user.name, email: user.email, ... };
}

// ✅ AFTER — update the record on every Google login
if (user) {
  if (!user.googleId) {
    user.googleId = googleId;
    user.provider = "google";
    await user.save();
  }
  return { id: user._id.toString(), name: user.name, email: user.email, provider: user.provider, role: user.role };
}
```

---

### BUG 4 — Managers get 404 on GET /api/reports/:id

**File:** `backend/controllers/report.controller.js`  
**Line:** 621

**What's wrong:**  
`getReportById` queries `{ _id: id, userId }` — it only returns reports the requesting user created. Managers (role `'manager'`) need to review any inspector's report. The `getReports` list route has an admin bypass (`isAdmin ? {} : { userId }`), but `getReportById` does not, so clicking into any specific report from the manager's queue returns 404.

```js
// ❌ BEFORE
const report = await Report.findOne({ _id: id, userId })

// ✅ AFTER
const isPrivileged = ["admin", "manager"].includes(req.user.role);
const query = isPrivileged ? { _id: id } : { _id: id, userId };
const report = await Report.findOne(query)
```

---

### BUG 5 — Stale booking data returned to inspector after assign

**File:** `backend/routes/bookings.js`  
**Line:** 336

**What's wrong:**  
`Booking.updateOne(...)` is used (not `findByIdAndUpdate`), so the `booking` in-memory object is not refreshed by the DB write. The final `res.json(booking)` returns the booking as it was before the update — `prefillData` may be present in memory but the `status` field still shows its old value. Use `findByIdAndUpdate(..., { new: true })` or re-fetch after `updateOne`.

```js
// ❌ BEFORE
await Booking.updateOne({ _id: booking._id }, { $set: { ... } }, { runValidators: false });
// ... later ...
res.json(booking);  // stale in-memory object

// ✅ AFTER
const updatedBooking = await Booking.findByIdAndUpdate(
  booking._id,
  { $set: { assignedInspectorId, status: 'assigned', prefillData: booking.prefillData } },
  { new: true, runValidators: false }
);
// ... later ...
res.json(updatedBooking);
```

---

### BUG 6 — `taskId` missing from prefill useEffect dependency array

**File:** `frontend/src/reports/PSI/PSIForm.jsx`  
**Line:** 503

**What's wrong:**  
`taskId` is read inside the effect to detect a new task (`savedTaskId !== taskId`) and to clear stale form data, but it is not listed in the `[prefillData]` dependency array. If the task ID changes while `prefillData` stays the same (e.g., reassignment to same inspection type), the effect doesn't re-run, old form data is never cleared, and the inspector sees a previous inspection's data.

```jsx
// ❌ BEFORE
}, [prefillData]);

// ✅ AFTER
}, [prefillData, taskId]);
```

---

## 🔵 ESLint Errors — Quick Fix List

| File | Line | Error | Fix |
|---|---|---|---|
| `AdminDashboard.jsx` | 25 | `user` assigned but never used | Remove from destructure |
| `AdminDashboard.jsx` | 88 | `handleLogout` assigned but never used | Remove the function |
| `BookingReviewModal.jsx` | 32 | `lockedCls` unused | Remove assignment |
| `BookingReviewModal.jsx` | 94 | `useEffect` missing dep: `token` | Add `token` to deps array |
| `BookingsQueue.jsx` | 29 | `onNewBooking` prop defined but never used | Remove prop or wire it up |
| `inspection-notice/NoticeTab.jsx` | 29 | `attachments` unused | Remove assignment |
| `inspection-notice/NoticeTab.jsx` | 45, 60 | `useEffect` missing deps: `updateSection`, quantity fields | Wrap `updateSection` in `useCallback` in parent; add to deps |
| `inspection-notice/ReportTab.jsx` | 7 | `reportUploads` unused | Remove assignment |
| `InspectionNoticeForm.jsx` | 1 | `useCallback` imported but not used | Remove from import |
| `InspectionNoticeForm.jsx` | 218 | `err` in catch never referenced | Rename to `_err` or use `console.error(err)` |
| `TechnicalManagerDashboard.jsx` | 169 | `useEffect` missing dep: `handleOpenReport` | Wrap `handleOpenReport` in `useCallback`; add to deps |
| `PSIForm.jsx` | 294 | `sectionReasons` assigned but never used | Remove or pass to a section display component |
| `PSIForm.jsx` | 310 | `setAqlLocked` in effect body | Move into prefill effect or initialise via `useState` lazy init |
| `PSIForm.jsx` | 366 | Multiple `setState` in effect body | Use `useReducer` dispatch or wrap in `React.startTransition` |
| `PSIForm.jsx` | 503 | `useEffect` missing dep: `taskId` | Add `taskId` (see Bug 6 above) |
| `FinalStep.jsx` | 4 | `onClearAfterDownload` prop never used | Remove prop from destructure (or wire it to the "New Report" button) |
| `Photos.jsx` | 2 | `colors` imported but never used | Remove import |

---

## Quick Wins — Fix in 5 Minutes

- **Remove the JWT fallback string** — `auth.middleware.js:3`. Replace with `process.exit(1)` if missing.
- **Add `await` to `sendImmediateEmail`** — `bookings.js:317`. One word prevents a possible server crash.
- **Fix AI endpoint guard** — `app.js:80`. Change `|| process.env.NODE_ENV !== 'production'` to `|| false` or remove the clause entirely.
- **Add `taskId` to prefill deps array** — `PSIForm.jsx:503`. One token prevents stale-form bug.
- **Add `token` to `BookingReviewModal` useEffect deps** — `BookingReviewModal.jsx:94`. One token prevents a stale closure.
- **Fix manager report fetch** — `report.controller.js:621`. Two lines add the privileged-role bypass.

---

## Recommended: Startup environment validation

Add a `backend/utils/validateEnv.js` that asserts all required vars at boot time. Call it before `mongoose.connect` in `server.js`. Catches misconfigured deploys before they become security holes.

```js
// backend/utils/validateEnv.js
const required = ['JWT_SECRET', 'MONGO_URI', 'GROQ_API_KEY'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
```

---

## Recommended: Add express-rate-limit

```bash
npm install express-rate-limit
```

Apply to auth routes and also consider a global 200 req/min limiter on the entire API to prevent DoS against the Groq key and MongoDB.
