import React from 'react';
import { AlertTriangle, Camera } from 'lucide-react';
import ReportSection from './ReportSection';

function ReviewContentPane({
  activeReport,
  collapsedSections,
  setCollapsedSections,
  commentInputs,
  setCommentInputs,
  clearSectionComment,
  saveSectionComment,
  SECTIONS_CONFIG,
  getTypeBadgeClass,
  getStatusBadgeClass
}) {
  return (
    <div className="flex-1 lg:w-[65%] h-full flex flex-col gap-6 overflow-y-auto pr-2 pb-12">
      {activeReport.revisionRound > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex gap-3 shadow-sm items-start">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Resubmission — Round {activeReport.revisionRound}</h4>
            <p className="text-xs text-amber-700 mt-0.5">This report has been resubmitted after corrections. Please review the inspector's updates thoroughly.</p>
          </div>
        </div>
      )}

      {activeReport.correctionFeedback.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex gap-3 shadow-sm items-start">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">⚠ Action Required: Correction Feedback Active</h4>
            <p className="text-xs text-rose-700 mt-0.5">This report contains active correction remarks. Section-specific feedback is shown inline below.</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Report Details</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeClass(activeReport.inspectionType)}`}>
                {activeReport.inspectionType}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">{activeReport.displayId} — {activeReport.clientName}</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Current State:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(activeReport.status)}`}>
              {activeReport.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-500">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Client Name</p>
            <p className="text-slate-800 font-bold text-sm mt-0.5">{activeReport.clientName}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Lead Inspector</p>
            <p className="text-slate-800 font-bold text-sm mt-0.5">{activeReport.inspectorName}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Submission Date</p>
            <p className="text-slate-800 font-bold text-sm mt-0.5">{activeReport.submissionDate}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Revision Round</p>
            <p className="text-slate-800 font-bold text-sm mt-0.5">
              {activeReport.revisionRound === 0 ? 'Initial (No corrections)' : `Round ${activeReport.revisionRound}`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(SECTIONS_CONFIG).map(([sectionKey, config]) => {
          const sectionData = activeReport.templateData[sectionKey];
          const isCollapsed = collapsedSections[sectionKey];
          const sectionFeedback = activeReport.correctionFeedback.find((feedback) => feedback.section === sectionKey);

          return (
            <ReportSection
              key={sectionKey}
              sectionKey={sectionKey}
              config={config}
              sectionData={sectionData}
              sectionFeedback={sectionFeedback}
              isCollapsed={isCollapsed}
              onToggle={() => setCollapsedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
              activeStatus={activeReport.status}
              commentValue={commentInputs[sectionKey].comment}
              commentPriority={commentInputs[sectionKey].priority}
              onCommentChange={(comment) => setCommentInputs((prev) => ({
                ...prev,
                [sectionKey]: { ...prev[sectionKey], comment }
              }))}
              onPriorityChange={(priority) => setCommentInputs((prev) => ({
                ...prev,
                [sectionKey]: { ...prev[sectionKey], priority }
              }))}
              onPrimeComment={() => setCommentInputs((prev) => ({
                ...prev,
                [sectionKey]: {
                  comment: sectionFeedback ? sectionFeedback.comment : '',
                  priority: sectionFeedback ? sectionFeedback.priority : 'Critical'
                }
              }))}
              onClearComment={() => clearSectionComment(sectionKey)}
              onSaveComment={() => saveSectionComment(sectionKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(ReviewContentPane);
