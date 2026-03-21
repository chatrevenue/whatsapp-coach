'use client';

import React from 'react';

interface PillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'accent' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

export default function PillButton({
  children,
  onClick,
  active = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
}: PillButtonProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-150 active:scale-95 cursor-pointer select-none border';

  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  };

  const variants = {
    default: active
      ? 'bg-wa-green text-white border-wa-green shadow-md shadow-wa-green/20'
      : 'bg-wa-card text-[#94A3B8] border-wa-border hover:border-wa-green hover:text-[#F1F5F9]',
    accent: 'bg-wa-green text-white border-wa-green hover:bg-wa-green-dark',
    ghost: active
      ? 'bg-wa-card text-[#F1F5F9] border-wa-border'
      : 'bg-transparent text-[#94A3B8] border-wa-border hover:border-[#94A3B8] hover:text-[#F1F5F9]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
