'use client';

import { INDUSTRIES } from '@/lib/types';
import type { Industry } from '@/lib/types';

interface IndustrySelectorProps {
  selected: Industry;
  onChange: (industry: Industry) => void;
  disabled?: boolean;
}

export default function IndustrySelector({ selected, onChange, disabled = false }: IndustrySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {INDUSTRIES.map((ind) => (
        <button
          key={ind.id}
          onClick={() => onChange(ind.id)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm
            transition-all duration-200 active:scale-95 border-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${selected === ind.id
              ? 'bg-whatsapp-green text-white border-whatsapp-green shadow-md shadow-green-300/50'
              : 'bg-white text-gray-700 border-gray-200 hover:border-whatsapp-green hover:text-whatsapp-green'
            }
          `}
        >
          <span className="text-base">{ind.icon}</span>
          <span>{ind.label}</span>
        </button>
      ))}
    </div>
  );
}
