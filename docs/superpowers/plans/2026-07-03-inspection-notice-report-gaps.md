# Inspection Notice — Report Tab & Status Table Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the Report-tab and status-table gaps identified between our Inspection Notice feature and the V-Trust MIS reference, per `docs/superpowers/specs/2026-07-03-inspection-notice-report-gaps-design.md`.

**Architecture:** Almost entirely frontend work in two existing components (`NoticeTab.jsx`, `ReportTab.jsx`), reusing the established `updateSection`/`updateRootField`/array-table patterns already in this codebase. One schema field (`otherContactPersons`) is added to `backend/models/InspectionNotice.js`; the existing `PUT /api/inspection-notices/:id` route already persists arbitrary nested fields via `$set: req.body`, so no other backend changes are needed.

**Tech Stack:** React 19, Tailwind CSS 4, lucide-react icons, Express 5 + Mongoose (backend schema only).

**No automated test suite exists in this project** (per `CLAUDE.md`). In place of write-test/run-test steps, each task's verification step is: (1) a lint check via `npx eslint <file>`, and (2) an exact manual action to perform in the running app (`npm run dev:all` from repo root) with the expected observable result. Do not skip the manual verification step — lint only catches syntax errors, not behavior.

---

## Task 1: Add `otherContactPersons` to the InspectionNotice schema

**Files:**
- Modify: `backend/models/InspectionNotice.js:161-178` (the `factoryInfo` block)

- [ ] **Step 1: Add the field**

Find this block:

```js
  // SECTION 14: Factory Information
  factoryInfo: {
    factoryName: String,
    englishName: String,
    address: String,
    mainContactPerson: String,
    phone: String,
```

Change it to:

```js
  // SECTION 14: Factory Information
  factoryInfo: {
    factoryName: String,
    englishName: String,
    address: String,
    mainContactPerson: String,
    otherContactPersons: String,
    phone: String,
```

- [ ] **Step 2: Verify the model still loads**

