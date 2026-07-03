# Auto-Fill Inspection Date on New Rows

## Context

"Inspection date" is entered once in Section 1 (`basicInfo.inspectionDateFrom`/`inspectionDateTo`) but has to be retyped separately in three other places: each new inspector row in Section 2 (`teamAssignment.inspectors[].dateFrom`/`.dateTo`), each new row in the Report tab's "Inspection Dates" grid (`reportExecutionInfo.inspectionDates[].date`), and each new row in the Report tab's "WeChat Time Clock Records" table (`reportExecutionInfo.timeClockRecords[].date`).

## Design

Section 1's `basicInfo.inspectionDateFrom` becomes the default value for the date field on any **newly created** row in the three other spots — not a live sync. Existing rows are never touched, so editing Section 1's dates after rows already have data in them can't clobber anything.

- `frontend/src/dashboards/admin/components/inspection-notice/NoticeTab.jsx` — the "+ Add Inspector" button's new-row object changes `dateFrom: ''` and `dateTo: ''` to both default to `basicInfo.inspectionDateFrom` (formatted `YYYY-MM-DD` for the date input, matching how existing rows already display it via `.split('T')[0]`).
- `frontend/src/dashboards/admin/components/inspection-notice/ReportTab.jsx` — `addInspectionDate` and `addTimeClockRecord` (both already have `basicInfo` in scope from the earlier read-only recap panel work) get the same treatment: `date: ''` becomes `date: basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : ''`.

All three remain fully editable after creation — this only changes what a brand-new row starts with.

## Out of scope

- Auto-generating multiple rows for a multi-day date range (confirmed: pre-fill on each manual "+ Add" click instead).
- Any other duplicated field (factory name, customer name, etc.) — confirmed inspection date only for this round.

## Testing

No automated test suite exists in this project. Manual verification: set Section 1's Inspection Date From to a specific date, then click "+ Add Inspector" and confirm the new row's Date From/To are pre-filled with that date instead of blank. Switch to the Report tab and click "+ Add Date" and "+ Add Record" separately, confirming each new row's Date field is pre-filled the same way. Then change Section 1's date and confirm existing rows (added before the change) keep their original values — only rows added *after* the change should reflect the new default.
