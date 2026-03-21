'use client';

import { useState } from 'react';

interface HeroSectionProps {
  onOptimize: (message: string) => void;
  isLoading: boolean;
}

const EXAMPLE_MESSAGES = [
  'Hallo Herr Müller, wir haben noch das Fahrzeug welches Sie sich letzten Monat angeschaut haben. Sind Sie noch interessiert?',
  'Guten Tag, ich wollte mich mal melden wegen Ihres Interesses an unserem Angebot. Haben Sie schon eine Entscheidung getroffen?',
  'Sehr geehrter Kunde, wir möchten Sie über unsere aktuelle Aktion informieren. Bis Ende des Monats gibt es 10% auf alle Gebrauchtwagen.',
];

export default function HeroSection({ onOptimize, isLoading }: HeroSectionProps) {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    setCharCount(val.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onOptimize(message.trim());
    }
  };

  const loadExample = () => {
    const random = EXAMPLE_MESSAGES[Math.floor(Math.random() * EXAMPLE_MESSAGES.length)];
    setMessage(random);
    setCharCount(random.length);
  };

  const canSubmit = message.trim().length > 0 && message.length <= 2000 && !isLoading;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-whatsapp-teal via-whatsapp-green-dark to-whatsapp-green py-16 sm:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">💬</div>
        <div className="absolute top-20 right-20 text-4xl">🚗</div>
        <div className="absolute bottom-10 left-1/4 text-5xl">📱</div>
        <div className="absolute bottom-20 right-10 text-4xl">✅</div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-sm font-medium px-4 py-1.5 rounded-full border border-white/30">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            KI-gestützte WhatsApp-Optimierung
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold text-white text-center leading-tight mb-4">
          Mehr Antworten.
          <br />
          <span className="text-whatsapp-bubble">Weniger ignoriert werden.</span>
        </h1>

        <p className="text-lg text-white/80 text-center mb-10 max-w-xl mx-auto">
          KI optimiert deine WhatsApp-Nachrichten nach dem Hormozi-Framework –
          speziell für Autohäuser entwickelt.
        </p>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Deine aktuelle WhatsApp-Nachricht
            </label>
            <textarea
              value={message}
              onChange={handleChange}
              placeholder="Füge hier deine Nachricht ein, die du optimieren möchtest..."
              rows={5}
              maxLength={2000}
              className="
                w-full resize-none rounded-xl border-2 border-gray-200
                focus:border-whatsapp-green p-3 text-gray-800 text-sm
                placeholder:text-gray-400 transition-colors duration-200
              "
            />
            <div className="flex items-center justify-between mt-2 mb-4">
              <button
                type="button"
                onClick={loadExample}
                className="text-xs text-whatsapp-green-dark hover:underline font-medium"
              >
                ✨ Beispiel laden
              </button>
              <span className={`text-xs ${charCount > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                {charCount}/2000
              </span>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="
                w-full py-4 rounded-xl font-bold text-white text-lg
                bg-whatsapp-green hover:bg-whatsapp-green-dark
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-[0.98]
                transition-all duration-200
                flex items-center justify-center gap-3
                shadow-lg shadow-green-500/30
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  KI optimiert...
                </>
              ) : (
                <>
                  🚀 Jetzt optimieren
                </>
              )}
            </button>
          </form>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex -space-x-2">
              {['🧑', '👩', '👨', '🧑‍💼'].map((emoji, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm border-2 border-white">
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">127+ Autohäuser</span> nutzen es bereits
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
