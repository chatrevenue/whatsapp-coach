'use client';

import { useState } from 'react';
import type { Industry } from '@/lib/types';

type Goal = 'verkauf' | 'erinnerung' | 'event' | 'followup' | null;
type Tone = 'locker' | 'freundlich' | 'verkaufsstark' | null;

export { type Goal, type Tone };

const EXAMPLES_BY_INDUSTRY: Record<string, { label: string; text: string }[]> = {
  autohaus: [
    { label: '🔧 Frühlingscheck', text: 'Wir haben diese Woche noch freie Termine für den Frühlingscheck' },
    { label: '🚗 Neues Modell', text: 'Unser neuer Elektro-SUV ist ab sofort bei uns verfügbar' },
    { label: '❄️ Reifenwechsel', text: 'Die Wintersaison ist vorbei – Zeit für Sommerreifen' },
  ],
  restaurant: [
    { label: '🍽️ Mittagsmenü', text: 'Heute haben wir ein besonderes Mittagsmenü' },
    { label: '🎉 Event', text: 'Nächsten Freitag ist Weinabend bei uns im Lokal' },
    { label: '🔥 Wochenspecial', text: 'Dieses Wochenende gibt es unser Hausspecial zum Aktionspreis' },
  ],
  fitnessstudio: [
    { label: '💪 Kursangebot', text: 'Nächste Woche startet unser neuer HIIT-Kurs' },
    { label: '🎯 Probetraining', text: 'Bring einen Freund mit – kostenlos probetrainieren' },
    { label: '⚡ Challenge', text: 'Wir starten eine 30-Tage Challenge – bist du dabei?' },
  ],
  andere: [
    { label: '📅 Event Einladung', text: 'Wir laden zu unserem Tag der offenen Tür ein' },
    { label: '🎁 Angebot', text: 'Nur diese Woche: 20% Rabatt auf alle Produkte' },
    { label: '🔄 Follow-up', text: 'Ich wollte kurz nachfragen wie alles bei dir läuft' },
  ],
};

const GOALS: { id: Goal; label: string }[] = [
  { id: 'verkauf', label: 'Verkauf' },
  { id: 'erinnerung', label: 'Erinnerung' },
  { id: 'event', label: 'Event' },
  { id: 'followup', label: 'Follow-up' },
];

interface InputAreaProps {
  onGenerate: (message: string, goal: Goal, tone: Tone) => void;
  isLoading: boolean;
  industry?: Industry;
}

export default function InputArea({ onGenerate, isLoading, industry = 'autohaus' }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [goal, setGoal] = useState<Goal>(null);


  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    onGenerate(message.trim(), goal, null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleExampleClick = (text: string) => {
    setMessage(text);
  };

  const examples = EXAMPLES_BY_INDUSTRY[industry] ?? EXAMPLES_BY_INDUSTRY.andere;

  const isDisabled = !message.trim() || isLoading;

  return (
    <div className="w-full">
      {/* Main white card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        padding: '32px',
        width: '100%',
      }}>
        {/* Card Label */}
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A2E1A', marginBottom: '12px' }}>
          📝 Deine aktuelle WhatsApp-Nachricht
        </div>

        {/* Goal Chips */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(26,46,26,0.5)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Ziel (optional)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(goal === g.id ? null : g.id)}
                disabled={isLoading}
                style={{
                  borderRadius: '50px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: goal === g.id ? 600 : 400,
                  cursor: 'pointer',
                  border: goal === g.id
                    ? '1px solid #9AE09A'
                    : '1px solid #E0E8E0',
                  background: goal === g.id
                    ? 'rgba(154,224,154,0.2)'
                    : 'white',
                  color: goal === g.id ? '#1A3A1A' : '#6B9E6B',
                  transition: 'all 0.15s ease',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Füge hier deine Nachricht ein, die du optimieren möchtest..."
          maxLength={2000}
          style={{
            border: '1px solid #E0E8E0',
            borderRadius: '12px',
            padding: '16px',
            height: '120px',
            fontSize: '14px',
            width: '100%',
            resize: 'vertical',
            color: '#1A2E1A',
            background: 'white',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />

        {/* Helper Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <button
            onClick={() => handleExampleClick(examples[0].text)}
            disabled={isLoading}
            style={{
              color: '#6B9E6B',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            ✨ Beispiel laden
          </button>
          <span style={{ color: '#A0A8A0', fontSize: '13px' }}>
            {message.length}/2000
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`w-full py-4 font-bold text-base rounded-xl transition-colors mt-4 flex items-center justify-center gap-2 ${
            isDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#25D366] hover:bg-[#1DA851] text-white cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>⏳ Optimiert...</>
          ) : (
            <>🚀 Jetzt optimieren</>
          )}
        </button>
      </div>

      {/* Example Chips – branchenspezifisch */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {examples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => handleExampleClick(ex.text)}
            disabled={isLoading}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.85)',
              borderRadius: '50px',
              padding: '6px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Re-export pillStyle for use in parent if needed
export function getPillStyle(active: boolean): React.CSSProperties {
  return {
    borderRadius: '50px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    border: active
      ? '1px solid rgba(255,255,255,0.6)'
      : '1px solid rgba(255,255,255,0.3)',
    background: active
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(255,255,255,0.15)',
    color: active ? 'white' : 'rgba(255,255,255,0.9)',
    transition: 'all 0.15s ease',
  };
}
