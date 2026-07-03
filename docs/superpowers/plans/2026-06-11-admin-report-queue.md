# Admin Report Queue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/admin/report-queue` page to the Admin dashboard showing all inspector submissions, with TM assignment and embedded full report review.

**Architecture:** Standalone admin page (follows `InspectionNoticesList` pattern) with a two-pane state machine: queue view (default) ↔ embedded TM review panes. Reuses `ReviewContentPane` + `ReviewActionsSidebar` from the manager dashboard without modifying them. Two new backend endpoints (admin queue, assign-TM) plus one new admin-users endpoint.

**Tech Stack:** React 19, Tailwind CSS 4, Express 5, Mongoose 8

---

## File Map

### New files
| File | Purpose |
|---|---|
| `frontend/src/dashboards/admin/hooks/useAdminReportQueue.js` | Fetch hook for `/api/reports/admin/all` |
| `frontend/src/dashboards/admin/components/AdminQueueView.jsx` | Queue table: 6 filters, REVIEWED BY column, 3-way action buttons |
| `frontend/src/dashboards/admin/components/AssignTMModal.jsx` | Assign-to-TM modal |
| `frontend/src/dashboards/admin/pages/AdminReportQueue.jsx` | Page: full state + two-pane render |

### Modified files
| File | Change |
|---|---|
| `backend/models/report.model.js` | Add `assignedTM` field |
| `backend/models/factoryAudit.model.js` | Add `assignedTM` field |
| `backend/controllers/admin.controller.js` | Add `getUsers` |
| `backend/routes/admin.routes.js` | Add `GET /users` route |
| `backend/controllers/report.controller.js` | Add `getAdminQueue`, `assignTM` |
| `backend/routes/report.routes.js` | Add `GET /admin/all`, `PATCH /:id/assign-tm` |
| `frontend/src/config/api.js` | Add `ADMIN.REPORT_QUEUE`, `ADMIN.ASSIGN_TM`, `ADMIN.USERS_BY_ROLE` |
| `frontend/src/routes/appRoutes.jsx` | Export `AdminReportQueue` |
| `frontend/src/main.jsx` | Add `/admin/report-queue` route |
| `frontend/src/dashboards/admin/components/AdminNavbar.jsx` | Add "Report Queue" nav item + badge |

---

## Task 1: Add `assignedTM` field to Report and FactoryAudit models

**Files:**
- Modify: `backend/models/report.model.js`
- Modify: `backend/models/factoryAudit.model.js`

- [ ] **Step 1: Add `assignedTM` to Report model**

In `backend/models/report.model.js`, find the `reviewedBy` field (around line 52) and add `assignedTM` directly after `reviewedAt`:

```javascript
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  assignedTM: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedAt: { type: Date },
```

- [ ] **Step 2: Add `assignedTM` to FactoryAudit model**

In `backend/models/factoryAudit.model.js`, find the `reviewedBy` field (around line 277) and add `assignedTM` after it:

```javascript
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTM: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
```

- [ ] **Step 3: Verify backend starts without errors**

```bash
npm run dev
```

Expected: Server starts, no Mongoose validation errors.

- [ ] **Step 4: Commit**

```bash
git add backend/models/report.model.js backend/models/factoryAudit.model.js
git commit -m "feat: add assignedTM field to Report and FactoryAudit models"
```

---

## Task 2: Backend — GET /api/admin/users

**Files:**
- Modify: `backend/controllers/admin.controller.js`
- Modify: `backend/routes/admin.routes.js`

- [ ] **Step 1: Add `getUsers` to admin controller**

In `backend/controllers/admin.controller.js`, add this function before `module.exports`:

```javascript
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ error: 'role query param is required' });
    const users = await User.find({ role })
      .select('name email')
      .sort({ name: 1 })
      .lean();
    res.json({ users: users.map(u => ({ id: u._id, name: u.name, email: u.email })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
```

Also add `getUsers` to the exports at the bottom:

```javascript
module.exports = { getInspectors, deleteInspector, getUsers };
```

- [ ] **Step 2: Register the route in admin.routes.js**

In `backend/routes/admin.routes.js`, import `getUsers` and add the route:

```javascript
const { getInspectors, deleteInspector, getUsers } = require('../controllers/admin.controller');

// existing routes ...
router.get('/users', getUsers);
```

- [ ] **Step 3: Test the endpoint**

Start the backend and test (replace TOKEN with a valid admin JWT from sessionStorage in your browser dev tools):

```bash
curl -H "Authorization: Bearer TOKEN" "http://localhost:5000/api/admin/users?role=manager"
```

