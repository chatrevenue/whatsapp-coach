'use client';

import { useEffect, useRef } from 'react';

interface WhatsAppBubbleProps {
  message: string;
  isUser?: boolean;
  timestamp?: string;
  isLoading?: boolean;
}

export default function WhatsAppBubble({
  message,
  isUser = false,
  timestamp,
  isLoading = false,
}: WhatsAppBubbleProps) {
  const time = timestamp || new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <div
      ref={bubbleRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up mb-1`}
    >
      <div
        className={`
          relative max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-2xl shadow-sm
          ${isUser
            ? 'bg-whatsapp-bubble text-gray-800 rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm'
          }
        `}
      >
        {/* Bubble tail */}
        {isUser ? (
          <div className="absolute -right-2 bottom-0 w-0 h-0 border-l-[10px] border-l-whatsapp-bubble border-b-[10px] border-b-transparent" />
        ) : (
          <div className="absolute -left-2 bottom-0 w-0 h-0 border-r-[10px] border-r-white border-b-[10px] border-b-transparent" />
        )}

        {isLoading ? (
          <div className="flex items-center gap-1 py-1 px-2">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message}</p>
            <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-gray-400">{time}</span>
              {isUser && (
                <svg className="w-3 h-3 text-blue-500" viewBox="0 0 16 11" fill="currentColor">
                  <path d="M11.071.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0l-3-3.25a.75.75 0 0 1 1.085-1.035l2.457 2.658 5.957-6.408a.75.75 0 0 1 1.06-.025Z" />
                  <path d="M14.571.653a.75.75 0 0 1 .025 1.06l-6.5 7a.75.75 0 0 1-1.085 0 .75.75 0 0 1 0-1.035l.542-.584 5.957-6.408a.75.75 0 0 1 1.06-.025Z" />
                </svg>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
