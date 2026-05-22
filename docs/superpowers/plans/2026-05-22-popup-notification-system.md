# Popup Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full popup notification system that shows system-wide admin-broadcast notifications to all users immediately on login, with a bell dropdown in all three dashboard navbars and an admin management panel.

**Architecture:** A new `SystemNotification` Mongoose model (distinct from the existing inspector task `Notification` model) powers REST endpoints at `/api/notifications`. A React `NotificationContext` fetches on mount and stores notifications app-wide. A `NotificationPopup` modal overlays the dashboard on first login per session (gated by `sessionStorage`). All three existing dashboard navbars (shared Navbar, AdminDashboard header, ManagerChrome header) consume the context for their bell badges and dropdowns.

**Tech Stack:** Express 5, Mongoose, React 19, Vite, Tailwind CSS 4, lucide-react. No new npm packages needed.

**Role note:** The app's actual role values are `admin`, `manager`, `inspector` — NOT `technical_manager`. Use `manager` everywhere.

---

## File Map

**Created:**
- `backend/models/systemNotification.model.js` — new notification schema
- `backend/controllers/notification.controller.js` — all 8 route handlers
- `backend/routes/notification.routes.js` — route definitions
- `backend/scripts/seedNotifications.js` — seed starter data
- `frontend/src/context/NotificationContext.jsx` — app-wide notification state
- `frontend/src/utils/timeAgo.js` — relative timestamp utility
- `frontend/src/components/shared/NotificationPopup.jsx` — login popup modal
- `frontend/src/pages/Notifications.jsx` — full notifications list page
- `frontend/src/dashboards/admin/components/NotificationManager.jsx` — admin CRUD panel

**Modified:**
- `backend/app.js` — mount `/api/notifications` routes
- `frontend/src/config/api.js` — add NOTIFICATIONS endpoints
- `frontend/src/main.jsx` — wrap with NotificationProvider, add /notifications route
- `frontend/src/components/layout/DashboardLayout.jsx` — render NotificationPopup
- `frontend/src/components/shared/Navbar.jsx` — use context for bell
- `frontend/src/dashboards/admin/AdminDashboard.jsx` — use context bell + add Notifications nav item
- `frontend/src/dashboards/manager/components/ManagerChrome.jsx` — use context bell
- `frontend/src/dashboards/manager/TechnicalManagerDashboard.jsx` — pass context data to ManagerChrome
- `frontend/src/routes/appRoutes.jsx` — export Notifications page

---

## Task 1: Backend — SystemNotification Model

**Files:**
- Create: `backend/models/systemNotification.model.js`

> NOTE: The existing `backend/models/notification.model.js` powers inspector per-task notifications. Do NOT touch it.

- [ ] **Step 1: Create the model**

```js
// backend/models/systemNotification.model.js
const mongoose = require("mongoose");

const readBySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  readAt: { type: Date, default: Date.now }
}, { _id: false });

const systemNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["info", "warning", "urgent", "success"],
    default: "info"
  },
  priority: { type: Number, enum: [1, 2, 3], default: 3 },
  targetRoles: [{
    type: String,
    enum: ["admin", "manager", "inspector"]
  }],
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  readBy: [readBySchema]
}, { timestamps: true });

// Index for efficient unread queries
systemNotificationSchema.index({ isActive: 1, targetRoles: 1 });
systemNotificationSchema.index({ isActive: 1, targetUsers: 1 });

module.exports = mongoose.model("SystemNotification", systemNotificationSchema);
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/systemNotification.model.js
git commit -m "feat(notifications): add SystemNotification model"
```

---

## Task 2: Backend — Notification Controller

**Files:**
- Create: `backend/controllers/notification.controller.js`

- [ ] **Step 1: Create the controller**

