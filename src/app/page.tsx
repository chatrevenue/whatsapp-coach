'use client';

import { useState, useCallback } from 'react';
import HeroSection from '@/components/HeroSection';
import ResultSection, { ChatMessage } from '@/components/ResultSection';
import CTASection from '@/components/CTASection';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(
    async (
      userMessage: string,
      history: { role: 'user' | 'assistant'; content: string }[] = []
    ) => {
      setIsLoading(true);
      setError(null);

      const timestamp = new Date().toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Add user message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: userMessage,
          timestamp,
        },
      ]);

      try {
        const res = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, history }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Fehler ${res.status}`);
        }

        const assistantTimestamp = new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        });

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.optimized_message,
            optimized_message: data.optimized_message,
            quick_replies: data.quick_replies,
            tip: data.tip,
            timestamp: assistantTimestamp,
          },
        ]);

        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
        setError(msg);
        // Remove the user message we just added if there's an error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleOptimize = (message: string) => {
    // Fresh optimization – clear history
    setMessages([]);
    optimize(message, []);
  };

  const handleFollowUp = (
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[]
  ) => {
    optimize(message, history);
  };

  return (
    <main className="min-h-screen">
      <HeroSection onOptimize={handleOptimize} isLoading={isLoading} />

      {/* Error Banner */}
      {error && (
        <div className="max-w-2xl mx-auto mt-6 mx-4 px-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in">
            <span className="text-2xl flex-shrink-0">❌</span>
            <div>
              <p className="font-semibold text-red-800">Fehler beim Optimieren</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div id="results">
        <ResultSection
          messages={messages}
          isLoading={isLoading}
          onFollowUp={handleFollowUp}
        />
      </div>

      {/* How it works – only before first result */}
      {messages.length === 0 && !isLoading && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
              So funktioniert's
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  icon: '✍️',
                  title: 'Nachricht eingeben',
                  desc: 'Füge deine aktuelle WhatsApp-Nachricht in das Textfeld ein.',
                },
                {
                  step: '2',
                  icon: '🤖',
                  title: 'KI optimiert',
                  desc: 'Claude analysiert und verbessert nach dem Hormozi-Framework.',
                },
                {
                  step: '3',
                  icon: '🚀',
                  title: 'Mehr Antworten',
                  desc: 'Kopiere die optimierte Version und sende sie an deine Kunden.',
                },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 bg-whatsapp-green rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-green-200">
                    {s.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    <span className="text-whatsapp-green font-bold mr-1">{s.step}.</span>
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </main>
  );
}
