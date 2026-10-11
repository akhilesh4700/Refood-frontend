import React from 'react';
import { cn } from './utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-600 text-[#5B6272] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full px-3 py-2.5 rounded-[10px] bg-[#EEF0FA] border border-[#E6E8F0] text-[#111827] text-sm placeholder:text-[#5B6272]/60 focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/20 transition-all',
          error && 'border-[#C62828] focus:border-[#C62828] focus:ring-[#C62828]/20',
          className
        )}
      />
      {error && <p className="text-xs text-[#C62828]">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-600 text-[#5B6272] uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={cn(
          'w-full px-3 py-2.5 rounded-[10px] bg-[#EEF0FA] border border-[#E6E8F0] text-[#111827] text-sm placeholder:text-[#5B6272]/60 focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/20 transition-all resize-none',
          error && 'border-[#C62828]',
          className
        )}
      />
      {error && <p className="text-xs text-[#C62828]">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-600 text-[#5B6272] uppercase tracking-widest">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={cn(
          'w-full px-3 py-2.5 rounded-[10px] bg-[#EEF0FA] border border-[#E6E8F0] text-[#111827] text-sm focus:outline-none focus:border-[#0E6B45] focus:ring-2 focus:ring-[#0E6B45]/20 transition-all appearance-none cursor-pointer',
          className
        )}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#C62828]">{error}</p>}
    </div>
  );
}