Expected: `{ "users": [...] }` — list of users with role "manager".

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/admin.controller.js backend/routes/admin.routes.js
git commit -m "feat: add GET /api/admin/users?role endpoint"
```

---

## Task 3: Backend — GET /api/reports/admin/all

**Files:**
- Modify: `backend/controllers/report.controller.js`
- Modify: `backend/routes/report.routes.js`

- [ ] **Step 1: Add FactoryAudit import to report.controller.js**

At the top of `backend/controllers/report.controller.js`, add after the existing model imports:

```javascript
const FactoryAudit = require('../models/factoryAudit.model');
```

- [ ] **Step 2: Add `getAdminQueue` function to report.controller.js**

Add this function before `module.exports` at the bottom of `backend/controllers/report.controller.js`:

```javascript
const getAdminQueue = async (req, res) => {
  try {
    const { status = 'all', type = 'all', reviewedBy = 'all', fromDate, toDate } = req.query;

    let query = {
      operationStatus: { $in: ['submitted', 'under_review', 'revision_required', 'approved'] },
    };
    if (status && status !== 'all') query.operationStatus = status;

    const [reports, factoryAudits] = await Promise.all([
      Report.find(query)
        .populate('userId', 'name email')
        .populate('generalInfo')
        .populate('assignedTM', 'name')
        .populate('reviewedBy', 'name')
        .sort({ submittedAt: -1, updatedAt: -1 })
        .lean(),
      FactoryAudit.find(query)
        .populate('userId', 'name email')
        .populate('assignedTM', 'name')
        .populate('reviewedBy', 'name')
        .sort({ submittedAt: -1, updatedAt: -1 })
        .lean(),
    ]);

    const normalized = [
      ...reports.map(r => ({
        id: r._id,
        reportId: r.reportNumber || `RPT-${r._id.toString().slice(-6).toUpperCase()}`,
        clientName: r.generalInfo?.client || 'Unknown Client',
        inspectionType: r.title || 'Standard Inspection',
        inspectorName: r.userId?.name || 'Unknown Inspector',
        submittedAt: r.submittedAt || r.updatedAt,
        status: r.operationStatus,
        revisionRound: r.revisionRound || 1,
        type: 'standard',
        assignedTMName: r.assignedTM?.name || null,
        reviewedByName: r.reviewedBy?.name || null,
      })),
      ...factoryAudits.map(fa => ({
        id: fa._id,
        reportId: `FA-${fa._id.toString().slice(-6).toUpperCase()}`,
        clientName: fa.generalInfo?.client || 'Unknown Client',
        inspectionType: fa.title || 'Factory Audit',
        inspectorName: fa.userId?.name || 'Unknown Inspector',
        submittedAt: fa.submittedAt || fa.updatedAt,
        status: fa.operationStatus,
        revisionRound: fa.revisionRound || 1,
        type: 'factoryAudit',
        assignedTMName: fa.assignedTM?.name || null,
        reviewedByName: fa.reviewedBy?.name || null,
      })),
    ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Apply type filter
    let filtered = normalized;
    if (type && type !== 'all') {
      if (type === 'factory_audit') {
        filtered = normalized.filter(r => r.type === 'factoryAudit');
      } else {
        filtered = normalized.filter(r => r.inspectionType.includes(type));
      }
    }

    // Apply reviewedBy filter (TM name)
    if (reviewedBy && reviewedBy !== 'all') {
      filtered = filtered.filter(
        r => r.assignedTMName === reviewedBy || r.reviewedByName === reviewedBy
      );
    }

    if (fromDate) {
      filtered = filtered.filter(r => new Date(r.submittedAt) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter(r => new Date(r.submittedAt) <= new Date(toDate));
    }

    const stats = {
      totalReports: normalized.length,
      pendingReview: normalized.filter(r => r.status === 'submitted').length,
      underReview: normalized.filter(r => r.status === 'under_review').length,
      sentForCorrection: normalized.filter(r => r.status === 'revision_required').length,
      finalizedToday: normalized.filter(r => {
        if (r.status !== 'approved') return false;
        const today = new Date();
        return new Date(r.submittedAt).toDateString() === today.toDateString();
      }).length,
    };

    res.json({ reports: filtered, stats });
  } catch (err) {
    console.error('getAdminQueue error:', err);
    res.status(500).json({ error: err.message });
  }
};
```

- [ ] **Step 3: Add `getAdminQueue` to module.exports**

Find the `module.exports` at the bottom of `backend/controllers/report.controller.js` and add `getAdminQueue`:

```javascript
module.exports = {
  generateReport,
  getReports,
  getReportById,
  suggestText,
  analyzePhoto,
  getStats,
  deleteReport,
  getAdminQueue,
};
```

- [ ] **Step 4: Register the route in report.routes.js**

In `backend/routes/report.routes.js`, add the admin route **before** `router.get("/:id", ...)` to avoid the `:id` param capturing "admin":

```javascript
// Add this BEFORE router.get("/:id", ...)
router.get("/admin/all", authMiddleware, roleCheck(['admin']), reportController.getAdminQueue);
```

The full updated file should look like:

```javascript
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
const roles = ["admin", "inspector", "operator"];

router.post("/generate", authMiddleware, requireOnboardingComplete, roleCheck(roles), upload.array("images"), reportController.generateReport);
router.get("/", authMiddleware, reportController.getReports);
router.get("/stats", authMiddleware, reportController.getStats);
router.get("/admin/all", authMiddleware, roleCheck(['admin']), reportController.getAdminQueue);
router.get("/:id", authMiddleware, reportController.getReportById);
router.delete("/:id", authMiddleware, reportController.deleteReport);

module.exports = router;
```

- [ ] **Step 5: Test the endpoint**

```bash
curl -H "Authorization: Bearer TOKEN" "http://localhost:5000/api/reports/admin/all"
```

Expected: `{ "reports": [...], "stats": { "totalReports": N, "pendingReview": N, ... } }`

- [ ] **Step 6: Commit**

```bash
git add backend/controllers/report.controller.js backend/routes/report.routes.js
git commit -m "feat: add GET /api/reports/admin/all endpoint"
```

---

## Task 4: Backend — PATCH /api/reports/:id/assign-tm

**Files:**
- Modify: `backend/controllers/report.controller.js`
- Modify: `backend/routes/report.routes.js`

- [ ] **Step 1: Add `assignTM` function to report.controller.js**

Add this function to `backend/controllers/report.controller.js` before `module.exports`:

```javascript
const assignTM = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicalManagerId, note } = req.body;

    if (!technicalManagerId) {
      return res.status(400).json({ error: 'technicalManagerId is required' });
    }

    const { User } = require('../models/user.model');
    const tm = await User.findById(technicalManagerId).select('name role').lean();
    if (!tm || tm.role !== 'manager') {
      return res.status(400).json({ error: 'Invalid Technical Manager ID' });
    }

    let doc = await Report.findById(id);
    let isFA = false;
    if (!doc) {
      doc = await FactoryAudit.findById(id);
      isFA = true;
    }
    if (!doc) return res.status(404).json({ error: 'Report not found' });

    doc.assignedTM = technicalManagerId;
    if (doc.operationStatus === 'submitted') {
      doc.operationStatus = 'under_review';
    }
    if (note && !isFA && Array.isArray(doc.tmRemarks)) {
      doc.tmRemarks.push({
        text: `[Admin Note] ${note}`,
        addedBy: req.user._id || req.user.id,
        addedAt: new Date(),
      });
    }
    await doc.save();

    res.json({
      success: true,
      report: {
        id: doc._id,
        assignedTMName: tm.name,
        status: doc.operationStatus,
      },
    });
  } catch (err) {
    console.error('assignTM error:', err);
    res.status(500).json({ error: err.message });
  }
};
```

- [ ] **Step 2: Add `assignTM` to module.exports**

```javascript
module.exports = {
  generateReport,
  getReports,
  getReportById,
  suggestText,
  analyzePhoto,
  getStats,
  deleteReport,
  getAdminQueue,
  assignTM,
};
```

- [ ] **Step 3: Register the route in report.routes.js**

Add this line **before** `router.delete("/:id", ...)`:

```javascript
router.patch("/:id/assign-tm", authMiddleware, roleCheck(['admin']), reportController.assignTM);
```

Full updated `backend/routes/report.routes.js`:

```javascript
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const upload = require("../middleware/upload.middleware");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const { requireOnboardingComplete } = require("../middleware/onboardingComplete.middleware");
const roles = ["admin", "inspector", "operator"];

