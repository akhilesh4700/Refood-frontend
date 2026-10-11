import React from 'react';
import { Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#E6E8F0] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#0E6B45] rounded-md flex items-center justify-center">
            <Leaf size={12} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-700 text-[#111827]">ReFood</p>
            <p className="text-xs text-[#5B6272]">Circular Food Surplus & Recovery Network</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {['Compliance & Food Safety', 'Cold-Chain Verification', 'Impact Methodology', 'Support Desk'].map(link => (
            <a key={link} href="#" className="text-xs text-[#5B6272] hover:text-[#0E6B45] transition-colors">
              {link}
            </a>
          ))}
        </div>
        <p className="text-xs text-[#5B6272]">© 2024 ReFood Platform Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
