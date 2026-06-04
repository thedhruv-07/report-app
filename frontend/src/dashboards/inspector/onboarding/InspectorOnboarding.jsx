// frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { motion as Motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import { clearFormStorage } from '../../../shared/services';
import StepIndicator from './StepIndicator';

const Step1Manual = lazy(() => import('./steps/Step1Manual'));
const Step2Videos = lazy(() => import('./steps/Step2Videos'));
const Step3Assessment = lazy(() => import('./steps/Step3Assessment'));

const STEP_LABELS = ['User Manual', 'Training Videos', 'Assessment'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function InspectorOnboarding() {
  const { user, token, refreshOnboarding } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Persist currentStep to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('onboarding_current_step', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    if (!token) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(ENDPOINTS.ONBOARDING.STATUS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const onboarding = data.onboarding || {};
        let nextStep = 1;
        if (onboarding.manualRead && !onboarding.videosWatched) {
          nextStep = 2;
        } else if (onboarding.manualRead && onboarding.videosWatched && !onboarding.isCompleted) {
          nextStep = 3;
        } else if (onboarding.isCompleted) {
          nextStep = 3;
        }
        setCurrentStep(nextStep);
      } catch {
        // default stays at step 1
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [token]);

  const handleStepComplete = async () => {
    await refreshOnboarding();
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleAssessmentComplete = async () => {
    localStorage.removeItem('onboarding_current_step');
    // Clear all form drafts so the inspector starts with a clean slate
    ['/dashboard/pre-shipment', '/dashboard/container-loading', '/dashboard/during-production', '/dashboard/factory-audit', '/dashboard/social-audit']
      .forEach(route => clearFormStorage(route));
    await refreshOnboarding();
    navigate('/dashboard/inspector', { replace: true });
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const firstName = user?.name?.split(' ')[0] || 'Inspector';
  const progressPercentage = Math.round((currentStep / 3) * 100);

  // Animated background gradient
  const bgShapes = [
    { id: 1, top: '-10%', left: '-5%', size: '300px', delay: 0 },
    { id: 2, top: '20%', right: '-10%', size: '250px', delay: 0.3 },
    { id: 3, bottom: '10%', left: '10%', size: '200px', delay: 0.6 },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
        <Motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading your onboarding...</p>
        </Motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background shapes */}
      {bgShapes.map(shape => (
        <Motion.div
          key={shape.id}
          className="absolute rounded-full bg-slate-100/40 blur-3xl pointer-events-none"
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left,
            right: shape.right,
            bottom: shape.bottom,
          }}
          animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
          transition={{ duration: 8, delay: shape.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <Motion.div
        className="max-w-5xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Premium Hero Section */}
        <Motion.div className="text-center mb-12 sm:mb-16" variants={itemVariants}>
          <Motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Onboarding Progress</span>
          </Motion.div>

          <Motion.h1
            className="text-5xl lg:text-6xl font-bold text-slate-900 mb-4"
            variants={itemVariants}
          >
            Welcome, {firstName}
          </Motion.h1>

          <Motion.p
            className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            Complete these 3 steps to unlock your Inspector Dashboard and start accepting inspection assignments.
          </Motion.p>

          {/* Progress Circle Card */}
          <Motion.div
            className="inline-block bg-white border border-slate-300 rounded-xl px-8 py-6 shadow-sm"
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                  />
                  <Motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`}
                    strokeLinecap="round"
                    transition={{ duration: 1, ease: 'easeInOut' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1F4B7B" />
                      <stop offset="100%" stopColor="#1F4B7B" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-900 leading-none">
                      {progressPercentage}%
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Complete</p>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-700">
                  Step {currentStep} of 3
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {currentStep === 1 && 'Read the user manual'}
                  {currentStep === 2 && 'Watch training videos'}
                  {currentStep === 3 && 'Complete assessment'}
                </p>
              </div>
            </div>
          </Motion.div>
        </Motion.div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />

        {/* Step Content - with page transitions */}
        <Motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <Suspense fallback={<div className="max-w-6xl mx-auto min-h-128 bg-white border border-slate-200 rounded-3xl animate-pulse" />}>
            {currentStep === 1 && <Step1Manual onComplete={handleStepComplete} />}
            {currentStep === 2 && <Step2Videos onComplete={handleStepComplete} onPrevious={handlePreviousStep} />}
            {currentStep === 3 && <Step3Assessment onComplete={handleAssessmentComplete} onPrevious={handlePreviousStep} />}
          </Suspense>
        </Motion.div>

        {/* Footer tip */}
        <Motion.p
          className="text-center text-xs text-slate-500 mt-12 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          You can return to continue your onboarding at any time
        </Motion.p>
      </Motion.div>
    </div>
  );
}