router.post("/generate", authMiddleware, requireOnboardingComplete, roleCheck(roles), upload.array("images"), reportController.generateReport);
router.get("/", authMiddleware, reportController.getReports);
router.get("/stats", authMiddleware, reportController.getStats);
router.get("/admin/all", authMiddleware, roleCheck(['admin']), reportController.getAdminQueue);
router.get("/:id", authMiddleware, reportController.getReportById);
router.patch("/:id/assign-tm", authMiddleware, roleCheck(['admin']), reportController.assignTM);
router.delete("/:id", authMiddleware, reportController.deleteReport);

module.exports = router;
```

- [ ] **Step 4: Test the endpoint**

```bash
curl -X PATCH \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"technicalManagerId":"VALID_MANAGER_ID","note":"Test note"}' \
  "http://localhost:5000/api/reports/VALID_REPORT_ID/assign-tm"
```

Expected: `{ "success": true, "report": { "id": "...", "assignedTMName": "...", "status": "under_review" } }`

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/report.controller.js backend/routes/report.routes.js
git commit -m "feat: add PATCH /api/reports/:id/assign-tm endpoint"
```

---

## Task 5: Frontend — API config + useAdminReportQueue hook

**Files:**
- Modify: `frontend/src/config/api.js`
- Create: `frontend/src/dashboards/admin/hooks/useAdminReportQueue.js`

- [ ] **Step 1: Add admin endpoints to api.js**

In `frontend/src/config/api.js`, find the `ADMIN` block and add three new entries:

```javascript
  ADMIN: {
    INSPECTORS: `${API_BASE_URL}/api/admin/inspectors`,
    DELETE_INSPECTOR: (id) => `${API_BASE_URL}/api/admin/inspectors/${encodeURIComponent(id)}`,
    TASK_PROGRESS: (bookingId) => `${API_BASE_URL}/api/admin/bookings/${encodeURIComponent(bookingId)}/task-progress`,
    REPORT_QUEUE: `${API_BASE_URL}/api/reports/admin/all`,
    ASSIGN_TM: (id) => `${API_BASE_URL}/api/reports/${encodeURIComponent(id)}/assign-tm`,
    USERS_BY_ROLE: (role) => `${API_BASE_URL}/api/admin/users?role=${encodeURIComponent(role)}`,
  },
```

- [ ] **Step 2: Create the hook**

Create `frontend/src/dashboards/admin/hooks/useAdminReportQueue.js`:

```javascript
import { useState, useEffect } from 'react';
import { ENDPOINTS } from '../../../config/api';

export const useAdminReportQueue = (filters = {}) => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const token = sessionStorage.getItem('reportToken');
      const response = await fetch(`${ENDPOINTS.ADMIN.REPORT_QUEUE}?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch admin report queue');
      const data = await response.json();
      setReports(data.reports || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type]);

  return { reports, stats, loading, error, refetch: fetchQueue };
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/config/api.js frontend/src/dashboards/admin/hooks/useAdminReportQueue.js
git commit -m "feat: add admin API endpoints and useAdminReportQueue hook"
```

---

## Task 6: Frontend — AdminQueueView component

**Files:**
- Create: `frontend/src/dashboards/admin/components/AdminQueueView.jsx`

- [ ] **Step 1: Create AdminQueueView.jsx**

Create `frontend/src/dashboards/admin/components/AdminQueueView.jsx` with the full content below:

```jsx
import React from 'react';
import { Filter, FileX } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || '?';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusBadgeStyle = (status) => {
  if (status === 'Pending Review') return { background: '#FEF3C7', color: '#92400E' };
  if (status === 'In Review' || status === 'Under Review') return { background: '#DBEAFE', color: '#1E40AF' };
  if (status?.includes('Correction')) return { background: '#FEE2E2', color: '#991B1B' };
  if (status === 'Finalized' || status === 'Approved') return { background: '#D1FAE5', color: '#065F46' };
  return { background: '#F3F4F6', color: '#374151' };
};

const getRevisionBadgeStyle = (round) => {
  if (round >= 3) return { background: '#FEF3C7', color: '#92400E' };
  if (round >= 2) return { background: '#FEE2E2', color: '#991B1B' };
  return { background: '#DBEAFE', color: '#1E40AF' };
};

const filterSelectClass = [
  'w-full border border-gray-200 rounded-lg px-3 py-2',
  'text-sm bg-white focus:outline-none',
  'focus:ring-2 focus:ring-purple-500 focus:border-transparent',
].join(' ');

