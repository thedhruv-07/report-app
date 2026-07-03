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
  const executionInfo = formData.reportExecutionInfo || {};
  const productInfo = formData.productInfo || {};
  const basicInfo = formData.basicInfo || {};
  const aql = formData.aql || { inspectionStandard: {}, acceptedQuantity: {} };
  const assignedInspectors = formData.teamAssignment?.inspectors || [];

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

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
        const arrayField = type === 'inspector' ? 'inspectorUploads' : 'auditorUploads';
        updateSection('reportUploads', { [arrayField]: data.notice.reportUploads[arrayField] });
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
    <div>
      <div className={labelClass}>{label}</div>
      <div className="text-sm font-semibold text-slate-700">{value ?? '—'}</div>
    </div>
  );

  const addTimeClockRecord = () => {
    const current = executionInfo.timeClockRecords || [];
    const defaultDate = basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : '';
    const defaultInspector = assignedInspectors[0]?.name || '';
    updateSection('reportExecutionInfo', { timeClockRecords: [...current, { inspector: defaultInspector, date: defaultDate, arrivalTimeFactory: '', arrivalLocation: '', arrivalDistance: '', departureTime: '', leaveLocation: '', leaveDistance: '' }] });
  };
  const updateTimeClockRecord = (idx, field, value) => {
    const current = [...(executionInfo.timeClockRecords || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateSection('reportExecutionInfo', { timeClockRecords: current });
  };
  const removeTimeClockRecord = (idx) => {
    updateSection('reportExecutionInfo', { timeClockRecords: (executionInfo.timeClockRecords || []).filter((_, i) => i !== idx) });
  };

  const addInspectionDate = () => {
    const current = executionInfo.inspectionDates || [];
    const defaultDate = basicInfo.inspectionDateFrom ? basicInfo.inspectionDateFrom.split('T')[0] : '';
    updateSection('reportExecutionInfo', { inspectionDates: [...current, { date: defaultDate, departureOffice: '', arrivalFactory: '', departureFactory: '' }] });
  };
  const updateInspectionDate = (idx, field, value) => {
    const current = [...(executionInfo.inspectionDates || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateSection('reportExecutionInfo', { inspectionDates: current });
  };
  const removeInspectionDate = (idx) => {
    updateSection('reportExecutionInfo', { inspectionDates: (executionInfo.inspectionDates || []).filter((_, i) => i !== idx) });
  };

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Actual Inspected Quantity</label>
              <input 
                type="number" 
                className={inputClass} 
                value={executionInfo.actualInspectedQuantity || 0} 
                onChange={e => updateSection('reportExecutionInfo', { actualInspectedQuantity: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className={labelClass}>Overall Conclusion</label>
              <select 
                className={inputClass} 
                value={executionInfo.overallConclusion || 'Pending'} 
                onChange={e => updateSection('reportExecutionInfo', { overallConclusion: e.target.value })}
              >
                <option>Pass</option><option>Fail</option><option>Pending</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Workmanship (AQL) Results - Found Defects</label>
              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Critical</div>
                  <input type="number" className={inputClass} value={executionInfo.workmanshipFound?.critical || 0} onChange={e => updateSection('reportExecutionInfo', { workmanshipFound: { ...executionInfo.workmanshipFound, critical: Number(e.target.value) } })} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Major</div>
                  <input type="number" className={inputClass} value={executionInfo.workmanshipFound?.major || 0} onChange={e => updateSection('reportExecutionInfo', { workmanshipFound: { ...executionInfo.workmanshipFound, major: Number(e.target.value) } })} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Minor</div>
                  <input type="number" className={inputClass} value={executionInfo.workmanshipFound?.minor || 0} onChange={e => updateSection('reportExecutionInfo', { workmanshipFound: { ...executionInfo.workmanshipFound, minor: Number(e.target.value) } })} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Problem Remark</label>
              <textarea className={inputClass} rows={3} value={executionInfo.problemRemark || ''} onChange={e => updateSection('reportExecutionInfo', { problemRemark: e.target.value })} />
            </div>
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
                    <td className="px-4 py-2">
                      {assignedInspectors.length > 0 ? (
                        <select className={inputClass} value={r.inspector || ''} onChange={e => updateTimeClockRecord(idx, 'inspector', e.target.value)}>
                          <option value="">— Select —</option>
                          {assignedInspectors.map(ins => (
                            <option key={ins.inspectorId || ins.name} value={ins.name}>{ins.name}</option>
                          ))}
                          {r.inspector && !assignedInspectors.some(ins => ins.name === r.inspector) && (
                            <option value={r.inspector}>{r.inspector}</option>
                          )}
                        </select>
                      ) : (
                        <input className={inputClass} value={r.inspector || ''} onChange={e => updateTimeClockRecord(idx, 'inspector', e.target.value)} />
                      )}
                    </td>
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
