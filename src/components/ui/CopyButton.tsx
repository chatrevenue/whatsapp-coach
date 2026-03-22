'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ text, label = 'Kopieren', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        background: copied ? '#25D366' : 'rgba(255,255,255,0.9)',
        border: copied ? '1px solid #25D366' : '1px solid rgba(255,255,255,0.3)',
        color: copied ? 'white' : '#1A3A1A',
      }}
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>Kopiert!</span>
        </>
      ) : (
        <>
          <span>📋</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
