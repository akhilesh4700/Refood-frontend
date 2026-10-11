import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { cn } from './utils';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-[#0E6B45] text-white rounded-[12px] shadow-xl max-w-sm transition-all duration-300',
      visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
    )}>
      <CheckCircle size={18} className="shrink-0 text-[#7EE8C8]" />
      <p className="text-sm font-500 flex-1">{message}</p>
      <button onClick={onClose} aria-label="Close notification" className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer">
        <X size={14} />
      </button>
    </div>
  );
}
