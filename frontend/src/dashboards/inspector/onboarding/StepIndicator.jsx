// frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx
export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 ${isCompleted ? 'text-emerald-600' : isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                ${isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className="text-sm font-semibold hidden sm:inline">{label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-10 h-0.5 mx-3 transition-colors duration-300 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
