# Inspection Notice — Attachments, Recent Records & Reading Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the second round of Inspection Notice gaps vs. V-Trust MIS: real file upload/download for Attachments (Section 9), an auto-populated Recent Inspection Records list (Section 15), and Reading Records tracking (Section 16), per `docs/superpowers/specs/2026-07-03-inspection-notice-attachments-records-design.md`.

**Architecture:** Three new Express routes/controller handlers on the existing `InspectionNotice` resource (`uploadAttachment`, `deleteAttachment`, `getRecentByFactory`), one behavioral change to the existing `getNoticeById` handler (logs a reading record on every fetch), and `NoticeTab.jsx` UI updates for Sections 9/15/16. `InspectionNoticeForm.jsx` gains two new props passed to `NoticeTab`: `token` and `recordId`. No schema changes — `attachments`, `recentRecords` (unused going forward — replaced by a live query), and `readingRecords` already exist on the Mongoose model.

**Tech Stack:** React 19, Tailwind CSS 4, lucide-react icons, Express 5 + Mongoose 9, existing `wasabiService` (S3-compatible Wasabi storage) and `upload.middleware.js` (multer memory storage).

**No automated test suite exists in this project** (per `CLAUDE.md`). Each task's verification step is: (1) a lint check via `npx eslint <file>` for frontend files or a `node -e "require(...)"` load check for backend files, and (2) an exact manual action to perform in the running app (`npm run dev:all` from repo root) with the expected observable result.

---

## Task 1: Backend — file-size formatter + Attachments upload route

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`
- Modify: `backend/routes/inspectionNotice.routes.js`

- [ ] **Step 1: Add the `wasabiService` import and size formatter at the top of the controller**

Find:

```js
const InspectionNotice = require("../models/InspectionNotice");
const { provisionFromNotice } = require("../services/noticeToBooking.service");
const { generateClientCode } = require("../utils/clientCode");
```

Replace with:

```js
const InspectionNotice = require("../models/InspectionNotice");
const { provisionFromNotice } = require("../services/noticeToBooking.service");
const { generateClientCode } = require("../utils/clientCode");
const wasabiService = require("../services/wasabiService");

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 2: Add the `uploadAttachment` handler**

Add at the end of `backend/controllers/inspectionNotice.controller.js` (after `exports.updateStatus`):

```js
exports.uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['client', 'supplier'].includes(type)) {
      return res.status(400).json({ error: "type must be 'client' or 'supplier'" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const { url } = await wasabiService.uploadFile(req.file);
    const entry = {
      fileName: req.file.originalname,
      size: formatFileSize(req.file.size),
      uploadDate: new Date(),
      url,
    };

    const arrayField = type === 'client' ? 'clientFiles' : 'supplierFiles';
    notice.attachments[arrayField].push(entry);
    await notice.save();

    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
};
```

- [ ] **Step 3: Add the route**

Find in `backend/routes/inspectionNotice.routes.js`:

```js
const express = require("express");
const router = express.Router();
const inspectionNoticeController = require("../controllers/inspectionNotice.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
```

Replace with:

```js
const express = require("express");
const router = express.Router();
const inspectionNoticeController = require("../controllers/inspectionNotice.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
```

Then find:

```js
router.patch("/:id/status", roleCheck(["admin", "manager"]), inspectionNoticeController.updateStatus);

module.exports = router;
```

Replace with:

```js
router.patch("/:id/status", roleCheck(["admin", "manager"]), inspectionNoticeController.updateStatus);
router.post("/:id/attachments", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadAttachment);

module.exports = router;
```

- [ ] **Step 4: Verify the controller and routes still load**

Run: `cd backend && node -e "require('./routes/inspectionNotice.routes.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/routes/inspectionNotice.routes.js
git commit -m "feat: add attachment upload endpoint to Inspection Notice API"
```

---

