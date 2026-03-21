'use client';

import { useState } from 'react';
import ChatBubble from '@/components/ui/ChatBubble';
import TypingIndicator from '@/components/ui/TypingIndicator';
import CopyButton from '@/components/ui/CopyButton';
import PillButton from '@/components/ui/PillButton';

export interface OutputMessage {
  optimized_message: string;
  quick_replies?: string[];
  auto_responses?: string[];
  tip?: string;
  timestamp?: string;
}

interface OutputAreaProps {
  result: OutputMessage | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onImprove: (instruction: string) => void;
  onEdit: () => void;
}

const IMPROVE_OPTIONS = [
  { label: 'Kürzer', instruction: 'Mache die Nachricht kürzer' },
  { label: 'Verkaufsstärker', instruction: 'Mache die Nachricht verkaufsstärker' },
  { label: 'Lockerer', instruction: 'Mache die Nachricht lockerer und freundlicher' },
];

export default function OutputArea({
  result,
  isLoading,
  onRegenerate,
  onImprove,
  onEdit,
}: OutputAreaProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isLoading && !result) return null;

  const handleCopyAll = async () => {
    if (!result) return;
    const lines = [
      result.optimized_message,
      '',
      result.quick_replies?.length ? `Quick Replies: ${result.quick_replies.join(' | ')}` : '',
      result.auto_responses?.length ? `Auto-Antworten: ${result.auto_responses.join(' | ')}` : '',
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-8 animate-fade-in-up">
      {/* Chat area */}
      <div className="bg-[#1A1D27] rounded-2xl border border-[#2D3348] shadow-xl shadow-black/40 overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#2D3348] bg-[#1E2130]">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-sm">
            💬
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F1F5F9]">KI-Optimierung</p>
            <p className="text-[10px] text-[#94A3B8]">WhatsApp Message Optimizer</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
            <span className="text-[10px] text-[#94A3B8]">online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="p-5 space-y-4">
          {/* Loading */}
          {isLoading && (
            <div className="animate-fade-in">
              <TypingIndicator />
            </div>
          )}

          {/* Result bubble */}
          {!isLoading && result && (
            <div className="animate-fade-in-up space-y-4">
              <ChatBubble
                message={result.optimized_message}
                direction="outgoing"
                timestamp={result.timestamp}
              />

              {/* Quick Reply Pills */}
              {result.quick_replies && result.quick_replies.length > 0 && (
                <div className="space-y-2 pl-0">
                  <p className="text-[11px] text-[#94A3B8] px-1">Quick Reply Buttons:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.quick_replies.map((reply, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[#1E2130] text-[#F1F5F9] border border-[#2D3348]"
                      >
                        {reply}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto responses */}
              {result.auto_responses && result.auto_responses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-[#94A3B8] px-1">
                    Wenn Kunde klickt → automatische Antwort:
                  </p>
                  <div className="space-y-2">
                    {result.auto_responses.map((resp, i) => (
                      <ChatBubble
                        key={i}
                        message={resp}
                        direction="incoming"
                        avatar="🤖"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              {result.tip && (
                <div className="bg-[#1E2130] rounded-xl px-4 py-3 border border-[#2D3348] flex items-start gap-2">
                  <span className="text-sm">💡</span>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{result.tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isLoading && result && (
        <div className="mt-4 space-y-3 animate-fade-in-up">
          {/* Primary actions */}
          <div className="flex flex-wrap gap-2 justify-center">
            <CopyButton text={result.optimized_message} label="Nachricht kopieren" />

            <button
              onClick={handleCopyAll}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-150 active:scale-95 border
                ${copiedAll
                  ? 'bg-wa-green text-white border-wa-green'
                  : 'bg-[#1E2130] text-[#94A3B8] border-[#2D3348] hover:border-[#25D366] hover:text-[#F1F5F9]'
                }
              `}
            >
              {copiedAll ? <><span>✓</span><span>Kopiert!</span></> : <><span>📋</span><span>Alles kopieren</span></>}
            </button>

            <button
              onClick={onRegenerate}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                bg-[#1E2130] text-[#94A3B8] border border-[#2D3348]
                hover:border-[#25D366] hover:text-[#F1F5F9]
                transition-all duration-150 active:scale-95
              "
            >
              <span>🔄</span>
              <span>Neu generieren</span>
            </button>

            <button
              onClick={onEdit}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                bg-[#1E2130] text-[#94A3B8] border border-[#2D3348]
                hover:border-[#25D366] hover:text-[#F1F5F9]
                transition-all duration-150 active:scale-95
              "
            >
              <span>✏️</span>
              <span>Bearbeiten</span>
            </button>
          </div>

          {/* Improvement pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {IMPROVE_OPTIONS.map((opt) => (
              <PillButton
                key={opt.label}
                onClick={() => onImprove(opt.instruction)}
                size="sm"
                variant="ghost"
              >
                {opt.label}
              </PillButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
