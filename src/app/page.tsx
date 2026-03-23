'use client';

import { useState, useCallback } from 'react';
import InputArea, { type Goal, type Tone } from '@/components/InputArea';
import OutputArea, { type OutputMessage } from '@/components/OutputArea';
import type { Industry } from '@/lib/types';
import { INDUSTRIES } from '@/lib/types';

export default function Home() {
  const [industry, setIndustry] = useState<Industry>('autohaus');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutputMessage | null>(null);

  const [lastRequest, setLastRequest] = useState<{
    message: string;
    goal: Goal;
    tone: Tone;
  } | null>(null);

  const generate = useCallback(
    async (message: string, goal: Goal, tone: Tone, currentIndustry: Industry = industry) => {
      setIsLoading(true);
      setError(null);
      setLastRequest({ message, goal, tone });

      try {
        const res = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            industry: currentIndustry,
            goal,
            tone,
            history: [],
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Fehler ${res.status}`);
        }

        const timestamp = new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        });

        setResult({
          optimized_message: data.optimized_message,
          quick_replies: data.quick_replies,
          auto_responses: data.auto_responses,
          tip: data.tip,
          timestamp,
        });

        setTimeout(() => {
          document.getElementById('output')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [industry]
  );

  const handleGenerate = (message: string, goal: Goal, tone: Tone) => {
    setResult(null);
    generate(message, goal, tone, industry);
  };

  const handleRegenerate = () => {
    if (!lastRequest) return;
    setResult(null);
    generate(lastRequest.message, lastRequest.goal, lastRequest.tone, industry);
  };

  const handleImprove = (instruction: string) => {
    if (!result) return;
    setResult(null);
    generate(
      `${instruction}:\n\n${result.optimized_message}`,
      lastRequest?.goal ?? null,
      lastRequest?.tone ?? null,
      industry
    );
  };

  const handleEdit = () => {
    document.getElementById('input')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleIndustryChange = (newIndustry: Industry) => {
    setIndustry(newIndustry);
    if (result) {
      setResult(null);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Floating Decorative Icons */}
      <div style={{
        position: 'fixed', top: '24px', left: '24px', zIndex: 10,
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
        padding: '12px', fontSize: '28px', lineHeight: 1,
        pointerEvents: 'none',
      }}>💬</div>

      <div style={{
        position: 'fixed', top: '24px', right: '24px', zIndex: 10,
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
        padding: '12px', fontSize: '28px', lineHeight: 1,
        pointerEvents: 'none',
      }}>🚗</div>

      <div style={{
        position: 'fixed', bottom: '24px', left: '24px', zIndex: 10,
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
        padding: '12px', fontSize: '28px', lineHeight: 1,
        pointerEvents: 'none',
      }}>📅</div>

      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 10,
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
        padding: '12px', fontSize: '28px', lineHeight: 1,
        pointerEvents: 'none',
      }}>✅</div>

      {/* Main Content */}
      <main className="relative flex flex-col items-center px-4 pt-12 pb-16">
        {/* Max-width container */}
        <div style={{ width: '100%', maxWidth: '620px' }} className="flex flex-col items-center gap-6">

          {/* Badge Pill */}
          <div style={{
            background: 'rgba(45, 74, 62, 0.75)',
            borderRadius: '50px',
            padding: '8px 20px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#6FCF6A', fontSize: '12px' }}>●</span>
            KI-gestützte WhatsApp-Optimierung
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', lineHeight: 1.15 }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#F0EBDA' }}>
              Mehr Antworten.
            </div>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#D4E4A0' }}>
              Weniger ignoriert werden.
            </div>
          </div>

          {/* Subheading */}
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center',
            maxWidth: '480px',
            lineHeight: 1.5,
          }}>
            KI optimiert deine WhatsApp-Nachrichten nach dem Hormozi-Framework – speziell für Autohäuser entwickelt.
          </p>

          {/* Industry Selector Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => handleIndustryChange(ind.id)}
                disabled={isLoading}
                style={{
                  borderRadius: '50px',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: industry === ind.id
                    ? '1px solid rgba(255,255,255,0.5)'
                    : '1px solid rgba(255,255,255,0.2)',
                  background: industry === ind.id
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(255,255,255,0.1)',
                  color: industry === ind.id
                    ? 'white'
                    : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.15s ease',
                }}
              >
                {ind.icon} {ind.label}
              </button>
            ))}
          </div>

          {/* Input Section */}
          <div id="input" className="w-full">
            <InputArea onGenerate={handleGenerate} isLoading={isLoading} />
          </div>

          {/* Social Proof */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '24px' }}>👩</span>
            <span style={{ fontSize: '24px' }}>👩‍🦱</span>
            <span style={{ fontSize: '24px' }}>👨</span>
            <span style={{ fontSize: '24px' }}>🧑</span>
            <span style={{ fontSize: '14px', color: 'rgba(45,77,61,0.9)' }}>
              <strong style={{ fontWeight: 700 }}>127+ Autohäuser</strong> nutzen es bereits
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="w-full animate-fade-in">
              <div style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>❌</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#FCA5A5', fontSize: '14px' }}>Fehler beim Generieren</p>
                  <p style={{ fontSize: '12px', color: 'rgba(252,165,165,0.8)', marginTop: '2px' }}>{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  style={{ color: 'rgba(252,165,165,0.6)', fontSize: '20px', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Output Section */}
          <div id="output" className="w-full">
            <OutputArea
              result={result}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onImprove={handleImprove}
              onEdit={handleEdit}
            />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          WhatsApp Message Optimizer · Powered by Claude AI
        </p>
      </footer>
    </div>
  );
}
