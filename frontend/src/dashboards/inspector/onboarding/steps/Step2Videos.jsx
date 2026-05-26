// frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx
import { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import { Check, Play, Clock, ArrowRight, ChevronLeft } from 'lucide-react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const VIDEOS = [
  { id: 1, title: 'Absolute Veritas Inspection Service', duration: '6:37', videoId: 'ppFuYFH6Sa8', youtubeUrl: 'https://youtu.be/ppFuYFH6Sa8' },
  { id: 2, title: 'Pre-Shipment Inspection (PSI) Overview', duration: '4:06', videoId: 'xSGf7UA1mMk', youtubeUrl: 'https://youtu.be/xSGf7UA1mMk' },
  { id: 3, title: 'Container Loading Supervision (CLS) Guide', duration: '4:35', videoId: 'MfzJsa5ypRs', youtubeUrl: 'https://youtu.be/MfzJsa5ypRs' },
  { id: 4, title: 'Factory Audit (FA) Guide', duration: '3:07', videoId: 'Fp02OdDyvo4', youtubeUrl: 'https://youtu.be/Fp02OdDyvo4' },
  { id: 5, title: 'During Production Inspection (DPI) Process', duration: '4:53', videoId: 'jGWIVMjhQuI', youtubeUrl: 'https://youtu.be/jGWIVMjhQuI' },
];

