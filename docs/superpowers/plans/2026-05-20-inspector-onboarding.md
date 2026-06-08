# Inspector Onboarding Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mandatory 3-step onboarding flow (manual → videos → assessment) that gates inspectors from their dashboard until complete, with admin visibility into onboarding status.

**Architecture:** Onboarding state lives in a subdocument on the `User` model. The backend grades assessments server-side and never exposes correct answers. On the frontend, `AuthContext` fetches onboarding status after login; an `OnboardingGuard` router component redirects incomplete inspectors to `/dashboard/inspector/onboarding`.

**Tech Stack:** Express 5, Mongoose, React 19, React Router v6, Tailwind CSS 4, Vite

> **Note:** No test suite is configured in this project (per CLAUDE.md). Steps skip the TDD cycle and go straight to implementation + server-restart verification.

---

## File Map

### New backend files
| Path | Responsibility |
|------|---------------|
| `backend/models/onboardingQuestion.model.js` | OnboardingQuestion schema |
| `backend/data/seedOnboardingQuestions.js` | 15 questions + inspector migration seeder |
| `backend/controllers/onboarding.controller.js` | 4 onboarding endpoint handlers |
| `backend/routes/onboarding.routes.js` | Routes for `/api/inspector/onboarding/*` |
| `backend/controllers/admin.controller.js` | Inspector listing for admin |
| `backend/routes/admin.routes.js` | Routes for `/api/admin/*` |
| `backend/middleware/onboardingComplete.middleware.js` | 403 guard for existing inspector endpoints |

### Modified backend files
| Path | Change |
|------|--------|
| `backend/models/user.model.js` | Add `onboarding` subdocument |
| `backend/routes/inspector.routes.js` | Insert `requireOnboardingComplete` middleware |
| `backend/app.js` | Mount onboarding + admin routes |

### New frontend files
| Path | Responsibility |
|------|---------------|
| `frontend/src/components/auth/OnboardingGuard.jsx` | Router-level gate; redirects incomplete inspectors |
| `frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx` | Page root; manages step state |
| `frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx` | Step progress bar component |
| `frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx` | User manual step |
| `frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx` | Training videos step |
| `frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx` | Quiz + results step |

### Modified frontend files
| Path | Change |
|------|--------|
| `frontend/src/config/api.js` | Add ONBOARDING and ADMIN endpoint groups |
| `frontend/src/context/AuthContext.jsx` | Add onboarding status fetch + `refreshOnboarding` |
| `frontend/src/main.jsx` | Add onboarding route + `OnboardingGuard` wrapper |
| `frontend/src/dashboards/admin/components/InspectorDirectory.jsx` | Fetch real data, add onboarding badge |
| `frontend/src/dashboards/admin/AdminDashboard.jsx` | Remove MOCK_INSPECTORS prop |

---

## Task 1: Extend User model with onboarding subdocument

**Files:**
- Modify: `backend/models/user.model.js`

- [ ] **Step 1: Add the onboarding subdocument to the schema**

In `backend/models/user.model.js`, add the `onboarding` field immediately before `}, { timestamps: true });` (currently line 45):

```js
// In the userSchema definition, add after the resetTokenExpiry field (line 43):
  onboarding: {
    isCompleted:        { type: Boolean, default: false },
    manualRead:         { type: Boolean, default: false },
    videosWatched:      { type: Boolean, default: false },
    assessmentScore:    { type: Number,  default: null },
    assessmentPassed:   { type: Boolean, default: false },
    assessmentAttempts: { type: Number,  default: 0 },
    completedAt:        { type: Date,    default: null },
  },
```

The full schema closing becomes:
```js
  onboarding: {
    isCompleted:        { type: Boolean, default: false },
    manualRead:         { type: Boolean, default: false },
    videosWatched:      { type: Boolean, default: false },
    assessmentScore:    { type: Number,  default: null },
    assessmentPassed:   { type: Boolean, default: false },
    assessmentAttempts: { type: Number,  default: 0 },
    completedAt:        { type: Date,    default: null },
  },
}, { timestamps: true });
```

- [ ] **Step 2: Verify the server still starts**

```bash
npm run dev
```

Expected: `Server listening on port 5000` with no crash. The existing `User.find()` calls are unaffected because Mongoose applies subdocument defaults lazily.

- [ ] **Step 3: Commit**

```bash
git add backend/models/user.model.js
git commit -m "feat: add onboarding subdocument to User model"
```

---

## Task 2: Create OnboardingQuestion model

**Files:**
- Create: `backend/models/onboardingQuestion.model.js`

- [ ] **Step 1: Create the model file**

```js
// backend/models/onboardingQuestion.model.js
const mongoose = require('mongoose');

const onboardingQuestionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: arr => arr.length === 4,
      message: 'Exactly 4 options required',
    },
  },
  correctAnswer: { type: Number, required: true, min: 0, max: 3 },
  category: {
    type: String,
    enum: ['PSI', 'CLS', 'DPI', 'General', 'Company Policy', 'Professional Conduct'],
    required: true,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('OnboardingQuestion', onboardingQuestionSchema);
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/onboardingQuestion.model.js
git commit -m "feat: add OnboardingQuestion model"
```

---

## Task 3: Create and run seeder script

