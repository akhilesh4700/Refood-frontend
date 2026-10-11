import React from 'react';
import { cn } from './utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-[#0E6B45] text-white hover:bg-[#0A5234] active:bg-[#084228]',
  secondary: 'bg-[#DDF7EE] text-[#0E6B45] hover:bg-[#c8f0e4]',
  amber: 'bg-[#B8650A] text-white hover:bg-[#9a540a] active:bg-[#7e4508]',
  danger: 'bg-[#C62828] text-white hover:bg-[#a82020]',
  ghost: 'bg-transparent text-[#5B6272] hover:bg-[#EEF0FA]',
  outline: 'bg-transparent border border-[#E6E8F0] text-[#111827] hover:bg-[#F6F7FB]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] font-600 transition-all duration-150 cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: React.ReactNode;
}

export function IconButton({ className, children, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-[#5B6272] hover:bg-[#EEF0FA] hover:text-[#111827] transition-colors duration-150 cursor-pointer',
        className
      )}
    >
      {children}
    </button>
  );
}
