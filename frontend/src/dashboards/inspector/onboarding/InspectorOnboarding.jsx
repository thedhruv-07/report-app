// frontend/src/dashboards/inspector/onboarding/InspectorOnboarding.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ENDPOINTS } from '../../../config/api';
import StepIndicator from './StepIndicator';
import Step1Manual from './steps/Step1Manual';
import Step2Videos from './steps/Step2Videos';
import Step3Assessment from './steps/Step3Assessment';

const STEP_LABELS = ['User Manual', 'Training Videos', 'Assessment'];

export default function InspectorOnboarding() {
  const { user, token, refreshOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // On mount, determine the furthest unlocked step so returning
  // inspectors resume where they left off rather than starting over
  useEffect(() => {
    if (!token) return;
    const fetchStatus = async () => {
      try {
        const res = await fetch(ENDPOINTS.ONBOARDING.STATUS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const ob = data.onboarding || {};
        if (ob.videosWatched) setCurrentStep(3);
        else if (ob.manualRead) setCurrentStep(2);
        else setCurrentStep(1);
      } catch {
        // default stays at step 1
      }
    };
    fetchStatus();
  }, [token]);

  const handleStepComplete = async () => {
    await refreshOnboarding();
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const firstName = user?.name?.split(' ')[0] || 'Inspector';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">
            Getting Started
          </div>
          <h1 className="text-3xl font-black text-slate-800">
            Welcome, {firstName}!
          </h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Complete the following 3 steps to unlock your Inspector Dashboard and start accepting assignments.
          </p>
        </div>

        <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />

        {currentStep === 1 && <Step1Manual onComplete={handleStepComplete} />}
        {currentStep === 2 && <Step2Videos onComplete={handleStepComplete} />}
        {currentStep === 3 && <Step3Assessment onComplete={refreshOnboarding} />}
      </div>
    </div>
  );
}