**Files:**
- Create: `backend/data/seedOnboardingQuestions.js`

- [ ] **Step 1: Create the seeder**

```js
// backend/data/seedOnboardingQuestions.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const OnboardingQuestion = require('../models/onboardingQuestion.model');
const { User } = require('../models/user.model');

const QUESTIONS = [
  // PSI — 3 questions
  {
    question: 'What does PSI stand for in inspection terminology?',
    options: ['Pre-Shipment Inspection', 'Post-Shipment Inspection', 'Product Safety Inspection', 'Primary Supplier Inspection'],
    correctAnswer: 0,
    category: 'PSI',
  },
  {
    question: 'During a PSI, at what minimum production completion percentage should goods be packed before the inspection begins?',
    options: ['50%', '80%', '100% production, 80% packed', '100% production, 100% packed'],
    correctAnswer: 2,
    category: 'PSI',
  },
  {
    question: 'Which document must an inspector review before starting a Pre-Shipment Inspection?',
    options: ['The shipping bill of lading', 'The purchase order and product specification sheet', "The factory's ISO certification", 'The customs declaration form'],
    correctAnswer: 1,
    category: 'PSI',
  },
  // CLS — 3 questions
  {
    question: 'What does CLS stand for?',
    options: ['Container Loading Survey', 'Cargo Logistics System', 'Client Loading Specification', 'Consolidated Load Statement'],
    correctAnswer: 0,
    category: 'CLS',
  },
  {
    question: 'During a Container Loading Survey, an inspector must primarily verify:',
    options: ["The factory's production capacity", 'The quantity, condition, and loading pattern of goods', "The supplier's financial records", "The shipping company's license"],
    correctAnswer: 1,
    category: 'CLS',
  },
  {
    question: 'What should an inspector do if they observe significantly damaged cartons during a CLS?',
    options: ['Proceed with loading and note it in the report later', 'Stop loading, photograph the damage, and report to supervisor immediately', 'Ask the factory to repack only the visibly damaged cartons', 'Accept loading if total damaged cartons are below 5%'],
    correctAnswer: 1,
    category: 'CLS',
  },
  // DPI — 2 questions
  {
    question: 'What does DPI stand for?',
    options: ['During Production Inspection', 'Delivered Product Inspection', 'Daily Process Index', 'Default Production Indicator'],
    correctAnswer: 0,
    category: 'DPI',
  },
  {
    question: 'At what production stage is a DPI typically conducted?',
    options: ['Before any production begins', 'After 100% of goods are produced', 'When approximately 20–40% of production is complete', 'During final shipment packaging only'],
    correctAnswer: 2,
    category: 'DPI',
  },
  // General — 2 questions
  {
    question: 'What is the primary purpose of an AQL sampling plan?',
    options: ['To inspect every single unit in a shipment', 'To estimate the overall quality of a lot by inspecting a representative sample', 'To set pricing based on defect rates', 'To determine the inspection fee'],
    correctAnswer: 1,
    category: 'General',
  },
  {
    question: 'Which type of defect would cause an immediate inspection failure regardless of AQL level?',
    options: ['A minor cosmetic scratch on the product surface', 'A label that is 1mm off-center', 'A product that poses a safety risk to end users', 'Slight colour variation within the approved tolerance'],
    correctAnswer: 2,
    category: 'General',
  },
  // Company Policy — 3 questions
  {
    question: 'According to company policy, within how many hours must an inspector submit their final report after completing an inspection?',
    options: ['48 hours', '24 hours', '72 hours', '12 hours'],
    correctAnswer: 1,
    category: 'Company Policy',
  },
  {
    question: 'If a supplier offers gifts or hospitality to an inspector, what is the correct action?',
    options: ['Accept gifts valued under $50', 'Accept meals during working hours only', 'Politely decline and report the offer to their manager', 'Accept and disclose in the inspection report'],
    correctAnswer: 2,
    category: 'Company Policy',
  },
  {
    question: 'When is an inspector permitted to share inspection results directly with the factory?',
    options: ['Immediately after completing the inspection', 'Only after the client has reviewed the report', 'Never — all communication goes through the company', 'Only if the factory requests it in writing'],
    correctAnswer: 2,
    category: 'Company Policy',
  },
  // Professional Conduct — 2 questions
  {
    question: 'What is the correct action if an inspector is unsure about a product specification during an inspection?',
    options: ['Make a best-guess judgment and proceed', 'Stop and contact the supervisor or client for clarification', 'Mark the item as a defect to be safe', 'Ask the factory representative for their interpretation'],
    correctAnswer: 1,
    category: 'Professional Conduct',
  },
  {
    question: 'An inspector notices a fellow inspector falsifying a report. What should they do?',
    options: ['Ignore it to avoid workplace conflict', 'Cover for their colleague out of loyalty', 'Confront the colleague privately and ask them to self-report', 'Report the misconduct to management immediately'],
    correctAnswer: 3,
    category: 'Professional Conduct',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await OnboardingQuestion.countDocuments();
  if (existing === 0) {
    await OnboardingQuestion.insertMany(QUESTIONS);
    console.log(`Inserted ${QUESTIONS.length} onboarding questions`);
  } else {
    console.log(`Skipped question insert: ${existing} questions already exist`);
  }

  // Mark all existing inspectors as onboarding complete so they are not retroactively gated
  const result = await User.updateMany(
    { role: 'inspector', 'onboarding.isCompleted': { $ne: true } },
    { $set: { 'onboarding.isCompleted': true, 'onboarding.completedAt': new Date() } }
  );
  console.log(`Migrated ${result.modifiedCount} existing inspector(s) → onboarding.isCompleted = true`);

  await mongoose.disconnect();
  console.log('Done.');
}

// Seed invocation removed for repository cleanliness.
```

