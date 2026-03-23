'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import InputArea, { type Goal, type Tone } from '@/components/InputArea';
import OutputArea, { type OutputMessage } from '@/components/OutputArea';
import type { Industry } from '@/lib/types';

const GOOD_MESSAGE_POINTS = [
  { icon: '👋', title: 'Persönlich & kurz', desc: 'Max. 2-3 Sätze. Kein Roman. Kein Newsletter-Stil.' },
  { icon: '❓', title: 'Immer eine Frage', desc: 'Jede Nachricht endet mit einer einfachen Frage – beantwortet über Quick-Reply-Buttons.' },
  { icon: '🎯', title: 'Infos kommen danach', desc: 'Produkt, Preis, Details – alles kommt erst in der automatischen Antwort auf den Button-Klick.' },
  { icon: '🤝', title: 'Kein Verkaufsdruck', desc: 'Die erste Nachricht macht neugierig. Nicht aufdringlich.' },
];

const STEPS = [
  { step: '1', icon: '✍️', title: 'Kurz beschreiben', desc: 'Was willst du kommunizieren? Ein Satz reicht.' },
  { step: '2', icon: '🤖', title: 'KI optimiert', desc: 'Claude verwandelt es in eine WhatsApp-freundliche Nachricht mit Quick-Replies.' },
  { step: '3', icon: '📋', title: 'Kopieren & senden', desc: 'Alles einzeln kopierbar – direkt in ChatRevenue einfügen.' },
];

const LEARNING_POINTS = [
  { icon: '💾', title: 'Antworten werden gespeichert', desc: 'Was deine Kunden antworten, wird analysiert und gemerkt.' },
  { icon: '🧠', title: 'Personalisierung wächst', desc: 'Mit der Zeit weiß das System, was bei welchem Kunden ankommt.' },
  { icon: '📈', title: 'Bessere Ergebnisse', desc: 'Öffnungsraten, Klickraten, Antworten – alles steigt.' },
];

const sectionContainerStyle: React.CSSProperties = {
  marginTop: '48px',
  background: 'rgba(255,255,255,0.12)',
  backdropFilter: 'blur(12px)',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: '32px',
  width: '100%',
};

const sectionHeadlineStyle: React.CSSProperties = {
  color: 'white',
  fontSize: '24px',
  fontWeight: 700,
  marginBottom: '8px',
};

const sectionSubtextStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: '15px',
  marginBottom: '24px',
};

const itemCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)',
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-start',
};

const itemIconStyle: React.CSSProperties = {
  fontSize: '24px',
  flexShrink: 0,
  lineHeight: 1,
};

const itemTitleStyle: React.CSSProperties = {
  color: 'white',
  fontWeight: 600,
  fontSize: '14px',
  marginBottom: '4px',
};

const itemDescStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '13px',
  lineHeight: 1.5,
};

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
      {/* Background Glassmorphism Icons */}
      <div style={{
        position: 'fixed', top: '24px', left: '24px', zIndex: 0,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '16px',
        fontSize: '36px',
        lineHeight: 1,
        pointerEvents: 'none',
      }}>💬</div>

      <div style={{
        position: 'fixed', top: '24px', right: '24px', zIndex: 0,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '16px',
        fontSize: '36px',
        lineHeight: 1,
        pointerEvents: 'none',
      }}>🚗</div>

      <div style={{
        position: 'fixed', bottom: '24px', left: '24px', zIndex: 0,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '16px',
        fontSize: '36px',
        lineHeight: 1,
        pointerEvents: 'none',
      }}>📅</div>

      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 0,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '16px',
        fontSize: '36px',
        lineHeight: 1,
        pointerEvents: 'none',
      }}>✅</div>

      {/* Sticky Header */}
      <Header
        industry={industry}
        onIndustryChange={handleIndustryChange}
        disabled={isLoading}
      />

      {/* Main Content */}
      <main className="relative flex flex-col items-center px-4 pt-10 pb-16">
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

          {/* Input Section */}
          <div id="input" className="w-full">
            <InputArea onGenerate={handleGenerate} isLoading={isLoading} industry={industry} />
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

          {/* ───── Section A: Was macht eine gute WhatsApp-Nachricht aus? ───── */}
          <div style={sectionContainerStyle}>
            <h2 style={sectionHeadlineStyle}>Schreib wie ein Freund, nicht wie ein Newsletter.</h2>
            <p style={sectionSubtextStyle}>
              Die beste WhatsApp-Nachricht klingt nicht nach Marketing. Sie klingt nach dir.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {GOOD_MESSAGE_POINTS.map((pt) => (
                <div key={pt.title} style={itemCardStyle}>
                  <span style={itemIconStyle}>{pt.icon}</span>
                  <div>
                    <div style={itemTitleStyle}>{pt.title}</div>
                    <div style={itemDescStyle}>{pt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ───── Section B: So funktioniert's ───── */}
          <div style={sectionContainerStyle}>
            <h2 style={sectionHeadlineStyle}>So funktioniert&apos;s</h2>
            <p style={sectionSubtextStyle}>In 3 Schritten zur perfekten WhatsApp-Nachricht.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {STEPS.map((s) => (
                <div key={s.step} style={itemCardStyle}>
                  <div style={{
                    flexShrink: 0,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={itemTitleStyle}>{s.icon} {s.title}</div>
                    <div style={itemDescStyle}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ───── Section C: Je mehr du sendest ───── */}
          <div style={sectionContainerStyle}>
            <h2 style={sectionHeadlineStyle}>Dein System lernt mit.</h2>
            <p style={sectionSubtextStyle}>
              Jede Antwort deiner Kunden macht das System schlauer – vollautomatisch.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {LEARNING_POINTS.map((pt) => (
                <div key={pt.title} style={itemCardStyle}>
                  <span style={itemIconStyle}>{pt.icon}</span>
                  <div>
                    <div style={itemTitleStyle}>{pt.title}</div>
                    <div style={itemDescStyle}>{pt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
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
