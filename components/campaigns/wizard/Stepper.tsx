'use client';

import React from 'react';
import { Check, AlertCircle, Lock } from 'lucide-react';

export interface StepDef {
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
}

export const STEPS: StepDef[] = [
  {
    number: 1,
    title: 'Campaign Details',
    description: 'Name, timeline, budget and bidding goals',
  },
  {
    number: 2,
    title: 'Products',
    description: 'Select items to promote',
  },
  {
    number: 3,
    title: 'Targeting',
    description: 'Choose how shoppers find your ads',
  },
  {
    number: 4,
    title: 'Negative Targeting',
    description: 'Exclude keywords, brands and products',
  },
  {
    number: 5,
    title: 'Review & Launch',
    description: 'Check everything and launch',
  },
];

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  maxStepReached: number;
  onStepClick: (step: 1 | 2 | 3 | 4 | 5) => void;
  stepErrors?: Record<number, boolean>;
}

export function Stepper({
  currentStep,
  maxStepReached,
  onStepClick,
  stepErrors = {},
}: StepperProps) {
  const progressPct = Math.round((currentStep / 5) * 100);

  return (
    <div className="bg-surface border border-border-dim rounded-md shadow-2xs p-4 flex flex-col font-mono text-xs text-text-main">
      {/* Top Progress Indicator */}
      <div className="mb-4 pb-3 border-b border-border-dim">
        <div className="flex items-center justify-between text-[11px] text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
          <span>Setup progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stepper items list */}
      <div className="space-y-1">
        {STEPS.map((step) => {
          const isCurrent = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isAccessible = step.number <= maxStepReached;
          const hasError = stepErrors[step.number];

          return (
            <button
              key={step.number}
              type="button"
              disabled={!isAccessible}
              onClick={() => onStepClick(step.number)}
              className={`w-full text-left p-2.5 rounded-md transition-all flex items-start gap-3 select-none ${
                isCurrent
                  ? 'bg-indigo-50/70 border border-indigo-200 shadow-2xs'
                  : isAccessible
                  ? 'hover:bg-slate-50 cursor-pointer border border-transparent'
                  : 'opacity-40 cursor-not-allowed border border-transparent'
              }`}
            >
              {/* Step Icon / Number */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors mt-0.5 ${
                  hasError
                    ? 'bg-rose-100 text-spend ring-2 ring-spend'
                    : isCurrent
                    ? 'bg-primary text-white'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {hasError ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Step Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`block truncate ${
                      isCurrent
                        ? 'font-bold text-slate-900'
                        : isAccessible
                        ? 'font-medium text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {hasError && (
                    <span className="w-2 h-2 rounded-full bg-spend ml-1 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-sans">
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