Run: `cd backend && node -e "require('./models/InspectionNotice.js'); console.log('OK');"`
Expected: `OK` with no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/models/InspectionNotice.js
git commit -m "feat: add otherContactPersons field to InspectionNotice factory info"
```

---

## Task 2: Add `otherContactPersons` to the frontend default form state

**Files:**
- Modify: `frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx` (the `factoryInfo` block inside the `useState` initializer, currently around line 109-126)

- [ ] **Step 1: Add the default value**

Find this block:

```js
    factoryInfo: {
      factoryName: '',
      englishName: '',
      address: '',
      mainContactPerson: '',
      phone: '',
```

Change it to:

```js
    factoryInfo: {
      factoryName: '',
      englishName: '',
      address: '',
      mainContactPerson: '',
      otherContactPersons: '',
      phone: '',
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/pages/InspectionNoticeForm.jsx`
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx
git commit -m "feat: default otherContactPersons in inspection notice form state"
```

---

## Task 3: Factory Info — "Other Contact Persons" field + copy-address/map link

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add a small clipboard-copy helper near the top of the component**

Find the `TableRow` component definition near the top of the file (right after the imports), and add a new helper function right after it, before `export default function NoticeTab(...)`:

```js
const openFactoryAddressOnMap = (address) => {
  if (!address) return;
  navigator.clipboard?.writeText(address).catch(() => {});
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

- [ ] **Step 2: Update the Section 14 Factory Information block**

Find this block (Section 14, Address and Main Contact Person rows):

```js
          <TableRow label="Address"><input className={inputClass} value={factoryInfo.address || ''} onChange={e => updateSection('factoryInfo', { address: e.target.value })} /></TableRow>
          <TableRow label="Main Contact Person"><input className={inputClass} value={factoryInfo.mainContactPerson || ''} onChange={e => updateSection('factoryInfo', { mainContactPerson: e.target.value })} /></TableRow>
```

Replace it with:

```js
          <TableRow label="Address">
            <div className="flex gap-2">
              <input className={inputClass} value={factoryInfo.address || ''} onChange={e => updateSection('factoryInfo', { address: e.target.value })} />
              <button
                type="button"
                onClick={() => openFactoryAddressOnMap(factoryInfo.address)}
                title="Copy address and open in Google Maps"
                className="px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-200 shrink-0 flex items-center"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </TableRow>
          <TableRow label="Main Contact Person"><input className={inputClass} value={factoryInfo.mainContactPerson || ''} onChange={e => updateSection('factoryInfo', { mainContactPerson: e.target.value })} /></TableRow>
          <TableRow label="Other Contact Persons"><input className={inputClass} value={factoryInfo.otherContactPersons || ''} onChange={e => updateSection('factoryInfo', { otherContactPersons: e.target.value })} /></TableRow>
```

Note: `ExternalLink` is already imported at the top of this file (`import { Plus, X, ExternalLink, Calculator } from 'lucide-react';`) — it was imported but unused until now.

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output (clean — this also confirms `ExternalLink` is no longer an unused import, if it was flagged before).

- [ ] **Step 4: Manual verification**

Run `npm run dev:all` from the repo root, log in as admin, open any Inspection Notice, scroll to Section 14 Factory Information. Type an address, click the map icon next to it — a new browser tab should open to a Google Maps search for that address, and the address text should be copied to your clipboard (paste anywhere to confirm). Type something into the new "Other Contact Persons" field, click "Save Draft", reload the page, and confirm the value persisted.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: add Other Contact Persons field and address map link to Factory Info"
```

---

## Task 4: Factory Abnormal Status table

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add the table after the Factory Information TableRow block**

Find the closing of the Section 14 `SectionCard` (the end of the Factory Information section):

```js
          <TableRow label="Inspection Notes"><textarea className={inputClass} rows={2} value={factoryInfo.inspectionNotes || ''} onChange={e => updateSection('factoryInfo', { inspectionNotes: e.target.value })} /></TableRow>
        </div>
      </SectionCard>
```

Replace it with (adds the abnormal-status table inside the same card, after the closing `</div>` of the table-row block):

```js
          <TableRow label="Inspection Notes"><textarea className={inputClass} rows={2} value={factoryInfo.inspectionNotes || ''} onChange={e => updateSection('factoryInfo', { inspectionNotes: e.target.value })} /></TableRow>
        </div>

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Factory Abnormal Status</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Content</th>
                  <th className="px-4 py-2 w-48">Label</th>
                  <th className="px-4 py-2 w-32">Submit Date</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(factoryInfo.abnormalStatusEntries || []).map((entry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.content || ''} onChange={e => updateArrayItem('factoryInfo', 'abnormalStatusEntries', idx, 'content', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.label || ''} onChange={e => updateArrayItem('factoryInfo', 'abnormalStatusEntries', idx, 'label', e.target.value)} /></td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{entry.submitDate ? new Date(entry.submitDate).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('factoryInfo', 'abnormalStatusEntries', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {(factoryInfo.abnormalStatusEntries || []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={() => addArrayItem('factoryInfo', 'abnormalStatusEntries', { content: '', label: '', submitDate: new Date().toISOString() })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> I Provide Factory Abnormal Status
            </button>
          </div>
        </div>
      </SectionCard>
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

In the running app, open Section 14, click "I Provide Factory Abnormal Status" — a new row appears with today's date already filled in the Submit Date column. Type content/label, click the X to remove a row, save the notice, reload, and confirm the remaining rows persisted with the same submit dates.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: add Factory Abnormal Status table to Notice tab"
```

---

## Task 5: Supplier Status Feedback table

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add the table to Section 13 (Supplier Information)**

Find:

```js
      {/* SECTION 13: Supplier Information */}
      <SectionCard title="SECTION 13: Supplier Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Supplier Name"><input className={inputClass} value={supplierInfo.supplierName || ''} onChange={e => updateSection('supplierInfo', { supplierName: e.target.value })} /></TableRow>
          <TableRow label="English Name"><input className={inputClass} value={supplierInfo.englishName || ''} onChange={e => updateSection('supplierInfo', { englishName: e.target.value })} /></TableRow>
        </div>
      </SectionCard>
```

Replace it with:

```js
      {/* SECTION 13: Supplier Information */}
      <SectionCard title="SECTION 13: Supplier Information">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <TableRow label="Supplier Name"><input className={inputClass} value={supplierInfo.supplierName || ''} onChange={e => updateSection('supplierInfo', { supplierName: e.target.value })} /></TableRow>
          <TableRow label="English Name"><input className={inputClass} value={supplierInfo.englishName || ''} onChange={e => updateSection('supplierInfo', { englishName: e.target.value })} /></TableRow>
        </div>

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Supplier Status Feedback</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Content</th>
                  <th className="px-4 py-2 w-48">Label</th>
                  <th className="px-4 py-2 w-32">Submit Date</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(supplierInfo.statusEntries || []).map((entry, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.content || ''} onChange={e => updateArrayItem('supplierInfo', 'statusEntries', idx, 'content', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={entry.label || ''} onChange={e => updateArrayItem('supplierInfo', 'statusEntries', idx, 'label', e.target.value)} /></td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{entry.submitDate ? new Date(entry.submitDate).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeArrayItem('supplierInfo', 'statusEntries', idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {(supplierInfo.statusEntries || []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-sm">No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={() => addArrayItem('supplierInfo', 'statusEntries', { content: '', label: '', submitDate: new Date().toISOString() })}
              className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Fill In Feedback
            </button>
          </div>
        </div>
      </SectionCard>
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Same pattern as Task 4 — add/remove rows in Section 13, save, reload, confirm persistence.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: add Supplier Status Feedback table to Notice tab"
```

---

## Task 6: "Information Complete" badge on Section 8

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Replace the Section 8 badge prop**

Find:

```js
      {/* SECTION 8: Inspection Information */}
      <SectionCard title="SECTION 8: Inspection Information" badge={!inspectionInfo.technicalManagerReviewed ? <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">⚠ Not Examined by Technical Manager</span> : null}>
```

Replace it with:

```js
      {/* SECTION 8: Inspection Information */}
      <SectionCard title="SECTION 8: Inspection Information" badge={
        <div className="flex items-center gap-2">
          {(inspectionInfo.onlineWI && inspectionInfo.reportTemplate && inspectionInfo.onlineCustomerClaimForm) && (
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">Information Complete</span>
          )}
          {!inspectionInfo.technicalManagerReviewed && (
            <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">⚠ Not Examined by Technical Manager</span>
          )}
        </div>
      }>
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Open Section 8. With Online WI / Report Template / Online Customer Claim Form all empty, only the red "Not Examined" badge shows. Fill in all three fields — a green "Information Complete" badge appears next to it. Both can show at once since they're independent conditions.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: add Information Complete badge to Section 8"
```

---

## Task 7: On-Site Tests CSV download

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`

- [ ] **Step 1: Add the `Download` icon to the lucide-react import**

Find:

```js
import { Plus, X, ExternalLink, Calculator } from 'lucide-react';
```

Replace it with:

```js
import { Plus, X, ExternalLink, Calculator, Download } from 'lucide-react';
```

- [ ] **Step 2: Add the CSV-export helper function**

Add this function right after the `updateArrayItem` function definition (before the `return (` of the component):

```js
  const downloadOnSiteTestsCSV = () => {
    const header = ['Description', 'Method', 'Criteria', 'Sample Size', 'Include'];
    const rows = onSiteTests.map(t => [t.description || '', t.method || '', t.criteria || '', t.sampleSize || '', t.include ? 'Yes' : 'No']);
    const csvContent = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `on-site-tests-${formData.noticeId || 'notice'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
```

- [ ] **Step 3: Add the Download button to Section 11**

Find:

```js
      {/* SECTION 11: On-Site Tests */}
      <SectionCard title="SECTION 11: On-Site Tests">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
```

Replace it with:

```js
      {/* SECTION 11: On-Site Tests */}
      <SectionCard title="SECTION 11: On-Site Tests">
        <div className="flex justify-end mb-3">
          <button
            onClick={downloadOnSiteTestsCSV}
            className="text-slate-600 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
```

- [ ] **Step 4: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 5: Manual verification**

Add a couple of on-site test rows with real values, click "Download" — a `.csv` file should download named `on-site-tests-<noticeId>.csv`. Open it in a spreadsheet app or a text editor and confirm the header row and data rows match what you entered, and clicking Download does **not** collapse/expand the section card (confirming the click doesn't bubble into the header's toggle).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: add CSV download for On-Site Tests"
```

---

## Task 8: ReportTab — read-only recap panel

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Add the recap panel before Section 17**

Find:

```js
export default function ReportTab({ formData, updateSection }) {
  const executionInfo = formData.reportExecutionInfo || {};

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6">
      
      {/* SECTION 17: Inspection Execution Info */}
      <SectionCard title="SECTION 17: Inspection Execution Info">
```

Replace it with:

```js
export default function ReportTab({ formData, updateSection }) {
  const executionInfo = formData.reportExecutionInfo || {};
  const productInfo = formData.productInfo || {};
  const basicInfo = formData.basicInfo || {};
  const aql = formData.aql || { inspectionStandard: {}, acceptedQuantity: {} };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  const recapItem = (label, value) => (
    <div>
      <div className={labelClass}>{label}</div>
      <div className="text-sm font-semibold text-slate-700">{value ?? '—'}</div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Read-only recap of Notice-tab data, for reference while filling in this tab */}
      <SectionCard title="Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recapItem('Product Quantity', productInfo.totalQuantity)}
          {recapItem('Service Type', basicInfo.serviceType)}
          {recapItem('Inspection Level', aql.samplingLevel)}
          {recapItem('Sample Size', aql.sampledQuantity)}
        </div>
        <div className="mt-4">
          <div className={labelClass}>Workmanship (AQL) Standard / Allowed</div>
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-1">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Critical</div>
              <div className="text-sm font-semibold text-slate-700">{aql.inspectionStandard?.critical ?? '—'} / Allowed: {aql.acceptedQuantity?.critical ?? '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Major</div>
              <div className="text-sm font-semibold text-slate-700">{aql.inspectionStandard?.major ?? '—'} / Allowed: {aql.acceptedQuantity?.major ?? '—'}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Minor</div>
              <div className="text-sm font-semibold text-slate-700">{aql.inspectionStandard?.minor ?? '—'} / Allowed: {aql.acceptedQuantity?.minor ?? '—'}</div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 17: Inspection Execution Info */}
      <SectionCard title="SECTION 17: Inspection Execution Info">
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Go to the Notice tab, set Service Type, AQL Sampling Level, add products (so Total Quantity is non-zero), fill in AQL standard/accepted values. Switch to Report (Online) tab — the new "Summary" card at the top should show all of those values read-only, matching what you entered.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: add read-only Notice-data recap panel to Report tab"
```

---

## Task 9: ReportTab — Inspection Q&A fields

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Add the Q&A fields inside the Section 17 card**

Find the end of the Section 17 card's existing content:

```js
            <div>
              <label className={labelClass}>General Remark</label>
              <textarea className={inputClass} rows={3} value={executionInfo.generalRemark || ''} onChange={e => updateSection('reportExecutionInfo', { generalRemark: e.target.value })} />
            </div>
          </div>
        </div>
      </SectionCard>
```

Replace it with:

```js
            <div>
              <label className={labelClass}>General Remark</label>
              <textarea className={inputClass} rows={3} value={executionInfo.generalRemark || ''} onChange={e => updateSection('reportExecutionInfo', { generalRemark: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Any Sample Selected?</label>
              <select className={inputClass} value={executionInfo.sampleSelected || 'No'} onChange={e => updateSection('reportExecutionInfo', { sampleSelected: e.target.value })}>
                <option>Yes</option><option>No</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Called CS?</label>
              <select className={inputClass} value={executionInfo.calledCS || 'No'} onChange={e => updateSection('reportExecutionInfo', { calledCS: e.target.value })}>
                <option>Yes</option><option>No</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={executionInfo.csConfirmedCall || false} onChange={e => updateSection('reportExecutionInfo', { csConfirmedCall: e.target.checked })} className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4" />
                Did Customer Service confirm the call?
              </label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Was there a representative of the client on site?</label>
              <div className="flex gap-4 items-center">
                <select className={`${inputClass} max-w-xs`} value={executionInfo.clientRepOnSite?.present ? 'Yes' : 'No'} onChange={e => updateSection('reportExecutionInfo', { clientRepOnSite: { ...executionInfo.clientRepOnSite, present: e.target.value === 'Yes' } })}>
                  <option>Yes</option><option>No</option>
                </select>
                <input className={inputClass} placeholder="Details (optional)" value={executionInfo.clientRepOnSite?.details || ''} onChange={e => updateSection('reportExecutionInfo', { clientRepOnSite: { ...executionInfo.clientRepOnSite, details: e.target.value } })} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Anything about the factory or inspection which requires special attention or further explanation?</label>
              <textarea className={inputClass} rows={3} value={executionInfo.specialAttention || ''} onChange={e => updateSection('reportExecutionInfo', { specialAttention: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Did the factory representative sign the draft report?</label>
              <select className={inputClass} value={executionInfo.factoryRepSignedDraft || 'No'} onChange={e => updateSection('reportExecutionInfo', { factoryRepSignedDraft: e.target.value })}>
                <option>Yes</option><option>No</option><option>Refused</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Additional Remarks</label>
              <textarea className={inputClass} rows={2} placeholder="Anything that doesn't need to go in the report but the company should know, or information changes during inspection..." value={executionInfo.additionalRemarks || ''} onChange={e => updateSection('reportExecutionInfo', { additionalRemarks: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Received a Phone Call?</label>
              <div className="flex flex-wrap gap-6">
                {['cs', 'tm', 'none', 'na'].map(key => (
                  <label key={key} className="flex items-center gap-2 text-sm font-medium text-slate-700 uppercase">
                    <input
                      type="checkbox"
                      checked={executionInfo.receivedPhoneCall?.[key] || false}
                      onChange={e => updateSection('reportExecutionInfo', { receivedPhoneCall: { ...executionInfo.receivedPhoneCall, [key]: e.target.checked } })}
                      className="rounded text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4"
                    />
                    {key}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

In the Report (Online) tab, set each new field to a non-default value (e.g. Sample Selected → Yes, Called CS → Yes + check "confirmed call", Client rep on site → Yes with details text, fill Special Attention and Additional Remarks, check two of the four phone-call boxes). Save, reload the page, and confirm every value is exactly as you left it.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: add inspection Q&A fields to Report tab Section 17"
```

---

## Task 10: ReportTab — Work Supervision Ratings

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Add the ratings block after Section 17, before Section 18**

Find:

```js
      {/* SECTION 18: Upload & Report */}
```

Replace it with (adds a new card immediately before it):

```js
      {/* Work Supervision Ratings */}
      <SectionCard title="Work Supervision">
        <p className="text-xs text-slate-400 mb-4">Rating scale: higher number = higher satisfaction.</p>
        <div className="space-y-6">
          {[
            { key: 'materialsGuidance', label: 'Materials & Instructions Guidance' },
            { key: 'csSupportLevel', label: 'CS Support Level' },
          ].map(({ key, label }) => {
            const current = executionInfo.workSupervisionRating?.[key] || {};
            return (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex gap-4">
                    {[5, 4, 3, 2, 1].map(n => (
                      <label key={n} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name={`rating-${key}`}
                          checked={current.rating === n}
                          onChange={() => updateSection('reportExecutionInfo', { workSupervisionRating: { ...executionInfo.workSupervisionRating, [key]: { ...current, rating: n } } })}
                          className="text-[#6C47FF] focus:ring-[#6C47FF] w-4 h-4"
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                  <input
                    className={`${inputClass} max-w-sm`}
                    placeholder="Remarks (optional)"
                    value={current.remarks || ''}
                    onChange={e => updateSection('reportExecutionInfo', { workSupervisionRating: { ...executionInfo.workSupervisionRating, [key]: { ...current, remarks: e.target.value } } })}
                  />
                </div>
              </div>
            );
          })}

          <div>
            <label className={labelClass}>TM Work Satisfaction</label>
            <div className="flex items-center gap-4 flex-wrap">
              <select
                className={`${inputClass} max-w-[120px]`}
                value={executionInfo.workSupervisionRating?.tmWorkSatisfaction?.rating || 5}
                onChange={e => updateSection('reportExecutionInfo', { workSupervisionRating: { ...executionInfo.workSupervisionRating, tmWorkSatisfaction: { ...executionInfo.workSupervisionRating?.tmWorkSatisfaction, rating: Number(e.target.value) } } })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <input
                className={`${inputClass} max-w-sm`}
                placeholder="Remarks (optional)"
                value={executionInfo.workSupervisionRating?.tmWorkSatisfaction?.remarks || ''}
                onChange={e => updateSection('reportExecutionInfo', { workSupervisionRating: { ...executionInfo.workSupervisionRating, tmWorkSatisfaction: { ...executionInfo.workSupervisionRating?.tmWorkSatisfaction, remarks: e.target.value } } })}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 18: Upload & Report */}
```

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Select a radio rating for Materials & Instructions Guidance and CS Support Level, type a remark for each, pick a number in the TM Work Satisfaction dropdown, type its remark. Save, reload, and confirm all three ratings and remarks persisted exactly.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: add Work Supervision ratings to Report tab"
```

---

## Task 11: ReportTab — WeChat Time Clock Records table

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Add array helpers scoped to `reportExecutionInfo`**

Add these functions right after the `recapItem` helper (before the `return (`):

```js
  const addTimeClockRecord = () => {
    const current = executionInfo.timeClockRecords || [];
    updateSection('reportExecutionInfo', { timeClockRecords: [...current, { inspector: '', date: '', arrivalTimeFactory: '', arrivalLocation: '', arrivalDistance: '', departureTime: '', leaveLocation: '', leaveDistance: '' }] });
  };
  const updateTimeClockRecord = (idx, field, value) => {
    const current = [...(executionInfo.timeClockRecords || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateSection('reportExecutionInfo', { timeClockRecords: current });
  };
  const removeTimeClockRecord = (idx) => {
    updateSection('reportExecutionInfo', { timeClockRecords: (executionInfo.timeClockRecords || []).filter((_, i) => i !== idx) });
  };
```

- [ ] **Step 2: Add the table as a new SectionCard, right after the Work Supervision card and before Section 18**

Find:

```js
      {/* SECTION 18: Upload & Report */}
```

Replace it with:

```js
      {/* WeChat Time Clock Records */}
      <SectionCard title="WeChat Time Clock Records">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3 w-36">Date</th>
                  <th className="px-4 py-3">Arrival Time</th>
                  <th className="px-4 py-3">Arrival Location</th>
                  <th className="px-4 py-3 w-24">Distance</th>
                  <th className="px-4 py-3">Departure Time</th>
                  <th className="px-4 py-3">Leave Location</th>
                  <th className="px-4 py-3 w-24">Distance</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(executionInfo.timeClockRecords || []).map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input className={inputClass} value={r.inspector || ''} onChange={e => updateTimeClockRecord(idx, 'inspector', e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="date" className={inputClass} value={r.date ? r.date.split('T')[0] : ''} onChange={e => updateTimeClockRecord(idx, 'date', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={r.arrivalTimeFactory || ''} onChange={e => updateTimeClockRecord(idx, 'arrivalTimeFactory', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={r.arrivalLocation || ''} onChange={e => updateTimeClockRecord(idx, 'arrivalLocation', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={r.arrivalDistance || ''} onChange={e => updateTimeClockRecord(idx, 'arrivalDistance', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={r.departureTime || ''} onChange={e => updateTimeClockRecord(idx, 'departureTime', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={r.leaveLocation || ''} onChange={e => updateTimeClockRecord(idx, 'leaveLocation', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={r.leaveDistance || ''} onChange={e => updateTimeClockRecord(idx, 'leaveDistance', e.target.value)} /></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeTimeClockRecord(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {(executionInfo.timeClockRecords || []).length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400 text-sm">No records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button onClick={addTimeClockRecord} className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 18: Upload & Report */}
```

- [ ] **Step 3: Update the imports**

Find:

```js
import SectionCard from './SectionCard';
import { Plus, X } from 'lucide-react';
```

Confirm both `Plus` and `X` are already imported (they are — no change needed here, this step is just a checkpoint before moving on).

- [ ] **Step 4: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 5: Manual verification**

Click "Add Record" twice, fill in Inspector/Date/Arrival/Departure fields for both rows, remove one with the X button, save, reload, and confirm the remaining row's data persisted exactly.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: add WeChat Time Clock Records table to Report tab"
```

---

## Task 12: ReportTab — Inspection Dates grid

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx`

- [ ] **Step 1: Add array helpers scoped to `reportExecutionInfo.inspectionDates`**

Add these functions right after the `removeTimeClockRecord` function from Task 11:

```js
  const addInspectionDate = () => {
    const current = executionInfo.inspectionDates || [];
    updateSection('reportExecutionInfo', { inspectionDates: [...current, { date: '', departureOffice: '', arrivalFactory: '', departureFactory: '' }] });
  };
  const updateInspectionDate = (idx, field, value) => {
    const current = [...(executionInfo.inspectionDates || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateSection('reportExecutionInfo', { inspectionDates: current });
  };
  const removeInspectionDate = (idx) => {
    updateSection('reportExecutionInfo', { inspectionDates: (executionInfo.inspectionDates || []).filter((_, i) => i !== idx) });
  };
```

- [ ] **Step 2: Add the grid inside the "WeChat Time Clock Records" card, right after its closing table wrapper `</div>` and before the card's closing `</SectionCard>`**

Find (the end of the WeChat Time Clock Records card added in Task 11):

```js
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button onClick={addTimeClockRecord} className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 18: Upload & Report */}
```

Replace it with:

```js
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <button onClick={addTimeClockRecord} className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>
        </div>

        <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 uppercase text-[11px] tracking-wider">Please Fill In the Inspection Information</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="px-4 py-2">Inspection Date</th>
                  <th className="px-4 py-2">Departure Time at Office</th>
                  <th className="px-4 py-2">Arrival Time at Factory</th>
                  <th className="px-4 py-2">Departure Time from Factory</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(executionInfo.inspectionDates || []).map((d, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2"><input type="date" className={inputClass} value={d.date ? d.date.split('T')[0] : ''} onChange={e => updateInspectionDate(idx, 'date', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={d.departureOffice || ''} onChange={e => updateInspectionDate(idx, 'departureOffice', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={d.arrivalFactory || ''} onChange={e => updateInspectionDate(idx, 'arrivalFactory', e.target.value)} /></td>
                    <td className="px-4 py-2"><input className={inputClass} value={d.departureFactory || ''} onChange={e => updateInspectionDate(idx, 'departureFactory', e.target.value)} /></td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => removeInspectionDate(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <button onClick={addInspectionDate} className="text-[#6C47FF] hover:bg-purple-50 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition-colors">
              <Plus className="w-4 h-4" /> Add Date
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 18: Upload & Report */}
```

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 4: Manual verification**

Add two inspection-date rows, fill in date/office-departure/factory-arrival/factory-departure for both, remove one, save, reload, confirm the remaining row persisted exactly.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: add Inspection Dates grid to Report tab"
```

---

## Task 13: Full round-trip verification

**Files:** none (verification only)

- [ ] **Step 1: Start the app**

Run: `npm run dev:all` from the repo root.

- [ ] **Step 2: Full walkthrough**

Log in as an admin. Open (or create) an Inspection Notice. On the Notice tab: fill in the new Other Contact Persons field, use the map-link icon, add 2 Factory Abnormal Status entries, add 2 Supplier Status Feedback entries, fill Section 8's three fields to confirm the green badge appears, add a couple of On-Site Tests rows and download the CSV. Switch to the Report (Online) tab: confirm the Summary recap panel shows the Notice-tab AQL/quantity data correctly, fill in every new Q&A field, set all three Work Supervision ratings with remarks, add 2 WeChat Time Clock Records and 2 Inspection Dates rows.

- [ ] **Step 3: Save and reload**

Click "Save Draft". Reload the browser page (full refresh, not just tab switch). Confirm every single value entered in Step 2 is still present, exactly as entered — this proves the whole-document `PUT` round-trips correctly with no backend changes needed beyond the one schema field from Task 1.

- [ ] **Step 4: Final commit (if anything was fixed during verification)**

If Step 2/3 surfaced any bugs, fix them in the relevant file from the task above, re-verify, and commit with a `fix:` prefixed message describing exactly what was wrong.
