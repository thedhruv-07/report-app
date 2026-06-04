import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCcw, Mail, AlertTriangle, CheckCircle2, Search, Send } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';

const STATUS_BADGE = {
  queued: 'bg-slate-100 text-slate-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700'
};

export default function EmailMonitoringPanel() {
  const { token, user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.EMAILS.LIST, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load email logs');
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load email logs' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const retryEmail = async (id) => {
    try {
      const res = await fetch(ENDPOINTS.EMAILS.RETRY(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Retry failed');
      setToast({ type: 'success', message: 'Email alert sent successfully' });
      await fetchEmails();
      window.setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Retry failed' });
    }
  };

  const sendTestEmail = async () => {
    if (!testRecipient.trim()) {
      setToast({ type: 'error', message: 'Recipient email is required' });
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch(ENDPOINTS.EMAILS.TEST, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient: testRecipient.trim() })
      });
      if (!res.ok) throw new Error('Test email failed');
      setToast({ type: 'success', message: 'Email alert sent successfully' });
      await fetchEmails();
      window.setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Test email failed' });
    } finally {
      setSendingTest(false);
    }
  };

  const filtered = emails.filter(e => {
    const haystack = `${e.recipient || ''} ${e.subject || ''} ${e.type || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            Email Monitoring
          </h2>
          <p className="text-sm text-slate-500">Track sent, failed, and retried lifecycle emails.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipient, subject, type"
            className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Test recipient email
          </label>
          <input
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="name@company.com"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          onClick={sendTestEmail}
          disabled={sendingTest}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold"
        >
          <Send className="w-4 h-4" />
          {sendingTest ? 'Sending…' : 'Send Test Email'}
        </button>
      </div>

      {toast && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-slate-500">Loading email logs…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-slate-400 text-sm">No email logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Retry</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(email => (
                  <tr key={email._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-700">{email.recipient}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[260px]">
                      <p className="truncate">{email.subject}</p>
                      {email.failedReason && (
                        <p className="text-[11px] text-rose-500 mt-0.5 truncate" title={email.failedReason}>
                          ✕ {email.failedReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{email.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[email.status] || STATUS_BADGE.queued}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{email.retryCount || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => retryEmail(email._id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
