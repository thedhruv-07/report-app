# Admin Report Queue — Design Spec
**Date:** 2026-06-11  
**Status:** Approved

---

## Overview

Add a Report Queue page to the Admin dashboard that gives the admin full visibility across all inspector submissions. The admin can assign reports to Technical Managers, and open any report in a full review interface (same components the TM uses) — all within the admin layout.

The Technical Manager's existing queue and review flow are **not changed**.

---

## Background

The TM dashboard already has a complete report review workflow: queue table with filters, report detail pane with section review, and action sidebar (finalize, request correction, add remarks). The admin needs the same capability with two additions: the ability to see all reports (not scoped to one TM) and the ability to assign "Pending Review" reports to a TM.

---

## Feature Breakdown

### Part 1 — Admin Navbar

Insert a **"Report Queue"** nav item between "All Bookings" and "Inspection Notices".

- Icon: `ClipboardList` (same as All Bookings, or `FileText`)
- Badge: red pill (`bg-red-500 text-white`) showing count of "Pending Review" reports
- Badge value: `stats.pendingReports` passed from the AdminReportQueue page via the `stats` prop
- Active state: `location.pathname.startsWith('/admin/report-queue')`
- On click: `navigate('/admin/report-queue')`
- On pages other than `/admin/report-queue`, badge defaults to 0 (no change to AdminDashboard or InspectionNotices)

Final navbar order:
```
Overview | All Bookings | Report Queue [badge] | Inspection Notices | Inspectors | Notifications | Email Logs
```

---

### Part 2 — Admin Report Queue Page

**Route:** `/admin/report-queue`  
**File:** `frontend/src/dashboards/admin/pages/AdminReportQueue.jsx`  
**Pattern:** Same as `InspectionNoticesList` — standalone page that renders its own `AdminNavbar`

The page is a two-pane state machine:
- **Queue view** (default): `AdminQueueView` component with filters and table
- **Review view** (when a report is selected): embedded `ReviewContentPane` + `ReviewActionsSidebar` (imported from TM dashboard components)

Page header (queue view only):
- Title: `"Report Queue"` — same style as TM version (`24px`, `700`, `#111827`)
- Subtitle: `"All inspector submissions across the platform"` — (`14px`, `#9CA3AF`)
- Badge: total count of all reports in current filter set — same purple pill as TM

#### State managed by the page:
```js
adminQueueFilters: { type, status, inspector, fromDate, toDate, reviewedBy }
activeReportId: string | null
assignModalOpen: boolean
assignModalReportId: string | null
```

#### Hooks used:
- `useAdminReportQueue(filters)` — fetches `/api/reports/admin/all`
- `useReportReview(activeReportId)` — reused from TM hooks (already allows admin role on backend)
- `useToast()` — reused

#### "Open Report" / "View Report" behavior:
When admin clicks "Open Report" or "View Report", set `activeReportId`. The page renders `ReviewContentPane` + `ReviewActionsSidebar` in the same layout as TM dashboard. A back button ("← Back to Queue") is shown in the review view to return to the queue (`setActiveReportId(null)`).

---

### Part 3 — AdminQueueView Component

**File:** `frontend/src/dashboards/admin/components/AdminQueueView.jsx`  
Based on TM's `QueueView.jsx` with these differences:

#### Filters (6 total, in a `lg:grid-cols-6` grid):
1. Inspection Type (same as TM)
2. Review Status (same as TM)
3. Inspector (same as TM — populated from `uniqueInspectors`)
4. Submitted From (same as TM)
5. Submitted To (same as TM)
6. **Reviewed By** (new) — `<select>` with "All TMs" option + list of unique TM names from the data

Filter state shape:
```js
{ type: 'All', status: 'All', inspector: 'All', fromDate: '', toDate: '', reviewedBy: 'All' }
```

#### Table columns (9 total):
1. REPORT ID
2. CLIENT NAME
3. INSPECTION TYPE
4. INSPECTOR
5. SUBMITTED DATE
6. REVISION ROUND
7. STATUS
8. **REVIEWED BY** (new) — between STATUS and ACTIONS
9. ACTIONS

