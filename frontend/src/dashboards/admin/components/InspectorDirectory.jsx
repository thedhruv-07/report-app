// frontend/src/dashboards/admin/components/InspectorDirectory.jsx
import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../context/AuthContext';

function OnboardingBadge({ onboarding }) {
  if (!onboarding || (!onboarding.isCompleted && !onboarding.manualRead && !onboarding.videosWatched)) {
    return (
      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
        Not Started
      </span>
    );
  }
  if (onboarding.isCompleted) {
    const completedDate = onboarding.completedAt
      ? new Date(onboarding.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
          Completed
        </span>
        {completedDate && <span className="text-[9px] text-slate-400 ml-0.5">{completedDate}</span>}
      </div>
    );
  }
  return (
    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
      In Progress
    </span>
  );
}

export default function InspectorDirectory({ activeView }) {
  const { token } = useAuth();
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeView !== 'inspectors') return;
    setLoading(true);
    setError(null);
    fetch(ENDPOINTS.ADMIN.INSPECTORS, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load inspectors');
        return res.json();
      })
      .then(data => setInspectors(data.inspectors || []))
      .catch(() => setError('Failed to load inspector data. Please refresh.'))
      .finally(() => setLoading(false));
  }, [activeView, token]);

  if (activeView !== 'inspectors') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading inspectors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-rose-600 font-medium">{error}</p>
        <button onClick={() => setError(null)} className="mt-3 text-indigo-600 underline text-sm">Retry</button>
      </div>
    );
  }

  if (inspectors.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">No inspectors found.</div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspectors.map(inspector => (
          <div key={inspector._id} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            {/* Avatar + name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-indigo-200 flex items-center justify-center font-black text-indigo-700 text-xl">
                  {inspector.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{inspector.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Joined {new Date(inspector.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{inspector.email}</span>
            </div>

            {/* Onboarding status */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Onboarding</span>
              <OnboardingBadge onboarding={inspector.onboarding} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
