import React from 'react';
import { cn } from './utils';

type Variant = 'edible' | 'organic' | 'urgent' | 'info' | 'neutral' | 'mint' | 'amber';

interface BadgeProps {
  variant?: Variant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  edible: 'bg-[#DDF7EE] text-[#0E6B45] border border-[#0E6B45]/20',
  organic: 'bg-[#FBEBDD] text-[#B8650A] border border-[#B8650A]/20',
  urgent: 'bg-[#FDE7E7] text-[#C62828] border border-[#C62828]/20',
  info: 'bg-[#DDF7EE] text-[#0E6B45]',
  neutral: 'bg-[#EEF0FA] text-[#5B6272]',
  mint: 'bg-[#7EE8C8] text-[#0A5234]',
  amber: 'bg-[#FBEBDD] text-[#B8650A]',
};

const dotClasses: Record<Variant, string> = {
  edible: 'bg-[#0E6B45]',
  organic: 'bg-[#B8650A]',
  urgent: 'bg-[#C62828]',
  info: 'bg-[#0E6B45]',
  neutral: 'bg-[#5B6272]',
  mint: 'bg-[#0A5234]',
  amber: 'bg-[#B8650A]',
};

export function Badge({ variant = 'neutral', dot, children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 leading-none',
      variantClasses[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotClasses[variant])} />}
      {children}
    </span>
  );
}

export function Chip({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-500',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