- [ ] **Step 2: Run the seeder**

```bash
node backend/data/seedOnboardingQuestions.js
```

Expected output:
```
Connected to MongoDB
Inserted 15 onboarding questions
Migrated N existing inspector(s) → onboarding.isCompleted = true
Done.
```

- [ ] **Step 3: Commit**

```bash
git add backend/data/seedOnboardingQuestions.js
git commit -m "feat: add onboarding question seeder with 15 questions"
```

---

## Task 4: Create onboarding controller

**Files:**
- Create: `backend/controllers/onboarding.controller.js`

- [ ] **Step 1: Create the controller**

```js
// backend/controllers/onboarding.controller.js
const { User } = require('../models/user.model');
const OnboardingQuestion = require('../models/onboardingQuestion.model');

const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('onboarding');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ onboarding: user.onboarding || {} });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const completeStep = async (req, res) => {
  const { step } = req.body;
  if (!['manualRead', 'videosWatched'].includes(step)) {
    return res.status(400).json({ error: 'Invalid step. Must be manualRead or videosWatched.' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { [`onboarding.${step}`]: true } },
      { new: true, select: 'onboarding' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ onboarding: user.onboarding });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getQuestions = async (req, res) => {
  try {
    const questions = await OnboardingQuestion.find({ isActive: true }).select('-correctAnswer');
    res.json({ questions });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const submitAssessment = async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' });
  }
  try {
    const questions = await OnboardingQuestion.find({ isActive: true });
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    let correctCount = 0;
    const categoryBreakdown = {};

    for (const answer of answers) {
      const q = questionMap[answer.questionId];
      if (!q) continue;
      if (!categoryBreakdown[q.category]) categoryBreakdown[q.category] = { correct: 0, total: 0 };
      categoryBreakdown[q.category].total++;
      if (answer.selectedOption === q.correctAnswer) {
        correctCount++;
        categoryBreakdown[q.category].correct++;
      }
    }

    const totalCount = questions.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= 70;

    const update = {
      $set: {
        'onboarding.assessmentScore': score,
        'onboarding.assessmentPassed': passed,
      },
      $inc: { 'onboarding.assessmentAttempts': 1 },
    };
    if (passed) {
      update.$set['onboarding.isCompleted'] = true;
      update.$set['onboarding.completedAt'] = new Date();
    }

    await User.findByIdAndUpdate(req.user.id, update);

    res.json({ passed, score, correctCount, totalCount, categoryBreakdown });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getStatus, completeStep, getQuestions, submitAssessment };
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/onboarding.controller.js
git commit -m "feat: add onboarding controller (getStatus, completeStep, getQuestions, submitAssessment)"
```

---

## Task 5: Create onboarding routes, admin controller, admin routes, and mount all in app.js

**Files:**
- Create: `backend/routes/onboarding.routes.js`
- Create: `backend/controllers/admin.controller.js`
- Create: `backend/routes/admin.routes.js`
- Modify: `backend/app.js`

- [ ] **Step 1: Create onboarding routes file**

```js
// backend/routes/onboarding.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getStatus, completeStep, getQuestions, submitAssessment } = require('../controllers/onboarding.controller');

router.use(authMiddleware);
router.use(roleCheck(['inspector']));

router.get('/status', getStatus);
router.post('/complete-step', completeStep);
router.get('/assessment-questions', getQuestions);
router.post('/submit-assessment', submitAssessment);

module.exports = router;
```

- [ ] **Step 2: Create admin controller**

```js
// backend/controllers/admin.controller.js
const { User } = require('../models/user.model');

const getInspectors = async (req, res) => {
  try {
    const inspectors = await User.find({ role: 'inspector' })
      .select('name email createdAt onboarding')
      .sort({ createdAt: -1 });
    res.json({ inspectors });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getInspectors };
```

- [ ] **Step 3: Create admin routes file**

```js
// backend/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleCheck } = require('../middleware/auth.middleware');
const { getInspectors } = require('../controllers/admin.controller');

router.use(authMiddleware);
router.use(roleCheck(['admin', 'manager']));

router.get('/inspectors', getInspectors);

module.exports = router;
```

- [ ] **Step 4: Mount the new routes in app.js**

In `backend/app.js`, add the following two blocks immediately before the `// Inspector Routes` comment (before line 86):

```js
// Onboarding Routes (must be mounted before /api/inspector to take priority)
const onboardingRoutes = require('./routes/onboarding.routes');
app.use('/api/inspector/onboarding', onboardingRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);
```

The Inspector Routes section already at line 86-87 remains unchanged:
```js
// Inspector Routes
const inspectorRoutes = require('./routes/inspector.routes');
app.use('/api/inspector', inspectorRoutes);
```

- [ ] **Step 5: Verify all routes register correctly**

