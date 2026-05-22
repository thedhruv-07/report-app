import React from 'react';
import { ChevronDown, ChevronUp, Camera, MessageSquare } from 'lucide-react';

function ReportSection({
  sectionKey,
  config,
  sectionData,
  sectionFeedback,
  isCollapsed,
  onToggle,
  activeStatus,
  commentValue,
  commentPriority,
  onCommentChange,
  onPriorityChange,
  onPrimeComment,
  onClearComment,
  onSaveComment
}) {
  const SectionIcon = config.icon;

  return (
    <div
      className={`bg-white border rounded-3xl shadow-sm transition-all duration-300 ${
        sectionFeedback ? 'border-rose-200' : 'border-slate-200'
      }`}
    >
      <div
        onClick={onToggle}
        className="px-6 py-4.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50/50 rounded-t-3xl transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${sectionFeedback ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
            <SectionIcon className="w-4 h-4 shrink-0" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">{config.label}</h3>
        </div>
        <div className="flex items-center gap-2">
          {sectionFeedback && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">FEEDBACK ATTACHED</span>
          )}
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {sectionKey !== 'sectionD' && sectionKey !== 'sectionG' && sectionData?.fields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
              {Object.entries(sectionData.fields).map(([label, val]) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs py-1.5 border-b border-slate-100/50 last:border-b-0">
                  <span className="font-extrabold text-slate-400 capitalize">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span
                    className={`sm:text-right font-bold mt-1 sm:mt-0 ${
                      val === 'Pass' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded' :
                      val === 'Fail' ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-black' :
                      'text-slate-700'
                    }`}
                  >
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {sectionKey === 'sectionB' && sectionData?.notes && (
            <div className="text-xs border-l-4 border-slate-300 pl-3 italic text-slate-500 bg-slate-50 p-3 rounded-r-xl">
              <strong>Workmanship Notes:</strong> {sectionData.notes}
            </div>
          )}

          {sectionKey === 'sectionD' && sectionData?.fields?.measurements && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Parameter Name</th>
                    <th className="py-2.5 px-3">Required Spec</th>
                    <th className="py-2.5 px-3">Actual Measured</th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-600">
                  {sectionData.fields.measurements.map((measurement, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-800 font-bold">{measurement.param}</td>
                      <td className="py-2.5 px-3">{measurement.spec}</td>
                      <td className="py-2.5 px-3">{measurement.actual}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${measurement.result === 'Pass' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 font-extrabold'}`}>
                          {measurement.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {sectionKey === 'sectionG' && sectionData?.photos && (
            <div className="grid grid-cols-3 gap-4">
              {sectionData.photos.map((photo, photoIndex) => (
                <div key={photoIndex} className="bg-slate-100 border border-slate-200 rounded-2xl aspect-video flex flex-col items-center justify-center p-3 relative group overflow-hidden">
                  <Camera className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-[10px] font-semibold text-slate-400 mt-2 truncate w-full text-center">{photo}</span>
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    VIEW PHOTO
                  </div>
                </div>
              ))}
            </div>
          )}

          {sectionFeedback && (
            <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Active Correction Feedback:</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${sectionFeedback.priority === 'Critical' ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>
                  {sectionFeedback.priority}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">{sectionFeedback.comment}</p>
              <span className="text-[10px] text-amber-500 self-end">Added: {sectionFeedback.addedAt}</span>
            </div>
          )}

          {activeStatus !== 'Finalized' && (
            <div className="border-t border-slate-100 pt-4.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">Section Correction Comments</span>
                <button
                  onClick={onPrimeComment}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>{sectionFeedback ? 'Edit Section Comment' : 'Add Section Comment'}</span>
                </button>
              </div>

              <div className="mt-4 bg-slate-50 border border-slate-150 p-4.5 rounded-2xl space-y-4">
                <textarea
                  placeholder="Write specific correction details or compliance notes..."
                  value={commentValue}
                  onChange={(e) => onCommentChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 leading-relaxed"
                  rows={3}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-extrabold text-slate-400">Feedback Priority:</span>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                      <input
                        type="radio"
                        name={`priority-${sectionKey}`}
                        value="Critical"
                        checked={commentPriority === 'Critical'}
                        onChange={() => onPriorityChange('Critical')}
                        className="text-rose-500 focus:ring-rose-500 focus:ring-1"
                      />
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Critical Failure</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                      <input
                        type="radio"
                        name={`priority-${sectionKey}`}
                        value="Advisory"
                        checked={commentPriority === 'Advisory'}
                        onChange={() => onPriorityChange('Advisory')}
                        className="text-slate-500 focus:ring-slate-500 focus:ring-1"
                      />
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Advisory / Quality Warning</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    {sectionFeedback && (
                      <button
                        onClick={onClearComment}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Clear Comment
                      </button>
                    )}
                    <button
                      onClick={onSaveComment}
                      className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-100"
                    >
                      Save Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ReportSection);
