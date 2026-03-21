'use client';

import { INDUSTRIES } from '@/lib/types';
import type { Industry } from '@/lib/types';

interface HeaderProps {
  industry: Industry;
  onIndustryChange: (industry: Industry) => void;
  disabled?: boolean;
}

export default function Header({ industry, onIndustryChange, disabled = false }: HeaderProps) {
  return (
    <header className="w-full px-4 py-4 flex items-center justify-between border-b border-[#2D3348] bg-[#0F1117] sticky top-0 z-10 backdrop-blur-sm">
      {/* Logo + Title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[#25D366] text-lg">💬</span>
          <span className="text-sm font-semibold text-[#F1F5F9] tracking-tight">
            WhatsApp Message Optimizer
          </span>
        </div>
        <span className="text-[11px] text-[#94A3B8] pl-7">Better messages in seconds</span>
      </div>

      {/* Industry Selector - compact pills */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-xs">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            onClick={() => onIndustryChange(ind.id)}
            disabled={disabled}
            title={ind.label}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
              transition-all duration-150 active:scale-95 border
              disabled:opacity-40 disabled:cursor-not-allowed
              ${industry === ind.id
                ? 'bg-[#25D366] text-white border-[#25D366] shadow-sm shadow-[#25D366]/20'
                : 'bg-[#1E2130] text-[#94A3B8] border-[#2D3348] hover:border-[#25D366] hover:text-[#F1F5F9]'
              }
            `}
          >
            <span>{ind.icon}</span>
            <span className="hidden sm:inline">{ind.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
