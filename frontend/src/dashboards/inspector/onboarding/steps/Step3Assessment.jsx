// frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Trophy, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

const Confetti = () => {
  return null; // Removed for professional design
};

export default function Step3Assessment({ onComplete, onPrevious }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoadingQuestions(true);
      setFetchError(null);
      try {
        const res = await fetch(ENDPOINTS.ONBOARDING.QUESTIONS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load questions');
        const data = await res.json();
        setQuestions(data.questions);
      } catch {
        setFetchError('Failed to load assessment questions. Please refresh the page.');
      } finally {
        setLoadingQuestions(false);
      }
    };
    load();
  }, [token]);

  const handleSelectAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const answersPayload = questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id] ?? -1,
      }));
      const res = await fetch(ENDPOINTS.ONBOARDING.SUBMIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: answersPayload }),
      });
      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();
      setResult(data);
      if (data.passed) await onComplete();
    } catch {
      setSubmitError('Failed to submit. Your answers are preserved — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  if (loadingQuestions) {
    return (
      <Motion.div
        className="flex flex-col items-center justify-center py-20 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Motion.div
          className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-slate-600 font-semibold">Loading assessment...</p>
      </Motion.div>
    );
  }

  if (fetchError) {
    return (
      <Motion.div
        className="max-w-md mx-auto text-center py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Motion.div
          className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </Motion.div>
        <h3 className="text-slate-900 font-bold text-lg mb-2">Failed to Load Questions</h3>
        <p className="text-slate-600 text-sm mb-6">{fetchError}</p>
        <Motion.button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Refresh Page
        </Motion.button>
      </Motion.div>
    );
  }

  if (questions.length === 0) {
    return (
      <Motion.div
        className="text-center py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-slate-900 font-bold text-lg mb-2">No questions available</p>
        <p className="text-slate-600 text-sm">Please contact support to complete your onboarding.</p>
      </Motion.div>
    );
  }

  // Results screen
  if (result) {
    const missedCategories = result.categoryBreakdown
      ? Object.entries(result.categoryBreakdown).filter(([, s]) => s.correct < s.total)
      : [];

    return (
      <Motion.div
        className="max-w-lg mx-auto text-center py-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {result.passed && <Confetti />}

        <Motion.div
          className={`w-28 h-28 rounded-lg mx-auto flex items-center justify-center text-5xl font-bold mb-8 ${
            result.passed
              ? 'bg-orange-50 text-orange-600'
              : 'bg-rose-50 text-rose-600'
          }`}
          animate={
            result.passed
              ? { scale: [0, 1.1, 1], rotate: [0, 10, 0] }
              : { shake: true }
          }
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        >
          {result.passed ? '✓' : '—'}
        </Motion.div>

        <Motion.h2
          className={`text-2xl font-bold mb-3 ${
            result.passed ? 'text-blue-900' : 'text-rose-700'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {result.passed ? 'Assessment Passed' : 'Assessment Not Passed'}
        </Motion.h2>

        {/* Score Card */}
        <Motion.div
          className="bg-white border border-slate-300 rounded-lg p-8 mb-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center mb-6">
            <p className="text-slate-600 text-sm font-semibold mb-2">Your Score</p>
            <Motion.p
              className={`text-5xl font-bold ${
                result.passed ? 'text-orange-600' : 'text-rose-600'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              {result.score}%
            </Motion.p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className={`font-semibold text-sm ${
              result.passed ? 'text-orange-700' : 'text-rose-700'
            }`}>
              {result.correctCount} of {result.totalCount} correct
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {result.passed ? '✓ You have exceeded the 70% passing requirement' : '⚠ You need at least 70% to pass'}
            </p>
          </div>

          {!result.passed && missedCategories.length > 0 && (
            <Motion.div
              className="bg-rose-50 rounded-xl p-5 border border-rose-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <p className="font-bold text-rose-800 text-sm">Areas to Review</p>
              </div>
              <div className="space-y-2">
                {missedCategories.map(([category, stats]) => (
                  <div key={category} className="flex justify-between text-sm text-rose-700">
                    <span>{category}</span>
                    <span className="font-bold">{stats.correct}/{stats.total}</span>
                  </div>
                ))}
              </div>
            </Motion.div>
          )}
        </Motion.div>

        {/* Success Message */}
        {result.passed && (
          <Motion.p
            className="text-slate-700 mb-8 text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            You now have full access to the Inspector Dashboard! 🎊
          </Motion.p>
        )}

        {/* CTA Buttons */}
        <Motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {result.passed ? (
            <>
              <Motion.button
                onClick={() => navigate('/dashboard/inspector')}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Motion.button>
              <Motion.button
                onClick={onPrevious}
                className="flex items-center justify-center gap-2 bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold px-8 py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Training Videos
              </Motion.button>
            </>
          ) : (
            <>
              <Motion.button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-5 h-5" />
                Retry Assessment
              </Motion.button>
              <Motion.button
                onClick={onPrevious}
                className="flex items-center justify-center gap-2 bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold px-8 py-3 rounded-lg transition-colors"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Training Videos
              </Motion.button>
            </>
          )}
        </Motion.div>
      </Motion.div>
    );
  }

  // Quiz screen
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <Motion.div
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Back Navigation */}
      <Motion.button
        onClick={onPrevious}
        className="mb-6 flex items-center gap-2 text-blue-900 hover:text-blue-800 font-semibold transition-colors"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Training Videos
      </Motion.button>

      {/* Progress Section */}
      <Motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-orange-600">{progressPct.toFixed(0)}%</p>
            <p className="text-xs text-slate-600">Progress</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <Motion.div
            className="bg-blue-900 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </Motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={currentIndex}
          className="bg-white border border-slate-300 rounded-lg shadow-sm p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Difficulty Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
            <Motion.div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest ${
                question.difficulty === 'easy'
                  ? 'bg-blue-50 text-blue-700'
                  : question.difficulty === 'medium'
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {question.difficulty}
            </Motion.div>
          </div>

          {/* Question Text */}
          <h3 className="text-lg font-bold text-slate-900 mb-6 leading-relaxed">
            {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = answers[question._id] === idx;

              return (
                <Motion.label
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Motion.div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-slate-300'
                    }`}
                    animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                  >
                    {isSelected && (
                      <Motion.div
                        className="w-2 h-2 bg-white rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </Motion.div>
                  <input
                    type="radio"
                    name={`q-${question._id}`}
                    checked={isSelected}
                    onChange={() => handleSelectAnswer(question._id, idx)}
                    className="hidden"
                  />
                  <span className={`font-medium text-sm ${
                    isSelected ? 'text-slate-900' : 'text-slate-700'
                  }`}>
                    {option}
                  </span>
                </Motion.label>
              );
            })}
          </div>
        </Motion.div>
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {submitError && (
          <Motion.div
            className="mb-6 bg-rose-50 border border-rose-300 text-rose-700 px-5 py-4 rounded-xl text-sm font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ❌ {submitError}
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <Motion.div
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Motion.button
          onClick={() => setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </Motion.button>

        <div className="flex-1 text-center text-sm text-slate-600 font-medium">
          {answeredCount === questions.length
            ? '✓ All questions answered'
            : `${questions.length - answeredCount} remaining`
          }
        </div>

        {isLast ? (
          <Motion.button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            title={answeredCount < questions.length ? `Answer all ${questions.length} questions to submit` : ''}
            className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-all ${
              submitting || answeredCount < questions.length
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
            whileHover={submitting || answeredCount < questions.length ? {} : { scale: 1.05, y: -2 }}
            whileTap={submitting || answeredCount < questions.length ? {} : { scale: 0.95 }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                Submit Assessment
              </>
            )}
          </Motion.button>
        ) : (
          <Motion.button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 text-white font-bold hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Motion.button>
        )}
      </Motion.div>
    </Motion.div>
  );
}
