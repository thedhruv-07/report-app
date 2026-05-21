// frontend/src/dashboards/inspector/onboarding/steps/Step2Videos.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
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
  const [watched, setWatched] = useState({});
  const [loaded, setLoaded] = useState({});
  const [loadError, setLoadError] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const watchedCount = VIDEOS.filter(v => watched[v.id]).length;
  const allWatched = watchedCount === VIDEOS.length;
  const progressPct = (watchedCount / VIDEOS.length) * 100;

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div className="text-center mb-10" variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Training Videos</h2>
        <p className="text-slate-600 text-lg mb-6">
          Watch these essential training videos to understand your role and responsibilities
        </p>

        {/* Info Message */}
        <motion.div
          className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-blue-900 font-medium">
            💡 If videos don't load in the embedded player, click <span className="font-bold">"Watch on YouTube"</span> to view them directly, then mark as watched when done.
          </p>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          className="inline-block bg-white border border-slate-300 rounded-lg px-8 py-5 shadow-sm"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-6">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">
                {watchedCount} of {VIDEOS.length} watched
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {allWatched ? '✓ All videos completed!' : `${VIDEOS.length - watchedCount} remaining`}
              </p>
            </div>
            <div className="flex-1 min-w-[150px]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-orange-600">{progressPct.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-slate-300 rounded-full h-2.5">
                <motion.div
                  className="bg-blue-900 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
            {allWatched && (
              <motion.div
                className="text-emerald-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Check className="w-6 h-6" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Videos Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
        variants={containerVariants}
      >
        {VIDEOS.map((video, idx) => (
          <motion.div
            key={video.id}
            className={`group relative bg-white border rounded-lg shadow-sm overflow-hidden transition-all duration-300 cursor-pointer ${
              watched[video.id]
                ? 'border-orange-300 shadow-orange-100'
                : 'border-slate-300 hover:border-slate-400 hover:shadow-sm'
            }`}
            variants={itemVariants}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
          >
            {/* Video Thumbnail - lazy load iframe on click, fallback to YouTube link if blocked */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden group-hover:brightness-90 transition-all">
              {loaded[video.id] && !loadError[video.id] ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.videoId}?modestbranding=1&rel=0`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  onError={() => setLoadError(prev => ({ ...prev, [video.id]: true }))}
                />
              ) : (
                <>
                  <div
                    className="w-full h-full bg-center bg-cover"
                    style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg)` }}
                    aria-hidden
                  />

                  {/* Play Icon Overlay - clicking loads the embed */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => setLoaded(prev => ({ ...prev, [video.id]: true }))}
                      className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center border border-white/20 hover:scale-105 transition-transform"
                      aria-label={`Play ${video.title}`}
                    >
                      <Play className="w-8 h-8 text-white" />
                    </button>
                  </div>

                  {/* If iframe load failed, show fallback link */}
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

              {/* Watched Badge */}
              {watched[video.id] && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-transparent flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Check className="w-8 h-8 text-orange-400" />
                    <span className="text-orange-300 text-sm font-bold">WATCHED</span>
                  </motion.div>
                </motion.div>
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
              {!watched[video.id] ? (
                <div className="space-y-2">
                  <motion.button
                    onClick={() => handleMarkWatched(video.id)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 border-2 border-orange-300 hover:bg-orange-50 py-2.5 rounded-lg transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check className="w-4 h-4" />
                    Mark as Watched
                  </motion.button>
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
                <motion.div
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-300 py-2.5 rounded-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Check className="w-4 h-4" />
                  Completed
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Section */}
      <motion.div
        className="flex flex-col items-center gap-6"
        variants={itemVariants}
      >
        {error && (
          <motion.div
            className="w-full bg-rose-50 border border-rose-300 text-rose-700 px-6 py-4 rounded-xl text-sm font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ❌ {error}
          </motion.div>
        )}

        {!allWatched && (
          <motion.p
            className="text-slate-600 text-center font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Watch all {VIDEOS.length} videos to unlock the next step
          </motion.p>
        )}

        <motion.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={onPrevious}
            className="flex items-center gap-2 font-semibold px-6 py-3 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Manual
          </motion.button>

          <motion.button
            onClick={handleContinue}
            disabled={!allWatched || loading}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all duration-200 ${
              allWatched && !loading
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
            whileHover={allWatched && !loading ? { scale: 1.02 } : {}}
            whileTap={allWatched && !loading ? { scale: 0.98 } : {}}
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
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
