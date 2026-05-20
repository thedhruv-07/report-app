# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A full-stack pre-shipment inspection (PSI) report generation platform for Absolute Veritas. Core value: inspectors fill multi-step forms → backend assembles pixel-perfect DOCX reports with photo galleries and AI-generated descriptions.

## Commands

```bash
# Development (from root)
npm run dev          # Backend only (nodemon, port 5000)
npm run dev:all      # Backend + frontend concurrently

# Frontend only (from frontend/)
npm run dev          # Vite dev server, port 5173
npm run build        # Build to frontend/dist
npm run lint         # ESLint

# Production
npm run build        # Install deps + build frontend
npm start            # Run backend in production
```

No test suite is configured.

## Architecture

### Stack
- **Backend:** Express 5 + MongoDB (Mongoose) + Socket.io
- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **AI:** Groq API (Llama 4 Scout) for text completion and photo analysis
- **Storage:** Wasabi S3-compatible cloud storage for photos; `backend/uploads/` for temp staging
- **Docs:** `docx` npm package builds `.docx` files directly (no LibreOffice conversion needed in dev)

### Backend structure
```
backend/
  server.js          # Entry: MongoDB connect → Express listen → Socket.io attach
  app.js             # Middleware stack, all route mounts
  config/config.js   # All env vars and path constants
  routes/            # auth, report, factoryAudit, inspector, manager, fileRoutes + routes/v2/
  controllers/       # Business logic (mirrors routes)
  models/            # Mongoose schemas
    report.model.js       # Top-level report document
    sections/             # GeneralInfo, Quantity, Workmanship, Inspection, Materials, Safety, Comments, Media, SectionStatus
  services/
    docx.service.js       # ~3000-line DOCX builder for PSI/DPI/CLS reports
    faDocx.service.js     # Factory Audit DOCX builder
    ai.service.js         # Groq integration: local memory cache → Groq fallback
    wasabiService.js      # S3 upload/signed-URL helpers
    email.service.js      # Nodemailer SMTP
  middleware/
    auth.middleware.js    # JWT verify + roleCheck() factory
    upload.middleware.js  # Multer config
  socket.js          # Socket.io room setup (clients join per-report rooms)
  data/memory.json   # Local AI remark cache (nodemon ignores this dir)
```

### Frontend structure
```
frontend/src/
  main.jsx           # App root: AuthProvider + RouterProvider
  context/AuthContext.jsx   # Global auth state (localStorage-backed, token + user)
  routes/            # React Router route definitions
  pages/             # DashboardHome, Settings, auth pages
  dashboards/
    admin/           # AdminDashboard
    inspector/       # InspectorDashboard
    manager/         # TechnicalManagerDashboard
  reports/
    PSI/             # Pre-Shipment Inspection form (multi-step)
    CLS/             # Container Loading Survey
    DPI/             # During Production Inspection
    FactoryAudit/    # Factory Audit form
    shared/          # Shared form utilities and components
  components/
    auth/            # ProtectedRoute, login/signup forms
    layout/          # DashboardLayout, navbar
    shared/          # Reusable UI
  hooks/             # Custom React hooks
  store/             # State management
```

### Auth & RBAC
- JWT (7-day expiry) + Google OAuth 2.0
- Roles: `admin`, `manager`, `inspector`, `operator`, `user`
- Backend: `roleCheck(['admin','manager'])` middleware on protected routes
- Frontend: `<ProtectedRoute allowedRoles={[...]}>`
- Token stored in localStorage, hydrated synchronously into AuthContext on page load

### Report lifecycle
1. Inspector fills multi-step form (PSI / DPI / CLS / FactoryAudit)
2. Submit → `POST /api/reports` or `/api/factory-audit`
3. Controller runs `enrichReportHeaderData()` to infer missing fields
4. Section documents created in MongoDB and linked to root `Report` doc
5. `docx.service.js` builds DOCX: header table with logo, merged-cell section tables, photo gallery with AI captions, status color coding (PASS=green, FAIL=red, PENDING=orange)
6. Binary DOCX returned to browser for download

### AI suggestion pipeline (`ai.service.js`)
1. Check `backend/data/memory.json` for cached remarks matching current context
2. If no match, call Groq (Llama 4 Scout) for professional inspection language
3. Auto-save new remarks to memory for future reuse

### Key non-obvious details
- Server timeout is 5 minutes (`server.setTimeout(300000)`) to handle large photo uploads + DOCX generation
- Request body limit is 50MB (photos are base64-encoded in request body)
- `backend/data/` and `backend/uploads/` are excluded from nodemon watching to prevent restart loops
- Vite frontend uses `import.meta.env.VITE_*` for all env vars
- There are two parallel route/model namespaces: original (`/api/reports`) and versioned (`/api/v2/reports`) — the v2 routes represent newer workflows
- CORS is manually set in `app.js` headers (not just the `cors` package) to support popup OAuth flows
- Docker build uses port 10000 (not 5000) for production deployment

## Environment Variables

Both `backend/` and root have `.env` files. Key vars:
```
PORT=5000
MONGO_URI=             # MongoDB Atlas connection string
JWT_SECRET=
GROQ_API_KEY=
GOOGLE_CLIENT_ID=
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
WASABI_ACCESS_KEY / WASABI_SECRET_KEY / WASABI_ENDPOINT
FRONTEND_URL=http://localhost:5173
```

Frontend (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=
```
