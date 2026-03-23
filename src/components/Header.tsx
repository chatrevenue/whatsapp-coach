'use client';

import type { Industry } from '@/lib/types';
import { INDUSTRIES } from '@/lib/types';

interface HeaderProps {
  industry: Industry;
  onIndustryChange: (industry: Industry) => void;
  disabled?: boolean;
}

export default function Header({ industry, onIndustryChange, disabled }: HeaderProps) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(30, 55, 40, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    }}>
      {/* Logo – zweizeilig */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '22px' }}>💬</span>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>
            WhatsApp
          </div>
          <div style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
            Message Optimizer
          </div>
        </div>
      </div>

      {/* Industry Pills – kompakt */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            onClick={() => onIndustryChange(ind.id)}
            disabled={disabled}
            style={{
              borderRadius: '50px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              border: industry === ind.id
                ? '1px solid rgba(255,255,255,0.55)'
                : '1px solid rgba(255,255,255,0.2)',
              background: industry === ind.id
                ? 'rgba(255,255,255,0.22)'
                : 'rgba(255,255,255,0.08)',
              color: industry === ind.id
                ? 'white'
                : 'rgba(255,255,255,0.65)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {ind.icon} {ind.label}
          </button>
        ))}
      </div>
    </header>
  );
}
