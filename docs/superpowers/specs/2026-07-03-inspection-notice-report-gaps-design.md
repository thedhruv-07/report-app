# Inspection Notice — Report Tab & Status Table Gaps

## Context

The Inspection Notice feature (`frontend/src/dashboards/admin/pages/InspectionNoticeForm.jsx`, `NoticeTab.jsx`, `ReportTab.jsx`, `backend/models/InspectionNotice.js`) was built as a close clone of the V-Trust MIS "Inspection Notice" screen. A screenshot-by-screenshot comparison against V-Trust surfaced several gaps between what the Mongoose schema models and what the React form actually renders. This spec covers the smallest, cheapest slice of those gaps: the Report tab's missing fields, and two status-feedback tables in the Notice tab.

Other identified gaps (real file upload/download for Attachments and Section 18, auto-populated Recent Inspection Records and Reading Records, the Historical Complaints feature, and the Expense tab) are explicitly out of scope for this round and will get their own spec/plan later.

## Backend impact

`inspectionNotice.controller.js`'s `updateNotice` does `findByIdAndUpdate(id, { $set: req.body })` with no field allowlist, and `getNoticeById` returns the full document with no `.select()` restriction. The frontend already sends the entire `formData` object on every save. Because of this, everything in this round is pure frontend work **except** one schema addition (`otherContactPersons`, see below).

## Scope

### 1. Report tab (`ReportTab.jsx`)

**Read-only recap panel** (new, top of the Section 17 card): displays, read-only, values already entered elsewhere in the notice — Product Quantity (`productInfo.totalQuantity`), Service Type (`basicInfo.serviceType`), Inspection Level (`aql.samplingLevel`), Sample Size (`aql.sampledQuantity`), Workmanship (AQL) standard + Allowed quantities (`aql.inspectionStandard`, `aql.acceptedQuantity`). No new state — straight reads from `formData`.

**Inspection Q&A fields** (new inputs bound to existing `reportExecutionInfo` schema fields):
- Sample Selected? — Yes/No select (`sampleSelected`)
- Called CS? — Yes/No select (`calledCS`)
- Did Customer Service confirm the call? — checkbox (`csConfirmedCall`)
- Was there a representative of the client on site? — Yes/No + free-text details (`clientRepOnSite.present`, `clientRepOnSite.details`)
- Anything requiring special attention or further explanation? — textarea (`specialAttention`)
- Did the factory representative sign the draft report? — Yes/No/Refused select (`factoryRepSignedDraft`)
- Additional remarks — textarea (`additionalRemarks`)
- Received a phone call? — 4 checkboxes: CS / TM / None / NA (`receivedPhoneCall.cs/tm/none/na`)

**Work Supervision Ratings** (bound to `workSupervisionRating`). Higher number = higher satisfaction in all three (matches V-Trust's "分值越高满意度越高" label):
- Materials & Instructions Guidance — radio scale, options 5/4/3/2/1 left to right + optional remark (`materialsGuidance.rating`, `.remarks`)
- CS Support Level — radio scale, options 5/4/3/2/1 left to right + optional remark (`csSupportLevel.rating`, `.remarks`)
- TM Work Satisfaction — numeric dropdown, options 1-10 + optional remark (`tmWorkSatisfaction.rating`, `.remarks`) — deliberately inconsistent widget from the other two, matching V-Trust exactly per user preference

**WeChat Time Clock Records** (bound to `reportExecutionInfo.timeClockRecords`): editable table — Inspector (text), Date, Arrival Time at Factory, Arrival Location, Arrival Distance, Departure Time from Factory, Leave Location, Leave Distance. Add/Remove row, following the existing array-table pattern (see Products/Customer Samples in `NoticeTab.jsx`). No photo capture — there's no mobile check-in mechanism to populate it, so building a photo upload widget here would be decorative. The schema's `photos: [String]` field is left untouched/unused for now.

**Inspection Dates** (bound to `reportExecutionInfo.inspectionDates`, a separate schema array from time-clock records): small grid — Date, Departure time at office, Arrival time at factory, Departure time from factory. Add/Remove row.

Explicitly **not** building: the "Get Inspection information from online report" button — it implies pulling from a connected external system we don't have; building it would just be a fake no-op button.

### 2. Notice tab (`NoticeTab.jsx`)

**Factory Information** (Section 14):
- Add `otherContactPersons: { type: String, default: '' }` to `factoryInfo` in `backend/models/InspectionNotice.js` (the only schema change in this round) — V-Trust's Factory Information table has both a "Main contact person" and an "Other contact persons" column; our schema only had the former.
- Add a plain text input for it next to Main Contact Person in the UI.
- Add a small "copy address / open in map" link next to the Address field. V-Trust links to Tencent Maps (China-specific); we'll link to a Google Maps search URL instead since Absolute Veritas operates across India/China/Bangladesh, not just China. Clicking copies the address text to the clipboard and opens `https://www.google.com/maps/search/?api=1&query=<url-encoded address>` in a new tab.

**Factory Abnormal Status** (new, under Factory Information): inline add-row table — Content (text), Label (text), Submit Date (auto-filled to today on add, not editable). Bound to `factoryInfo.abnormalStatusEntries` (already in schema). Same Add/Remove pattern as other array tables on this page.

**Supplier Status Feedback** (new, under Supplier Information): same shape as above, bound to `supplierInfo.statusEntries` (already in schema).

**Section 8 "Information Complete" badge**: add a green badge next to the existing red "Not Examined by Technical Manager" badge. Shown when all three of `inspectionInfo.onlineWI`, `inspectionInfo.reportTemplate`, and `inspectionInfo.onlineCustomerClaimForm` are non-empty. The two badges are independent conditions (data completeness vs. TM review status) and can show simultaneously.

**On-Site Tests Download button**: add a "Download" button next to the section header that exports the current `onSiteTests` array as a CSV file, generated and downloaded entirely client-side (no backend endpoint). Columns: Description, Method, Criteria, Sample Size, Include.

## Out of scope (future rounds)

- Real file upload/download for Attachments (Section 9) and Report tab Section 18 (Upload & Report / Create Report)
- Auto-populated Recent Inspection Records (Section 15) and Instructional Letters Reading Record (Section 16)
- Historical Complaints feature (no data model exists for complaints at all yet)
- Expense tab (currently a placeholder, no schema)

## Testing

No automated test suite exists in this project (per `CLAUDE.md`). Verification will be manual: open an existing Inspection Notice, exercise every new field/table (add/remove rows, fill in values, save), reload the page, and confirm the data round-trips correctly through the existing `PUT /api/inspection-notices/:id` endpoint. The CSV download and the map-link/copy-to-clipboard behavior will be checked directly in a browser.
