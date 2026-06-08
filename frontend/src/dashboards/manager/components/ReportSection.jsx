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
          {/* Key-value fields grid — all sections except D and G */}
          {sectionKey !== 'sectionD' && sectionKey !== 'sectionG' && sectionData?.fields && Object.keys(sectionData.fields).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
              {Object.entries(sectionData.fields).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between text-xs py-2 border-b border-slate-100/70 last:border-b-0">
                  <span className="font-extrabold text-slate-400 shrink-0 pr-4">{label}</span>
                  <span
                    className={`text-right font-bold ${
                      val === 'Pass'    ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded' :
                      val === 'Fail'    ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-black' :
                      val === 'Pending' ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' :
                      'text-slate-700'
                    }`}
                  >
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Section B — workmanship remark + defects table */}
          {sectionKey === 'sectionB' && sectionData?.notes && (
            <div className="text-xs border-l-4 border-slate-300 pl-3 italic text-slate-500 bg-slate-50 p-3 rounded-r-xl">
              <strong>Workmanship Notes:</strong> {sectionData.notes}
            </div>
          )}
          {sectionKey === 'sectionB' && sectionData?.defects?.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-200">Defect Details</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3 text-left">Item</th>
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-center">Critical</th>
                    <th className="py-2 px-3 text-center">Major</th>
                    <th className="py-2 px-3 text-center">Minor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {sectionData.defects.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-800">{d.itemName}</td>
                      <td className="py-2 px-3">{d.description}</td>
                      <td className="py-2 px-3 text-center">{d.critical}</td>
                      <td className="py-2 px-3 text-center">{d.major}</td>
                      <td className="py-2 px-3 text-center">{d.minor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section C — quantity items table */}
          {sectionKey === 'sectionC' && sectionData?.items?.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-200">Product / Item Breakdown</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3 text-left">Item</th>
                    <th className="py-2 px-3 text-center">Order Qty</th>
                    <th className="py-2 px-3 text-center">Cartons</th>
                    <th className="py-2 px-3 text-center">Qty/Carton</th>
                    <th className="py-2 px-3 text-center">Sample (Packed)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {sectionData.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-800">{item.itemName || item.po}</td>
                      <td className="py-2 px-3 text-center">{item.orderQty}</td>
                      <td className="py-2 px-3 text-center">{item.cartons}</td>
                      <td className="py-2 px-3 text-center">{item.qtyPerCarton}</td>
                      <td className="py-2 px-3 text-center">{item.sampleSizePacked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section D — specifications / measurements table */}
          {sectionKey === 'sectionD' && sectionData?.fields?.measurements?.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Parameter / Description</th>
                    <th className="py-2.5 px-3">Required Spec</th>
                    <th className="py-2.5 px-3">Actual Finding</th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {sectionData.fields.measurements.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-800 font-bold">{m.param}</td>
                      <td className="py-2.5 px-3">{m.spec}</td>
                      <td className="py-2.5 px-3">{m.actual}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.result === 'Pass' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 font-extrabold'}`}>
                          {m.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sectionKey === 'sectionD' && (!sectionData?.fields?.measurements || sectionData.fields.measurements.length === 0) && (
            <p className="text-xs text-slate-400 italic text-center py-4">No specification data submitted.</p>
          )}

          {/* Section E — safety checks table */}
          {sectionKey === 'sectionE' && sectionData?.safetyChecks?.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-2 bg-slate-50 border-b border-slate-200">Safety / On-Site Test Checks</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3 text-left">Check</th>
                    <th className="py-2 px-3 text-center">Result</th>
                    <th className="py-2 px-3 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {sectionData.safetyChecks.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-800">{c.checkName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.result === 'Pass' ? 'bg-emerald-50 text-emerald-600' : c.result === 'Fail' ? 'bg-rose-50 text-rose-600 font-extrabold' : 'bg-slate-100 text-slate-500'}`}>
                          {c.result}
                        </span>
                      </td>
                      <td className="py-2 px-3 italic text-slate-500">{c.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section G — photo gallery */}
          {sectionKey === 'sectionG' && sectionData?.photos?.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {sectionData.photos.map((photo, photoIndex) => {
                const url = typeof photo === 'object' ? photo.url : photo;
                const desc = typeof photo === 'object' ? photo.description : '';
                return (
                  <a key={photoIndex} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden border border-slate-200 group relative bg-slate-100">
                    <img
                      src={url}
                      alt={desc || `Photo ${photoIndex + 1}`}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                    <div className="hidden w-full aspect-video flex-col items-center justify-center gap-1 p-2">
                      <Camera className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] text-slate-400 text-center break-all">{desc || 'Photo failed to load'}</span>
                    </div>
                    {desc && (
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-white text-[10px] font-semibold px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {desc}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
          {sectionKey === 'sectionG' && (!sectionData?.photos || sectionData.photos.length === 0) && (
            <p className="text-xs text-slate-400 italic text-center py-4">No photos uploaded for this report.</p>
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
