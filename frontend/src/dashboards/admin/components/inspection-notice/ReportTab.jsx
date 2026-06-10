import React from 'react';
import SectionCard from './SectionCard';
import { Plus, X } from 'lucide-react';

export default function ReportTab({ formData, updateSection }) {
  const executionInfo = formData.reportExecutionInfo || {};
  const reportUploads = formData.reportUploads || {};

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6">
      
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
          </div>
        </div>
      </SectionCard>

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
