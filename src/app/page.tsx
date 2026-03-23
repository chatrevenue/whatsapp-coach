'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import InputArea, { type Goal, type Tone } from '@/components/InputArea';
import OutputArea, { type OutputMessage } from '@/components/OutputArea';
import type { Industry } from '@/lib/types';
import { INDUSTRIES } from '@/lib/types';

// ─── Static data ────────────────────────────────────────────────────────────

const GOOD_MESSAGE_POINTS = [
  { icon: '👋', title: 'Persönlich & kurz', desc: 'Max. 2–3 Sätze. Kein Roman. Kein Newsletter-Stil.' },
  { icon: '❓', title: 'Immer eine Frage', desc: 'Jede Nachricht endet mit einer einfachen Frage – beantwortet über Quick-Reply-Buttons.' },
  { icon: '🎯', title: 'Infos kommen danach', desc: 'Produkt, Preis, Details – alles kommt erst in der automatischen Antwort auf den Button-Klick.' },
  { icon: '🤝', title: 'Kein Verkaufsdruck', desc: 'Die erste Nachricht macht neugierig. Nicht aufdringlich. Nicht werblich.' },
];

const STEPS = [
  { step: '1', icon: '✍️', title: 'Kurz beschreiben', desc: 'Was willst du kommunizieren? Ein Satz reicht – der Rest kommt von der KI.' },
  { step: '2', icon: '🤖', title: 'KI optimiert', desc: 'Claude verwandelt es in eine WhatsApp-Nachricht mit Quick-Replies und automatischer Antwort.' },
  { step: '3', icon: '📋', title: 'Kopieren & senden', desc: 'Alles einzeln kopierbar – direkt in ChatRevenue oder WhatsApp einfügen.' },
];

const LEARNING_POINTS = [
  { icon: '💾', title: 'Antworten werden gespeichert', desc: 'Was deine Kunden antworten, wird analysiert – du siehst welche Nachrichten ankommen.' },
  { icon: '🧠', title: 'Personalisierung wächst', desc: 'Mit der Zeit weiß das System, was bei welchem Kunden funktioniert.' },
  { icon: '📈', title: 'Bessere Ergebnisse', desc: 'Öffnungsraten, Klickraten, Antworten – je mehr du sendest, desto besser wird\'s.' },
];

const WA_STATS = [
  '📊 WhatsApp hat eine Öffnungsrate von 98%',
  '💬 40% höhere Antwortrate als E-Mail',
  '⚡ Kunden antworten im Schnitt binnen 3 Minuten',
  '🚀 Businesses berichten +30% mehr Umsatz mit WhatsApp',
  '👥 Über 2 Milliarden aktive WhatsApp-Nutzer weltweit',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [industry, setIndustry] = useState<Industry>('autohaus');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutputMessage | null>(null);

  // Social proof stat – random initial, click cycles through
  const [statIndex, setStatIndex] = useState(() => Math.floor(Math.random() * WA_STATS.length));

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

  const handleStatClick = () => {
    setStatIndex((prev) => (prev + 1) % WA_STATS.length);
  };

  return (
    <div className="min-h-screen">
      {/* Header (minimal / null) */}
      <Header industry={industry} onIndustryChange={handleIndustryChange} disabled={isLoading} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative px-4 pt-12 pb-8 flex flex-col items-center overflow-hidden">
        {/* Background Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute top-8 left-8 text-5xl opacity-10">💬</span>
          <span className="absolute top-16 right-12 text-4xl opacity-10">🚗</span>
          <span className="absolute bottom-8 left-1/4 text-5xl opacity-10">📱</span>
          <span className="absolute bottom-16 right-8 text-4xl opacity-10">✅</span>
        </div>

        <div className="relative w-full max-w-xl flex flex-col items-center gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: 'rgba(7,94,84,0.75)' }}>
            <span style={{ color: '#25D366', fontSize: '10px' }}>●</span>
            KI-gestützte WhatsApp-Optimierung
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-bold text-white text-center leading-tight mb-4">
            Mehr Antworten.<br />
            <span style={{ color: '#DCF8C6' }}>Weniger ignoriert werden.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-white/75 text-[17px] text-center max-w-[480px] leading-relaxed">
            KI optimiert deine WhatsApp-Nachrichten für maximale Rücklaufquoten – in Sekunden.
          </p>

          {/* Industry Selector */}
          <div className="flex flex-wrap gap-2 justify-center">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => handleIndustryChange(ind.id)}
                disabled={isLoading}
                className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-all ${
                  industry === ind.id
                    ? 'bg-white/40 border border-white/60'
                    : 'bg-white/20 border border-white/30 hover:bg-white/30'
                } ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {ind.icon} {ind.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div id="input" className="w-full">
            <InputArea onGenerate={handleGenerate} isLoading={isLoading} industry={industry} />
          </div>

          {/* Social Proof – rotating stat */}
          <button
            onClick={handleStatClick}
            className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer select-none"
            title="Klicken für nächste Statistik"
          >
            {WA_STATS[statIndex]}
          </button>

          {/* Error Banner */}
          {error && (
            <div className="w-full animate-fade-in">
              <div className="bg-red-500/15 border border-red-400/30 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl flex-shrink-0">❌</span>
                <div className="flex-1">
                  <p className="font-semibold text-red-300 text-sm">Fehler beim Generieren</p>
                  <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-300/60 text-xl leading-none bg-transparent border-0 cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Output */}
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
      </section>

      {/* ── Section A: Was macht eine gute WhatsApp-Nachricht aus? ────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
            Schreib wie ein Freund, nicht wie ein Newsletter.
          </h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Die beste WhatsApp-Nachricht klingt nicht nach Marketing. Sie klingt nach dir.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {GOOD_MESSAGE_POINTS.map((point, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex gap-4">
                <div className="text-3xl flex-shrink-0">{point.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{point.title}</h3>
                  <p className="text-sm text-gray-500">{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section B: So funktioniert's ──────────────────────────────────── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">So funktioniert&apos;s</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-green-200">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  <span className="text-[#25D366] font-bold mr-1">{s.step}.</span>
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section C: Dein System lernt mit ─────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#075E54] to-[#25D366]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Dein System lernt mit.</h2>
          <p className="text-white/80 mb-10 max-w-xl mx-auto">
            Jede Antwort deiner Kunden macht das System schlauer – vollautomatisch.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {LEARNING_POINTS.map((p, i) => (
              <div key={i} className="bg-white/15 backdrop-blur rounded-2xl p-5 border border-white/20 text-left">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-semibold text-white mb-1">{p.title}</h3>
                <p className="text-sm text-white/70">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-6 px-4 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">© 2026 ChatRevenue · WhatsApp Message Optimizer</p>
      </footer>
    </div>
  );
}
