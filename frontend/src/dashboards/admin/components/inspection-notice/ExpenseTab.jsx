import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { ENDPOINTS } from '../../../../config/api';
import SectionCard from './SectionCard';

export default function ExpenseTab({ recordId, token }) {
  const [expenses, setExpenses] = useState(null);

  useEffect(() => {
    if (!recordId) return;
    fetch(`${ENDPOINTS.BASE_URL}/api/inspection-notices/${recordId}/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setExpenses(data.expenses || []))
      .catch(() => setExpenses([]));
  }, [recordId, token]);

  if (!recordId) {
    return <div className="p-8 text-center text-slate-500 text-sm">Save the notice as a draft first to see expense submissions here.</div>;
  }

  if (expenses === null) {
    return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  }

  if (expenses.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-sm">No inspector has submitted expenses for this notice yet.</div>;
  }

  return (
    <div className="space-y-6">
      {expenses.map((exp) => (
        <SectionCard key={exp._id} title={exp.inspectorId?.name || 'Inspector'}>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Files</div>
            {(exp.files || []).length === 0 ? (
              <p className="text-sm text-slate-400">No files uploaded.</p>
            ) : (
              exp.files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-100 last:border-0 py-1.5">
                  <span className="text-slate-700">{f.fileName}</span>
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-[#6C47FF] font-semibold flex items-center gap-1 hover:underline">
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
          {exp.remarks && (
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</div>
              <p className="text-sm text-slate-700">{exp.remarks}</p>
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