```bash
npm run dev
```

Expected: Server starts with no errors. Test in terminal:
```bash
curl -X GET http://localhost:5000/api/inspector/onboarding/status
```
Expected: `{"error":"Authentication required"}` (401 — proves route is registered and auth guard is working).

```bash
curl -X GET http://localhost:5000/api/admin/inspectors
```
Expected: `{"error":"Authentication required"}` (401).

- [ ] **Step 6: Commit**

```bash
git add backend/routes/onboarding.routes.js backend/controllers/admin.controller.js backend/routes/admin.routes.js backend/app.js
git commit -m "feat: add onboarding and admin routes, mount in app.js"
```

---

## Task 6: Create onboarding completion middleware and apply to inspector routes

**Files:**
- Create: `backend/middleware/onboardingComplete.middleware.js`
- Modify: `backend/routes/inspector.routes.js`

- [ ] **Step 1: Create the middleware**

```js
// backend/middleware/onboardingComplete.middleware.js
const { User } = require('../models/user.model');

const requireOnboardingComplete = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('onboarding');
    if (!user?.onboarding?.isCompleted) {
      return res.status(403).json({ error: 'Complete onboarding before accessing reports.' });
    }
    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { requireOnboardingComplete };
```

- [ ] **Step 2: Apply it to inspector routes**

Replace the full contents of `backend/routes/inspector.routes.js` with:

```js
const express = require('express');
const router = express.Router();
const inspectorController = require('../controllers/inspector.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireOnboardingComplete } = require('../middleware/onboardingComplete.middleware');

// All inspector routes require auth + completed onboarding
router.use(authMiddleware);
router.use(requireOnboardingComplete);

// Dashboard Summary
router.get('/dashboard/summary', inspectorController.getSummary);

// Tasks
router.get('/tasks', inspectorController.getTasks);
router.get('/tasks/:taskId', inspectorController.getTaskById);
router.post('/tasks/:taskId/accept', inspectorController.acceptTask);

// Notifications
router.get('/notifications', inspectorController.getNotifications);
router.put('/notifications/read-all', inspectorController.markAllNotificationsRead);
router.put('/notifications/:notificationId/read', inspectorController.markNotificationRead);

module.exports = router;
```

- [ ] **Step 3: Verify the middleware fires correctly**

Restart the server. Using a valid JWT for an inspector whose `onboarding.isCompleted` is `false`:
```bash
curl -H "Authorization: Bearer <inspector_token>" http://localhost:5000/api/inspector/tasks
```
Expected: `{"error":"Complete onboarding before accessing reports."}` (403)

For an inspector with `isCompleted: true` (any existing inspector after running the seeder), the request proceeds normally.

- [ ] **Step 4: Commit**

```bash
git add backend/middleware/onboardingComplete.middleware.js backend/routes/inspector.routes.js
git commit -m "feat: add onboarding completion middleware to inspector routes"
```

---

## Task 7: Add ONBOARDING and ADMIN endpoints to frontend API config

**Files:**
- Modify: `frontend/src/config/api.js`

- [ ] **Step 1: Add the new endpoint groups**

In `frontend/src/config/api.js`, add the following two groups at the end of the `ENDPOINTS` object (before the closing `}`):

```js
  ONBOARDING: {
    STATUS:        `${API_BASE_URL}/api/inspector/onboarding/status`,
    COMPLETE_STEP: `${API_BASE_URL}/api/inspector/onboarding/complete-step`,
    QUESTIONS:     `${API_BASE_URL}/api/inspector/onboarding/assessment-questions`,
    SUBMIT:        `${API_BASE_URL}/api/inspector/onboarding/submit-assessment`,
  },
  ADMIN: {
    INSPECTORS: `${API_BASE_URL}/api/admin/inspectors`,
  },
```

The full updated `ENDPOINTS` object will end:
```js
  MANAGER: {
    QUEUE: `${API_BASE_URL}/api/manager/queue`,
    REPORT_DETAILS: (id) => `${API_BASE_URL}/api/manager/reports/${id}`,
    SUBMIT_FEEDBACK: (id) => `${API_BASE_URL}/api/manager/reports/${id}/correction`,
    FINALIZE: (id) => `${API_BASE_URL}/api/manager/reports/${id}/finalize`,
    ADD_REMARK: (id) => `${API_BASE_URL}/api/manager/reports/${id}/remarks`,
  },
  ONBOARDING: {
    STATUS:        `${API_BASE_URL}/api/inspector/onboarding/status`,
    COMPLETE_STEP: `${API_BASE_URL}/api/inspector/onboarding/complete-step`,
    QUESTIONS:     `${API_BASE_URL}/api/inspector/onboarding/assessment-questions`,
    SUBMIT:        `${API_BASE_URL}/api/inspector/onboarding/submit-assessment`,
  },
  ADMIN: {
    INSPECTORS: `${API_BASE_URL}/api/admin/inspectors`,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/api.js
git commit -m "feat: add ONBOARDING and ADMIN API endpoints to frontend config"
```

---

## Task 8: Extend AuthContext with onboarding status fetching

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Replace the full AuthContext with the extended version**

