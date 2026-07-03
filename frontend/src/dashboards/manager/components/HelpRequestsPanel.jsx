import { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';

export default function HelpRequestsPanel() {
  const { token } = useAuth();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sendingId, setSendingId] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(ENDPOINTS.MANAGER.HELP_REQUESTS, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHelpRequests(data.helpRequests || []))
      .catch(() => setHelpRequests([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleReply = async (id) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text || sendingId) return;
    setSendingId(id);
    try {
      const res = await fetch(ENDPOINTS.MANAGER.REPLY_HELP_REQUEST(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setHelpRequests(prev => prev.map(h => h._id === id ? data.helpRequest : h));
        setReplyDrafts(prev => ({ ...prev, [id]: '' }));
      }
    } catch {
      // silently ignore — the textarea keeps the draft so the manager can retry
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return <div className="px-6 py-8"><div className="max-w-3xl mx-auto animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white border border-slate-200 rounded-3xl" />)}</div></div>;
  }

  return (
    <div className="px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-300">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Inspector Help Requests</h3>
          <p className="text-slate-400 text-xs mt-0.5">Messages inspectors have sent while filling in report forms.</p>
        </div>

        {helpRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-sm">
            No help requests yet.
          </div>
        ) : (
          helpRequests.map(hr => (
            <div key={hr._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{hr.inspectorName}</p>
                    <p className="text-[11px] text-slate-400">
                      {[hr.reportType, hr.sectionLabel].filter(Boolean).join(' — Section: ') || 'No report context'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{new Date(hr.createdAt).toLocaleString()}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700">
                {hr.message}
              </div>

              {hr.replies?.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-blue-100">
                  {hr.replies.map((r, idx) => (
                    <div key={idx} className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-blue-700">{r.repliedByName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(r.repliedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyDrafts[hr._id] || ''}
                  onChange={e => setReplyDrafts(prev => ({ ...prev, [hr._id]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleReply(hr._id); }}
                  placeholder="Type a reply…"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={() => handleReply(hr._id)}
                  disabled={sendingId === hr._id || !(replyDrafts[hr._id] || '').trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingId === hr._id ? 'Sending…' : 'Reply'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
