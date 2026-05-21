// frontend/src/dashboards/inspector/onboarding/StepIndicator.jsx
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle2 } from 'lucide-react';

const STEP_ICONS = [BookOpen, Play, CheckCircle2];

export default function StepIndicator({ currentStep, steps }) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center gap-0 max-w-2xl mx-auto">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const IconComponent = STEP_ICONS[index];

          return (
            <motion.div
              key={label}
              className="flex items-center flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Step circle */}
              <div className="flex flex-col items-center relative z-10 w-full">
                <motion.div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold border-2 transition-all duration-300 shadow-sm relative ${
                    isCompleted
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : isActive
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                  whileHover={isActive ? { scale: 1.05 } : {}}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  ) : (
                    <IconComponent className="w-6 h-6" />
                  )}
                </motion.div>
                <motion.span
                  className={`text-xs font-bold uppercase tracking-wider mt-2 text-center px-2 transition-colors duration-300 ${
                    isCompleted ? 'text-emerald-600' : isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`text-xs font-bold uppercase tracking-wider mt-2 text-center px-2 transition-colors duration-300 ${
                    isCompleted ? 'text-orange-600' : isActive ? 'text-blue-900' : 'text-slate-400'
                  }`}
                >
                  {label}
                </motion.span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative -top-8">
                  <motion.div
                    className={`h-full rounded-full transition-colors duration-300 ${
                      isCompleted ? 'bg-orange-500' : 'bg-slate-300'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.2 + 0.2, duration: 0.6 }}
                    style={{ originX: 0 }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