function AdminQueueView({
  queueFilters,
  setQueueFilters,
  uniqueInspectors,
  uniqueReviewers,
  filteredReports,
  handleOpenReport,
  onAssignTM,
}) {
  const resetFilters = () =>
    setQueueFilters({ type: 'All', status: 'All', inspector: 'All', fromDate: '', toDate: '', reviewedBy: 'All' });

  const getActionButton = (report) => {
    if (report.status === 'Pending Review') {
      return (
        <button
          onClick={() => onAssignTM(report.id)}
          className="hover:opacity-90 transition-opacity"
          style={{ fontSize: '13px', fontWeight: 500, color: 'white', background: '#F59E0B', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Assign to TM
        </button>
      );
    }
    if (report.status === 'Finalized') {
      return (
        <button
          onClick={() => handleOpenReport(report.id)}
          className="hover:opacity-90 transition-opacity"
          style={{ fontSize: '13px', fontWeight: 500, color: 'white', background: '#10B981', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          View Report
        </button>
      );
    }
    return (
      <button
        onClick={() => handleOpenReport(report.id)}
        className="hover:bg-[#5538E0] transition-colors"
        style={{ fontSize: '13px', fontWeight: 500, color: 'white', background: '#6C47FF', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Open Report
      </button>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-300 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Report Queue</h1>
          <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>All inspector submissions across the platform</p>
        </div>
        <span style={{ background: '#EDE9FE', color: '#6C47FF', borderRadius: '9999px', padding: '4px 12px', fontSize: '14px', fontWeight: 500, flexShrink: 0 }}>
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} color="#6C47FF" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Queue Filters</span>
          </div>
          <button
            onClick={resetFilters}
            className="hover:underline"
            style={{ fontSize: '13px', color: '#6C47FF', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Inspection Type</label>
            <select value={queueFilters.type} onChange={(e) => setQueueFilters(prev => ({ ...prev, type: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All Types</option>
              <option value="PSI">PSI (Pre-Shipment)</option>
              <option value="CLS">CLS (Container Loading)</option>
              <option value="DPI">DPI (During Production)</option>
              <option value="Factory Audit">Factory Audit</option>
              <option value="Social Audit">Social Audit</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Review Status</label>
            <select value={queueFilters.status} onChange={(e) => setQueueFilters(prev => ({ ...prev, status: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="In Review">In Review</option>
              <option value="Correction Requested (Round 1)">Correction Requested (Round 1)</option>
              <option value="Correction Requested (Round 2)">Correction Requested (Round 2)</option>
              <option value="Finalized">Finalized</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Inspector</label>
            <select value={queueFilters.inspector} onChange={(e) => setQueueFilters(prev => ({ ...prev, inspector: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All Inspectors</option>
              {uniqueInspectors.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Submitted From</label>
            <input type="date" value={queueFilters.fromDate} onChange={(e) => setQueueFilters(prev => ({ ...prev, fromDate: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Submitted To</label>
            <input type="date" value={queueFilters.toDate} onChange={(e) => setQueueFilters(prev => ({ ...prev, toDate: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500 }}>Reviewed By</label>
            <select value={queueFilters.reviewedBy} onChange={(e) => setQueueFilters(prev => ({ ...prev, reviewedBy: e.target.value }))} className={filterSelectClass} style={{ color: '#374151' }}>
              <option value="All">All TMs</option>
              {uniqueReviewers.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileX size={48} color="#9CA3AF" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>No reports found</h4>
            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 16px' }}>Try adjusting your filters</p>
            <button onClick={resetFilters} className="hover:bg-[#F5F3FF] transition-colors" style={{ fontSize: '14px', color: '#6C47FF', fontWeight: 500, border: '1px solid #6C47FF', background: 'white', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer' }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  {[
                    { label: 'REPORT ID', center: false },
                    { label: 'CLIENT NAME', center: false },
                    { label: 'INSPECTION TYPE', center: false },
                    { label: 'INSPECTOR', center: false },
                    { label: 'SUBMITTED DATE', center: false },
                    { label: 'REVISION ROUND', center: true },
                    { label: 'STATUS', center: false },
                    { label: 'REVIEWED BY', center: false },
                    { label: 'ACTIONS', center: true },
                  ].map(({ label, center }) => (
                    <th key={label} style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', fontWeight: 500, textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, idx) => {
                  const displayReviewer = report.assignedTMName || report.reviewedByName;
                  return (
                    <tr key={report.id} className="hover:bg-[#F5F3FF] transition-colors" style={{ background: idx % 2 === 0 ? '#ffffff' : '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>

                      {/* Report ID */}
                      <td style={{ padding: '14px 20px' }}>
                        <span title={report.displayId || report.id} style={{ fontFamily: 'monospace', fontSize: '13px', color: '#374151' }}>
                          {(() => { const id = report.displayId || report.id || ''; return id.length > 14 ? `${id.substring(0, 14)}...` : id; })()}
                        </span>
                      </td>

                      {/* Client Name */}
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>{report.clientName}</td>

                      {/* Inspection Type */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ background: '#F3F4F6', color: '#374151', fontSize: '12px', padding: '4px 10px', borderRadius: '9999px', display: 'inline-block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(report.inspectionType || '').length > 30 ? `${report.inspectionType.substring(0, 30)}...` : (report.inspectionType || '—')}
                        </span>
                      </td>

                      {/* Inspector */}
                      <td style={{ padding: '14px 20px' }}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EDE9FE', color: '#6C47FF', fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getInitials(report.inspectorName)}
                          </div>
                          <span style={{ fontSize: '13px', color: '#374151' }}>{report.inspectorName}</span>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {formatDate(report.submissionDate)}
                      </td>

                      {/* Revision Round */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {!report.revisionRound || report.revisionRound === 0 ? (
                          <span style={{ background: '#F3F4F6', color: '#374151', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px' }}>Initial</span>
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px', ...getRevisionBadgeStyle(report.revisionRound) }}>Round {report.revisionRound}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '9999px', display: 'inline-block', whiteSpace: 'nowrap', ...getStatusBadgeStyle(report.status) }}>
                          {report.status}
                        </span>
                      </td>

                      {/* Reviewed By */}
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: displayReviewer ? '#374151' : '#9CA3AF' }}>
                        {displayReviewer || 'Unassigned'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {getActionButton(report)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(AdminQueueView);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/admin/components/AdminQueueView.jsx
git commit -m "feat: add AdminQueueView component with 6 filters and REVIEWED BY column"
```

---

## Task 7: Frontend — AssignTMModal component

**Files:**
- Create: `frontend/src/dashboards/admin/components/AssignTMModal.jsx`

- [ ] **Step 1: Create AssignTMModal.jsx**

Create `frontend/src/dashboards/admin/components/AssignTMModal.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ENDPOINTS } from '../../../config/api';

export default function AssignTMModal({ reportId, reportDisplayId, onClose, onSuccess }) {
  const [tms, setTms] = useState([]);
  const [selectedTM, setSelectedTM] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('reportToken');
    fetch(ENDPOINTS.ADMIN.USERS_BY_ROLE('manager'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setTms(data.users || []))
      .catch(() => setError('Failed to load Technical Managers'))
      .finally(() => setFetching(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedTM) { setError('Please select a Technical Manager'); return; }
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('reportToken');
      const res = await fetch(ENDPOINTS.ADMIN.ASSIGN_TM(reportId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ technicalManagerId: selectedTM, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');
      onSuccess(data.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', position: 'relative' }}>

        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
          <X size={20} />
        </button>

        {/* Title */}
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          Assign Report to Technical Manager
        </h3>
        <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6B7280', margin: '0 0 24px' }}>
          {reportDisplayId || reportId}
        </p>

        {/* TM Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Technical Manager
          </label>
          {fetching ? (
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Loading...</p>
          ) : (
            <select
              value={selectedTM}
              onChange={e => setSelectedTM(e.target.value)}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#374151', background: 'white', outline: 'none' }}
            >
              <option value="" disabled>Select Technical Manager</option>
              {tms.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.name} — {tm.email}</option>
              ))}
            </select>
          )}
        </div>

        {/* Note textarea */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 200))}
            placeholder="e.g. Priority review, customer is waiting..."
            rows={3}
            style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#374151', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'right', margin: '4px 0 0' }}>
            {note.length} / 200
          </p>
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{error}</p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#374151', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || fetching}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: loading ? '#9CA3AF' : '#6C47FF', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            {loading ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/admin/components/AssignTMModal.jsx
git commit -m "feat: add AssignTMModal component"
```

---

## Task 8: Frontend — AdminReportQueue page

**Files:**
- Create: `frontend/src/dashboards/admin/pages/AdminReportQueue.jsx`

- [ ] **Step 1: Create AdminReportQueue.jsx**

Create `frontend/src/dashboards/admin/pages/AdminReportQueue.jsx` with the full content below:

```jsx
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Info, CheckCircle, ClipboardList, SlidersHorizontal,
  Lock, AlertTriangle, Camera, User
} from 'lucide-react';

import AdminNavbar from '../components/AdminNavbar';
import AdminQueueView from '../components/AdminQueueView';
import AssignTMModal from '../components/AssignTMModal';
import { useAdminReportQueue } from '../hooks/useAdminReportQueue';
import { useReportReview } from '../../manager/hooks/useReportReview';
import useToast from '../../../hooks/useToast';

const ReviewContentPane = lazy(() => import('../../manager/components/ReviewContentPane'));
const ReviewActionsSidebar = lazy(() => import('../../manager/components/ReviewActionsSidebar'));

// ─────────────────────────────────────────────────────────────
// Constants (outside component to avoid re-creation on render)
// ─────────────────────────────────────────────────────────────

const SECTIONS_CONFIG = {
  sectionA: { label: 'Section A — Inspection Summary', icon: Info },
  sectionB: { label: 'Section B — Product Workmanship', icon: CheckCircle },
  sectionC: { label: 'Section C — Quantity Verification', icon: ClipboardList },
  sectionD: { label: 'Section D — Measurement & Spec Check', icon: SlidersHorizontal },
  sectionE: { label: 'Section E — Function & Safety Tests', icon: Lock },
  sectionF: { label: 'Section F — Defect Classification', icon: AlertTriangle },
  sectionG: { label: 'Section G — Photo Gallery', icon: Camera },
  sectionH: { label: 'Section H — Inspector Declaration', icon: User },
};

const INITIAL_COMMENT_INPUTS = Object.fromEntries(
  Object.keys(SECTIONS_CONFIG).map(k => [k, { comment: '', priority: 'Critical' }])
);

const INITIAL_COLLAPSED = Object.fromEntries(
  Object.keys(SECTIONS_CONFIG).map(k => [k, false])
);

const mapStatusToBackend = (status) => {
  if (status === 'Pending Review') return 'submitted';
  if (status === 'In Review') return 'under_review';
  if (status === 'Correction Requested (Round 1)' || status === 'Correction Requested (Round 2)') return 'revision_required';
  if (status === 'Finalized') return 'approved';
  return 'all';
};

const mapTypeToBackend = (type) => {
  if (type === 'Factory Audit') return 'factory_audit';
  if (type === 'All') return 'all';
  return type;
};

const getTypeBadgeClass = (type) => {
  if (type === 'PSI') return 'bg-blue-50 text-blue-600 border border-blue-200';
  if (type === 'CLS') return 'bg-purple-50 text-purple-600 border border-purple-200';
  if (type === 'DPI') return 'bg-orange-50 text-orange-600 border border-orange-200';
  if (type === 'Factory Audit') return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
};

const getStatusBadgeClass = (status) => {
  if (status === 'Pending Review') return 'bg-orange-50 text-orange-600 border border-orange-200';
  if (status === 'In Review' || status === 'Under Review') return 'bg-blue-50 text-blue-600 border border-blue-200';
  if (status?.includes('Correction Requested (Round 1)')) return 'bg-amber-50 text-amber-600 border border-amber-200';
  if (status?.includes('Correction Requested (Round 2)')) return 'bg-rose-50 text-rose-600 border border-rose-200';
  if (status === 'Finalized') return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
};

const getDaysSinceSubmission = (subDate) => {
  const diff = Date.now() - new Date(subDate).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AdminReportQueue() {
  // ── Queue state ──────────────────────────────────────────
  const [queueFilters, setQueueFilters] = useState({
    type: 'All', status: 'All', inspector: 'All', fromDate: '', toDate: '', reviewedBy: 'All',
  });

  const { reports: backendReports, stats: backendStats, refetch: refetchQueue } = useAdminReportQueue({
    status: mapStatusToBackend(queueFilters.status),
    type: mapTypeToBackend(queueFilters.type),
  });

  // ── Review state ─────────────────────────────────────────
  const [activeReportId, setActiveReportId] = useState(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState(INITIAL_COLLAPSED);
  const [commentInputs, setCommentInputs] = useState(INITIAL_COMMENT_INPUTS);
  const [overallRemarksInput, setOverallRemarksInput] = useState('');

  const { reportData, submitFeedback, finalizeReport, addRemark } = useReportReview(activeReportId);
  const { toasts, addToast, dismiss: dismissToast } = useToast();

  // ── Assign modal state ───────────────────────────────────
  const [assignModal, setAssignModal] = useState({ open: false, reportId: null, reportDisplayId: null });

  // ── Map backend reports to UI format ─────────────────────
  const reports = useMemo(() => (backendReports || []).map(r => ({
    id: r.id,
    displayId: r.reportId,
    clientName: r.clientName,
    inspectionType: r.inspectionType,
    inspectorName: r.inspectorName,
    submissionDate: new Date(r.submittedAt).toLocaleDateString(),
    status:
      r.status === 'submitted' ? 'Pending Review' :
      r.status === 'under_review' ? 'In Review' :
      r.status === 'revision_required' ? `Correction Requested (Round ${r.revisionRound})` :
      r.status === 'approved' ? 'Finalized' : r.status,
    revisionRound: r.revisionRound,
    assignedTMName: r.assignedTMName,
    reviewedByName: r.reviewedByName,
  })), [backendReports]);

  // ── Client-side filtering ─────────────────────────────────
  const filteredReports = useMemo(() => reports.filter(r => {
    const typeMatch = queueFilters.type === 'All' || r.inspectionType === queueFilters.type;
    const statusMatch = queueFilters.status === 'All' || r.status === queueFilters.status;
    const inspectorMatch = queueFilters.inspector === 'All' || r.inspectorName === queueFilters.inspector;
    const reviewerMatch = queueFilters.reviewedBy === 'All' ||
      r.assignedTMName === queueFilters.reviewedBy || r.reviewedByName === queueFilters.reviewedBy;
    let dateMatch = true;
    if (queueFilters.fromDate) dateMatch = dateMatch && new Date(r.submissionDate) >= new Date(queueFilters.fromDate);
    if (queueFilters.toDate) dateMatch = dateMatch && new Date(r.submissionDate) <= new Date(queueFilters.toDate);
    return typeMatch && statusMatch && inspectorMatch && reviewerMatch && dateMatch;
  }), [reports, queueFilters]);

  const uniqueInspectors = useMemo(() => Array.from(new Set(reports.map(r => r.inspectorName))), [reports]);
  const uniqueReviewers = useMemo(() =>
    Array.from(new Set(reports.flatMap(r => [r.assignedTMName, r.reviewedByName].filter(Boolean)))),
    [reports]
  );

  const pendingCount = backendStats?.pendingReview || 0;

  // ── Active report data mapping ────────────────────────────
  let activeReport = null;
  if (reportData && reportData.report) {
    const r = reportData.report;
    const isFactoryAudit = reportData.type === 'factoryAudit';

    const mappedFeedback = (r.correctionFeedback || []).map(fb => ({
      section: fb.section,
      comment: fb.comment,
      priority: fb.priority === 'critical' ? 'Critical' : 'Advisory',
      addedAt: new Date(fb.addedAt).toLocaleString(),
    }));

    const g   = r.generalInfo     || {};
    const q   = r.quantityDetails || {};
    const w   = r.workmanship     || {};
    const ins = r.inspection      || {};
    const mat = r.materials       || {};
    const saf = r.safety          || {};
    const com = r.comments        || {};
    const med = Array.isArray(r.media) ? r.media : [];

    const nonEmpty = (obj) => Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== 0)
    );

    activeReport = {
      id: r._id,
      displayId: r.reportNumber || r._id,
      clientName: g.client || r.generalInfo?.client || 'Unknown',
      inspectionType: isFactoryAudit ? 'Factory Audit' : (r.title || 'Inspection'),
      inspectorName: r.userId?.name || 'Unknown',
      submissionDate: new Date(r.submittedAt || r.updatedAt).toLocaleDateString(),
      status:
        r.operationStatus === 'submitted' ? 'Pending Review' :
        r.operationStatus === 'under_review' ? 'In Review' :
        r.operationStatus === 'revision_required' ? `Correction Requested (Round ${r.revisionRound || 1})` :
        r.operationStatus === 'approved' ? 'Finalized' : r.operationStatus,
      revisionRound: r.revisionRound || 1,
      correctionFeedback: mappedFeedback,
      tmRemarks: r.tmRemarks?.[r.tmRemarks.length - 1]?.text || '',
      templateData: {
        sectionA: {
          title: 'Inspection Summary',
          fields: nonEmpty({
            'Client':            g.client,
            'Supplier':          g.supplier,
            'Factory':           g.factory,
            'Product':           g.productName,
            'PO Number':         g.po,
            'Item No':           g.itemNo,
            'Inspection Date':   g.inspectionDate,
            'Location':          g.inspectionLocation,
            'Country':           g.country,
            'Reference Sample':  g.referenceSample,
            'Service Performed': g.servicePerformed,
          }),
        },
        sectionB: {
          title: 'Product Workmanship',
          fields: nonEmpty({
            'Inspection Level':  w.inspectionLevelWM,
            'Sample Size':       w.sampleSizeWM,
            'AQL Critical':      w.aqlCriticalWM,
            'AQL Major':         w.aqlMajorWM,
            'AQL Minor':         w.aqlMinorWM,
            'Accepted Critical': w.acceptedCritical,
            'Accepted Major':    w.acceptedMajor,
            'Accepted Minor':    w.acceptedMinor,
            'Found Critical':    w.totalFoundCritical,
            'Found Major':       w.totalFoundMajor,
            'Found Minor':       w.totalFoundMinor,
            'Overall Result':    w.workmanshipResult,
          }),
          notes: w.workmanshipRemark || null,
          defects: w.defects || [],
        },
        sectionC: {
          title: 'Quantity Verification',
          fields: nonEmpty({ 'Quantity Result': q.quantityResult, 'Selected Cartons': q.selectedCartonsCount, 'Remark': q.quantityRemark }),
          items: q.items || [],
        },
        sectionD: {
          title: 'Measurement & Spec Check',
          fields: {
            measurements: (mat.specifications || []).map(s => ({
              param: s.description, spec: s.requirement, actual: s.finding, result: s.result,
            })),
          },
        },
        sectionE: {
          title: 'Function & Safety Tests',
          fields: nonEmpty({ 'On-Site Test Result': saf.onSiteTestResult, 'Remark': saf.onSiteTestRemark }),
          safetyChecks: saf.safetyChecks || [],
        },
        sectionF: {
          title: 'Defect Classification / Inspection Criteria',
          fields: nonEmpty({
            'Quantity':           ins.quantityResult,
            'Workmanship':        ins.workmanshipResult,
            'On-Site Tests':      ins.onSiteTestsResult,
            'Dimensions':         ins.dimensionsResult,
            'Packing':            ins.packingResult,
            'Marking & Labeling': ins.markingResult,
            'Client Requirement': ins.clientRequirementResult,
          }),
        },
        sectionG: {
          title: 'Photo Gallery',
          photos: med
            .map(m => ({ url: m.url || m.signedUrl, description: m.description || m.originalName || '' }))
            .filter(p => p.url),
        },
        sectionH: {
          title: 'Inspector Declaration',
          fields: nonEmpty({
            'Inspector':         com.inspector || r.userId?.name,
            'Approved By':       com.approvedBy,
            'Conclusion':        com.recommendations,
            'Factory Comments':  com.factoryComments,
            'Inspector Opinion': com.inspectorOpinion,
            'Remarks':           Array.isArray(com.remarks) ? com.remarks.filter(Boolean).join(' | ') : com.remarks,
          }),
        },
      },
    };
  }

  // ── Reset section inputs when switching reports ───────────
  useEffect(() => {
    if (activeReportId) {
      setOverallRemarksInput(activeReport?.tmRemarks || '');
      setCommentInputs(INITIAL_COMMENT_INPUTS);
      setCollapsedSections(INITIAL_COLLAPSED);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReportId]);

  // ── Handlers ──────────────────────────────────────────────
  const handleOpenReport = (reportId) => setActiveReportId(reportId);

  const handleAssignTM = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    setAssignModal({ open: true, reportId, reportDisplayId: report?.displayId });
  };

  const handleAssignSuccess = (updatedReport) => {
    setAssignModal({ open: false, reportId: null, reportDisplayId: null });
    refetchQueue();
    addToast(`Report assigned to ${updatedReport.assignedTMName}.`, 'success');
  };

  const saveSectionComment = async (sectionKey) => {
    const input = commentInputs[sectionKey];
    if (!input.comment.trim()) { addToast('Comment field cannot be empty.', 'error'); return; }
    try {
      await submitFeedback(sectionKey, input.comment.trim(), input.priority.toLowerCase());
      addToast('Section comment saved.', 'success');
    } catch {
      addToast('Failed to save comment.', 'error');
    }
  };

  const clearSectionComment = (sectionKey) => {
    setCommentInputs(prev => ({ ...prev, [sectionKey]: { comment: '', priority: 'Critical' } }));
  };

  const handleRemarksBlur = async () => {
    if (activeReport && overallRemarksInput.trim()) {
      try { await addRemark(overallRemarksInput); addToast('Remarks auto-saved.', 'info'); } catch {}
    }
  };

  const saveInternalRemarksOnly = async () => {
    if (activeReport && overallRemarksInput.trim()) {
      try { await addRemark(overallRemarksInput); addToast('Remarks saved.', 'info'); }
      catch { addToast('Failed to save remarks.', 'error'); }
    }
  };

  const confirmFinalizeReport = async () => {
    if (!activeReport) return;
    try {
      await finalizeReport();
      addToast('Report finalized. Inspector has been notified.', 'success');
      setShowFinalizeModal(false);
      setActiveReportId(null);
      refetchQueue();
    } catch {
      addToast('Failed to finalize report.', 'error');
    }
  };

  const confirmRequestCorrection = async () => {
    addToast('Correction request sent. Inspector has been notified.', 'warning');
    setShowCorrectionModal(false);
    setActiveReportId(null);
    refetchQueue();
  };

  const toastBg = (type) => (
    type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#6C47FF'
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex flex-col bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">

      <AdminNavbar
        activeView={null}
        stats={{ readyToDeliver: 0, pendingReports: pendingCount }}
      />

      <main className="flex-1 overflow-y-auto bg-[#F4F5F7]">

        {/* QUEUE VIEW */}
        {!activeReportId && (
          <AdminQueueView
            queueFilters={queueFilters}
            setQueueFilters={setQueueFilters}
            uniqueInspectors={uniqueInspectors}
            uniqueReviewers={uniqueReviewers}
            filteredReports={filteredReports}
            handleOpenReport={handleOpenReport}
            onAssignTM={handleAssignTM}
          />
        )}

        {/* REVIEW VIEW */}
        {activeReportId && activeReport && (
          <Suspense fallback={
            <div className="max-w-7xl mx-auto px-6 py-6 animate-pulse space-y-4">
              <div className="h-10 bg-white border border-slate-200 rounded-xl w-40" />
              <div className="h-96 bg-white border border-slate-200 rounded-3xl" />
            </div>
          }>
            <div className="px-6 pt-4 pb-6 max-w-7xl mx-auto">
              <button
                onClick={() => setActiveReportId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#6C47FF', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: '6px 0' }}
              >
                ← Back to Queue
              </button>
            </div>
            <div className="px-6 pb-6 h-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto animate-in zoom-in-95 duration-200">
              <ReviewContentPane
                activeReport={activeReport}
                collapsedSections={collapsedSections}
                setCollapsedSections={setCollapsedSections}
                commentInputs={commentInputs}
                setCommentInputs={setCommentInputs}
                clearSectionComment={clearSectionComment}
                saveSectionComment={saveSectionComment}
                SECTIONS_CONFIG={SECTIONS_CONFIG}
                getTypeBadgeClass={getTypeBadgeClass}
                getStatusBadgeClass={getStatusBadgeClass}
              />
              <ReviewActionsSidebar
                activeReport={activeReport}
                overallRemarksInput={overallRemarksInput}
                setOverallRemarksInput={setOverallRemarksInput}
                handleRemarksBlur={handleRemarksBlur}
                saveInternalRemarksOnly={saveInternalRemarksOnly}
                setShowFinalizeModal={setShowFinalizeModal}
                setShowCorrectionModal={setShowCorrectionModal}
                setActiveReportId={setActiveReportId}
                getDaysSinceSubmission={getDaysSinceSubmission}
              />
            </div>
          </Suspense>
        )}

        {/* Loading state when report is being fetched */}
        {activeReportId && !activeReport && (
          <div className="max-w-7xl mx-auto px-6 py-6 animate-pulse space-y-4">
            <div className="h-8 bg-white border border-slate-200 rounded w-36" />
            <div className="h-96 bg-white border border-slate-200 rounded-3xl" />
          </div>
        )}
      </main>

      {/* Assign TM Modal */}
      {assignModal.open && (
        <AssignTMModal
          reportId={assignModal.reportId}
          reportDisplayId={assignModal.reportDisplayId}
          onClose={() => setAssignModal({ open: false, reportId: null, reportDisplayId: null })}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Finalize Confirmation Modal */}
      {showFinalizeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Finalize Report?</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              This will mark the report as approved and notify the inspector.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFinalizeModal(false)} style={{ padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmFinalizeReport} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#10B981', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                Finalize Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Confirmation Modal */}
      {showCorrectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Send Correction Request?</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              The section comments you saved will be sent to the inspector as correction requests.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCorrectionModal(false)} style={{ padding: '10px 20px', border: '1px solid #E5E7EB', borderRadius: '8px', background: 'white', color: '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={confirmRequestCorrection} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#F59E0B', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {toasts.map(t => (
            <div
              key={t.id}
              onClick={() => dismissToast(t.id)}
              style={{ background: toastBg(t.type), color: 'white', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', maxWidth: '360px' }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/admin/pages/AdminReportQueue.jsx
git commit -m "feat: add AdminReportQueue page with queue view and embedded review"
```

---

## Task 9: Frontend — Routing + AdminNavbar

**Files:**
- Modify: `frontend/src/routes/appRoutes.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/dashboards/admin/components/AdminNavbar.jsx`

- [ ] **Step 1: Export AdminReportQueue from appRoutes.jsx**

In `frontend/src/routes/appRoutes.jsx`, add after the `InspectionNoticeForm` export:

```javascript
export const AdminReportQueue = lazy(() => import('../dashboards/admin/pages/AdminReportQueue.jsx'))
```

- [ ] **Step 2: Add route to main.jsx**

In `frontend/src/main.jsx`, import `AdminReportQueue` and add the route inside the admin `ProtectedRoute` block, after the last InspectionNotice route:

```jsx
import {
  // existing imports...
  InspectionNoticesList,
  InspectionNoticeForm,
  AdminReportQueue,  // ADD THIS
} from './routes/appRoutes'
```

Inside the routes:

```jsx
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/dashboard/admin" element={<AdminDashboard />} />
  <Route path="/admin/inspection-notices" element={<InspectionNoticesList />} />
  <Route path="/admin/inspection-notices/new" element={<InspectionNoticeForm />} />
  <Route path="/admin/inspection-notices/:id" element={<InspectionNoticeForm />} />
  <Route path="/admin/report-queue" element={<AdminReportQueue />} />  {/* ADD THIS */}
</Route>
```

- [ ] **Step 3: Update AdminNavbar**

In `frontend/src/dashboards/admin/components/AdminNavbar.jsx`:

Add `FileText` to the lucide-react import (line 5):

```javascript
import { LayoutDashboard, ClipboardList, Users, Bell, Mail, LogOut, FileText } from 'lucide-react';
```

Update the function signature to include `pendingReports` from stats (it's already in the `stats` prop, no signature change needed).

Add the "Report Queue" button **after** the "All Bookings" button and **before** the "Inspection Notices" button:

```jsx
        <button
          onClick={() => navigate('/admin/report-queue')}
          className={navItemClass(location.pathname.startsWith('/admin/report-queue'))}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Report Queue</span>
          {(stats.pendingReports || 0) > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              location.pathname.startsWith('/admin/report-queue') ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'
            }`}>
              {stats.pendingReports}
            </span>
          )}
        </button>
```

The nav section in `AdminNavbar.jsx` should now read:

```jsx
      <nav className="hidden md:flex items-center gap-2">
        {/* Overview */}
        <button onClick={() => handleNav("dashboard", "/dashboard/admin")} className={navItemClass(activeView === "dashboard" && location.pathname === '/dashboard/admin')}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Overview</span>
        </button>

        {/* All Bookings */}
        <button onClick={() => handleNav("bookings", "/dashboard/admin")} className={navItemClass(activeView === "bookings" && location.pathname === '/dashboard/admin')}>
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>All Bookings</span>
          {stats.readyToDeliver > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${(activeView === "bookings" && location.pathname === '/dashboard/admin') ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white animate-pulse'}`}>
              {stats.readyToDeliver} Ready
            </span>
          )}
        </button>

        {/* Report Queue — NEW */}
        <button onClick={() => navigate('/admin/report-queue')} className={navItemClass(location.pathname.startsWith('/admin/report-queue'))}>
          <FileText className="w-4 h-4 shrink-0" />
          <span>Report Queue</span>
          {(stats.pendingReports || 0) > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${location.pathname.startsWith('/admin/report-queue') ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'}`}>
              {stats.pendingReports}
            </span>
          )}
        </button>

        {/* Inspection Notices */}
        <button onClick={() => navigate("/admin/inspection-notices")} className={navItemClass(isInspectionNoticesActive)}>
          <ClipboardList className="w-4 h-4 shrink-0" />
          <span>Inspection Notices</span>
        </button>

        {/* Inspectors */}
        <button onClick={() => handleNav("inspectors", "/dashboard/admin")} className={navItemClass(activeView === "inspectors" && location.pathname === '/dashboard/admin')}>
          <Users className="w-4 h-4 shrink-0" />
          <span>Inspectors</span>
        </button>

        {/* Notifications */}
        <button onClick={() => handleNav("notifications", "/dashboard/admin")} className={navItemClass(activeView === "notifications" && location.pathname === '/dashboard/admin')}>
          <Bell className="w-4 h-4 shrink-0" />
          <span>Notifications</span>
          {notifUnreadCount > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${(activeView === "notifications" && location.pathname === '/dashboard/admin') ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'}`}>
              {notifUnreadCount}
            </span>
          )}
        </button>

        {/* Email Logs */}
        <button onClick={() => handleNav("emails", "/dashboard/admin")} className={navItemClass(activeView === "emails" && location.pathname === '/dashboard/admin')}>
          <Mail className="w-4 h-4 shrink-0" />
          <span>Email Logs</span>
        </button>
      </nav>
```

- [ ] **Step 4: Start dev server and verify end-to-end**

```bash
npm run dev:all
```

Run through the golden path manually:

1. Log in as admin → navigate to `/admin/report-queue`
2. Verify the page loads with the queue table
3. Verify 6 filters are shown in a row
4. Verify "Report Queue" appears in the navbar between "All Bookings" and "Inspection Notices"
5. If any reports with status "Pending Review" exist: click "Assign to TM" → modal opens → select a TM → click "Assign" → modal closes, row updates to "In Review" with TM name in REVIEWED BY column
6. Click "Open Report" on an "In Review" report → review panes appear (ReviewContentPane + ReviewActionsSidebar)
7. Click "← Back to Queue" → returns to the queue table
8. Verify the badge count in the navbar shows the number of pending reviews
9. Verify existing admin routes (`/dashboard/admin`, `/admin/inspection-notices`) still work

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/appRoutes.jsx frontend/src/main.jsx frontend/src/dashboards/admin/components/AdminNavbar.jsx
git commit -m "feat: add /admin/report-queue route and Report Queue nav item to admin navbar"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Report Queue nav item between All Bookings and Inspectors | Task 9 Step 3 |
| Red badge with pending count | Task 9 Step 3 |
| `/admin/report-queue` route, admin-only | Task 9 Steps 1–2 |
| Page title "Report Queue", subtitle, badge | Task 6 AdminQueueView header |
| 6 filters including "Reviewed By" | Task 6 Step 1 |
| Extra "REVIEWED BY" column | Task 6 Step 1 |
| Unassigned in gray `#9CA3AF` | Task 6 Step 1 (displayReviewer check) |
| Assign to TM button (amber) for Pending Review | Task 6 getActionButton |
| Open Report button (purple) for In Review | Task 6 getActionButton |
| View Report button (green) for Finalized | Task 6 getActionButton |
| Assign TM Modal with TM dropdown, note, char count | Task 7 |
| PATCH /api/reports/:id/assign-tm | Task 4 |
| Status auto-update to "under_review" on assign | Task 4 Step 1 |
| GET /api/reports/admin/all | Task 3 |
| GET /api/admin/users?role=manager | Task 2 |
| Embedded full TM review (ReviewContentPane + ReviewActionsSidebar) | Task 8 |
| Back to Queue button | Task 8 Step 1 |
| Finalize + Correction inline modals | Task 8 Step 1 |
| assignedTM model field | Task 1 |
| No TM dashboard files modified | ✅ All TM files read-only |

All spec requirements have corresponding tasks. No placeholders or TODOs in the plan.
