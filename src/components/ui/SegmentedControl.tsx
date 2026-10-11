import React from 'react';
import { cn } from './utils';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div className={cn('inline-flex bg-[#EEF0FA] rounded-[10px] p-1 gap-0.5', className)}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-1.5 rounded-[8px] text-sm font-600 transition-all duration-150 cursor-pointer',
            value === opt.value
              ? 'bg-white text-[#111827] shadow-sm'
              : 'text-[#5B6272] hover:text-[#111827]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  variant?: 'default' | 'danger' | 'amber';
  onClick?: () => void;
}

export function FilterChip({ label, count, active, variant = 'default', onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-600 border transition-all duration-150 cursor-pointer',
        active && variant === 'default' && 'bg-[#0E6B45] text-white border-[#0E6B45]',
        active && variant === 'danger' && 'bg-[#C62828] text-white border-[#C62828]',
        active && variant === 'amber' && 'bg-[#B8650A] text-white border-[#B8650A]',
        !active && 'bg-white text-[#5B6272] border-[#E6E8F0] hover:border-[#0E6B45] hover:text-[#0E6B45]',
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded-full',
          active ? 'bg-white/20 text-white' : 'bg-[#EEF0FA] text-[#5B6272]'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
