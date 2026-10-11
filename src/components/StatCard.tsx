import React from 'react';
import { cn } from './ui/utils';

interface ChipDef {
  label: string;
  variant?: 'edible' | 'organic' | 'info' | 'mint' | 'amber';
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subLine?: string;
  /** Alias for subLine */
  sub?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  /** Typed chip array OR arbitrary ReactNode */
  chips?: ChipDef[] | React.ReactNode;
  variant?: 'default' | 'amber' | 'mint';
  className?: string;
}

const CHIP_STYLES: Record<string, string> = {
  edible: 'bg-[#DDF7EE] text-[#0E6B45]',
  organic: 'bg-[#FEF3C7] text-[#B8650A]',
  info: 'bg-[#EEF0FA] text-[#5B6272]',
  mint: 'bg-[#DDF7EE] text-[#0E6B45]',
  amber: 'bg-[#FBEBDD] text-[#B8650A]',
};

function renderChips(chips: ChipDef[] | React.ReactNode) {
  if (!chips) return null;
  if (
    Array.isArray(chips) &&
    chips.length > 0 &&
    typeof (chips[0] as ChipDef).label === 'string'
  ) {
    return (chips as ChipDef[]).map((c, i) => (
      <span
        key={i}
        className={cn(
          'px-2 py-0.5 rounded-full text-[10px] font-semibold',
          CHIP_STYLES[c.variant ?? 'info'] ?? CHIP_STYLES.info
        )}
      >
        {c.label}
      </span>
    ));
  }
  return chips as React.ReactNode;
}

export function StatCard({
  label,
  value,
  unit,
  subLine,
  sub,
  icon,
  iconBg,
  chips,
  variant = 'default',
  className,
}: StatCardProps) {
  const subtitle = subLine ?? sub;
  return (
    <div
      className={cn(
        'bg-white rounded-[16px] p-5 border border-[#E6E8F0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] flex flex-col gap-3 card-hover',
        variant === 'amber' && 'bg-[#FBEBDD]/30',
        variant === 'mint' && 'bg-[#DDF7EE]/30',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-600 uppercase tracking-[0.08em] text-[#5B6272]">{label}</p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0', iconBg ?? 'bg-[#EEF0FA]')}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[2.5rem] font-600 leading-none text-[#111827] tracking-tight">{value}</span>
        {unit && <span className="text-sm font-500 text-[#5B6272]">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-[#5B6272]">{subtitle}</p>}
      {chips && <div className="flex flex-wrap gap-1.5">{renderChips(chips)}</div>}
    </div>
  );
}
