'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import InputArea, { type Goal, type Tone } from '@/components/InputArea';
import OutputArea, { type OutputMessage } from '@/components/OutputArea';
import type { Industry } from '@/lib/types';

export default function Home() {
  const [industry, setIndustry] = useState<Industry>('autohaus');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutputMessage | null>(null);

  // Keep last request for regenerate
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

        // Scroll to output
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
    // Scroll back to input area
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
    <div className="min-h-screen bg-[#0F1117] flex flex-col">
      <Header
        industry={industry}
        onIndustryChange={handleIndustryChange}
        disabled={isLoading}
      />

      <main className="flex-1 flex flex-col items-center py-6">
        {/* Input Section */}
        <div id="input" className="w-full">
          <InputArea onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full max-w-2xl px-4 mb-4 animate-fade-in">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">❌</span>
              <div className="flex-1">
                <p className="font-semibold text-red-400 text-sm">Fehler beim Generieren</p>
                <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-400 text-lg leading-none"
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

        {/* How it works – only when idle */}
        {!result && !isLoading && (
          <section className="w-full max-w-2xl px-4 py-8 animate-fade-in">
            <h2 className="text-base font-semibold text-[#94A3B8] text-center mb-6">
              So funktioniert&apos;s
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: '🏢',
                  title: 'Branche wählen',
                  desc: 'Wähle deine Branche oben rechts für einen maßgeschneiderten Prompt.',
                },
                {
                  icon: '✍️',
                  title: 'Nachricht eingeben',
                  desc: 'Tippe deine Rohe Nachricht ein – Ziel und Ton optional.',
                },
                {
                  icon: '🚀',
                  title: 'Mehr Antworten',
                  desc: 'Kopiere die optimierte Version und sende sie direkt über WhatsApp.',
                },
              ].map((s, i) => (
                <div key={i} className="bg-[#1E2130] rounded-xl border border-[#2D3348] p-4 text-center">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <h3 className="font-semibold text-[#F1F5F9] text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#2D3348] text-center">
        <p className="text-xs text-[#94A3B8]">
          WhatsApp Message Optimizer · Powered by Claude AI
        </p>
      </footer>
    </div>
  );
}
