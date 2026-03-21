'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function CopyButton({ text, className = '', size = 'md' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = size === 'sm'
    ? 'w-6 h-6 text-xs'
    : 'w-8 h-8 text-sm';

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Kopiert!' : 'Kopieren'}
      className={`
        ${sizeClasses}
        rounded-full flex items-center justify-center
        transition-all duration-200 active:scale-90
        ${copied
          ? 'bg-green-500 text-white'
          : 'bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300'
        }
        ${className}
      `}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}
