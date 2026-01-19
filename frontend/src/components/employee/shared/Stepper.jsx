import React from 'react';
import { Check } from 'lucide-react';

const steps = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Employment' },
  { id: 3, title: 'Skills' },
  { id: 4, title: 'Payroll' },
  { id: 5, title: 'Documents' },
];

// ✅ Added setCurrentStep prop to make steps clickable
export default function Stepper({ currentStep, setCurrentStep, isEdit }) {
  const progress = (currentStep / steps.length) * 100;

  // ✅ Handle step click
  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
  };

  return (
    <div className="p-8 h-full flex flex-col justify-between">
      <div>
        {/* --- DYNAMIC HEADER --- */}
        <h2 className="text-xl font-bold text-slate-800 mb-8">
          {isEdit ? 'Edit Details' : 'Create Profile'}
        </h2>

        <div className="space-y-8 relative">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="flex items-center gap-4 relative z-10 group cursor-pointer"
              onClick={() => handleStepClick(step.id)}
            >
              {/* ✅ Made circle clickable with hover effects */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                currentStep > step.id 
                  ? 'bg-indigo-600 border-indigo-600 group-hover:bg-indigo-700 group-hover:border-indigo-700' 
                  : currentStep === step.id 
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100' 
                  : 'border-slate-300 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-400'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>

              {/* ✅ Made text clickable with hover effects */}
              <span className={`font-medium transition-colors duration-200 ${
                currentStep === step.id 
                  ? 'text-slate-900 font-semibold' 
                  : 'text-slate-400 group-hover:text-indigo-600'
              }`}>
                {step.title}
              </span>
              
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div className={`absolute left-5 top-10 w-[2px] h-8 -z-10 transition-colors ${
                  currentStep > step.id ? 'bg-indigo-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* ✅ Helper text */}
        <p className="text-[10px] text-slate-400 mt-6 text-center italic">
          Click on any step to navigate
        </p>
      </div>

      {/* Progress Circle at bottom */}
      <div className="mt-auto pt-10 flex flex-col items-center">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle 
              cx="40" 
              cy="40" 
              r="36" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="transparent" 
              className="text-slate-100" 
            />
            <circle 
              cx="40" 
              cy="40" 
              r="36" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray={226} 
              strokeDashoffset={226 - (226 * progress) / 100}
              className="text-indigo-600 transition-all duration-500" 
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
            {Math.round(progress)}%
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-bold">Completion</p>
      </div>
    </div>
  );
}