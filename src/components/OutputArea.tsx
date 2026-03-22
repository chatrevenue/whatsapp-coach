'use client';

import { useState } from 'react';
import TypingIndicator from '@/components/ui/TypingIndicator';
import CopyButton from '@/components/ui/CopyButton';

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

  const actionBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#1A3A1A',
    transition: 'all 0.15s ease',
  };

  return (
    <div className="w-full animate-fade-in-up">
      {/* Chat area */}
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.2)',
        overflow: 'hidden',
      }}>
        {/* Chat header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.08)',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#25D366', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', flexShrink: 0,
          }}>
            💬
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>KI-Optimierung</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>WhatsApp Message Optimizer</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#25D366', display: 'inline-block' }}></span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading && (
            <div className="animate-fade-in">
              <TypingIndicator />
            </div>
          )}

          {!isLoading && result && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Outgoing bubble – optimized message */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{
                  background: '#25D366',
                  color: 'white',
                  borderRadius: '16px 16px 4px 16px',
                  padding: '16px',
                  maxWidth: '85%',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  <p>{result.optimized_message}</p>
                  {result.timestamp && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', gap: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{result.timestamp}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>✓✓</span>
                    </div>
                  )}
                </div>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#25D366', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                }}>💬</div>
              </div>

              {/* Quick Reply Pills */}
              {result.quick_replies && result.quick_replies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>Quick Reply Buttons:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.quick_replies.map((reply, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '50px',
                          fontSize: '13px',
                          fontWeight: 500,
                          background: 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.4)',
                          color: 'white',
                        }}
                      >
                        {reply}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto responses */}
              {result.auto_responses && result.auto_responses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>
                    Wenn Kunde klickt → automatische Antwort:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.auto_responses.map((resp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                        }}>🤖</div>
                        <div style={{
                          background: 'white',
                          color: '#1A2E1A',
                          borderRadius: '16px 16px 16px 4px',
                          padding: '16px',
                          maxWidth: '85%',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          border: '1px solid #E0E8E0',
                        }}>
                          {resp}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tip */}
              {result.tip && (
                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{result.tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isLoading && result && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Primary actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            <CopyButton text={result.optimized_message} label="Nachricht kopieren" />

            <button onClick={handleCopyAll} style={actionBtnStyle}>
              {copiedAll ? <><span>✓</span><span>Kopiert!</span></> : <><span>📋</span><span>Alles kopieren</span></>}
            </button>

            <button onClick={onRegenerate} style={actionBtnStyle}>
              <span>🔄</span>
              <span>Neu generieren</span>
            </button>

            <button onClick={onEdit} style={actionBtnStyle}>
              <span>✏️</span>
              <span>Bearbeiten</span>
            </button>
          </div>

          {/* Improvement pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {IMPROVE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => onImprove(opt.instruction)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '50px',
                  color: 'white',
                  padding: '6px 14px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