```js
// backend/controllers/notification.controller.js
const SystemNotification = require("../models/systemNotification.model");

// Helper: build query for "notifications visible to this user"
const buildUserQuery = (user) => {
  const now = new Date();
  return {
    isActive: true,
    $or: [
      { targetRoles: user.role },
      { targetUsers: user.id }
    ],
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }
    ]
  };
};

// GET /api/notifications/my-notifications
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = {
      ...buildUserQuery(req.user),
      "readBy.userId": { $ne: userId }
    };

    const notifications = await SystemNotification.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    res.json({ notifications });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/mark-read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ error: "notificationId is required" });
    }

    const notification = await SystemNotification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { readBy: { userId: req.user.id, readAt: new Date() } } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/mark-all-read
const markAllRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ error: "notificationIds array is required" });
    }

    await SystemNotification.updateMany(
      { _id: { $in: notificationIds } },
      { $addToSet: { readBy: { userId: req.user.id, readAt: new Date() } } }
    );

    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    console.error("markAllRead error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/notifications/bell-count
const getBellCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = {
      ...buildUserQuery(req.user),
      "readBy.userId": { $ne: userId }
    };

    const count = await SystemNotification.countDocuments(query);
    res.json({ count });
  } catch (err) {
    console.error("getBellCount error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/create  (admin only)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, priority, targetRoles, targetUsers, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "title and message are required" });
    }

    const notification = await SystemNotification.create({
      title,
      message,
      type: type || "info",
      priority: priority || 3,
      targetRoles: targetRoles || [],
      targetUsers: targetUsers || [],
      createdBy: req.user.id,
      expiresAt: expiresAt || null
    });

    res.status(201).json({ notification });
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/notifications/:id  (admin only)
const updateNotification = async (req, res) => {
  try {
    const { title, message, type, priority, targetRoles, isActive, expiresAt } = req.body;

    const notification = await SystemNotification.findByIdAndUpdate(
      req.params.id,
      { title, message, type, priority, targetRoles, isActive, expiresAt },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (err) {
    console.error("updateNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/notifications/:id  (admin only — soft delete)
const deleteNotification = async (req, res) => {
  try {
    const notification = await SystemNotification.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, message: "Notification deactivated" });
  } catch (err) {
    console.error("deleteNotification error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/notifications/all  (admin only)
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await SystemNotification.find({})
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const withReadCount = notifications.map(n => ({
      ...n,
      readCount: n.readBy?.length || 0
    }));

    res.json({ notifications: withReadCount });
  } catch (err) {
    console.error("getAllNotifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllRead,
  getBellCount,
  createNotification,
  updateNotification,
  deleteNotification,
  getAllNotifications
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/notification.controller.js
git commit -m "feat(notifications): add notification controller"
```

---

## Task 3: Backend — Routes + Mount in app.js

**Files:**
- Create: `backend/routes/notification.routes.js`
- Modify: `backend/app.js`

- [ ] **Step 1: Create routes file**

```js
// backend/routes/notification.routes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  getBellCount,
  createNotification,
  updateNotification,
  deleteNotification,
  getAllNotifications
} = require("../controllers/notification.controller");

// All routes require authentication
router.use(authMiddleware);

// User routes (all authenticated roles)
router.get("/my-notifications", getMyNotifications);
router.post("/mark-read", markAsRead);
router.post("/mark-all-read", markAllRead);
router.get("/bell-count", getBellCount);

// Admin-only routes
router.use("/create", roleCheck(["admin"]));
router.post("/create", createNotification);

router.use("/all", roleCheck(["admin"]));
router.get("/all", getAllNotifications);

router.use("/:id", roleCheck(["admin"]));
router.put("/:id", updateNotification);
router.delete("/:id", deleteNotification);

module.exports = router;
```

- [ ] **Step 2: Mount in app.js**

In `backend/app.js`, after the line `app.use('/api/manager', managerRoutes);`, add:

```js
// Notification Routes
const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add backend/routes/notification.routes.js backend/app.js
git commit -m "feat(notifications): add notification routes and mount in app"
```

---

## Task 4: Backend — Seed Starter Notifications

**Files:**
- Create: `backend/scripts/seedNotifications.js`

