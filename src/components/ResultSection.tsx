'use client';

import { useState, useRef, useEffect } from 'react';
import WhatsAppBubble from './WhatsAppBubble';
import QuickReplies from './QuickReplies';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  optimized_message?: string;
  quick_replies?: string[];
  tip?: string;
  timestamp: string;
}

interface ResultSectionProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onFollowUp: (message: string, history: { role: 'user' | 'assistant'; content: string }[]) => void;
}

export default function ResultSection({ messages, isLoading, onFollowUp }: ResultSectionProps) {
  const [followUp, setFollowUp] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (text?: string) => {
    const toSend = (text || followUp).trim();
    if (!toSend || isLoading) return;

    // Build history from current messages
    const history = messages.map((m) => ({
      role: m.role,
      content: m.role === 'assistant' && m.optimized_message
        ? JSON.stringify({
            optimized_message: m.optimized_message,
            quick_replies: m.quick_replies,
            tip: m.tip,
          })
        : m.content,
    }));

    onFollowUp(toSend, history);
    setFollowUp('');
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  if (messages.length === 0 && !isLoading) return null;

  return (
    <section className="py-8 sm:py-12 px-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-whatsapp-green flex items-center justify-center text-white text-lg shadow">
          🤖
        </div>
        <div>
          <p className="font-semibold text-gray-800">WhatsApp KI-Coach</p>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* Chat window */}
      <div
        ref={chatRef}
        className="rounded-2xl overflow-hidden shadow-lg border border-gray-200"
        style={{ background: '#E5DDD5' }}
      >
        {/* Chat header */}
        <div className="bg-whatsapp-teal px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
            💬
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">KI-Coach</p>
            <p className="text-white/70 text-xs">Heute verfügbar</p>
          </div>
          <div className="flex gap-2 text-white/60">
            <span className="text-xs">🔒 Ende-zu-Ende verschlüsselt</span>
          </div>
        </div>

        {/* Messages */}
        <div
          className="px-3 py-4 space-y-3 min-h-[200px] max-h-[500px] overflow-y-auto"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23E5DDD5'/%3E%3C/svg%3E")`,
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx}>
              <WhatsAppBubble
                message={msg.role === 'user' ? msg.content : (msg.optimized_message || msg.content)}
                isUser={msg.role === 'user'}
                timestamp={msg.timestamp}
              />
              {/* Show quick replies after last assistant message */}
              {msg.role === 'assistant' &&
                msg.quick_replies &&
                idx === messages.length - 1 &&
                !isLoading && (
                  <QuickReplies
                    replies={msg.quick_replies}
                    onSelect={(reply) => handleSend(reply)}
                  />
                )}
            </div>
          ))}

          {/* Loading bubble */}
          {isLoading && (
            <WhatsAppBubble
              message=""
              isUser={false}
              isLoading={true}
            />
          )}

          <div ref={bottomRef} />
        </div>

        {/* Follow-up input */}
        <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-t border-gray-200">
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Anpassung wünschen? Einfach schreiben..."
            disabled={isLoading}
            className="
              flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-800
              placeholder:text-gray-400 border border-gray-200
              focus:outline-none focus:border-whatsapp-green
              disabled:opacity-50
            "
          />
          <button
            onClick={() => handleSend()}
            disabled={!followUp.trim() || isLoading}
            className="
              w-10 h-10 rounded-full bg-whatsapp-green text-white
              flex items-center justify-center
              hover:bg-whatsapp-green-dark
              disabled:opacity-40 disabled:cursor-not-allowed
              active:scale-90 transition-all
              shadow
            "
          >
            <svg className="w-5 h-5 rotate-90" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tip card */}
      {lastAssistantMsg?.tip && !isLoading && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
          <div className="flex gap-2 items-start">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Warum diese Version besser ist:</p>
              <p className="text-sm text-amber-700">{lastAssistantMsg.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Copy button */}
      {lastAssistantMsg?.optimized_message && !isLoading && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              navigator.clipboard.writeText(lastAssistantMsg.optimized_message!);
            }}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium
              active:scale-95 transition-all
            "
          >
            📋 Nachricht kopieren
          </button>
        </div>
      )}
    </section>
  );
}
