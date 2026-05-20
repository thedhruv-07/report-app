# Inspector Onboarding Flow — Design Spec
**Date:** 2026-05-20  
**Status:** Approved  
**Scope:** Full-stack implementation — DB model, backend API, route guard, 3-step onboarding UI, admin visibility

---

## 1. Overview

When an admin creates a new inspector account, the inspector logs in and is redirected to a mandatory 3-step onboarding flow at `/dashboard/inspector/onboarding`. They cannot access any other inspector page until all 3 steps are complete. Steps: read the user manual, watch 4 training videos, pass a 15-question assessment (≥70%).

This is a hard gate — enforced at both the frontend routing layer (OnboardingGuard component) and the backend API layer (middleware on existing inspector endpoints). Onboarding state is fully server-side so it persists across devices.

---

## 2. Data Layer

### 2a. User Model Extension (`backend/models/user.model.js`)

Add an `onboarding` subdocument to the existing User schema:

```js
onboarding: {
  isCompleted:        { type: Boolean, default: false },
  manualRead:         { type: Boolean, default: false },
  videosWatched:      { type: Boolean, default: false },
  assessmentScore:    { type: Number,  default: null },
  assessmentPassed:   { type: Boolean, default: false },
  assessmentAttempts: { type: Number,  default: 0 },
  completedAt:        { type: Date,    default: null }
}
```

All existing users without this field will behave as if `isCompleted: false` (Mongoose default values handle this on first access). To avoid forcing existing inspectors through onboarding, the seeder will set `isCompleted: true` for any user with `role: 'inspector'` that already exists at migration time.

### 2b. OnboardingQuestion Model (`backend/models/onboardingQuestion.model.js`)

New Mongoose collection: `onboardingquestions`

```js
{
  question:      { type: String, required: true },
  options:       { type: [String], required: true, validate: arr => arr.length === 4 },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  category:      { type: String, enum: ['PSI', 'CLS', 'DPI', 'General', 'Company Policy', 'Professional Conduct'], required: true },
  isActive:      { type: Boolean, default: true }
}
```

The `correctAnswer` field is never sent to the frontend. Server-side grading only.

### 2c. Seeder (`backend/data/seedOnboardingQuestions.js`)

Standalone Node script: `node backend/data/seedOnboardingQuestions.js`

- Checks if questions already exist (idempotent via `OnboardingQuestion.countDocuments()`)
- Inserts 15 questions across 6 categories: PSI (3), CLS (3), DPI (2), General (2), Company Policy (3), Professional Conduct (2)
- Also sets `onboarding.isCompleted = true` for all existing inspector users so they are not retroactively gated

---

## 3. Backend API

### 3a. Onboarding Routes (`backend/routes/onboarding.routes.js`)

Mounted at `/api/inspector/onboarding` in `backend/app.js`.  
All routes protected by `authMiddleware` + `roleCheck(['inspector'])`.

| Method | Path | Controller | Description |
|--------|------|-----------|-------------|
| GET | `/status` | `getStatus` | Returns the inspector's `onboarding` object |
| POST | `/complete-step` | `completeStep` | Sets `manualRead` or `videosWatched` to true |
| GET | `/assessment-questions` | `getQuestions` | Returns active questions, `correctAnswer` stripped |
| POST | `/submit-assessment` | `submitAssessment` | Grades answers server-side, updates all assessment fields |

### 3b. Onboarding Controller (`backend/controllers/onboarding.controller.js`)

**`getStatus`**: Fetch user by `req.user.id`, return `user.onboarding`.

**`completeStep`**: Validate `step` is `'manualRead'` or `'videosWatched'`. Update that field to `true`. Return updated `onboarding` object.

**`getQuestions`**: `OnboardingQuestion.find({ isActive: true }).select('-correctAnswer')`. Returns array of question objects without the answer.

