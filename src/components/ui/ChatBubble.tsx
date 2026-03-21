'use client';

import React from 'react';

interface ChatBubbleProps {
  message: string;
  direction?: 'outgoing' | 'incoming';
  timestamp?: string;
  avatar?: string;
  className?: string;
}

export default function ChatBubble({
  message,
  direction = 'outgoing',
  timestamp,
  avatar,
  className = '',
}: ChatBubbleProps) {
  const isOutgoing = direction === 'outgoing';

  return (
    <div className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'} ${className}`}>
      {/* Avatar for incoming */}
      {!isOutgoing && (
        <div className="w-8 h-8 rounded-full bg-[#2D3348] flex items-center justify-center text-sm flex-shrink-0 mb-1">
          {avatar || '👤'}
        </div>
      )}

      <div
        className={`
          relative max-w-[85%] rounded-2xl px-4 py-2.5 shadow-lg
          ${isOutgoing
            ? 'bg-[#1E7E34] text-white rounded-br-sm'
            : 'bg-[#1E2130] text-[#F1F5F9] rounded-bl-sm border border-[#2D3348]'
          }
        `}
      >
        {/* Message text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message}</p>

        {/* Timestamp */}
        {timestamp && (
          <div className={`flex items-center justify-end mt-1 gap-1`}>
            <span className={`text-[10px] ${isOutgoing ? 'text-white/60' : 'text-[#94A3B8]'}`}>
              {timestamp}
            </span>
            {isOutgoing && (
              <span className="text-[10px] text-white/60">✓✓</span>
            )}
          </div>
        )}
      </div>

      {/* Avatar for outgoing */}
      {isOutgoing && (
        <div className="w-8 h-8 rounded-full bg-[#1E7E34] flex items-center justify-center text-sm flex-shrink-0 mb-1">
          💬
        </div>
      )}
    </div>
  );
}
