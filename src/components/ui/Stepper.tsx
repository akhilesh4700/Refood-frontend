import React from 'react';
import { Check } from 'lucide-react';
import { cn } from './utils';

interface Step {
  label: string;
  caption?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 1-based
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const completed = stepNum < currentStep;
        const active = stepNum === currentStep;
        const pending = stepNum > currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              {/* Circle */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-700 transition-all',
                completed && 'bg-[#0E6B45] border-[#0E6B45] text-white',
                active && 'bg-white border-[#0E6B45] text-[#0E6B45] shadow-[0_0_0_4px_#DDF7EE]',
                pending && 'bg-white border-[#E6E8F0] text-[#5B6272]',
              )}>
                {completed ? <Check size={14} /> : stepNum}
              </div>
              {/* Label */}
              <p className={cn('mt-2 text-xs font-600 text-center leading-tight px-1', active ? 'text-[#0E6B45]' : pending ? 'text-[#5B6272]' : 'text-[#111827]')}>
                {step.label}
              </p>
              {step.caption && (
                <p className="text-[10px] text-[#5B6272] text-center leading-tight mt-0.5 px-1">{step.caption}</p>
              )}
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-shrink-0 h-0.5 mt-4 w-12',
                completed ? 'bg-[#0E6B45]' : 'bg-[#E6E8F0]'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