**`submitAssessment`**: 
1. Fetch all active questions with `correctAnswer` included (backend only)
2. Build a map of `questionId → correctAnswer`
3. Iterate `answers` array, count correct responses
4. Compute score: `Math.round((correct / total) * 100)`
5. Increment `assessmentAttempts`
6. Save `assessmentScore = score`
7. If `score >= 70`: set `assessmentPassed = true`, `isCompleted = true`, `completedAt = new Date()`
8. Return `{ passed, score, correctCount, totalCount, categoryBreakdown }`

`categoryBreakdown` is a map of `{ category: { correct, total } }` — used by the frontend to show which categories the inspector missed when they fail.

### 3c. Admin Inspector Route

Mounted at `/api/admin/inspectors` (or extend existing admin routes if a file exists).  
Protected by `authMiddleware` + `roleCheck(['admin', 'manager'])`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | All users with `role: 'inspector'`, returning `name`, `email`, `createdAt`, `onboarding` |

### 3d. Onboarding Completion Middleware (`backend/middleware/onboardingComplete.middleware.js`)

```js
export const requireOnboardingComplete = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('onboarding');
  if (!user?.onboarding?.isCompleted) {
    return res.status(403).json({ error: 'Complete onboarding before accessing reports.' });
  }
  next();
};
```

Applied to existing inspector endpoint handlers in `inspector.routes.js`:
- `GET /dashboard/summary`
- `GET /tasks`
- `GET /tasks/:taskId`
- `POST /tasks/:taskId/accept`
- `GET /notifications`
- `PUT /notifications/read-all`
- `PUT /notifications/:notificationId/read`

The middleware chain becomes: `authMiddleware → requireOnboardingComplete → controller`. (No `roleCheck` needed — these routes are already inspector-only via `authMiddleware` checking the token, and the inspector role has already been validated before reaching these handlers.)

---

## 4. Frontend Architecture

### 4a. AuthContext Extension (`frontend/src/context/AuthContext.jsx`)

Add two new pieces of state:
- `onboardingCompleted: boolean | null` — null while loading, then true/false
- `refreshOnboarding: () => Promise<void>` — re-fetches status and updates state

After login (and on hydration if user is already an inspector), the context calls `GET /api/inspector/onboarding/status`. Only called when `user.role === 'inspector'` — no extra request for other roles.

The `login()` function is unchanged. The extra fetch happens in a `useEffect` that watches `[user]`.

### 4b. OnboardingGuard (`frontend/src/components/auth/OnboardingGuard.jsx`)

```jsx
const OnboardingGuard = () => {
  const { user, onboardingCompleted } = useAuth();
  if (user?.role === 'inspector' && onboardingCompleted === false) {
    return <Navigate to="/dashboard/inspector/onboarding" replace />;
  }
  return <Outlet />;
};
```

`onboardingCompleted === null` (loading state) renders a spinner to prevent redirect flash. `onboardingCompleted === true` or user is not an inspector → renders `<Outlet>` normally.

### 4c. Router Changes (`frontend/src/main.jsx`)

```
/dashboard/inspector/onboarding   ← ProtectedRoute(inspector) only, NO OnboardingGuard
/dashboard/inspector              ← ProtectedRoute(inspector) → OnboardingGuard → InspectorDashboard
/dashboard/inspector/*            ← ProtectedRoute(inspector) → OnboardingGuard → ...
```

The onboarding route sits outside the guard intentionally — if it were inside, incomplete inspectors would be caught in an infinite redirect loop.

### 4d. Onboarding Page Structure

```
frontend/src/dashboards/inspector/onboarding/
  InspectorOnboarding.jsx        ← Page root: manages currentStep state
  StepIndicator.jsx              ← Top bar showing step 1/2/3 with completed/active/locked states
  steps/
    Step1Manual.jsx              ← Scrollable manual, confirm button
    Step2Videos.jsx              ← 4 video cards with mark-as-watched buttons
    Step3Assessment.jsx          ← Question-by-question quiz, results screen
```

**InspectorOnboarding**: On mount, reads the server-side onboarding state (via context) and initializes `currentStep` to the furthest unlocked step. This means a returning inspector who completed step 1 previously sees step 2 when they return.

