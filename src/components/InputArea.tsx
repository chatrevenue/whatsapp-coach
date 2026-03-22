'use client';

import { useState } from 'react';

type Goal = 'verkauf' | 'erinnerung' | 'event' | 'followup' | null;
type Tone = 'locker' | 'freundlich' | 'verkaufsstark' | null;

export { type Goal, type Tone };

const EXAMPLES = [
  { label: '🍽️ Aktion im Restaurant', text: 'Wir haben diese Woche ein besonderes Mittagsmenü' },
  { label: '📅 Event Einladung', text: 'Wir laden zum Tag der offenen Tür ein' },
  { label: '🔄 Follow-up nach Termin', text: 'Ich wollte kurz nachfragen wie alles gelaufen ist' },
];

const GOALS: { id: Goal; label: string }[] = [
  { id: 'verkauf', label: 'Verkauf' },
  { id: 'erinnerung', label: 'Erinnerung' },
  { id: 'event', label: 'Event' },
  { id: 'followup', label: 'Follow-up' },
];

const TONES: { id: Tone; label: string }[] = [
  { id: 'locker', label: 'Locker' },
  { id: 'freundlich', label: 'Freundlich' },
  { id: 'verkaufsstark', label: 'Verkaufsstark' },
];

interface InputAreaProps {
  onGenerate: (message: string, goal: Goal, tone: Tone) => void;
  isLoading: boolean;
}

export default function InputArea({ onGenerate, isLoading }: InputAreaProps) {
  const [message, setMessage] = useState('');
  const [goal, setGoal] = useState<Goal>(null);
  const [tone, setTone] = useState<Tone>(null);

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    onGenerate(message.trim(), goal, tone);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleExampleClick = (text: string) => {
    setMessage(text);
  };

  const pillStyle = (active: boolean) => ({
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
  } as React.CSSProperties);

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
        <div style={{ marginBottom: '12px' }}>
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

        {/* Tone Chips */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(26,46,26,0.5)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Ton (optional)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(tone === t.id ? null : t.id)}
                disabled={isLoading}
                style={{
                  borderRadius: '50px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: tone === t.id ? 600 : 400,
                  cursor: 'pointer',
                  border: tone === t.id
                    ? '1px solid #9AE09A'
                    : '1px solid #E0E8E0',
                  background: tone === t.id
                    ? 'rgba(154,224,154,0.2)'
                    : 'white',
                  color: tone === t.id ? '#1A3A1A' : '#6B9E6B',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
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
            onClick={() => handleExampleClick(EXAMPLES[0].text)}
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
          disabled={!message.trim() || isLoading}
          style={{
            width: '100%',
            height: '52px',
            background: !message.trim() || isLoading
              ? 'rgba(154,224,154,0.5)'
              : 'linear-gradient(135deg, #9AE09A, #A8E6A0)',
            borderRadius: '12px',
            border: 'none',
            color: '#1A3A1A',
            fontSize: '16px',
            fontWeight: 700,
            cursor: !message.trim() || isLoading ? 'not-allowed' : 'pointer',
            marginTop: '16px',
            boxShadow: '0 2px 8px rgba(100,180,100,0.2)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {isLoading ? (
            <>⏳ Optimiert...</>
          ) : (
            <>🚀 Jetzt optimieren</>
          )}
        </button>
      </div>

      {/* Example Chips */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {EXAMPLES.map((ex) => (
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

      {/* Ziel/Ton Pills also as transparent on green bg — shown as hint below examples */}
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