- [ ] **Step 1: Create seed script**

```js
// backend/scripts/seedNotifications.js
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const { User } = require("../models/user.model");
const SystemNotification = require("../models/systemNotification.model");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Find an admin user to set as createdBy
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("No admin user found. Create an admin account first.");
    process.exit(1);
  }

  // Clear existing seed notifications to avoid duplicates
  await SystemNotification.deleteMany({ createdBy: admin._id });

  const now = new Date();
  const seeds = [
    // --- ADMIN ---
    {
      title: "System Ready",
      message: "IRMS is fully operational. All inspector accounts are active.",
      type: "info",
      priority: 3,
      targetRoles: ["admin"],
      createdBy: admin._id
    },
    {
      title: "Pending Report Reviews",
      message: "You have inspection reports awaiting your review and approval. Please check the reports section.",
      type: "warning",
      priority: 1,
      targetRoles: ["admin"],
      createdBy: admin._id
    },
    // --- TECHNICAL MANAGER (role: "manager") ---
    {
      title: "Reports Assigned to You",
      message: "Several inspection reports have been submitted and are awaiting technical review. Please prioritize these today.",
      type: "urgent",
      priority: 1,
      targetRoles: ["manager"],
      createdBy: admin._id
    },
    {
      title: "Inspector Onboarding Pending",
      message: "2 inspectors have not completed their onboarding assessment. Follow up with them.",
      type: "warning",
      priority: 2,
      targetRoles: ["manager"],
      createdBy: admin._id
    },
    // --- INSPECTOR ---
    {
      title: "Complete Your Onboarding",
      message: "You have not completed your onboarding process. Please finish the User Manual, Training Videos, and Assessment to unlock full access.",
      type: "urgent",
      priority: 1,
      targetRoles: ["inspector"],
      createdBy: admin._id
    },
    {
      title: "New Assignment",
      message: "You have been assigned a new inspection job. Check your dashboard for details.",
      type: "info",
      priority: 2,
      targetRoles: ["inspector"],
      createdBy: admin._id
    }
  ];

  await SystemNotification.insertMany(seeds);
  console.log(`Seeded ${seeds.length} notifications`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed**

From the project root:
```bash
node backend/scripts/seedNotifications.js
```

Expected output:
```
Connected to MongoDB
Seeded 6 notifications
```

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/seedNotifications.js
git commit -m "feat(notifications): add seed script for starter notifications"
```

---

## Task 5: Frontend — API Endpoints

**Files:**
- Modify: `frontend/src/config/api.js`

- [ ] **Step 1: Add NOTIFICATIONS section to ENDPOINTS**

In `frontend/src/config/api.js`, add the following block inside the `ENDPOINTS` export object after the `ADMIN` block:

```js
  NOTIFICATIONS: {
    MY: `${API_BASE_URL}/api/notifications/my-notifications`,
    BELL_COUNT: `${API_BASE_URL}/api/notifications/bell-count`,
    MARK_READ: `${API_BASE_URL}/api/notifications/mark-read`,
    MARK_ALL_READ: `${API_BASE_URL}/api/notifications/mark-all-read`,
    ALL: `${API_BASE_URL}/api/notifications/all`,
    CREATE: `${API_BASE_URL}/api/notifications/create`,
    UPDATE: (id) => `${API_BASE_URL}/api/notifications/${encodeURIComponent(id)}`,
    DELETE: (id) => `${API_BASE_URL}/api/notifications/${encodeURIComponent(id)}`,
  },
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/config/api.js
git commit -m "feat(notifications): add notification API endpoints to config"
```

---

## Task 6: Frontend — Time Utility

**Files:**
- Create: `frontend/src/utils/timeAgo.js`

- [ ] **Step 1: Create utility**

```js
// frontend/src/utils/timeAgo.js
export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/utils/timeAgo.js
git commit -m "feat(notifications): add timeAgo utility"
```

---

## Task 7: Frontend — NotificationContext

**Files:**
- Create: `frontend/src/context/NotificationContext.jsx`