**Step1Manual**: Displays formatted manual content (static JSX). Confirm button calls `POST /complete-step { step: 'manualRead' }`, then calls `refreshOnboarding()`.

**Step2Videos**: 2×2 grid. Each card has an embedded `<iframe>` (YouTube placeholder URL) and a "Mark as Watched" button. Watching is tracked in local component state (array of 4 booleans). "Continue to Assessment" button is disabled until all 4 are marked. On continue: calls `POST /complete-step { step: 'videosWatched' }`, then `refreshOnboarding()`.

**Step3Assessment**: Fetches questions on mount via `GET /assessment-questions`. Renders one question at a time with a progress bar (`Question X of 15`). Answers stored in local state. On submit: calls `POST /submit-assessment { answers: [...] }`. Shows results screen:
- **Pass (≥70%)**: Green success state, score, "Go to Dashboard" button → navigates to `/dashboard/inspector`. Also calls `refreshOnboarding()` so guard state updates.
- **Fail (<70%)**: Red state, score, `categoryBreakdown` shown as a table of missed categories, "Retry Assessment" button resets local state and re-fetches questions.

### 4e. Admin InspectorDirectory (`frontend/src/dashboards/admin/components/InspectorDirectory.jsx`)

Replace hardcoded mock data with a `useEffect` fetch to `GET /api/admin/inspectors`. Add onboarding status badge column:

| `isCompleted` | `manualRead` or `videosWatched` | Badge |
|---|---|---|
| true | — | Green "Completed" + formatted completedAt date |
| false | either true | Yellow "In Progress" |
| false | both false | Grey "Not Started" |

Existing card UI (avatar, email, active jobs, etc.) is preserved. The onboarding badge is added below the existing rating line.

---

## 5. Files Created / Modified

### New Files
| Path | Purpose |
|------|---------|
| `backend/models/onboardingQuestion.model.js` | OnboardingQuestion schema |
| `backend/data/seedOnboardingQuestions.js` | Question seeder + retroactive inspector migration |
| `backend/routes/onboarding.routes.js` | 4 onboarding API routes |
| `backend/controllers/onboarding.controller.js` | Controller logic for all 4 routes |
| `backend/middleware/onboardingComplete.middleware.js` | Guard middleware for existing inspector routes |
| `frontend/src/components/auth/OnboardingGuard.jsx` | Router-level onboarding gate |
| `frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx` | Page root |
| `frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx` | Step progress bar |
| `frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx` | Manual step |
| `frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx` | Videos step |
| `frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx` | Assessment step |

### Modified Files
| Path | Change |
|------|--------|
| `backend/models/user.model.js` | Add `onboarding` subdocument |
| `backend/app.js` | Mount `/api/inspector/onboarding` and `/api/admin/inspectors` routes |
| `backend/routes/inspector.routes.js` | Insert `requireOnboardingComplete` middleware on all existing handlers |
| `frontend/src/context/AuthContext.jsx` | Add onboarding status fetch + `refreshOnboarding` |
| `frontend/src/main.jsx` | Add onboarding route + OnboardingGuard wrapper |
| `frontend/src/dashboards/admin/components/InspectorDirectory.jsx` | Real data fetch + onboarding column |

---

## 6. Error Handling & Loading States

- AuthContext onboarding fetch: on error, defaults `onboardingCompleted` to `null` (keeps spinner visible rather than incorrectly blocking or allowing)
- All step API calls: loading spinner on button, error toast on failure, no state update on error
- Assessment submission: if network error mid-submission, answers are preserved in local state so inspector can retry without re-answering
- Admin inspector fetch: loading skeleton, error state with retry button

---

## 7. Out of Scope

- Admin UI for adding/editing questions (questions managed via seeder only for now)
- Assessment cooldown between retries
- Email notification when inspector completes onboarding
- Progress auto-save on assessment (answers reset if page is refreshed before submission)