#### "REVIEWED BY" column:
- Display logic: `report.assignedTMName || report.reviewedByName || null`
  - Finalized reports: show `reviewedByName` (who finalized — set on finalize action)
  - In-progress reports: show `assignedTMName` (who is assigned — set by admin via modal)
  - Neither set: show gray "Unassigned" (`color: #9CA3AF`)

#### ACTION button (status-based):

| Report status | Button label | Background | Text color |
|---|---|---|---|
| `"Pending Review"` | `"Assign to TM"` | `#F59E0B` | `white` |
| `"In Review"` or `"Under Review"` | `"Open Report"` | `#6C47FF` | `white` |
| `"Finalized"` | `"View Report"` | `#10B981` | `white` |
| All other statuses | `"Open Report"` | `#6C47FF` | `white` |

"Assign to TM" calls `onAssignTM(report.id)` (opens modal).  
All other buttons call `handleOpenReport(report.id)`.

---

### Part 4 — AssignTMModal Component

**File:** `frontend/src/dashboards/admin/components/AssignTMModal.jsx`

Triggered when admin clicks "Assign to TM". Modal follows existing modal styles in the project (white card, rounded-xl, shadow, overlay).

#### Content:
- **Title:** `"Assign Report to Technical Manager"` — `18px 700 #111827`
- **Subtitle:** Report ID in monospace gray below title — `font-family: monospace; font-size: 13px; color: #6B7280`
- **TM Dropdown:** `<select>` — fetched from `GET /api/admin/users?role=manager`
  - Default option: `"Select Technical Manager"` (disabled)
  - Each option shows: `"Name — email@domain.com"`
- **Note textarea:** "Add a note (optional)" — `placeholder: "e.g. Priority review, customer is waiting..."` — `maxLength: 200` — show char count `"X / 200"` below in gray
- **Buttons row (right-aligned):**
  - "Cancel" — outline `border #E5E7EB`, `color #374151`, closes modal
  - "Assign" — filled `background #6C47FF`, `color white`

#### Behavior:
- "Assign" calls `PATCH /api/reports/:id/assign-tm` with body `{ technicalManagerId, note }`
- On success: close modal, update the row in the table optimistically (change status to "In Review", set reviewedByName), show toast
- On error: show inline error message inside modal (red text below buttons)
- Loading state: disable "Assign" button and show "Assigning…" text while request in flight

---

### Part 5 — Routing

In `main.jsx`, add inside the `<ProtectedRoute allowedRoles={['admin']}>` block:
```jsx
<Route path="/admin/report-queue" element={<AdminReportQueue />} />
```

In `appRoutes.jsx`, add:
```js
export const AdminReportQueue = lazy(() => import('../dashboards/admin/pages/AdminReportQueue.jsx'))
```

---

## Backend Changes

### 1. Model changes

**`backend/models/report.model.js`** — add field:
```js
assignedTM: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
```

**`backend/models/factoryAudit.model.js`** — add same field:
```js
assignedTM: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
```

### 2. New endpoint: GET /api/reports/admin/all

**Route:** `GET /api/reports/admin/all`  
**Auth:** `authMiddleware` + `roleCheck(['admin'])`  
**Query params:** `status`, `type`, `reviewedBy` (TM name string), `fromDate`, `toDate`, `page`, `limit`

Response shape (each report):
```json
{
  "id": "...",
  "reportId": "RPT-ABC123",
  "clientName": "Acme Corp",
  "inspectionType": "PSI",
  "inspectorName": "Jane Smith",
  "submittedAt": "2026-06-01T...",
  "status": "submitted",
  "revisionRound": 1,
  "type": "standard",
  "assignedTMName": "John TM",
  "reviewedByName": null
}
```

Wraps the existing `getAllReports` helper in `manager.controller.js` (or duplicates it) with additional `.populate('assignedTM', 'name').populate('reviewedBy', 'name')` and exposes both names in response.

