# Inspection Notice — Section 18: Upload & Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the third round of Inspection Notice gaps vs. V-Trust MIS: real file upload + view-logged download for Section 18's Inspector/Auditor Uploads, and manual metadata-tracking tables for Inspector Report / Technical Manager Report, per `docs/superpowers/specs/2026-07-03-inspection-notice-upload-report-design.md`.

**Architecture:** Two new Express routes/controller handlers on the existing `InspectionNotice` resource (`uploadReportFile`, `logReportFileView`), reusing `wasabiService`, `upload.middleware.js`, and the `formatFileSize` helper already added to `inspectionNotice.controller.js` in the previous round. `ReportTab.jsx` gains `token`/`recordId` props (same pattern as `NoticeTab` got for Attachments) and a rebuilt Section 18: two upload tables (Inspector/Auditor) and two report-metadata tables (Inspector Report/TM Report) using one generic add/update/remove helper trio. No schema changes — `reportUploads.{inspectorUploads,auditorUploads,inspectorReports,tmReports}` already exist on the model.

**Tech Stack:** React 19, Tailwind CSS 4, lucide-react icons, Express 5 + Mongoose 9, existing `wasabiService` + `upload.middleware.js`.

**No automated test suite exists in this project** (per `CLAUDE.md`). Each task's verification step is: (1) a lint check via `npx eslint <file>` for frontend files or a `node -e "require(...)"` load check for backend files, and (2) an exact manual action to perform in the running app (`npm run dev:all` from repo root) with the expected observable result.

---

## Task 1: Backend — report-upload route (Inspector/Auditor Uploads)

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`
- Modify: `backend/routes/inspectionNotice.routes.js`

- [ ] **Step 1: Add the `uploadReportFile` handler**

Add at the end of `backend/controllers/inspectionNotice.controller.js` (after `exports.getRecentByFactory`):

```js
exports.uploadReportFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    if (!['inspector', 'auditor'].includes(type)) {
      return res.status(400).json({ error: "type must be 'inspector' or 'auditor'" });
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
      uploadTime: new Date(),
      uploadedBy: req.user.name,
      url,
    };

    const arrayField = type === 'inspector' ? 'inspectorUploads' : 'auditorUploads';
    notice.reportUploads[arrayField].push(entry);
    await notice.save();

    res.status(200).json({ notice });
  } catch (error) {
    console.error("Error uploading report file:", error);
    res.status(500).json({ error: "Failed to upload report file" });
  }
};
```

- [ ] **Step 2: Add the route**

Find in `backend/routes/inspectionNotice.routes.js`:

```js
router.delete("/:id/attachments/:fileId", roleCheck(["admin", "manager"]), inspectionNoticeController.deleteAttachment);

module.exports = router;
```

Replace with:

```js
router.delete("/:id/attachments/:fileId", roleCheck(["admin", "manager"]), inspectionNoticeController.deleteAttachment);
router.post("/:id/report-uploads", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadReportFile);

module.exports = router;
```

- [ ] **Step 3: Verify the controller and routes still load**

Run: `cd backend && node -e "require('dotenv').config({ path: '../.env' }); require('./routes/inspectionNotice.routes.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/routes/inspectionNotice.routes.js
git commit -m "feat: add report-uploads endpoint for Inspector/Auditor Uploads"
```

---

## Task 2: Backend — log-view route

**Files:**
- Modify: `backend/controllers/inspectionNotice.controller.js`
- Modify: `backend/routes/inspectionNotice.routes.js`

- [ ] **Step 1: Add the `logReportFileView` handler**

Add after `exports.uploadReportFile`:

```js
exports.logReportFileView = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const { type } = req.body;

    if (!['inspector', 'auditor'].includes(type)) {
      return res.status(400).json({ error: "type must be 'inspector' or 'auditor'" });
    }

    const notice = await InspectionNotice.findById(id);
    if (!notice) {
      return res.status(404).json({ error: "Inspection Notice not found" });
    }

    const arrayField = type === 'inspector' ? 'inspectorUploads' : 'auditorUploads';
    const entry = notice.reportUploads[arrayField].id(fileId);
    if (!entry) {
      return res.status(404).json({ error: "Uploaded file not found" });
    }

    entry.timeViewed = new Date();
    entry.viewedBy = req.user.name;
    await notice.save();

    res.status(200).json({ url: entry.url });
  } catch (error) {
    console.error("Error logging file view:", error);
    res.status(500).json({ error: "Failed to log file view" });
  }
};
```

- [ ] **Step 2: Add the route (no role restriction, matching `getNoticeById`)**

Find:

```js
router.post("/:id/report-uploads", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadReportFile);