## Task 2: Backend — Attachments delete route

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`
- Modify: `backend/routes/inspectionNotice.routes.js`

- [ ] **Step 1: Add the `deleteAttachment` handler**

Add after `exports.uploadAttachment` in `backend/controllers/inspectionNotice.controller.js`:

```js
exports.deleteAttachment = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const { type } = req.query;

    if (!['client', 'supplier'].includes(type)) {
      return res.status(400).json({ error: "type must be 'client' or 'supplier'" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const arrayField = type === 'client' ? 'clientFiles' : 'supplierFiles';
    const entry = notice.attachments[arrayField].id(fileId);
    if (!entry) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    await wasabiService.deleteFile(wasabiService.extractKey(entry.url));
    notice.attachments[arrayField].pull(fileId);
    await notice.save();

    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};
```

- [ ] **Step 2: Add the route**

Find:

```js
router.post("/:id/attachments", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadAttachment);

module.exports = router;
```

Replace with:

```js
router.post("/:id/attachments", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadAttachment);
router.delete("/:id/attachments/:fileId", roleCheck(["admin", "manager"]), inspectionNoticeController.deleteAttachment);

module.exports = router;
```

- [ ] **Step 3: Verify routes still load**

Run: `cd backend && node -e "require('./routes/inspectionNotice.routes.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/routes/inspectionNotice.routes.js
git commit -m "feat: add attachment delete endpoint to Inspection Notice API"
```

---

## Task 3: Backend — Recent Inspection Records endpoint

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`
- Modify: `backend/routes/inspectionNotice.routes.js`

- [ ] **Step 1: Add the `getRecentByFactory` handler**

Add after `exports.deleteAttachment`:

```js
exports.getRecentByFactory = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await InspectionNotice.findById(id).lean();
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const factoryName = (notice.factoryInfo?.factoryName || '').trim();
    if (!factoryName) {
      return res.status(200).json({ records: [] });
    }

    const escaped = factoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('^' + escaped + '$', 'i');

    const others = await InspectionNotice.find({
      _id: { $ne: id },
      'factoryInfo.factoryName': pattern,
    })
      .sort({ 'basicInfo.inspectionDateFrom': -1 })
      .limit(5)
      .lean();

    const records = others.map(n => ({
      inspectionDate: n.basicInfo?.inspectionDateFrom || null,
      inspectorName: n.teamAssignment?.inspectors?.[0]?.name || '—',
      noticeId: n.noticeId,
    }));

    res.status(200).json({ records });
  } catch (error) {
    console.error("Error fetching recent records:", error);
    res.status(500).json({ error: "Failed to fetch recent records" });
  }
};
```

- [ ] **Step 2: Add the route (no role restriction, matching `getNoticeById`)**

Find:

```js
router.get("/:id", inspectionNoticeController.getNoticeById);
```

Replace with:

```js
router.get("/:id", inspectionNoticeController.getNoticeById);
router.get("/:id/recent-by-factory", inspectionNoticeController.getRecentByFactory);
```

- [ ] **Step 3: Verify routes still load**

Run: `cd backend && node -e "require('./routes/inspectionNotice.routes.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/routes/inspectionNotice.routes.js
git commit -m "feat: add recent-by-factory endpoint to Inspection Notice API"
```

---

## Task 4: Backend — Reading Records on notice fetch

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js:78-90` (the `getNoticeById` handler)

- [ ] **Step 1: Replace `getNoticeById`**

Find:

```js
exports.getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await InspectionNotice.findById(id).lean();
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }
    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error fetching notice:", error);
    res.status(500).json({ error: "Failed to fetch Inspection Notice" });
  }
};
```

Replace with:

```js
exports.getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }
    notice.readingRecords.push({ inspectorName: req.user.name, timeViewed: new Date() });
    await notice.save();
    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error fetching notice:", error);
    res.status(500).json({ error: "Failed to fetch Inspection Notice" });
  }
};
```

- [ ] **Step 2: Verify the controller still loads**

Run: `cd backend && node -e "require('./controllers/inspectionNotice.controller.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js
git commit -m "feat: log a reading record every time an Inspection Notice detail page is opened"
```

---

## Task 5: Frontend — pass `token` and `recordId` props from the form page to `NoticeTab`

**Files:**
- Modify: `frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx`

- [ ] **Step 1: Pass the new props**

Find:

```jsx
          {activeTab === 'Notice' && (
            <NoticeTab 
              formData={formData} 
              updateSection={updateSection}
              updateRootField={updateRootField}
              inspectorOptions={inspectorOptions}
            />
          )}
```

Replace with:

```jsx
          {activeTab === 'Notice' && (
            <NoticeTab 
              formData={formData} 
              updateSection={updateSection}
              updateRootField={updateRootField}
              inspectorOptions={inspectorOptions}
              token={token}
              recordId={id}
            />
          )}
```

`id` here is the route param from `useParams()` at the top of this file — it's the Mongo `_id` (the URL is `/admin/inspection-notices/:id`, and `handleSave` navigates to `/admin/inspection-notices/${data.notice._id}` after creation), which is exactly the `recordId` the spec calls for.

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/pages/InspectionNoticeForm.jsx`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx
git commit -m "feat: pass token and recordId to NoticeTab for attachments/records features"
```

---

## Task 6: Frontend — NoticeTab Section 9 Attachments UI

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add the `ENDPOINTS` import and a local `AttachmentBox` component**

Find:

```js
import SectionCard from './SectionCard';
import { Plus, X, ExternalLink, Calculator, Download } from 'lucide-react';
import { calculateAQL } from '../../../../utils/aqlCalculator';