export default function Step2Videos({ onComplete, onPrevious }) {
  const { token } = useAuth();
  const [watchedProgress, setWatchedProgress] = useState({});
  const [videosUnlocked, setVideosUnlocked] = useState({});
  const [loaded, setLoaded] = useState({});
  const [loadError, setLoadError] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const playersRef = useRef({});
  const savedToBackendRef = useRef({});
  const ytReadyRef = useRef(false);
  const pendingVideoIdsRef = useRef(new Set());
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const unlockedCount = VIDEOS.filter(v => videosUnlocked[v.id]).length;
  const allUnlocked = unlockedCount === VIDEOS.length;
  const progressPct = (unlockedCount / VIDEOS.length) * 100;

  // Always-current player creator — stored in a ref to avoid stale closures in callbacks
  const createPlayerRef = useRef(null);
  createPlayerRef.current = (video) => {
    if (playersRef.current[video.id]) return;
    if (!ytReadyRef.current || !window.YT?.Player) {
      pendingVideoIdsRef.current.add(video.id);
      return;
    }
    const el = document.getElementById(`yt-player-${video.id}`);
    if (!el) {
      setTimeout(() => createPlayerRef.current?.(video), 50);
      return;
    }
    playersRef.current[video.id] = new window.YT.Player(`yt-player-${video.id}`, {
      host: 'https://www.youtube-nocookie.com',
      videoId: video.videoId,
      playerVars: { modestbranding: 1, rel: 0, autoplay: 1 },
      events: {
        onError: () => setLoadError(prev => ({ ...prev, [video.id]: true })),
      },
    });
  };

  useEffect(() => {
    // Restore saved video progress from backend on mount
    fetch(ENDPOINTS.ONBOARDING.STATUS, {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    })
      .then(r => r.json())
      .then(data => {
        const vp = data.onboarding?.videoProgress || {};
        const unlocked = {};
        VIDEOS.forEach(v => {
          if (vp[`video${v.id}`]) {
            unlocked[v.id] = true;
            savedToBackendRef.current[v.id] = true;
          }
        });
        if (Object.keys(unlocked).length > 0) setVideosUnlocked(unlocked);
      })
      .catch(() => {});

    // Wire up YouTube IFrame API — preserve any existing callback
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      if (typeof prevCallback === 'function') prevCallback();
      pendingVideoIdsRef.current.forEach(id => {
        const video = VIDEOS.find(v => v.id === id);
        if (video) createPlayerRef.current?.(video);
      });
      pendingVideoIdsRef.current.clear();
    };

    if (window.YT?.Player) {
      ytReadyRef.current = true;
    } else if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }

    // Poll all active players every 2 seconds for watch progress
    const intervalId = setInterval(() => {
      Object.entries(playersRef.current).forEach(([idStr, player]) => {
        const id = Number(idStr);
        try {
          if (!player || typeof player.getCurrentTime !== 'function') return;
          const current = player.getCurrentTime();
          const duration = player.getDuration();
          if (!duration || duration <= 0) return;

          const progress = current / duration;

          setWatchedProgress(prev => {
            const next = Math.max(prev[id] || 0, progress);
            return next !== (prev[id] || 0) ? { ...prev, [id]: next } : prev;
          });

          // First time hitting 50%: unlock and persist to backend
          if (progress >= 0.5 && !savedToBackendRef.current[id]) {
            savedToBackendRef.current[id] = true;
            setVideosUnlocked(prev => prev[id] ? prev : { ...prev, [id]: true });
            fetch(ENDPOINTS.ONBOARDING.VIDEO_PROGRESS, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
              body: JSON.stringify({ videoId: `video${id}` }),
            }).catch(() => {});
          }
        } catch {
          // Player may not be in a playable state yet
        }
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);  

  const handlePlay = (video) => {
    setLoaded(prev => ({ ...prev, [video.id]: true }));
    // Wait one tick for React to render the placeholder div, then create the YT player
    setTimeout(() => createPlayerRef.current?.(video), 50);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <Motion.div
      className="max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <Motion.div className="text-center mb-10" variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Training Videos</h2>
        <p className="text-slate-600 text-lg mb-6">
          Watch these essential training videos to understand your role and responsibilities
        </p>

        {/* Info Message */}
        <Motion.div
          className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-blue-900 font-medium">
            💡 Watch at least <span className="font-bold">50%</span> of each video to unlock the next step. If the embedded player doesn't load, click <span className="font-bold">"Watch on YouTube"</span> to view it directly.
          </p>
        </Motion.div>

        {/* Progress Card */}
        <Motion.div
          className="inline-block bg-white border border-slate-300 rounded-lg px-8 py-5 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-6">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">
                {unlockedCount} of {VIDEOS.length} completed
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {allUnlocked ? '✓ All videos completed!' : `${VIDEOS.length - unlockedCount} remaining`}
              </p>
            </div>
            <div className="flex-1 min-w-37.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-orange-600">{progressPct.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-slate-300 rounded-full h-2.5">
                <Motion.div
                  className="bg-blue-900 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
            {allUnlocked && (
              <Motion.div
                className="text-emerald-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Check className="w-6 h-6" />
              </Motion.div>
            )}
          </div>
        </Motion.div>
      </Motion.div>

      {/* Videos Grid */}
      <Motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
        variants={containerVariants}
      >
        {VIDEOS.map((video) => (
          <Motion.div
            key={video.id}
            className={`group relative bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-300 cursor-pointer ${
              videosUnlocked[video.id]
                ? 'border-orange-300 shadow-orange-100'
                : 'border-slate-300 hover:border-slate-400 hover:shadow-sm'
            }`}
            variants={itemVariants}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
          >
            {/* Video Thumbnail — YT player replaces the div once loaded */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden group-hover:brightness-90 transition-all">
              {loaded[video.id] && !loadError[video.id] ? (
                <div id={`yt-player-${video.id}`} className="w-full h-full" />
              ) : (
                <>
                  <div
                    className="w-full h-full bg-center bg-cover"
                    style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg)` }}
                    aria-hidden
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => handlePlay(video)}
                      className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center border border-white/20 hover:scale-105 transition-transform"
                      aria-label={`Play ${video.title}`}
                    >
                      <Play className="w-8 h-8 text-white" />
                    </button>
                  </div>

                  {loadError[video.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4">
                      <div className="text-center">
                        <p className="text-white font-semibold mb-2">Embedded player is blocked by your browser or extensions.</p>
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-white text-blue-900 px-4 py-2 rounded-md font-medium"
                        >
                          Open on YouTube
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Watched overlay badge */}
              {videosUnlocked[video.id] && (
                <Motion.div
                  className="absolute inset-0 bg-linear-to-t from-orange-900/80 to-transparent flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Check className="w-8 h-8 text-orange-400" />
                    <span className="text-orange-300 text-sm font-bold">WATCHED</span>
                  </Motion.div>
                </Motion.div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 leading-snug">{video.title}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{video.duration}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!videosUnlocked[video.id] ? (
                <div>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1.5 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Watch on YouTube
                  </a>
                </div>
              ) : (
                <Motion.div
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-300 py-2.5 rounded-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Check className="w-4 h-4" />
                  Completed
                </Motion.div>
              )}

              {/* Watch progress bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(watchedProgress[video.id] || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Status badge */}
              <div className="mt-2">
                {videosUnlocked[video.id] ? (
                  <Motion.span
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Check className="w-3 h-3" />
                    Completed
                  </Motion.span>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    Watch at least 50% to continue
                  </span>
                )}
              </div>
            </div>
          </Motion.div>
        ))}
      </Motion.div>

      {/* CTA Section */}
      <Motion.div
        className="flex flex-col items-center gap-6"
        variants={itemVariants}
      >
        {error && (
          <Motion.div
            className="w-full bg-rose-50 border border-rose-300 text-rose-700 px-6 py-4 rounded-xl text-sm font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ❌ {error}
          </Motion.div>
        )}

        {!allUnlocked && (
          <Motion.p
            className="text-slate-600 text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Watch at least 50% of all {VIDEOS.length} videos to unlock the next step
          </Motion.p>
        )}

        <Motion.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Motion.button
            onClick={onPrevious}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Manual
          </Motion.button>

          <Motion.button
            onClick={handleContinue}
            disabled={!allUnlocked || loading}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all duration-200 ${
              allUnlocked && !loading
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
            whileHover={allUnlocked && !loading ? { scale: 1.02 } : {}}
            whileTap={allUnlocked && !loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Progress...
              </>
            ) : (
              <>
                Continue to Assessment
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Motion.button>
        </Motion.div>
      </Motion.div>
    </Motion.div>
  );
}
