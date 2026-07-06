import { useState } from 'react';
import { AlertTriangle, X, Building, Send } from 'lucide-react';

export default function ClientIssueModal({
  clientIssueModalOpen,
  setClientIssueModalOpen,
  activeBooking,
  handleReportClientIssue,
}) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!clientIssueModalOpen || !activeBooking) return null;

  const close = () => {
    setClientIssueModalOpen(false);
    setComment('');
  };

  const submit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await handleReportClientIssue(comment.trim());
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={close}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button onClick={close} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-black text-slate-800">Report Client Issue</h3>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Send report <strong className="text-slate-700">{activeBooking.reportId}</strong> back to the original inspector to fix, based on the client's feedback.
          </p>
        </div>

        <div className="p-6 bg-slate-50 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
            <p className="font-semibold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              {activeBooking.clientName}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">What did the client say?</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Describe the client's complaint or requested change…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <button
            onClick={submit}
            disabled={submitting || !comment.trim()}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {submitting ? 'Sending…' : 'Send Back to Inspector'}
          </button>
        </div>
      </div>
    </div>
  );
}
