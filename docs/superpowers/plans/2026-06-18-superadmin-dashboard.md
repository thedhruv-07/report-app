# Super Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `superadmin` role and a self-contained User Management dashboard that lets superadmins create, re-role, and delete accounts while locking public signup.

**Architecture:** Backend gains a role-gated `/api/superadmin` route group and a controller that operates on the User model directly. Frontend adds a standalone full-page dashboard (outside DashboardLayout to avoid double-navbar) reached via a new protected route; the login redirect dispatcher in DashboardHome is updated to send superadmins to their page.

**Tech Stack:** Express 5, Mongoose, bcryptjs, React 19, React Router 6, Tailwind CSS 4, native fetch

**Spec:** `docs/superpowers/specs/2026-06-18-superadmin-dashboard-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/models/user.model.js` | Modify | Add `"superadmin"` to role enum |
| `backend/controllers/auth.controller.js` | Modify | Guard signup — require superadmin JWT |
| `backend/controllers/superadmin.controller.js` | Create | listUsers, createUser, updateRole, deleteUser |
| `backend/routes/superadmin.routes.js` | Create | Mount 4 endpoints behind authMiddleware + roleCheck |
| `backend/app.js` | Modify | Mount superadmin router |
| `frontend/src/routes/appRoutes.jsx` | Modify | Lazy export SuperAdminDashboard |
| `frontend/src/pages/DashboardHome.jsx` | Modify | Add superadmin redirect case |
| `frontend/src/main.jsx` | Modify | Add protected route outside DashboardLayout |
| `frontend/src/dashboards/superadmin/SuperAdminDashboard.jsx` | Create | Full-page user management UI |

---

## Task 1: Add superadmin to the role enum

**Files:**
- Modify: `backend/models/user.model.js:34`

- [ ] **Step 1: Edit the enum**

In `backend/models/user.model.js`, change line 34:

```js
// Before
enum: ["user", "admin", "operator", "inspector", "manager"],

// After
enum: ["user", "admin", "operator", "inspector", "manager", "superadmin"],
```

- [ ] **Step 2: Verify the server starts cleanly**

```bash
cd backend && node -e "require('./models/user.model'); console.log('OK')"
```

Expected output: `OK` (no errors).

- [ ] **Step 3: Commit**

```bash
git add backend/models/user.model.js
git commit -m "feat: add superadmin to user role enum"
```

---

## Task 2: Lock down public signup

**Files:**
- Modify: `backend/controllers/auth.controller.js:1,10-13`

- [ ] **Step 1: Add the guard at the top of the signup handler**

In `backend/controllers/auth.controller.js`, add the import for `verifyToken` at the top (line 2, after the existing requires):

```js
const { verifyToken } = require("../middleware/auth.middleware");
```

Then, inside the `signup` function, insert this block **immediately after** `try {` and **before** the existing `const { name, email: rawEmail, password } = req.body;` line:

```js
    const authHeader = req.headers.authorization;
    const rawToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const decoded = rawToken ? verifyToken(rawToken) : null;
    if (!decoded || decoded.role !== "superadmin") {
      return res.status(403).json({ error: "Account creation is restricted to administrators" });
    }
```

- [ ] **Step 2: Verify the guard works**

Start the backend and test:

```bash
# Should return 403
curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","password":"123456"}' | jq .
```

Expected: `{ "error": "Account creation is restricted to administrators" }`

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/auth.controller.js
git commit -m "feat: restrict signup to superadmin-authenticated requests"
```

---

## Task 3: Create the superadmin controller

**Files:**
- Create: `backend/controllers/superadmin.controller.js`

- [ ] **Step 1: Create the file**

```js
const bcrypt = require("bcryptjs");
const { User } = require("../models/user.model");

const ALLOWED_ROLES = ["inspector", "manager", "admin", "operator", "superadmin"];

