import React from 'react';
import { CheckCircle, AlertTriangle, MessageSquare, Lock, Clock, ArrowLeft } from 'lucide-react';

function ReviewActionsSidebar({
  activeReport,
  overallRemarksInput,
  setOverallRemarksInput,
  handleRemarksBlur,
  saveInternalRemarksOnly,
  setShowFinalizeModal,
  setShowCorrectionModal,
  setActiveReportId,
  getDaysSinceSubmission
}) {
  return (
    <div className="w-full lg:w-[35%] h-fit shrink-0 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6">
      <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Inspector & Assignment</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">TM Gatekeeper</span>
        </div>

        <div className="space-y-2 text-xs font-medium text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Inspector:</span>
            <span className="font-bold text-slate-800">{activeReport.inspectorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Submitted:</span>
            <span className="font-bold text-slate-800">{activeReport.submissionDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Revision Round:</span>
            <span className="font-bold text-slate-800">
              {activeReport.revisionRound === 0 ? 'Initial (Round 0)' : `Round ${activeReport.revisionRound}`}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200/50 pt-2 text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Days Since Submission:</span>
            </span>
            <span>{getDaysSinceSubmission(activeReport.submissionDate)} days ago</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-extrabold text-slate-700 block">Overall Remarks (visible to Admin)</label>
        <textarea
          placeholder="Provide overarching quality review summary, client notes, or instructions..."
          value={overallRemarksInput}
          onChange={(e) => setOverallRemarksInput(e.target.value)}
          onBlur={handleRemarksBlur}
          disabled={activeReport.status === 'Finalized'}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 leading-relaxed disabled:opacity-60"
          rows={5}
        />
        <p className="text-[10px] text-slate-400 italic">This content auto-saves on blur. This remark will be logged directly inside the client report.</p>
      </div>

      {activeReport.status !== 'Finalized' ? (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowFinalizeModal(true)}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>FINALIZE REPORT</span>
          </button>

          {activeReport.correctionFeedback.length === 0 && !overallRemarksInput.trim() ? (
            <div className="relative group">
              <button
                disabled={true}
                className="w-full py-3.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>REQUEST CORRECTION</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center leading-normal">
                Add at least one section comment or overall remarks before requesting correction
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCorrectionModal(true)}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>REQUEST CORRECTION</span>
            </button>
          )}

          <button
            onClick={saveInternalRemarksOnly}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-slate-500" />
            <span>Save Internal Remarks Only</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4.5 flex gap-3 text-slate-600 text-xs leading-normal">
          <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-slate-700">Finalized - Read Only Mode</h4>
            <p className="text-[11px] text-slate-500 mt-1">This report is locked. Visual and workmanship parameters are sealed permanently, and changes cannot be saved.</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setActiveReportId(null)}
        className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Queue</span>
      </button>
    </div>
  );
}

export default React.memo(ReviewActionsSidebar);