- [ ] **Step 1: Create the context**

```jsx
// frontend/src/context/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ENDPOINTS } from "../config/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [popupNotifications, setPopupNotifications] = useState([]);
  const [bellNotifications, setBellNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.NOTIFICATIONS.MY, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      const notifs = data.notifications || [];
      setPopupNotifications(notifs);
      setBellNotifications(notifs.slice(0, 10));
      setUnreadCount(notifs.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // Fetch on login
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      setPopupNotifications([]);
      setBellNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!token) return;
    try {
      await fetch(ENDPOINTS.NOTIFICATIONS.MARK_READ, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      });
      setPopupNotifications(prev => prev.filter(n => n._id !== notificationId));
      setBellNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  }, [token]);

  const markAllAsRead = useCallback(async (notificationIds) => {
    if (!token || !notificationIds?.length) return;
    try {
      await fetch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationIds })
      });
      setPopupNotifications([]);
      setBellNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  }, [token]);

  return (
    <NotificationContext.Provider value={{
      popupNotifications,
      bellNotifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/context/NotificationContext.jsx
git commit -m "feat(notifications): add NotificationContext"
```

---

## Task 8: Frontend — NotificationPopup Component

**Files:**
- Create: `frontend/src/components/shared/NotificationPopup.jsx`

- [ ] **Step 1: Create the popup**

```jsx
// frontend/src/components/shared/NotificationPopup.jsx
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { timeAgo } from "../../utils/timeAgo";

const TYPE_CONFIG = {
  urgent:  { label: "URGENT",  bg: "bg-red-100",    text: "text-red-700",    border: "border-l-red-500" },
  warning: { label: "WARNING", bg: "bg-amber-100",  text: "text-amber-700",  border: "border-l-amber-500" },
  info:    { label: "INFO",    bg: "bg-blue-100",   text: "text-blue-700",   border: "border-l-blue-500" },
  success: { label: "SUCCESS", bg: "bg-emerald-100",text: "text-emerald-700",border: "border-l-emerald-500" },
};

const PRIORITY_BORDER = {
  1: "border-l-red-500",
  2: "border-l-amber-500",
  3: "border-l-blue-500",
};

export default function NotificationPopup() {
  const { popupNotifications, markAllAsRead } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [markOnClose, setMarkOnClose] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("notif_popup_shown");
    if (!alreadyShown && popupNotifications.length > 0) {
      setVisible(true);
      // Slight delay so the animation plays after mount
      requestAnimationFrame(() => setTimeout(() => setEntered(true), 50));
    }
  }, [popupNotifications]);

  if (!visible) return null;

  const topPriority = Math.min(...popupNotifications.map(n => n.priority ?? 3));
  const cardBorderClass = PRIORITY_BORDER[topPriority] || PRIORITY_BORDER[3];

  const handleClose = async () => {
    if (markOnClose) {
      const ids = popupNotifications.map(n => n._id);
      await markAllAsRead(ids);
    }
    sessionStorage.setItem("notif_popup_shown", "true");
    setEntered(false);
    setTimeout(() => setVisible(false), 300);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay — not dismissible */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Card */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] border-l-4 ${cardBorderClass}
          transform transition-all duration-300 ease-out
          ${entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  You have {popupNotifications.length} new notification{popupNotifications.length !== 1 ? "s" : ""}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Please review before continuing to your dashboard
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-4 mt-1"
            >
              Dismiss All
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto max-h-[360px] px-6 py-3 space-y-1">
          {popupNotifications.map((notif, idx) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
            return (
              <div
                key={notif._id}
                className="py-3 border-l-2 border-l-blue-200 pl-3"
                style={{ borderBottom: idx < popupNotifications.length - 1 ? "1px solid #f1f5f9" : "none" }}
              >
                <div className="flex items-start gap-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 mt-0.5 ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{notif.title}</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markOnClose}
              onChange={(e) => setMarkOnClose(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-slate-500">Mark all as read when I close this</span>
          </label>
          <button
            onClick={handleClose}
            className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
          >
            Got it, continue to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shared/NotificationPopup.jsx
git commit -m "feat(notifications): add NotificationPopup modal component"
```

