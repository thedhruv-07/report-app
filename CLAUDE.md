# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A full-stack inspection report platform for Absolute Veritas. Inspectors fill multi-step forms → backend assembles pixel-perfect DOCX reports with photo galleries and AI-generated descriptions. Also integrates with a separate **online booking system** (IRMS) that pre-fills report forms when an admin assigns an online booking to an inspector.

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
    bookings.js           # IRMS booking routes (POST /api/bookings, POST /api/bookings/:id/assign)
  controllers/       # Business logic (mirrors routes)
  models/            # Mongoose schemas
    report.model.js       # Top-level report document
    Booking.js            # IRMS booking (onlineBookingId, prefillData, assignedInspectorId, status, etc.)
    notification.model.js # Single notification collection for all user notifications
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
    admin/           # AdminDashboard (complete)
    inspector/       # InspectorDashboard (complete)
    manager/         # TechnicalManagerDashboard (complete)
  reports/
    PSI/             # Pre-Shipment Inspection — pre-fill enabled
    CLS/             # Container Loading Supervision — pre-fill enabled
    DPI/             # During Production Inspection
    FactoryAudit/    # Factory Audit — pre-fill enabled
    shared/          # Shared form utilities, SchemaSection renderer, formSchemas
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

### Report templates (all 5 built)
| Template | Route | Pre-fill | Form field storage |
|---|---|---|---|
| PSI | `/dashboard/pre-shipment` | ✅ | flat `form` state + localStorage (`inspectionForm`) |
| CLS | `/dashboard/container-loading` | ✅ | flat `form` state + localStorage (`clsForm`) |
| DPI | `/dashboard/during-production` | — | flat `form` state |
| Factory Audit | `/dashboard/factory-audit` | ✅ | flat `form` state + localStorage (`faForm`) |
| Social Audit | `/dashboard/social-audit` | — | flat `form` state |

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

### IRMS online booking integration

When an admin assigns an online booking to an inspector the platform fetches pre-fill data and stores it on the `Booking` document, then navigates the inspector directly into the correct report template with the data already populated.

**Flow:**
1. Admin creates a booking via `POST /api/bookings` — sets `onlineBookingId` if the booking originated from the online system
2. Admin assigns via `POST /api/bookings/:id/assign`:
   - Sets `assignedInspectorId`, `status = 'assigned'`
   - If `onlineBookingId` is set, calls `BOOKING_API_URL/api/bookings/:onlineBookingId/report-data` and stores the response as `booking.prefillData`
   - Creates a `Notification` record (`type: 'task_assigned'`) for the inspector
3. Inspector clicks **Start Report** → `InspectorDashboard` navigates to the report route with `{ state: { task } }` (React Router)
4. Report template reads `location.state?.task?.prefillData` and applies it on mount via `useEffect`
5. Blue dismissible banner shows at the top: _"Auto-filled from Online Booking — review all fields before submitting"_

**Pre-fill field mapping (prefillData shape → form field name):**
| prefillData path | PSI | CLS | Factory Audit |
|---|---|---|---|
| `client.name` | `client` | `client` | — |
| `factory.name` | `supplier` + `factory` | `supplier` + `factory` | `factory` |
| `factory.address/city/country` joined | `inspectionLocation` | `location` | `factoryAddress` |
| `inspectionDate` | `inspectionDate` | `inspectionDate` | `auditDate` |
| `product.description` | `productName` | `productName` | — |
| `product.quantity` | `orderQuantity` | `orderQuantity` | — |
| `aql.inspectionLevel` | `inspectionLevel` | — | — |
| `aql.sampleSize` | `sampleSize` | — | — |
| `aql.acceptPoint` | `acceptPoint` | — | — |
| `aql.rejectPoint` | `rejectPoint` | — | — |
| `contact.name` | — | — | `contactPerson` |
| `contact.email` | — | — | `email` |
| `contact.phone` | — | — | `phone` |

**Key integration detail:** `Booking.onlineBookingId` is the foreign key linking this repo to the online-booking repo. The online-booking API endpoint is `BOOKING_API_URL` (default: `http://localhost:3001`), configured in `backend/.env`.

### Notification model
A single `notification.model.js` collection handles all inspector notifications. Fields: `inspectorId`, `title` (optional), `message`, `type` (enum includes `task_assigned`), `isRead`, `relatedTaskId`, `relatedBookingId`, `timestamps`. **Do not create a second Notification model** — both task assignments and booking assignments write to this one collection so the inspector's bell queries a single source.

### Dashboards (all complete)
Build order for reference: Inspector → Technical Manager → Admin.
- **Inspector** (`/dashboard/inspector`): task list, accept/start report flow, notification bell
- **Technical Manager** (`/dashboard/manager`): review submitted reports, request corrections, finalize
- **Admin** (`/dashboard/admin`): booking queue, inspector assignment, system overview

### Key non-obvious details
- Server timeout is 5 minutes (`server.setTimeout(300000)`) to handle large photo uploads + DOCX generation
- Request body limit is 50MB (photos are base64-encoded in request body)
- `backend/data/` and `backend/uploads/` are excluded from nodemon watching to prevent restart loops
- Vite frontend uses `import.meta.env.VITE_*` for all env vars
- There are two parallel route/model namespaces: original (`/api/reports`) and versioned (`/api/v2/reports`) — the v2 routes represent newer workflows
- CORS is manually set in `app.js` headers (not just the `cors` package) to support popup OAuth flows
- Docker build uses port 10000 (not 5000) for production deployment
- CLS and Factory Audit use a schema-driven `SchemaSection` renderer — field names come from `frontend/src/shared/formSchemas.js` (`clsSchema`) and `frontend/src/shared/faSchema.js` (`faSchema`), not hardcoded JSX inputs

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
BOOKING_API_URL=http://localhost:3001   # Online booking system (IRMS) base URL
```

Frontend (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=
```
