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
              {/* Outgoing bubble – optimized message + Copy Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '8px' }}>
                {/* Copy Button direkt bei der Bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <CopyButton text={result.optimized_message} label="Kopieren" />
                </div>
                <div style={{
                  background: '#25D366',
                  color: 'white',
                  borderRadius: '16px 16px 4px 16px',
                  padding: '16px',
                  maxWidth: '75%',
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

              {/* Quick Reply + Auto Response Paare */}
              {result.quick_replies && result.quick_replies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>Quick Reply Buttons & automatische Antworten:</p>
                  {result.quick_replies.map((reply, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      border: '1px solid rgba(255,255,255,0.5)',
                    }}>
                      {/* Button row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '5px 14px',
                          borderRadius: '50px',
                          fontSize: '13px',
                          fontWeight: 600,
                          background: '#25D366',
                          color: 'white',
                          flexShrink: 0,
                        }}>
                          {reply}
                        </span>
                        <CopyButton text={reply} label="" />
                      </div>
                      {/* Auto response – als eingehende Chat-Bubble formatiert */}
                      {result.auto_responses && result.auto_responses[i] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <p style={{ fontSize: '11px', color: '#888', paddingLeft: '4px' }}>↳ Automatische Antwort wenn Kunde klickt:</p>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: '#E8F5E9', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '13px', flexShrink: 0,
                            }}>🤖</div>
                            <div style={{
                              background: 'white',
                              color: '#1A2E1A',
                              borderRadius: '16px 16px 16px 4px',
                              padding: '12px 14px',
                              maxWidth: '85%',
                              fontSize: '13px',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              border: '1px solid #E0E8E0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                            }}>
                              {result.auto_responses[i]}
                            </div>
                            <CopyButton text={result.auto_responses[i]} label="" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tip */}
              {result.tip && (
                <div style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <p style={{ fontSize: '13px', color: '#1A2E1A', lineHeight: 1.5 }}>{result.tip}</p>
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
