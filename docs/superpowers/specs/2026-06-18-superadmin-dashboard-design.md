# Super Admin Dashboard — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

---

## Overview

Add a `superadmin` role and a dedicated User Management dashboard to the Absolute Veritas report platform. The existing `admin` role and `AdminDashboard` (CS/booking management) are untouched.

---

## 1. Backend

### 1.1 User Model (`backend/models/user.model.js`)

Add `"superadmin"` to the role enum. Default remains `"inspector"`.

```js
enum: ["user", "admin", "operator", "inspector", "manager", "superadmin"]
```

### 1.2 Signup Restriction (`backend/controllers/auth.controller.js`)

The `/api/auth/signup` route stays public in the router. The controller gains a guard at the very top of the handler:

1. Read `Authorization` header and call `verifyToken()` from `auth.middleware.js`.
2. If the decoded token exists and `decoded.role === 'superadmin'` → allow the request through.
3. Otherwise → `return res.status(403).json({ error: "Account creation is restricted to administrators" })`.

Login and all other auth routes are unchanged.

### 1.3 Superadmin Routes (`backend/routes/superadmin.routes.js`)

All routes protected by `authMiddleware + roleCheck(['superadmin'])`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/superadmin/users` | List all users |
| POST | `/api/superadmin/users` | Create a new user |
| PATCH | `/api/superadmin/users/:id/role` | Update a user's role |
| DELETE | `/api/superadmin/users/:id` | Delete a user |

### 1.4 Superadmin Controller (`backend/controllers/superadmin.controller.js`)

**GET /users**  
`User.find({}, '_id name email role provider createdAt')` — excludes password field.  
Returns `{ users: [...] }`.

**POST /users**  
Body: `{ name, email, password, role }`. 
Validation:
- All four fields required.
- `role` must be in `["inspector", "manager", "admin", "operator", "superadmin"]`.
- Email must pass the same regex as signup.
- Password ≥ 6 chars.

Creates with `new User({ name, email, password: await bcrypt.hash(password, 10), role, provider: 'local' })` — uses the Mongoose model directly (not the `createUser()` helper, which doesn't accept a `role` param).  
Returns 409 if email already exists, 201 on success.

**PATCH /users/:id/role**  
Body: `{ role }`.  
Validates role against the same allowed enum. Calls `User.findByIdAndUpdate`.  
Returns updated user fields.

**DELETE /users/:id**  
If `req.params.id === req.user.id` → 400 "You cannot delete your own account".  
Otherwise `User.findByIdAndDelete`. Returns 204.

### 1.5 App Mount (`backend/app.js`)

```js
const superadminRoutes = require('./routes/superadmin.routes');
app.use('/api/superadmin', superadminRoutes);
```

Mounted after the existing admin routes block.

---

## 2. Frontend

### 2.1 Token Access

The app stores auth in `sessionStorage` (not localStorage). The superadmin dashboard reads token via `useAuth()` context (`token` field), consistent with all other dashboards.

### 2.2 Route Structure (`frontend/src/main.jsx`)

The superadmin route is placed **outside** `DashboardLayout` (which renders `<Navbar />`) to avoid the double-navbar bug. It sits as a sibling of the DashboardLayout block, still inside the outer `ProtectedRoute`:

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<DashboardLayout />}>
    {/* ...all existing routes unchanged... */}
  </Route>

  {/* Superadmin — own full-page layout, no shared Navbar */}
  <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
    <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
  </Route>
</Route>
```

### 2.3 Lazy Export (`frontend/src/routes/appRoutes.jsx`)

```js
export const SuperAdminDashboard = lazy(() => import('../dashboards/superadmin/SuperAdminDashboard.jsx'))
```

### 2.4 Login Redirect (`frontend/src/pages/DashboardHome.jsx`)

Add before the default redirect:

```jsx
if (user.role === 'superadmin') return <Navigate to="/dashboard/superadmin" replace />;
```

### 2.5 SuperAdminDashboard (`frontend/src/dashboards/superadmin/SuperAdminDashboard.jsx`)

Self-contained page. Uses `useAuth()` for `user`, `token`, and `logout`. All state is local.

**Layout sections:**

**Header bar**  
Full-width bar: "Super Admin — User Management" title on the left; logged-in user name chip + Logout button on the right.

**Stats row**  
4 count cards computed from the fetched user list (no extra API call):
- Total Users
- Inspectors (`role === 'inspector'`)
- Managers (`role === 'manager'`)
- Admins (`role === 'admin'`)

**Add User button**  
Top-right of the table header area. Opens the Add User modal.

**User table**  
Columns: Name | Email | Role | Provider | Created | Actions

- **Role badge**: colored pill — `inspector`=blue, `manager`=purple, `admin`=orange, `superadmin`=red, `operator`=gray, `user`=slate
- **Provider badge**: `local` or `google`
- **Created**: formatted date string
- **Actions**: "Change Role" button (disabled + muted if row is the logged-in user — prevents accidental self-demotion/lockout) + "Delete" button (red; disabled + muted if row is the logged-in user)

**Add User modal**  
Inline overlay (controlled by `showAddModal` state). Fields: Full Name, Email, Password, Role (select with all valid roles). Submit → `POST /api/superadmin/users`. On success: close modal, re-fetch list. On error: show inline error message.

**Change Role modal**  
Triggered by "Change Role" button on a row. Shows current role, a select for new role, and a Confirm button. Submit → `PATCH /api/superadmin/users/:id/role`. On success: close modal, re-fetch.

**Delete confirmation**  
Uses `window.confirm()` before calling `DELETE /api/superadmin/users/:id`. On success: re-fetch list.

**Error/loading states**  
Table shows a loading spinner while fetching. Errors displayed as a red alert banner above the table.

---

## 3. Constraints

- Do not touch `AdminDashboard.jsx`, admin routes, or booking functionality.
- Do not remove login page or Google OAuth.
- Existing `admin` role unchanged.
- No new npm packages — use native `fetch`.
- CommonJS backend, ESM frontend. No TypeScript.
- No comments unless non-obvious.