---

## Task 9: Frontend — Wire Context + Popup into App

**Files:**
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/components/layout/DashboardLayout.jsx`

- [ ] **Step 1: Read current DashboardLayout**

Read `frontend/src/components/layout/DashboardLayout.jsx` to understand how to add the popup without breaking it.

- [ ] **Step 2: Wrap app with NotificationProvider in main.jsx**

In `frontend/src/main.jsx`, add the import and wrap:

```jsx
import { NotificationProvider } from './context/NotificationContext'
```

Change the render tree so `NotificationProvider` wraps the content inside `AuthProvider`:

```jsx
<AuthProvider>
  <NotificationProvider>
    <Suspense fallback={<RouteFallback />}>
      {/* ... all routes ... */}
    </Suspense>
  </NotificationProvider>
</AuthProvider>
```

- [ ] **Step 3: Read DashboardLayout.jsx**

Read the full file before editing.

- [ ] **Step 4: Add NotificationPopup to DashboardLayout**

Add these two lines to `DashboardLayout.jsx`:

```jsx
import NotificationPopup from '../shared/NotificationPopup';
```

Then render it at the top of the returned JSX (before or after the existing content, at the same level):

```jsx
<>
  <NotificationPopup />
  {/* existing layout JSX */}
</>
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/main.jsx frontend/src/components/layout/DashboardLayout.jsx
git commit -m "feat(notifications): wire NotificationProvider and popup into app shell"
```

---

## Task 10: Frontend — Update Shared Navbar Bell

**Files:**
- Modify: `frontend/src/components/shared/Navbar.jsx`

The existing Navbar has local state for notifications (`notifications`, `unreadCount`) and fetches from `ENDPOINTS.INSPECTOR.NOTIFICATIONS`. Replace this with `useNotifications()` context.

- [ ] **Step 1: Update imports and state**

Replace the existing notification-related `useState`/`useEffect`/`markAsRead`/`markAllAsRead` block with context usage.

At the top of the component, add:
```jsx
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/timeAgo';
```

Replace the local state declarations:
```jsx
// REMOVE these lines:
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);

// REMOVE the useEffect that fetches from ENDPOINTS.INSPECTOR.NOTIFICATIONS

// REMOVE the local markAsRead and markAllAsRead functions
```

Add context usage:
```jsx
const { bellNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
```

- [ ] **Step 2: Update the bell badge**

Replace `{unreadCount > 0 && (<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>)}` with:

```jsx
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white">
    {unreadCount > 9 ? "9+" : unreadCount}
  </span>
)}
```

- [ ] **Step 3: Update dropdown to render bellNotifications and use timeAgo**

In the dropdown, change `notifications.map(n => ...)` to `bellNotifications.map(n => ...)`.

Replace the date display `new Date(n.createdAt).toLocaleDateString()` with `timeAgo(n.createdAt)`.

Add the "Mark all read" handler call:
```jsx
// markAllAsRead now takes an array of IDs
const handleMarkAllRead = () => {
  const ids = bellNotifications.map(n => n._id);
  markAllAsRead(ids);
};
```

Update the "Mark all read" button's `onClick` from `markAllAsRead` to `handleMarkAllRead`.

Update single item "mark as read" to call `markAsRead(n._id)`.

Add a "View all" footer link after the notifications list inside the dropdown:
```jsx
<div className="px-4 py-2 border-t border-slate-100">
  <button
    onClick={() => { navigate('/notifications'); setNotificationsOpen(false); }}
    className="text-xs font-semibold text-blue-600 hover:text-blue-700 w-full text-center"
  >
    View all notifications
  </button>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/shared/Navbar.jsx
