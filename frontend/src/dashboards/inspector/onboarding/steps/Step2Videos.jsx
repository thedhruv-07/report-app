// frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx
import { useState } from 'react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const VIDEOS = [
  { id: 1, title: 'Introduction to PSI Inspections', duration: '12:34', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 2, title: 'Container Loading Supervision Guide', duration: '9:45', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 3, title: 'How to Use the IRMS Report App', duration: '15:20', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 4, title: 'Professional Conduct & Client Interaction', duration: '8:12', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
];

export default function Step2Videos({ onComplete }) {
  const { token } = useAuth();
  const [watched, setWatched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const watchedCount = VIDEOS.filter(v => watched[v.id]).length;
  const allWatched = watchedCount === VIDEOS.length;

  const handleMarkWatched = (id) => {
    setWatched(prev => ({ ...prev, [id]: true }));
  };

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS.ONBOARDING.COMPLETE_STEP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ step: 'videosWatched' }),
      });
      if (!res.ok) throw new Error('Failed to save progress');
      await onComplete();
    } catch {
      setError('Failed to save progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Training Videos</h2>
        <p className="text-slate-500 mt-1 text-sm">{watchedCount} of {VIDEOS.length} watched</p>
        <div className="w-48 bg-slate-200 rounded-full h-1.5 mt-3 mx-auto">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(watchedCount / VIDEOS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {VIDEOS.map(video => (
          <div
            key={video.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${watched[video.id] ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200'}`}
          >
            <div className="aspect-video bg-slate-900">
              <iframe
                src={video.url}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight">{video.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{video.duration}</p>
                </div>
                {watched[video.id] && (
                  <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">WATCHED</span>
                )}
              </div>
              {!watched[video.id] && (
                <button
                  onClick={() => handleMarkWatched(video.id)}
                  className="w-full text-sm font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors"
                >
                  Mark as Watched
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-rose-600 text-sm text-center mb-4">{error}</p>}

      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!allWatched || loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            : 'Continue to Assessment'
          }
        </button>
      </div>
    </div>
  );
}