const openFactoryAddressOnMap = (address) => {
```

Replace with:

```js
import SectionCard from './SectionCard';
import { Plus, X, ExternalLink, Calculator, Download } from 'lucide-react';
import { calculateAQL } from '../../../../utils/aqlCalculator';
import { ENDPOINTS } from '../../../../config/api';

const AttachmentBox = ({ title, files, type, onUpload, onDelete, disabled, inputId }) => (
  <div className="border border-slate-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
      <div>
        <input id={inputId} type="file" className="hidden" disabled={disabled} onChange={e => onUpload(e, type)} />
        <label
          htmlFor={disabled ? undefined : inputId}
          title={disabled ? 'Save as draft first' : undefined}
          className={`px-4 py-2 border rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
            disabled ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#6C47FF] text-[#6C47FF] hover:bg-purple-50 cursor-pointer'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Upload File
        </label>
      </div>
    </div>
    {files.length === 0 ? (
      <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
        <p>No {title.toLowerCase()} uploaded.</p>
      </div>
    ) : (
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {files.map(f => (
          <div key={f._id} className="flex items-center justify-between px-3 py-2 text-sm gap-2">
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-[#6C47FF] hover:underline truncate">{f.fileName}</a>
            <span className="text-slate-400 text-xs shrink-0">{f.size}</span>
            <button onClick={() => onDelete(f._id, type)} className="text-rose-500 hover:bg-rose-50 p-1 rounded shrink-0"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const openFactoryAddressOnMap = (address) => {
```

- [ ] **Step 2: Accept the new `token` and `recordId` props, and destructure `attachments`**

Find:

```js
export default function NoticeTab({ formData, updateSection, updateRootField, inspectorOptions = [] }) {
  const basicInfo = formData.basicInfo || {};
```

Replace with:

```js
export default function NoticeTab({ formData, updateSection, updateRootField, inspectorOptions = [], token, recordId }) {
  const basicInfo = formData.basicInfo || {};
  const attachments = formData.attachments || { clientFiles: [], supplierFiles: [] };
```

- [ ] **Step 3: Add the upload/delete handlers**

Find:

```js
  const downloadOnSiteTestsCSV = () => {
```

Replace with:

```js
  const handleAttachmentUpload = async (e, type) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !recordId) return;
    const body = new FormData();
    body.append('file', file);
    body.append('type', type);
    try {
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (res.ok) {
        const data = await res.json();
        updateSection('attachments', data.notice.attachments);
      }
    } catch (err) {
      console.error('Error uploading attachment:', err);
    }
  };

  const handleAttachmentDelete = async (fileId, type) => {
    if (!recordId) return;
    try {
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/attachments/${fileId}?type=${type}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        updateSection('attachments', data.notice.attachments);
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const downloadOnSiteTestsCSV = () => {
```

- [ ] **Step 4: Replace the Section 9 markup**

Find:

```jsx
      {/* SECTION 9: Attachments */}
      <SectionCard title="SECTION 9: Attachments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Client Files</h4>
            <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              <p>No client files uploaded.</p>
              <button className="mt-3 px-4 py-2 border border-[#6C47FF] text-[#6C47FF] rounded-lg text-xs font-bold hover:bg-purple-50">Upload File</button>
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-4">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Supplier Files</h4>
            <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
              <p>No supplier files uploaded.</p>
              <button className="mt-3 px-4 py-2 border border-[#6C47FF] text-[#6C47FF] rounded-lg text-xs font-bold hover:bg-purple-50">Upload File</button>
            </div>
          </div>
        </div>
      </SectionCard>
```

Replace with:

```jsx
      {/* SECTION 9: Attachments */}
      <SectionCard title="SECTION 9: Attachments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AttachmentBox
            title="Client Files"
            files={attachments.clientFiles || []}
            type="client"
            onUpload={handleAttachmentUpload}
            onDelete={handleAttachmentDelete}
            disabled={!recordId}
            inputId="attachment-upload-client"
          />
          <AttachmentBox
            title="Supplier Files"
            files={attachments.supplierFiles || []}
            type="supplier"
            onUpload={handleAttachmentUpload}
            onDelete={handleAttachmentDelete}
            disabled={!recordId}
            inputId="attachment-upload-supplier"
          />
        </div>
      </SectionCard>
```

- [ ] **Step 5: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 6: Manual verification**

Run `npm run dev:all`, open an *existing, saved* Inspection Notice (one with a real `_id` in the URL), go to Section 9. Upload a file under Client Files — it should appear in the list with name/size and a working download link. Click the ✕ to delete it — it disappears. Repeat for Supplier Files. Then open a brand-new (unsaved) notice and confirm the Upload File buttons are visibly disabled with a "Save as draft first" tooltip.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: wire up real file upload/download for Attachments in Notice tab"
```

---

## Task 7: Frontend — NoticeTab Section 15 Recent Inspection Records UI

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Import `useState` alongside the existing `useEffect` import**

Find:

```js
import React, { useEffect } from 'react';
```

Replace with:

```js
import React, { useEffect, useState } from 'react';
```

- [ ] **Step 2: Add local state and the fetch effect**

Find (the second `useEffect`, the AQL auto-calc one — add right after it, still before the array helpers):

```js
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.productInfo?.totalQuantity, aql.samplingLevel, aql.inspectionStandard?.critical, aql.inspectionStandard?.major, aql.inspectionStandard?.minor]);

  // Recent Inspection Records: derived, read-only, fetched fresh whenever the factory name settles
  const [recentFactoryRecords, setRecentFactoryRecords] = useState([]);
  useEffect(() => {
    if (!recordId || !factoryInfo.factoryName) {
      setRecentFactoryRecords([]);
      return;
    }
    fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/recent-by-factory`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRecentFactoryRecords(data.records || []))
      .catch(() => setRecentFactoryRecords([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, factoryInfo.factoryName, token]);

  // Helpers to safely update arrays.
```

- [ ] **Step 3: Replace the Section 15 markup**

Find:

```jsx
      {/* SECTION 15: Recent Inspection Records */}
      <SectionCard title="SECTION 15: Recent Inspection Records">
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
          No recent inspection records available for this factory.
        </div>
      </SectionCard>
```

Replace with:

```jsx
      {/* SECTION 15: Recent Inspection Records */}
      <SectionCard title="SECTION 15: Recent Inspection Records">
        {recentFactoryRecords.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Inspection Date</th>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Notice ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFactoryRecords.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">{r.inspectionDate ? new Date(r.inspectionDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{r.inspectorName}</td>
                    <td className="px-4 py-3 text-slate-500">{r.noticeId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
            No recent inspection records available for this factory.
          </div>
        )}
      </SectionCard>
```

- [ ] **Step 4: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 5: Manual verification**

Open two different Inspection Notices and give both the exact same Factory Name in Section 14 (save both). Reopen one of them, go to Section 15 — the other notice should appear in the table with its inspection date and first inspector's name. Clear the factory name on one, save, reopen — the table should revert to the "no records" message.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: auto-populate Recent Inspection Records by factory name"
```

---

## Task 8: Frontend — NoticeTab Section 16 Reading Records UI

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Replace the Section 16 markup**

Find:

```jsx
      {/* SECTION 16: Instructional Letters Reading Record */}
      <SectionCard title="SECTION 16: Instructional Letters Reading Record">
        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
          No reading records logged yet.
        </div>
      </SectionCard>
```

Replace with:

```jsx
      {/* SECTION 16: Instructional Letters Reading Record */}
      <SectionCard title="SECTION 16: Instructional Letters Reading Record">
        {(formData.readingRecords || []).length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Viewed By</th>
                  <th className="px-4 py-3">Time Viewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.readingRecords.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">{r.inspectorName || '—'}</td>
                    <td className="px-4 py-3">{r.timeViewed ? new Date(r.timeViewed).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
            No reading records logged yet.
          </div>
        )}
      </SectionCard>
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Open an existing Inspection Notice, go to Section 16 — one entry should already be there (from this page load, since `getNoticeById` now logs on every fetch) showing your name and a fresh timestamp. Close the page and reopen it — a second entry appears with a later timestamp. Confirm the list endpoint (`/admin/inspection-notices` list page) does NOT add entries — only opening the individual detail page does.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: render Reading Records list in Notice tab Section 16"
```

---

## Task 9: Full round-trip verification

**Files:** none (verification only)

- [ ] **Step 1: Start the app**

Run: `npm run dev:all` from the repo root.

- [ ] **Step 2: Full walkthrough**

Log in as admin. Open an existing Inspection Notice (must already have a saved `_id`). Section 9: upload one file to Client Files and one to Supplier Files, confirm both download links work, delete one of them and confirm it disappears. Section 15: set the same Factory Name as another existing notice, save, reload, confirm the other notice shows up in the Recent Records table. Section 16: confirm a reading record was logged for this page-open with your name and current timestamp; reload and confirm a second entry appears.

- [ ] **Step 3: Fix anything surfaced**

If Step 2 surfaces any bugs, fix them in the relevant file from the task above, re-verify, and commit with a `fix:` prefixed message describing exactly what was wrong.
