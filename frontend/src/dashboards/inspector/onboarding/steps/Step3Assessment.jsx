// frontend/src/dashboards/inspector/onboarding/steps/Step3Assessment.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../../../config/api';
import { useAuth } from '../../../../context/AuthContext';

export default function Step3Assessment({ onComplete }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOptionIndex }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null); // { passed, score, correctCount, totalCount, categoryBreakdown }

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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading assessment...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-20">
        <p className="text-rose-600 font-medium">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-indigo-600 underline text-sm">
          Refresh page
        </button>
      </div>
    );
  }

  // Results screen
  if (result) {
    const missedCategories = result.categoryBreakdown
      ? Object.entries(result.categoryBreakdown).filter(([, s]) => s.correct < s.total)
      : [];

    return (
      <div className="max-w-lg mx-auto text-center">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-6 ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {result.passed ? '✓' : '✗'}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
          {result.passed ? 'Congratulations! You passed.' : "Not quite — let's try again."}
        </h2>
        <p className="text-slate-700 text-lg font-semibold mb-1">Score: {result.score}%</p>
        <p className="text-slate-500 text-sm mb-8">
          {result.correctCount} of {result.totalCount} correct &mdash; {result.passed ? 'minimum 70% required' : 'need 70% to pass'}
        </p>

        {result.passed && (
          <p className="text-slate-600 mb-8">
            You have completed all onboarding steps. You now have full access to the Inspector Dashboard.
          </p>
        )}

        {!result.passed && missedCategories.length > 0 && (
          <div className="bg-rose-50 rounded-xl p-5 mb-8 text-left border border-rose-100">
            <p className="font-semibold text-rose-800 mb-3 text-sm">Areas to review before retrying:</p>
            {missedCategories.map(([category, stats]) => (
              <div key={category} className="flex justify-between items-center text-sm text-rose-700 py-1.5 border-b border-rose-100 last:border-0">
                <span>{category}</span>
                <span className="font-semibold">{stats.correct}/{stats.total} correct</span>
              </div>
            ))}
          </div>
        )}

        {result.passed ? (
          <button
            onClick={() => navigate('/dashboard/inspector')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 py-3 rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-3 rounded-xl transition-colors"
          >
            Retry Assessment
          </button>
        )}
      </div>
    );
  }

  // Quiz screen
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{answeredCount} of {questions.length} answered</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-6">
        <p className="font-semibold text-slate-800 text-base leading-relaxed mb-6">{question.question}</p>
        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <label
              key={idx}
              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                answers[question._id] === idx
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name={`q-${question._id}`}
                checked={answers[question._id] === idx}
                onChange={() => handleSelectAnswer(question._id, idx)}
                className="accent-indigo-600 shrink-0"
              />
              <span className="text-sm text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(i => i - 1)}
          disabled={currentIndex === 0}
          className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {submitError && (
          <p className="text-rose-600 text-xs text-center flex-1 mx-4">{submitError}</p>
        )}

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            title={answeredCount < questions.length ? `Answer all ${questions.length} questions to submit` : ''}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              : `Submit (${answeredCount}/${questions.length} answered)`
            }
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