module.exports = router;
```

Replace with:

```js
router.post("/:id/report-uploads", roleCheck(["admin", "manager"]), upload.single('file'), inspectionNoticeController.uploadReportFile);
router.post("/:id/report-uploads/:fileId/log-view", inspectionNoticeController.logReportFileView);

module.exports = router;
```

- [ ] **Step 3: Verify routes still load**

Run: `cd backend && node -e "require('dotenv').config({ path: '../.env' }); require('./routes/inspectionNotice.routes.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/inspectionNotice.controller.js backend/routes/inspectionNotice.routes.js
git commit -m "feat: add log-view endpoint for report-upload downloads"
```

---

## Task 3: Frontend — `ReportTab` gains `token`/`recordId` props

**Files:**
- Modify: `frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx`

- [ ] **Step 1: Pass the new props**

Find:

```jsx
          {activeTab === 'Report (Online)' && (
            <ReportTab
              formData={formData}
              updateSection={updateSection}
            />
          )}
```

Replace with:

```jsx
          {activeTab === 'Report (Online)' && (
            <ReportTab
              formData={formData}
              updateSection={updateSection}
              token={token}
              recordId={id}
            />
          )}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/pages/InspectionNoticeForm.jsx`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx
git commit -m "feat: pass token and recordId to ReportTab for Section 18 uploads"
```

---

## Task 4: Frontend — `ReportTab` shared helpers + upload/view handlers + `ReportUploadBox`

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Add the `ENDPOINTS` import and a local `ReportUploadBox` component**

Find:

```jsx
import React from 'react';
import SectionCard from './SectionCard';
import { Plus, X } from 'lucide-react';

export default function ReportTab({ formData, updateSection }) {
```

Replace with:

```jsx
import React from 'react';
import SectionCard from './SectionCard';
import { Plus, X, Download } from 'lucide-react';
import { ENDPOINTS } from '../../../../config/api';

const ReportUploadBox = ({ title, files, type, onUpload, onDownload, disabled, inputId }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
      <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">{title}</span>
      <div>
        <input id={inputId} type="file" className="hidden" disabled={disabled} onChange={e => onUpload(e, type)} />
        <label
          htmlFor={disabled ? undefined : inputId}
          title={disabled ? 'Save as draft first' : undefined}
          className={`px-3 py-1.5 border-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
            disabled ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#6C47FF] text-[#6C47FF] hover:bg-purple-50 cursor-pointer'
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Upload File
        </label>
      </div>
    </div>
    {files.length === 0 ? (
      <div className="p-8 text-center text-slate-400 text-sm bg-white">No files uploaded yet.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
              <th className="px-4 py-2">File Name</th>
              <th className="px-4 py-2">Size</th>
              <th className="px-4 py-2">Upload Time</th>
              <th className="px-4 py-2">Uploaded By</th>
              <th className="px-4 py-2">Time Viewed</th>
              <th className="px-4 py-2">Viewed By</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {files.map(f => (
              <tr key={f._id}>
                <td className="px-4 py-2">{f.fileName}</td>
                <td className="px-4 py-2 text-slate-500">{f.size}</td>
                <td className="px-4 py-2 text-slate-500">{f.uploadTime ? new Date(f.uploadTime).toLocaleString() : '—'}</td>
                <td className="px-4 py-2 text-slate-500">{f.uploadedBy || '—'}</td>
                <td className="px-4 py-2 text-slate-500">{f.timeViewed ? new Date(f.timeViewed).toLocaleString() : '—'}</td>
                <td className="px-4 py-2 text-slate-500">{f.viewedBy || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => onDownload(f._id, type)} className="text-[#6C47FF] hover:bg-purple-50 p-1 rounded" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function ReportTab({ formData, updateSection, token, recordId }) {
```

- [ ] **Step 2: Add the shared array helpers and the upload/view handlers**

Find:

```jsx
  const recapItem = (label, value) => (
```

Replace with:

```jsx
  const reportUploads = formData.reportUploads || { inspectorUploads: [], auditorUploads: [], inspectorReports: [], tmReports: [] };

  const addToSection = (section, arrayField, newItem) => {
    const current = formData[section]?.[arrayField] || [];
    updateSection(section, { [arrayField]: [...current, newItem] });
  };
  const updateInSection = (section, arrayField, idx, field, value) => {
    const current = [...(formData[section]?.[arrayField] || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateSection(section, { [arrayField]: current });
  };
  const removeFromSection = (section, arrayField, idx) => {
    updateSection(section, { [arrayField]: (formData[section]?.[arrayField] || []).filter((_, i) => i !== idx) });
  };

  const handleReportFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !recordId) return;
    const body = new FormData();
    body.append('file', file);
    body.append('type', type);
    try {
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/report-uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (res.ok) {
        const data = await res.json();
        updateSection('reportUploads', data.notice.reportUploads);
      }
    } catch (err) {
      console.error('Error uploading report file:', err);
    }
  };

  const handleReportFileDownload = async (fileId, type) => {
    if (!recordId) return;
    try {
      const res = await fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/report-uploads/${fileId}/log-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, '_blank', 'noopener,noreferrer');
        const arrayField = type === 'inspector' ? 'inspectorUploads' : 'auditorUploads';
        const current = [...(reportUploads[arrayField] || [])];
        const idx = current.findIndex(f => f._id === fileId);
        if (idx !== -1) {
          current[idx] = { ...current[idx], timeViewed: new Date().toISOString(), viewedBy: 'You' };
          updateSection('reportUploads', { [arrayField]: current });
        }
      }
    } catch (err) {
      console.error('Error logging file view:', err);
    }
  };

  const recapItem = (label, value) => (
```

**Note on Step 2:** the `viewedBy: 'You'` optimistic patch is a placeholder label only until the next full reload re-fetches the notice from the server (which returns the real `req.user.name` value saved by the backend) — it avoids a second round-trip just to refresh the row, at the cost of showing "You" instead of the real name until reload. This matches the existing codebase's pattern of optimistic local updates after a save (see `updateSection` usage elsewhere in this file).

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output (some unused-var warnings possible until Task 5 wires the JSX in — that's fine, they'll clear then).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: add report-upload helpers and ReportUploadBox to ReportTab"
```

---

## Task 5: Frontend — rebuild Section 18 markup (Uploads + Report tables)

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Replace the Section 18 body**

Find:

```jsx
      {/* SECTION 18: Upload & Report */}
      <SectionCard title="SECTION 18: Upload & Report">
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Inspector Uploads</div>
            <div className="p-8 text-center text-slate-400 text-sm bg-white">
              No files uploaded yet.
              <div className="mt-4">
                <button className="text-[#6C47FF] hover:bg-purple-50 px-4 py-2 border-2 border-[#6C47FF] rounded-lg text-sm font-bold inline-flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Upload File
                </button>
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Online Report (Inspector)</div>
            <div className="p-8 text-center text-slate-400 text-sm bg-white">
              No report generated yet.
              <div className="mt-4">
                <button className="bg-[#6C47FF] hover:bg-purple-700 text-white shadow-sm px-4 py-2 rounded-lg text-sm font-bold inline-flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Create Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

    </div>
  );
}
```

Replace with:

```jsx
      {/* SECTION 18: Upload & Report */}
      <SectionCard title="SECTION 18: Upload & Report">
        <div className="space-y-6">
          <ReportUploadBox
            title="Inspector Uploads"
            files={reportUploads.inspectorUploads || []}
            type="inspector"
            onUpload={handleReportFileUpload}
            onDownload={handleReportFileDownload}
            disabled={!recordId}
            inputId="report-upload-inspector"
          />
          <ReportUploadBox
            title="Auditor Uploads"
            files={reportUploads.auditorUploads || []}
            type="auditor"
            onUpload={handleReportFileUpload}
            onDownload={handleReportFileDownload}
            disabled={!recordId}
            inputId="report-upload-auditor"
          />

          {[
            { key: 'inspectorReports', label: 'Online Report (Inspector)', prefix: 'IR' },
            { key: 'tmReports', label: 'Online Report (Technical Manager)', prefix: 'TMR' },
          ].map(({ key, label, prefix }) => {
            const rows = reportUploads[key] || [];
            return (
              <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">{label}</span>
                  <button
                    onClick={() => addToSection('reportUploads', key, { reportNo: `${prefix}-${Date.now()}`, creationDate: new Date().toISOString(), finishDate: '', confirmationTime: '', url: '' })}
                    className="bg-[#6C47FF] hover:bg-purple-700 text-white shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Report
                  </button>
                </div>
                {rows.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm bg-white">No report generated yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                          <th className="px-4 py-2">Report No.</th>
                          <th className="px-4 py-2">Creation Date</th>
                          <th className="px-4 py-2">Finish Date</th>
                          <th className="px-4 py-2">Confirmation Time</th>
                          <th className="px-4 py-2">URL</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((r, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium text-slate-700">{r.reportNo}</td>
                            <td className="px-4 py-2 text-slate-500">{r.creationDate ? new Date(r.creationDate).toLocaleString() : '—'}</td>
                            <td className="px-4 py-2"><input type="date" className={inputClass} value={r.finishDate ? r.finishDate.split('T')[0] : ''} onChange={e => updateInSection('reportUploads', key, idx, 'finishDate', e.target.value)} /></td>
                            <td className="px-4 py-2"><input className={inputClass} value={r.confirmationTime || ''} onChange={e => updateInSection('reportUploads', key, idx, 'confirmationTime', e.target.value)} /></td>
                            <td className="px-4 py-2"><input className={inputClass} value={r.url || ''} onChange={e => updateInSection('reportUploads', key, idx, 'url', e.target.value)} /></td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => removeFromSection('reportUploads', key, idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

    </div>
  );
}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Run `npm run dev:all`, open an *existing, saved* Inspection Notice, go to Report (Online) tab, Section 18. Upload a file to Inspector Uploads and one to Auditor Uploads — both list with uploader name and time. Click the Download icon on each — a new tab opens with the file and a Time Viewed / Viewed By pair appears in the row. Click "Create Report" under both Inspector Report and TM Report — a row appears with an auto-generated report number and creation date. Fill in Finish Date, Confirmation Time, and URL by hand for one row, remove another row with the ✕. Save, reload, confirm everything persisted exactly. Open a brand-new unsaved notice and confirm both Upload File buttons are disabled with a "Save as draft first" tooltip.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: build Section 18 Upload & Report UI (uploads + report metadata tables)"
```

---

## Task 6: Full round-trip verification

**Files:** none (verification only)

- [ ] **Step 1: Start the app**

Run: `npm run dev:all` from the repo root.

- [ ] **Step 2: Full walkthrough**

Log in as admin. Open an existing Inspection Notice, go to Report (Online) tab, Section 18. Upload one file as Inspector Upload and one as Auditor Upload, confirm both list with correct uploader/time. Download both and confirm Time Viewed/Viewed By populate after the click and the file actually opens. Create one Inspector Report row and one TM Report row, fill in Finish Date/Confirmation Time/URL, remove one of the two rows. Save, reload the page, confirm every value from this walkthrough persisted exactly as entered.

- [ ] **Step 3: Fix anything surfaced**

If Step 2 surfaces any bugs, fix them in the relevant file from the task above, re-verify, and commit with a `fix:` prefixed message describing exactly what was wrong.