git commit -m "feat(notifications): update shared Navbar bell to use NotificationContext"
```

---

## Task 11: Frontend — Update Admin Dashboard Bell + Add Notifications Tab

**Files:**
- Modify: `frontend/src/dashboards/admin/AdminDashboard.jsx`
- Create: `frontend/src/dashboards/admin/components/NotificationManager.jsx`

### Part A — Update Admin bell

- [ ] **Step 1: Add context usage to AdminDashboard.jsx**

Add import at the top:
```jsx
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/timeAgo';
```

Inside the component, add:
```jsx
const { bellNotifications, unreadCount: notifUnreadCount, markAsRead: markNotifRead, markAllAsRead: markAllNotifRead } = useNotifications();
```

- [ ] **Step 2: Update the bell badge in AdminDashboard's header**

Locate the bell button (around line 179-188 in the current file). Replace the badge `<span>` to use `notifUnreadCount`:

```jsx
<button
  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200 cursor-pointer"
>
  <Bell className="w-5 h-5" />
  {notifUnreadCount > 0 && (
    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold px-1">
      {notifUnreadCount > 9 ? "9+" : notifUnreadCount}
    </span>
  )}
</button>
```

- [ ] **Step 3: Add "Notifications" nav item to AdminDashboard's nav**

After the "Inspectors" nav button, add:
```jsx
<button
  onClick={() => setActiveView("notifications")}
  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
    activeView === "notifications" ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
  }`}
>
  <div className="flex items-center gap-2">
    <Bell className="w-4 h-4 shrink-0" />
    <span>Notifications</span>
    {notifUnreadCount > 0 && (
      <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        activeView === "notifications" ? 'bg-indigo-600 text-white' : 'bg-red-500 text-white'
      }`}>
        {notifUnreadCount}
      </span>
    )}
  </div>
</button>
```

- [ ] **Step 4: Render NotificationManager in main area**

In the main area (`<main>`) of AdminDashboard.jsx, add a conditional render:
```jsx
import NotificationManager from './components/NotificationManager';

