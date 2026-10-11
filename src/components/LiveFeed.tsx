import React, { useState, useEffect } from 'react';
import { cn } from './ui/utils';

export const FEED_MESSAGES = [
  { org: 'Hilton Midtown', action: 'allocated 140kg cooked surplus to Salvation Army', time: '2m ago' },
  { org: 'GreenCycle Bengaluru', action: 'collected 85kg vegetable scraps from Hotel Leela', time: '8m ago' },
  { org: 'Hope Community Foodbank', action: 'received 60kg bakery surplus from Asha Bakeries', time: '14m ago' },
  { org: 'SaladWorks Express', action: 'dispatched 15kg salad boxes to Nandhini Shelter', time: '21m ago' },
  { org: 'TechPark Cafeteria', action: 'matched 35kg catering trays to Akshaya Patra', time: '29m ago' },
  { org: 'Grand Hotel Bay', action: 'cleared 210kg Sunday buffet surplus to Mission City Food Pantry', time: '34m ago' },
];

interface LiveFeedProps {
  /** 'bar' = single-line ticker (landing page). 'list' = full expanded list (analytics). */
  variant?: 'bar' | 'list';
  className?: string;
}

export function LiveFeed({ variant = 'bar', className }: LiveFeedProps) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % FEED_MESSAGES.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  if (variant === 'list') {
    return (
      <div className={cn('bg-white rounded-[16px] border border-[#E6E8F0] overflow-hidden', className)}>
        <div className="px-5 py-3.5 border-b border-[#E6E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0E6B45] animate-pulse" />
            <span className="text-sm font-700 text-[#111827]">Live Network Feed</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-[10px] font-700 uppercase tracking-wide">
            Realtime Sync Active
          </span>
        </div>
        <ul className="divide-y divide-[#E6E8F0]">
          {FEED_MESSAGES.map((m, i) => (
            <li key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-[#FAFAFC] transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E6B45] mt-2 shrink-0" />
              <span className="text-xs text-[#111827] flex-1">
                <span className="font-700">{m.org}</span> {m.action}
              </span>
              <span className="text-[10px] text-[#5B6272] shrink-0 mt-0.5">{m.time}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const current = FEED_MESSAGES[idx];
  return (
    <div className={cn('bg-white rounded-[12px] border border-[#E6E8F0] px-4 py-3 flex items-center gap-3 overflow-hidden', className)}>
      <span className="w-2 h-2 rounded-full bg-[#0E6B45] animate-pulse shrink-0" />
      <p
        className="text-xs text-[#5B6272] font-500 flex-1 truncate transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="font-700 text-[#111827]">Live Feed: </span>
        <span className="font-600 text-[#0E6B45]">{current.org}</span>
        {' '}{current.action} →
      </p>
      <span className="px-2.5 py-0.5 rounded-full bg-[#DDF7EE] text-[#0E6B45] text-[10px] font-700 shrink-0 whitespace-nowrap">
        Realtime Sync Active
      </span>
    </div>
  );
}