Full response: `{ reports: [...], stats: { totalReports, pendingReview, underReview, sentForCorrection, finalizedToday } }`

### 3. New endpoint: PATCH /api/reports/:id/assign-tm

**Route:** `PATCH /api/reports/:id/assign-tm`  
**Auth:** `authMiddleware` + `roleCheck(['admin'])`  
**Body:** `{ technicalManagerId: string, note?: string }`

Logic:
1. Validate `technicalManagerId` is a valid User with role `"manager"`
2. Try `Report.findById(id)`, else try `FactoryAudit.findById(id)`
3. Set `doc.assignedTM = technicalManagerId`
4. If `doc.operationStatus === "submitted"`, set `doc.operationStatus = "under_review"`
5. Save and return `{ success: true, report: { id, assignedTMName, status } }`

### 4. New endpoint: GET /api/admin/users

**Route:** `GET /api/admin/users`  
**Auth:** existing `authMiddleware` + `roleCheck(['admin', 'manager'])`  
**Query params:** `role` (e.g. `manager`)

Logic: `User.find({ role: req.query.role }).select('name email').lean()`  
Response: `{ users: [{ id, name, email }] }`

Note: User model role enum uses `"manager"` not `"technical_manager"`. Frontend passes `role=manager`, labels them "Technical Manager" in UI.

### 5. New hook: useAdminReportQueue

**File:** `frontend/src/dashboards/admin/hooks/useAdminReportQueue.js`

Same shape as `useReportQueue` but calls `ENDPOINTS.ADMIN.REPORT_QUEUE` (new endpoint). Returns `{ reports, stats, loading, error, refetch }`.

### 6. api.js additions

```js
ADMIN: {
  // existing...
  REPORT_QUEUE: `${API_BASE_URL}/api/reports/admin/all`,
  ASSIGN_TM: (id) => `${API_BASE_URL}/api/reports/${encodeURIComponent(id)}/assign-tm`,
  USERS_BY_ROLE: (role) => `${API_BASE_URL}/api/admin/users?role=${encodeURIComponent(role)}`,
}
```

---

## File Change Summary

### New files
| File | Purpose |
|---|---|
| `frontend/src/dashboards/admin/pages/AdminReportQueue.jsx` | Page with state machine (queue ↔ review) |
| `frontend/src/dashboards/admin/components/AdminQueueView.jsx` | Queue table adapted from TM's QueueView |
| `frontend/src/dashboards/admin/components/AssignTMModal.jsx` | Assign-to-TM modal |
| `frontend/src/dashboards/admin/hooks/useAdminReportQueue.js` | Data hook for admin queue |

### Modified files
| File | Change |
|---|---|
| `frontend/src/dashboards/admin/components/AdminNavbar.jsx` | Add "Report Queue" nav item + badge |
| `frontend/src/main.jsx` | Add `/admin/report-queue` route under admin ProtectedRoute |
| `frontend/src/routes/appRoutes.jsx` | Export `AdminReportQueue` lazy component |
| `frontend/src/config/api.js` | Add `ADMIN.REPORT_QUEUE`, `ADMIN.ASSIGN_TM`, `ADMIN.USERS_BY_ROLE` |
| `backend/models/report.model.js` | Add `assignedTM` field |
| `backend/models/factoryAudit.model.js` | Add `assignedTM` field |
| `backend/routes/report.routes.js` | Register new `admin/all` and `:id/assign-tm` routes |
| `backend/controllers/report.controller.js` | Add `getAdminQueue` and `assignTM` handlers |
| `backend/routes/admin.routes.js` | Register new `GET /users` route |
| `backend/controllers/admin.controller.js` | Add `getUsers` handler |

---

## Constraints

- TM dashboard (`TechnicalManagerDashboard.jsx`) and all its components are not modified
- All existing admin routes and components continue to work
- Purple `#6C47FF` design system used throughout
- Backend manager routes (`/api/manager/*`) are not changed
