import React from 'react';
import { cn } from './utils';

interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'primary' | 'amber' | 'danger';
  label?: string;
  status?: string;
  className?: string;
}

const fillClasses = {
  primary: 'bg-[#0E6B45]',
  amber: 'bg-[#B8650A]',
  danger: 'bg-[#C62828]',
};

export function ProgressBar({ value, variant = 'primary', label, status, className }: ProgressBarProps) {
  const fill = Math.min(100, Math.max(0, value));
  const auto = fill > 75 ? 'danger' : fill > 50 ? 'amber' : variant;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || status) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-[#5B6272] font-500">{label}</span>}
          {status && <span className={cn('font-600', fill > 75 ? 'text-[#C62828]' : fill > 50 ? 'text-[#B8650A]' : 'text-[#0E6B45]')}>{status}</span>}
        </div>
      )}
      <div className="h-1 w-full bg-[#E6E8F0] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillClasses[auto])}
          style={{ width: `${fill}%` }}
          role="progressbar"
          aria-valuenow={fill}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
