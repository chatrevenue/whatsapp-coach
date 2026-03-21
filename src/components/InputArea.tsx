'use client';

import { useState } from 'react';
import PillButton from '@/components/ui/PillButton';

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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Main input card */}
      <div className="bg-[#1E2130] rounded-2xl border border-[#2D3348] shadow-xl shadow-black/40 p-5 space-y-4">
        {/* Textarea */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Was möchtest du verschicken? (z. B. Aktion, Termin, Angebot...)"
          rows={4}
          maxLength={2000}
          className="
            w-full bg-[#0F1117] text-[#F1F5F9] placeholder-[#94A3B8]/50
            rounded-xl px-4 py-3 text-sm leading-relaxed resize-none
            border border-[#2D3348] focus:border-[#25D366]
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />

        {/* Character count */}
        <div className="flex justify-end">
          <span className={`text-xs ${message.length > 1800 ? 'text-orange-400' : 'text-[#94A3B8]'}`}>
            {message.length}/2000
          </span>
        </div>

        {/* Goal Chips */}
        <div className="space-y-2">
          <span className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Ziel</span>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <PillButton
                key={g.id}
                active={goal === g.id}
                onClick={() => setGoal(goal === g.id ? null : g.id)}
                disabled={isLoading}
                size="sm"
              >
                {g.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Tone Chips */}
        <div className="space-y-2">
          <span className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Ton</span>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <PillButton
                key={t.id}
                active={tone === t.id}
                onClick={() => setTone(tone === t.id ? null : t.id)}
                disabled={isLoading}
                size="sm"
              >
                {t.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="
            w-full py-3.5 rounded-xl font-semibold text-sm text-white
            bg-[#25D366] hover:bg-[#1DA851]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-[0.99]
            shadow-lg shadow-[#25D366]/20
            flex items-center justify-center gap-2
          "
        >
          {isLoading ? (
            <>
              <span className="animate-spin text-base">⟳</span>
              <span>Generiere...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Nachricht generieren</span>
              <span className="text-white/50 text-xs font-normal ml-1">⌘↵</span>
            </>
          )}
        </button>
      </div>

      {/* Example Chips */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => handleExampleClick(ex.text)}
            disabled={isLoading}
            className="
              text-xs px-3 py-1.5 rounded-full
              bg-[#1A1D27] text-[#94A3B8] border border-[#2D3348]
              hover:border-[#25D366]/50 hover:text-[#F1F5F9]
              transition-all duration-150 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
