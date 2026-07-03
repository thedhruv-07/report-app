import { useState, useEffect } from 'react';
import { MessageCircle, X, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';

function MessageDetailModal({ helpRequest, onClose, currentUserId, replyDraft, onReplyDraftChange, onSend, sending }) {
  if (!helpRequest) return null;
  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between rounded-t-3xl shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Question</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {[helpRequest.reportType, helpRequest.sectionLabel].filter(Boolean).join(' — Section: ') || 'No report context'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700">
            {helpRequest.message}
            <div className="text-[11px] text-slate-400 mt-2">{new Date(helpRequest.createdAt).toLocaleString()}</div>
          </div>

          {helpRequest.replies?.length > 0 ? (
            <div className="space-y-2 pl-4 border-l-2 border-blue-100">
              {helpRequest.replies.map((r, idx) => {
                const isMine = currentUserId && r.repliedBy === currentUserId;
                return (
                  <div
                    key={idx}
                    className={`border rounded-xl p-3 text-sm ${isMine ? 'bg-emerald-50/40 border-emerald-100' : 'bg-blue-50/40 border-blue-100'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isMine ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {isMine ? 'You' : r.repliedByName}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(r.repliedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{r.message}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No reply yet — check back later.</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-2">
          <input
            type="text"
            value={replyDraft}
            onChange={e => onReplyDraftChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSend(); }}
            placeholder="Type a reply…"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            onClick={onSend}
            disabled={sending || !replyDraft.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
          >
            {sending ? 'Sending…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPanel() {
  const { token, user } = useAuth();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.INSPECTOR.HELP_REQUESTS, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHelpRequests(data.helpRequests || []))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReply = async () => {
    const text = replyDraft.trim();
    if (!text || sending || !selected) return;
    setSending(true);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.REPLY_HELP_REQUEST(selected._id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setHelpRequests(prev => prev.map(h => h._id === selected._id ? data.helpRequest : h));
        setSelected(data.helpRequest);
        setReplyDraft('');
      }
    } catch {
      // silently ignore — the textarea keeps the draft so the inspector can retry
    } finally {
      setSending(false);
    }
  };

  if (loading || helpRequests.length === 0) return null;

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-800">Messages</h3>
          <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full">{helpRequests.length}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {helpRequests.map(hr => (
            <button
              key={hr._id}
              onClick={() => setSelected(hr)}
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{hr.message}</p>
                  <p className="text-[11px] text-slate-400">
                    {[hr.reportType, hr.sectionLabel].filter(Boolean).join(' — Section: ') || 'No report context'}
                    {hr.replies?.length > 0 && ` · ${hr.replies.length} repl${hr.replies.length === 1 ? 'y' : 'ies'}`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <MessageDetailModal
        helpRequest={selected}
        onClose={() => { setSelected(null); setReplyDraft(''); }}
        currentUserId={user?.id}
        replyDraft={replyDraft}
        onReplyDraftChange={setReplyDraft}
        onSend={handleReply}
        sending={sending}
      />
    </>
  );
}
