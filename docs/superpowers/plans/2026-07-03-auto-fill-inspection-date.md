# Auto-Fill Inspection Date on New Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Default the date field on newly-created inspector rows, Inspection Dates rows, and WeChat Time Clock Records rows to Section 1's `basicInfo.inspectionDateFrom`, instead of blank.

**Architecture:** Three one-line default-value changes at row-creation call sites — no new state, no live sync, no schema change. Existing rows are never touched.

**Tech Stack:** React.

**No automated test suite exists in this project.** Verification is lint plus exact manual actions with expected observable results.

---

### Task 1: Default new Inspector row dates

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx:376`

- [ ] **Step 1: Update the Add Inspector button's new-row object**

Find:
```js
              onClick={() => addArrayItem('teamAssignment', 'inspectors', { name: '', dateFrom: '', dateTo: '', mobile: '', manDays: 1, role: 'Member' })}
```

Replace with:
```js
              onClick={() => addArrayItem('teamAssignment', 'inspectors', {
                name: '',
                dateFrom: basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : '',
                dateTo: basicInfo.inspectionDateTo ? basicInfo.inspectionDateTo.split('T')[0] : '',
                mobile: '', manDays: 1, role: 'Member'
              })}
```

(`basicInfo` is already destructured from `formData.basicInfo` near the top of this component — no new variable needed.)

- [ ] **Step 2: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/NoticeTab.jsx`
Expected: no output.

- [ ] **Step 3: Manual verification**

Set Section 1's "Inspection Dates" From field to a specific date (and To field to a later date). Click "+ Add Inspector" in Section 2 and confirm the new row's Date From and Date To columns are pre-filled with those exact dates instead of being blank. Confirm they're still editable (change one, it should update normally).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx
git commit -m "feat: default new inspector rows to the notice's inspection date range"
```

---

### Task 2: Default new Report tab date rows

**Files:**
- Modify: `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx:140-156`

- [ ] **Step 1: Update `addTimeClockRecord`**

Find:
```js
  const addTimeClockRecord = () => {
    const current = executionInfo.timeClockRecords || [];
    updateSection('reportExecutionInfo', { timeClockRecords: [...current, { inspector: '', date: '', arrivalTimeFactory: '', arrivalLocation: '', arrivalDistance: '', departureTime: '', leaveLocation: '', leaveDistance: '' }] });
```

Replace with:
```js
  const addTimeClockRecord = () => {
    const current = executionInfo.timeClockRecords || [];
    const defaultDate = basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : '';
    updateSection('reportExecutionInfo', { timeClockRecords: [...current, { inspector: '', date: defaultDate, arrivalTimeFactory: '', arrivalLocation: '', arrivalDistance: '', departureTime: '', leaveLocation: '', leaveDistance: '' }] });
```

(Leave the closing `};` on the line after unchanged.)

- [ ] **Step 2: Update `addInspectionDate`**

Find:
```js
  const addInspectionDate = () => {
    const current = executionInfo.inspectionDates || [];
    updateSection('reportExecutionInfo', { inspectionDates: [...current, { date: '', departureOffice: '', arrivalFactory: '', departureFactory: '' }] });
  };
```

Replace with:
```js
  const addInspectionDate = () => {
    const current = executionInfo.inspectionDates || [];
    const defaultDate = basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : '';
    updateSection('reportExecutionInfo', { inspectionDates: [...current, { date: defaultDate, departureOffice: '', arrivalFactory: '', departureFactory: '' }] });
  };
```

(`basicInfo` is already destructured from `formData.basicInfo` at the top of `ReportTab` — no new variable needed.)

- [ ] **Step 3: Lint check**

Run: `cd frontend && npx eslint src/dashboards/admin/components/inspection-notice/ReportTab.jsx`
Expected: no output.

- [ ] **Step 4: Manual verification**

With Section 1's Inspection Date From still set to the same test date, switch to the Report (Online) tab. Click "+ Add Record" under WeChat Time Clock Records and confirm the new row's Date column is pre-filled. Click "+ Add Date" under the Inspection Dates grid and confirm the same. Edit one of the pre-filled dates and confirm it still works normally. Then go back to Section 1 and change the Inspection Date From to a different date — confirm the rows you already added keep their original date (only a brand-new row added after this change should reflect the new default).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx
git commit -m "feat: default new Report tab date rows to the notice's inspection date"
```
