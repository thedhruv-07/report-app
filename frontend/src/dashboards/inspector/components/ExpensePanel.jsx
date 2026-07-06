import { useState, useEffect, useRef } from "react";
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { Upload, ExternalLink } from "lucide-react";
import CompactCard from './CompactCard';

export default function ExpensePanel({ taskId }) {
  const { token } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(ENDPOINTS.INSPECTOR.TASK_EXPENSE(taskId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(data => {
        setExpense(data.expense);
        setRemarks(data.expense?.remarks || '');
      })
      .catch(() => setLoadError(true));
  }, [taskId, token]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setUploadError(false);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(ENDPOINTS.INSPECTOR.TASK_EXPENSE_UPLOAD(taskId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setExpense(data.expense);
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveRemarks = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(ENDPOINTS.INSPECTOR.TASK_EXPENSE_REMARKS(taskId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setExpense(data.expense);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return <div className="text-sm text-red-600">Couldn't load expense data for this task. Try refreshing the page.</div>;
  }

  if (!expense) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <CompactCard title="Upload Receipts / Files">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx" />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading…' : 'Upload File'}
        </button>
        {uploadError && <p className="text-xs text-red-600 mt-1.5">Upload failed. Please try again.</p>}

        <div className="mt-3 space-y-1.5">
          {(expense.files || []).length === 0 ? (
            <p className="text-sm text-slate-400">No files uploaded yet.</p>
          ) : (
            expense.files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 py-1.5">
                <span className="text-slate-700">{f.fileName}</span>
                <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))
          )}
        </div>
      </CompactCard>

      <CompactCard title="Remarks">
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          placeholder="Expense notes (e.g. taxi fare, meals, lodging)…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <button
          onClick={handleSaveRemarks}
          disabled={saving}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Remarks'}
        </button>
        {saveError && <p className="text-xs text-red-600 mt-1.5">Couldn't save remarks. Please try again.</p>}
      </CompactCard>
    </div>
  );
}