```jsx
// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENDPOINTS } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("reportUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("reportToken") || "";
    } catch {
      return "";
    }
  });

  const [loading, setLoading] = useState(false);

  // null = still fetching, true = complete, false = incomplete
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);

  const fetchOnboardingStatus = useCallback(async (currentToken) => {
    if (!currentToken) return;
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.STATUS, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardingCompleted(data.onboarding?.isCompleted ?? false);
      } else {
        setOnboardingCompleted(false);
      }
    } catch {
      setOnboardingCompleted(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setOnboardingCompleted(null);
      return;
    }
    if (user.role !== 'inspector') {
      // Non-inspectors are always considered "complete" — no gate for them
      setOnboardingCompleted(true);
      return;
    }
    fetchOnboardingStatus(token);
  }, [user, token, fetchOnboardingStatus]);

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem("reportUser", JSON.stringify(userData));
    localStorage.setItem("reportToken", tokenStr);
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setOnboardingCompleted(null);
    localStorage.removeItem("reportUser");
    localStorage.removeItem("reportToken");
  };

  const refreshOnboarding = useCallback(() => {
    return fetchOnboardingStatus(token);
  }, [token, fetchOnboardingStatus]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, onboardingCompleted, refreshOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify the Vite dev server compiles without errors**

```bash
cd frontend && npm run dev
```

Expected: No TypeScript/ESLint errors in the console. The app loads at `http://localhost:5173`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: extend AuthContext with onboarding status fetch and refreshOnboarding"
```

---

## Task 9: Create OnboardingGuard component

**Files:**
- Create: `frontend/src/components/auth/OnboardingGuard.jsx`

- [ ] **Step 1: Create the guard component**

```jsx
// frontend/src/components/auth/OnboardingGuard.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OnboardingGuard() {
  const { user, onboardingCompleted } = useAuth();

  // Show spinner while onboarding status is being fetched (null = loading)
  if (user?.role === 'inspector' && onboardingCompleted === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect incomplete inspectors to onboarding
  if (user?.role === 'inspector' && onboardingCompleted === false) {
    return <Navigate to="/dashboard/inspector/onboarding" replace />;
  }

  return <Outlet />;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/OnboardingGuard.jsx
git commit -m "feat: add OnboardingGuard router component"
```

---

## Task 10: Update main.jsx routing

**Files:**
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Add imports for new components**

At the top of `frontend/src/main.jsx`, add these two imports after the existing import for `Dashboard`:

```jsx
import OnboardingGuard from './components/auth/OnboardingGuard'
import InspectorOnboarding from './dashboards/inspector/onboarding/InspectorOnboarding.jsx'
```

- [ ] **Step 2: Replace the inspector route block**

Find this block in `main.jsx` (lines 59-61):
```jsx
              <Route element={<ProtectedRoute allowedRoles={['inspector', 'admin', 'manager']} />}>
                <Route path="/dashboard/inspector" element={<Dashboard />} />
              </Route>
```

Replace it with:
```jsx
              <Route element={<ProtectedRoute allowedRoles={['inspector', 'admin', 'manager']} />}>
                {/* Onboarding page — accessible without OnboardingGuard (guard would cause redirect loop) */}
                <Route path="/dashboard/inspector/onboarding" element={<InspectorOnboarding />} />
                {/* All other inspector pages gated behind OnboardingGuard */}
                <Route element={<OnboardingGuard />}>
                  <Route path="/dashboard/inspector" element={<Dashboard />} />
                </Route>
              </Route>
```

- [ ] **Step 3: Verify routing works**

With the Vite dev server running, open `http://localhost:5173/dashboard/inspector` in a browser while logged in as an inspector with `isCompleted: false`. You should be redirected to `/dashboard/inspector/onboarding`. With `isCompleted: true`, you should see the normal dashboard.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.jsx
git commit -m "feat: add onboarding route and OnboardingGuard to inspector routes in main.jsx"
```

---

## Task 11: Create StepIndicator component

**Files:**
- Create: `frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx`

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx
export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 ${isCompleted ? 'text-emerald-600' : isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                ${isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className="text-sm font-semibold hidden sm:inline">{label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-10 h-0.5 mx-3 transition-colors duration-300 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx
git commit -m "feat: add StepIndicator component"
```

---

## Task 12: Create Step1Manual component

**Files:**
- Create: `frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx`

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx
import { useState } from 'react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const MANUAL_SECTIONS = [
  {
    title: 'Welcome to Absolute Veritas',
    content: (
      <p>We are delighted to welcome you as a certified inspector at Absolute Veritas. Our mission is to provide world-class pre-shipment inspection services that protect our clients' supply chains and uphold the highest standards of quality assurance. As an inspector, you are the frontline guardian of that mission.</p>
    ),
  },
  {
    title: 'Your Role & Responsibilities',
    content: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>Conduct thorough, unbiased inspections at supplier facilities</li>
        <li>Document findings accurately using the IRMS Report App</li>
        <li>Submit final reports within 24 hours of inspection completion</li>
        <li>Escalate critical safety defects to your supervisor immediately</li>
        <li>Maintain professional conduct at all supplier sites at all times</li>
        <li>Protect client confidentiality and inspection findings</li>
      </ul>
    ),
  },
  {
    title: 'Overview of Inspection Types',
    content: (
      <div className="space-y-3">
        {[
          { type: 'PSI — Pre-Shipment Inspection', desc: 'Conducted when 100% of production is complete and at least 80% is packed. Verifies product quality, quantity, and carton markings against the purchase order.' },
          { type: 'CLS — Container Loading Survey', desc: 'Supervised loading of goods into shipping containers. Ensures correct quantities, loading patterns, and container conditions.' },
          { type: 'DPI — During Production Inspection', desc: 'Mid-production check at 20–40% completion. Catches quality issues early before they affect the full batch.' },
          { type: 'Factory Audit', desc: "Comprehensive assessment of a supplier's manufacturing capabilities, quality management systems, and social compliance." },
          { type: 'Social Audit', desc: 'Evaluates supplier compliance with labour standards, worker safety, and ethical business practices.' },
        ].map(item => (
          <div key={item.type} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">{item.type}</p>
            <p className="text-slate-600 mt-0.5 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Reporting Guidelines & Deadlines',
    content: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>All reports must be submitted via the IRMS platform — no external communication of results</li>
        <li>Deadline: final report within <strong>24 hours</strong> of inspection end time</li>
        <li>Photos must be clear, well-lit, and directly relevant to the findings</li>
        <li>Defect descriptions must use objective, factual language</li>
        <li>Never share inspection results directly with the factory or supplier</li>
      </ul>
    ),
  },
  {
    title: 'Code of Conduct',
    content: (
      <ul className="list-disc list-inside space-y-1.5">
        <li>Decline all gifts, hospitality, or inducements from suppliers</li>
        <li>Maintain complete impartiality — your findings must reflect reality</li>
        <li>Dress professionally and arrive punctually for all assignments</li>
        <li>Report any conflicts of interest to management before accepting an assignment</li>
        <li>Report misconduct by colleagues through the appropriate channels immediately</li>
      </ul>
    ),
  },
  {
    title: 'Contact Information',
    content: (
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 space-y-1 text-sm">
        <p><span className="font-semibold">Operations Support:</span> cs@absoluteveritas.com</p>
        <p><span className="font-semibold">Emergency Escalations:</span> Contact your assigned Technical Manager</p>
        <p><span className="font-semibold">Platform Support:</span> Available through the Settings page in IRMS</p>
      </div>
    ),
  },
];

export default function Step1Manual({ onComplete }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.COMPLETE_STEP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'manualRead' }),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      await onComplete();
    } catch {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Inspector User Manual</h2>
          <p className="text-indigo-100 mt-1 text-sm">Please read the following carefully before proceeding.</p>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 text-slate-700 text-sm leading-relaxed">
          {MANUAL_SECTIONS.map(section => (
            <section key={section.title}>
              <h3 className="text-base font-bold text-slate-800 mb-3">{section.title}</h3>
              {section.content}
            </section>
          ))}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <p className="text-xs text-slate-500">Scroll through the full manual before confirming.</p>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              : 'I have read and understood the manual'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/inspector/onboarding/steps/Step1Manual.jsx
git commit -m "feat: add Step1Manual onboarding component"
```

---

## Task 13: Create Step2Videos component

**Files:**
- Create: `frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx`

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx
import { useState } from 'react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const VIDEOS = [
  { id: 1, title: 'Introduction to PSI Inspections', duration: '12:34', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 2, title: 'Container Loading Supervision Guide', duration: '9:45', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 3, title: 'How to Use the IRMS Report App', duration: '15:20', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 4, title: 'Professional Conduct & Client Interaction', duration: '8:12', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
];

export default function Step2Videos({ onComplete }) {
  const { token } = useAuth();
  const [watched, setWatched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const watchedCount = VIDEOS.filter(v => watched[v.id]).length;
  const allWatched = watchedCount === VIDEOS.length;

  const handleMarkWatched = (id) => {
    setWatched(prev => ({ ...prev, [id]: true }));
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.COMPLETE_STEP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'videosWatched' }),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      await onComplete();
    } catch {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Training Videos</h2>
        <p className="text-slate-500 mt-1 text-sm">{watchedCount} of {VIDEOS.length} watched</p>
        <div className="w-48 bg-slate-200 rounded-full h-1.5 mt-3 mx-auto">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(watchedCount / VIDEOS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {VIDEOS.map(video => (
          <div
            key={video.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${watched[video.id] ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200'}`}
          >
            <div className="aspect-video bg-slate-900">
              <iframe
                src={video.url}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight">{video.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{video.duration}</p>
                </div>
                {watched[video.id] && (
                  <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">WATCHED</span>
                )}
              </div>
              {!watched[video.id] && (
                <button
                  onClick={() => handleMarkWatched(video.id)}
                  className="w-full text-sm font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors"
                >
                  Mark as Watched
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-rose-600 text-sm text-center mb-4">{error}</p>}

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!allWatched || loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            : 'Continue to Assessment'
          }
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx
git commit -m "feat: add Step2Videos onboarding component"
```

---

## Task 14: Create Step3Assessment component

**Files:**
- Create: `frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx`

- [ ] **Step 1: Create the component**

```jsx
// frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

export default function Step3Assessment({ onComplete }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null); // { passed, score, correctCount, totalCount, categoryBreakdown }

  useEffect(() => {
    const load = async () => {
      setLoadingQuestions(true);
      setFetchError(null);
      try {
        const res = await fetch(ENDPOINTS.ONBOARDING.QUESTIONS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load questions');
        const data = await res.json();
        setQuestions(data.questions);
      } catch {
        setFetchError('Failed to load assessment questions. Please refresh the page.');
      } finally {
        setLoadingQuestions(false);
      }
    };
    load();
  }, [token]);

  const handleSelectAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const answersPayload = questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id] ?? -1,
      }));
      const res = await fetch(ENDPOINTS.ONBOARDING.SUBMIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answersPayload }),
      });
      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();
      setResult(data);
      if (data.passed) await onComplete();
    } catch {
      setSubmitError('Failed to submit. Your answers are preserved — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  if (loadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading assessment...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-20">
        <p className="text-rose-600 font-medium">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-indigo-600 underline text-sm">
          Refresh page
        </button>
      </div>
    );
  }

  // Results screen
  if (result) {
    const missedCategories = result.categoryBreakdown
      ? Object.entries(result.categoryBreakdown).filter(([, s]) => s.correct < s.total)
      : [];

    return (
      <div className="max-w-lg mx-auto text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-6 ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {result.passed ? '✓' : '✗'}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
          {result.passed ? 'Congratulations! You passed.' : "Not quite — let's try again."}
        </h2>
        <p className="text-slate-700 text-lg font-semibold mb-1">Score: {result.score}%</p>
        <p className="text-slate-500 text-sm mb-8">
          {result.correctCount} of {result.totalCount} correct &mdash; {result.passed ? 'minimum 70% required' : 'need 70% to pass'}
        </p>

        {result.passed && (
          <p className="text-slate-600 mb-8">
            You have completed all onboarding steps. You now have full access to the Inspector Dashboard.
          </p>
        )}

        {!result.passed && missedCategories.length > 0 && (
          <div className="bg-rose-50 rounded-xl p-5 mb-8 text-left border border-rose-100">
            <p className="font-semibold text-rose-800 mb-3 text-sm">Areas to review before retrying:</p>
            {missedCategories.map(([category, stats]) => (
              <div key={category} className="flex justify-between items-center text-sm text-rose-700 py-1.5 border-b border-rose-100 last:border-0">
                <span>{category}</span>
                <span className="font-semibold">{stats.correct}/{stats.total} correct</span>
              </div>
            ))}
          </div>
        )}

        {result.passed ? (
          <button
            onClick={() => navigate('/dashboard/inspector')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-3 rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-3 rounded-xl transition-colors"
          >
            Retry Assessment
          </button>
        )}
      </div>
    );
  }

  // Quiz screen
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} of {questions.length} answered</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
        <p className="font-semibold text-slate-800 text-base leading-relaxed mb-6">{question.question}</p>
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                answers[question._id] === idx
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={`q-${question._id}`}
                checked={answers[question._id] === idx}
                onChange={() => handleSelectAnswer(question._id, idx)}
                className="accent-indigo-600 shrink-0"
              />
              <span className="text-sm text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
          className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {submitError && (
          <p className="text-rose-600 text-xs text-center flex-1 mx-4">{submitError}</p>
        )}

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            title={answeredCount < questions.length ? `Answer all ${questions.length} questions to submit` : ''}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              : `Submit (${answeredCount}/${questions.length} answered)`
            }
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx
git commit -m "feat: add Step3Assessment onboarding component with quiz and results screen"
```

---

## Task 15: Create InspectorOnboarding page

**Files:**
- Create: `frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx`

- [ ] **Step 1: Create the page**

```jsx
// frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import StepIndicator from './StepIndicator';
import Step1Manual from './steps/Step1Manual';
import Step2Videos from './steps/Step2Videos';
import Step3Assessment from './steps/Step3Assessment';