const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "_id name email role provider createdAt").lean();
    res.json({ users });
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name: name.trim(), email, password: hashed, role, provider: "local" });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: "_id name email role" }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      message: "Role updated",
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("updateRole error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

module.exports = { listUsers, createUser, updateRole, deleteUser };
```

- [ ] **Step 2: Smoke-check the module loads**

```bash
node -e "require('./backend/controllers/superadmin.controller'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/superadmin.controller.js
git commit -m "feat: add superadmin controller (list, create, updateRole, delete)"
```

---

## Task 4: Create the superadmin routes and mount them

**Files:**
- Create: `backend/routes/superadmin.routes.js`
- Modify: `backend/app.js`

- [ ] **Step 1: Create the routes file**

```js
const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const { listUsers, createUser, updateRole, deleteUser } = require("../controllers/superadmin.controller");

router.use(authMiddleware, roleCheck(["superadmin"]));

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", updateRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
```

- [ ] **Step 2: Mount in app.js**

In `backend/app.js`, add after the existing admin routes block (after `app.use('/api/admin', adminRoutes);`):

```js
const superadminRoutes = require('./routes/superadmin.routes');
app.use('/api/superadmin', superadminRoutes);
```

- [ ] **Step 3: Verify the server starts and the route exists**

Start the backend (`npm run dev` from root), then:

```bash
# Should return 401 (auth required), not 404
curl -s http://localhost:5000/api/superadmin/users | jq .
```

Expected: `{ "error": "Authentication required" }` (401, not 404)

- [ ] **Step 4: Commit**

```bash
git add backend/routes/superadmin.routes.js backend/app.js
git commit -m "feat: add superadmin routes mounted at /api/superadmin"
```

---

## Task 5: Create the SuperAdminDashboard component

**Files:**
- Create: `frontend/src/dashboards/superadmin/SuperAdminDashboard.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BASE = import.meta.env.VITE_API_BASE_URL;

const ROLES = ['inspector', 'manager', 'admin', 'operator', 'superadmin'];

const ROLE_BADGE = {
  inspector: 'bg-blue-100 text-blue-700',
  manager: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  superadmin: 'bg-red-100 text-red-700',
  operator: 'bg-gray-100 text-gray-600',
  user: 'bg-slate-100 text-slate-600',
};

export default function SuperAdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'inspector' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [roleModal, setRoleModal] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const stats = useMemo(() => ({
    total: users.length,
    inspectors: users.filter(u => u.role === 'inspector').length,
    managers: users.filter(u => u.role === 'manager').length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch(`${BASE}/api/superadmin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'inspector' });
      fetchUsers();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRoleSubmit = async () => {
    setRoleError('');
    setRoleLoading(true);
    try {
      const res = await fetch(`${BASE}/api/superadmin/users/${roleModal._id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      setRoleModal(null);
      fetchUsers();
    } catch (err) {
      setRoleError(err.message);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Delete ${targetUser.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BASE}/api/superadmin/users/${targetUser._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Super Admin — User Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 font-medium">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total },
            { label: 'Inspectors', value: stats.inspectors },
            { label: 'Managers', value: stats.managers },
            { label: 'Admins', value: stats.admins },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">All Users</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add User
            </button>
          </div>

          {error && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Name', 'Email', 'Role', 'Provider', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => {
                  const isSelf = u._id === user?.id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{u.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 capitalize">{u.provider}</td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isSelf}
                            onClick={() => { setRoleModal(u); setNewRole(u.role); setRoleError(''); }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Change Role
                          </button>
                          <button
                            disabled={isSelf}
                            onClick={() => handleDelete(u)}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-5">Add New User</h3>
            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{addError}</div>
            )}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddError(''); setAddForm({ name: '', email: '', password: '', role: 'inspector' }); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {addLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Change Role</h3>
            <p className="text-sm text-slate-500 mb-5">{roleModal.name}</p>
            {roleError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{roleError}</div>
            )}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1">New Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-blue-500 outline-none"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRoleModal(null); setRoleError(''); }}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleSubmit}
                disabled={roleLoading || newRole === roleModal.role}
                className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {roleLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/dashboards/superadmin/SuperAdminDashboard.jsx
git commit -m "feat: add SuperAdminDashboard user management page"
```

---

## Task 6: Wire up the frontend route and redirect

**Files:**
- Modify: `frontend/src/routes/appRoutes.jsx`
- Modify: `frontend/src/pages/DashboardHome.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Add lazy export to appRoutes.jsx**

In `frontend/src/routes/appRoutes.jsx`, add after the `AdminReportQueue` export:

```js
export const SuperAdminDashboard = lazy(() => import('../dashboards/superadmin/SuperAdminDashboard.jsx'))
```

- [ ] **Step 2: Add redirect in DashboardHome.jsx**

In `frontend/src/pages/DashboardHome.jsx`, add before the `if (user.role === 'manager')` block (line 15):

```jsx
  if (user.role === 'superadmin') {
    return <Navigate to="/dashboard/superadmin" replace />;
  }
```

- [ ] **Step 3: Add the import and route in main.jsx**

Add `SuperAdminDashboard` to the existing import from `'./routes/appRoutes'`:

```js
import {
  // ...existing imports...
  SuperAdminDashboard,
} from './routes/appRoutes'
```

Then, inside `<Route element={<ProtectedRoute />}>`, add a new block **after** the closing tag of `<Route element={<DashboardLayout />}>` and **before** the catch-all:

```jsx
{/* Superadmin — standalone page, no shared Navbar */}
<Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
  <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
</Route>
```

- [ ] **Step 4: Verify the frontend compiles**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/routes/appRoutes.jsx frontend/src/pages/DashboardHome.jsx frontend/src/main.jsx
git commit -m "feat: wire superadmin route and login redirect"
```

---

## Task 7: Create a superadmin seed user for testing

> This task creates a one-time script to bootstrap the first superadmin account directly in MongoDB (since signup is now locked). Run once, then delete the script.

**Files:**
- Create (temporary): `backend/scripts/seed-superadmin.js`

- [ ] **Step 1: Create the seed script**

```js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../models/user.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'superadmin@absoluteveritas.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Superadmin already exists:', existing.email);
    return process.exit(0);
  }
  const password = await bcrypt.hash('ChangeMe123!', 10);
  const user = new User({ name: 'Super Admin', email, password, role: 'superadmin', provider: 'local' });
  await user.save();
  console.log('Created superadmin:', email, '/ password: ChangeMe123!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run the seed**

```bash
node backend/scripts/seed-superadmin.js
```

Expected: `Created superadmin: superadmin@absoluteveritas.com / password: ChangeMe123!`

- [ ] **Step 3: Test login and dashboard access**

1. Start the full app: `npm run dev:all`
2. Navigate to `http://localhost:5173/login`
3. Log in with `superadmin@absoluteveritas.com` / `ChangeMe123!`
4. Confirm redirect to `/dashboard/superadmin`
5. Confirm user table loads, stats cards show counts
6. Test Add User — create a test inspector account
7. Test Change Role on the test account
8. Test Delete on the test account
9. Confirm both Change Role and Delete are disabled on the superadmin's own row

- [ ] **Step 4: Delete the seed script**

```bash
git rm backend/scripts/seed-superadmin.js
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete superadmin dashboard — user management CRUD"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Add `superadmin` to role enum | Task 1 |
| Lock signup to superadmin-only | Task 2 |
| GET /api/superadmin/users | Task 3 + 4 |
| POST /api/superadmin/users | Task 3 + 4 |
| PATCH /api/superadmin/users/:id/role | Task 3 + 4 |
| DELETE /api/superadmin/users/:id (prevent self-delete) | Task 3 + 4 |
| Mount at /api/superadmin | Task 4 |
| SuperAdminDashboard — header bar | Task 5 |
| SuperAdminDashboard — stats row | Task 5 |
| SuperAdminDashboard — user table + role badges | Task 5 |
| SuperAdminDashboard — Add User modal | Task 5 |
| SuperAdminDashboard — Change Role modal | Task 5 |
| SuperAdminDashboard — Delete confirmation | Task 5 |
| SuperAdminDashboard — Change Role disabled for self | Task 5 |
| Lazy export in appRoutes | Task 6 |
| Protected route outside DashboardLayout | Task 6 |
| Login redirect for superadmin via DashboardHome | Task 6 |
| Token from sessionStorage via useAuth() | Task 5 (uses `token` from useAuth) |
| Do not touch AdminDashboard | ✓ Not modified |