// In the render, after existing conditionals:
{activeView === 'notifications' && <NotificationManager />}
```

- [ ] **Step 5: Remove MOCK_NOTIFICATIONS usage**

The admin dashboard currently imports `MOCK_NOTIFICATIONS` and uses local state for `notifications`/`unreadCount`. Since we're replacing that with the context, remove the local `notifications` state and `unreadCount` state (replace with `notifUnreadCount` from context). The `NotificationPanel` (existing side panel) can be left as-is or removed — keep it so the slide-out panel still works but render `bellNotifications` through it.

Actually: leave `NotificationPanel` component wired up to `bellNotifications` from context. Update `handleMarkAllRead` in AdminDashboard to call `markAllNotifRead(bellNotifications.map(n => n._id))`.

### Part B — Create NotificationManager panel

- [ ] **Step 6: Create NotificationManager.jsx**

```jsx
// frontend/src/dashboards/admin/components/NotificationManager.jsx
import { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, Edit2, Trash2, Users, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { timeAgo } from '../../../utils/timeAgo';

const TYPE_CONFIG = {
  urgent:  { label: "Urgent",  bg: "bg-red-100",    text: "text-red-700" },
  warning: { label: "Warning", bg: "bg-amber-100",  text: "text-amber-700" },
  info:    { label: "Info",    bg: "bg-blue-100",   text: "text-blue-700" },
  success: { label: "Success", bg: "bg-emerald-100",text: "text-emerald-700" },
};

const EMPTY_FORM = {
  title: "",
  message: "",
  type: "info",
  priority: 3,
  targetRoles: [],
  expiresAt: ""
};

export default function NotificationManager() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.NOTIFICATIONS.ALL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (notif) => {
    setForm({
      title: notif.title,
      message: notif.message,
      type: notif.type,
      priority: notif.priority,
      targetRoles: notif.targetRoles || [],
      expiresAt: notif.expiresAt ? new Date(notif.expiresAt).toISOString().slice(0, 10) : ""
    });
    setEditingId(notif._id);
    setShowModal(true);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this notification?")) return;
    try {
      await fetch(ENDPOINTS.NOTIFICATIONS.DELETE(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAll();
    } catch (err) {
      alert("Failed to deactivate: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert("Title and message are required");
      return;
    }
    if (form.targetRoles.length === 0) {
      alert("Select at least one target role");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt || null
      };
      if (editingId) {
        await fetch(ENDPOINTS.NOTIFICATIONS.UPDATE(editingId), {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(ENDPOINTS.NOTIFICATIONS.CREATE, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  if (loading) return <div className="p-8 text-slate-500">Loading notifications…</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Notification Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage system-wide notifications for all user roles</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Notification
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Target Roles</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Read By</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No notifications yet</td>
                </tr>
              )}
              {notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                return (
                  <tr key={notif._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 max-w-[180px] truncate">{notif.title}</p>
                      <p className="text-xs text-slate-400 max-w-[180px] truncate">{notif.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${notif.priority === 1 ? 'text-red-600' : notif.priority === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {notif.priority === 1 ? 'High' : notif.priority === 2 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(notif.targetRoles || []).map(r => (
                          <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded capitalize">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {notif.readCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {notif.isActive
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle className="w-3 h-3" />Active</span>
                        : <span className="text-xs text-slate-400 font-semibold">Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(notif.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(notif)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {notif.isActive && (
                          <button
                            onClick={() => handleDeactivate(notif._id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{editingId ? "Edit Notification" : "Create Notification"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  placeholder="Full notification message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    <option value={1}>1 — High</option>
                    <option value={2}>2 — Medium</option>
                    <option value={3}>3 — Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Target Roles *</label>
                <div className="flex gap-3">
                  {["admin", "manager", "inspector"].map(role => (
                    <label key={role} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.targetRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span className="text-sm text-slate-600 capitalize">{role === "manager" ? "Technical Manager" : role}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/dashboards/admin/AdminDashboard.jsx frontend/src/dashboards/admin/components/NotificationManager.jsx
git commit -m "feat(notifications): update admin dashboard bell + add NotificationManager panel"
```

---

## Task 12: Frontend — Update Manager Bell in ManagerChrome

**Files:**
- Modify: `frontend/src/dashboards/manager/components/ManagerChrome.jsx`
- Modify: `frontend/src/dashboards/manager/TechnicalManagerDashboard.jsx`

The manager dashboard uses socket-based real-time `notifications` state from `TechnicalManagerDashboard` and passes it to `ManagerChrome`. We add the context bell count alongside it.

- [ ] **Step 1: Update ManagerChrome to accept and display context bell count**

In `ManagerChrome.jsx`, add a new prop `systemUnreadCount` alongside the existing `unreadCount`. Update the bell button in the header to use `systemUnreadCount`:

```jsx
// Add to props destructuring:
systemUnreadCount,

// Bell button in header (around line 132-142), replace badge with:
{systemUnreadCount > 0 && (
  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold px-1">
    {systemUnreadCount > 9 ? "9+" : systemUnreadCount}
  </span>
)}
```

The bell button `onClick` will open the notifications panel (which now shows both socket notifs + context notifs).

- [ ] **Step 2: Update TechnicalManagerDashboard.jsx to pass system count**

Add import at top:
```jsx
import { useNotifications } from '../../context/NotificationContext';
```

Inside the component:
```jsx
const { bellNotifications: systemNotifs, unreadCount: systemUnreadCount, markAllAsRead: markSystemAllRead } = useNotifications();
```

Pass to ManagerChrome:
```jsx
<ManagerChrome
  // ... existing props ...
  systemUnreadCount={systemUnreadCount}
/>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/manager/components/ManagerChrome.jsx frontend/src/dashboards/manager/TechnicalManagerDashboard.jsx
git commit -m "feat(notifications): update manager chrome bell with system notification count"
```

---

## Task 13: Frontend — Full Notifications Page + Route

**Files:**
- Create: `frontend/src/pages/Notifications.jsx`
- Modify: `frontend/src/routes/appRoutes.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 1: Create Notifications page**

```jsx
// frontend/src/pages/Notifications.jsx
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/timeAgo';
import { Bell, CheckCheck } from 'lucide-react';

const TYPE_CONFIG = {
  urgent:  { label: "URGENT",  bg: "bg-red-100",    text: "text-red-700" },
  warning: { label: "WARNING", bg: "bg-amber-100",  text: "text-amber-700" },
  info:    { label: "INFO",    bg: "bg-blue-100",   text: "text-blue-700" },
  success: { label: "SUCCESS", bg: "bg-emerald-100",text: "text-emerald-700" },
};

export default function Notifications() {
  const { bellNotifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  const handleMarkAll = () => {
    const ids = bellNotifications.map(n => n._id);
    markAllAsRead(ids);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">All Notifications</h1>
            <p className="text-sm text-slate-500">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading…</p>}

      {!loading && bellNotifications.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">You're all caught up</p>
          <p className="text-sm mt-1">No unread notifications</p>
        </div>
      )}

      <div className="space-y-2">
        {bellNotifications.map(notif => {
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
          return (
            <div
              key={notif._id}
              className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex gap-4 hover:border-slate-300 transition-colors"
            >
              <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0 mt-0.5 ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{notif.title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">{timeAgo(notif.createdAt)}</p>
              </div>
              <button
                onClick={() => markAsRead(notif._id)}
                className="shrink-0 self-start text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors mt-1"
              >
                Dismiss
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export from appRoutes.jsx**

Add to `frontend/src/routes/appRoutes.jsx`:
```jsx
export const NotificationsPage = lazy(() => import('../pages/Notifications.jsx'))
```

- [ ] **Step 3: Add route in main.jsx**

Import:
```jsx
import { ..., NotificationsPage } from './routes/appRoutes'
```

Add route inside the `<ProtectedRoute>` > `<DashboardLayout>` section:
```jsx
<Route path="/notifications" element={<NotificationsPage />} />
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Notifications.jsx frontend/src/routes/appRoutes.jsx frontend/src/main.jsx
git commit -m "feat(notifications): add full notifications page and route"
```

---

## Self-Review

**Spec coverage check:**

| Spec Section | Covered By |
|---|---|
| Part 1 — DB model | Task 1 |
| Part 2 — 8 backend routes | Tasks 2–3 |
| Part 3 — NotificationContext + sessionStorage popup gate | Tasks 7, 9 |
| Part 4 — NotificationPopup design (overlay, animation, badges, footer) | Task 8 |
| Part 5 — Bell in all 3 navbars (Navbar, Admin, Manager) | Tasks 10–12 |
| Part 6 — Seed data (6 starter notifications) | Task 4 |
| Part 7 — Admin CRUD panel | Task 11 Part B |
| /notifications full page | Task 13 |

**Role mapping:** Spec says `technical_manager` — codebase uses `manager`. All tasks use `manager`. ✓

**Old notification model:** Not touched. Inspector controller still works. ✓

**No placeholders:** All code blocks are complete. ✓

**Type consistency:**
- `SystemNotification` model exported as `module.exports = mongoose.model("SystemNotification", ...)` — matches `require()` in controller ✓
- `ENDPOINTS.NOTIFICATIONS.MY` / `.MARK_READ` / `.MARK_ALL_READ` — matches fetch calls in context ✓
- `useNotifications()` returns `{ bellNotifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }` — matches all consumers ✓
- `markAllAsRead(ids: string[])` — called correctly everywhere ✓

**One gap:** The `NotificationPanel` component in `frontend/src/dashboards/admin/components/NotificationPanel.jsx` currently renders mock notifications. Task 11 instructs updating `handleMarkAllRead` to use context but doesn't explicitly say to pass `bellNotifications` to `NotificationPanel`. **Fix:** In Step 5 of Task 11, replace `notifications` prop to `NotificationPanel` with `bellNotifications` from context.