const STEP_LABELS = ['User Manual', 'Training Videos', 'Assessment'];

export default function InspectorOnboarding() {
  const { user, token, refreshOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // On mount, determine the furthest unlocked step so returning
  // inspectors resume where they left off rather than starting over
  useEffect(() => {
    if (!token) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(ENDPOINTS.ONBOARDING.STATUS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const ob = data.onboarding || {};
        if (ob.videosWatched) setCurrentStep(3);
        else if (ob.manualRead) setCurrentStep(2);
        else setCurrentStep(1);
      } catch {
        // default stays at step 1
      }
    };
    fetchStatus();
  }, [token]);

  const handleStepComplete = async () => {
    await refreshOnboarding();
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const firstName = user?.name?.split(' ')[0] || 'Inspector';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">
            Getting Started
          </div>
          <h1 className="text-3xl font-black text-slate-800">
            Welcome, {firstName}!
          </h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Complete the following 3 steps to unlock your Inspector Dashboard and start accepting assignments.
          </p>
        </div>

        <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />

        {currentStep === 1 && <Step1Manual onComplete={handleStepComplete} />}
        {currentStep === 2 && <Step2Videos onComplete={handleStepComplete} />}
        {currentStep === 3 && <Step3Assessment onComplete={refreshOnboarding} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the full onboarding flow renders**

With both backend and frontend dev servers running:
1. Log in as a new inspector (with `onboarding.isCompleted: false`)
2. You should land at `/dashboard/inspector/onboarding`
3. Step 1 should render the manual with a confirm button
4. Clicking confirm should advance to Step 2
5. Marking all 4 videos as watched enables "Continue to Assessment"
6. Assessment shows 15 questions one at a time
7. Submitting with ≥70% correct shows the success screen and "Go to Dashboard" navigates to `/dashboard/inspector`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx
git commit -m "feat: add InspectorOnboarding page with step routing and resume logic"
```

---

## Task 16: Update InspectorDirectory with real data and onboarding badges

**Files:**
- Modify: `frontend/src/dashboards/admin/components/InspectorDirectory.jsx`
- Modify: `frontend/src/dashboards/admin/AdminDashboard.jsx`

- [ ] **Step 1: Rewrite InspectorDirectory to fetch real data**

Replace the full contents of `frontend/src/dashboards/admin/components/InspectorDirectory.jsx`:

```jsx
// frontend/src/dashboards/admin/components/InspectorDirectory.jsx
import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../context/AuthContext';

function OnboardingBadge({ onboarding }) {
  if (!onboarding || (!onboarding.isCompleted && !onboarding.manualRead && !onboarding.videosWatched)) {
    return (
      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
        Not Started
      </span>
    );
  }
  if (onboarding.isCompleted) {
    const completedDate = onboarding.completedAt
      ? new Date(onboarding.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
          Completed
        </span>
        {completedDate && <span className="text-[9px] text-slate-400 ml-0.5">{completedDate}</span>}
      </div>
    );
  }
  return (
    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
      In Progress
    </span>
  );
}

export default function InspectorDirectory({ activeView }) {
  const { token } = useAuth();
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeView !== 'inspectors') return;
    setLoading(true);
    setError(null);
    fetch(ENDPOINTS.ADMIN.INSPECTORS, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load inspectors');
        return res.json();
      })
      .then(data => setInspectors(data.inspectors || []))
      .catch(() => setError('Failed to load inspector data. Please refresh.'))
      .finally(() => setLoading(false));
  }, [activeView, token]);

  if (activeView !== 'inspectors') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading inspectors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-rose-600 font-medium">{error}</p>
        <button onClick={() => setError(null)} className="mt-3 text-indigo-600 underline text-sm">Retry</button>
      </div>
    );
  }

  if (inspectors.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">No inspectors found.</div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspectors.map(inspector => (
          <div key={inspector._id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Avatar + name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-xl">
                  {inspector.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{inspector.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Joined {new Date(inspector.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{inspector.email}</span>
            </div>

            {/* Onboarding status */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Onboarding</span>
              <OnboardingBadge onboarding={inspector.onboarding} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Remove MOCK_INSPECTORS prop from AdminDashboard**

In `frontend/src/dashboards/admin/AdminDashboard.jsx`:

1. Remove `MOCK_INSPECTORS` from the import on line 8. Change:
```js
import { 
  MOCK_BOOKINGS, MOCK_INSPECTORS, MOCK_NOTIFICATIONS, 
  STATUS_COLORS, INSPECTION_TYPES, ALL_STATUSES 
} from './constants/adminMockData';
```
To:
```js
import { 
  MOCK_BOOKINGS, MOCK_NOTIFICATIONS, 
  STATUS_COLORS, INSPECTION_TYPES, ALL_STATUSES 
} from './constants/adminMockData';
```

2. Find the `<InspectorDirectory>` render (around line 245-248) and remove the `MOCK_INSPECTORS` prop:
```jsx
{/* Before */}
<InspectorDirectory 
  activeView={activeView}
  MOCK_INSPECTORS={MOCK_INSPECTORS}
/>

{/* After */}
<InspectorDirectory 
  activeView={activeView}
/>
```

- [ ] **Step 3: Verify the admin inspector view works**

1. Log in as admin
2. Click "Inspectors" in the nav
3. Real inspector accounts from the DB should appear with onboarding badges
4. No console errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/InspectorDirectory.jsx frontend/src/dashboards/admin/AdminDashboard.jsx
git commit -m "feat: wire InspectorDirectory to real DB data with onboarding status badges"
```

---

## Self-Review Notes

**Spec coverage check:**
- Part 1 (DB changes): Tasks 1-3 ✓ — User model onboarding subdoc, OnboardingQuestion model, seeder
- Part 2 (API routes): Tasks 4-5 ✓ — all 4 onboarding routes + admin route
- Part 3 (Route guard): Tasks 6, 8-10 ✓ — frontend OnboardingGuard + backend onboarding middleware
- Part 4 (Onboarding page): Tasks 11-15 ✓ — StepIndicator, Step1, Step2, Step3, InspectorOnboarding
- Part 5 (Admin visibility): Task 16 ✓ — real data + onboarding badges (Not Started/In Progress/Completed)

**Key integration points to verify after all tasks:**
1. A brand-new inspector (no onboarding data) logs in → redirected to `/dashboard/inspector/onboarding` → can't access `/dashboard/inspector`
2. An existing inspector (seeder set `isCompleted: true`) logs in → goes straight to dashboard, no redirect
3. After passing assessment → `refreshOnboarding()` updates context → `OnboardingGuard` re-evaluates → inspector can now navigate to dashboard
4. Admin sees real inspectors with correct badge states
5. Backend returns 403 on `/api/inspector/tasks` for incomplete inspectors
