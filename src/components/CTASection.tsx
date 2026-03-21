'use client';

const FEATURES = [
  {
    icon: '🤖',
    title: 'KI-gestützte Optimierung',
    desc: 'Claude analysiert deine Nachrichten und macht sie unwiderstehlich.',
  },
  {
    icon: '⚡',
    title: 'Hormozi-Framework',
    desc: 'Hook, Agitation, Solution, CTA – bewährt in über 1.000 Kampagnen.',
  },
  {
    icon: '📱',
    title: 'Quick-Replies inklusive',
    desc: '3 Button-Vorschläge für maximale Klickrate direkt in WhatsApp.',
  },
  {
    icon: '📈',
    title: 'Mehr Rücklaufquoten',
    desc: 'Autohäuser berichten von +40% mehr Antworten in der ersten Woche.',
  },
];

export default function CTASection() {
  const handleDemoClick = () => {
    // Scroll to top / hero section for demo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
            Warum WhatsApp KI-Coach?
          </h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Kein Marketing-Experte nötig. Einfach Nachricht rein, optimierte Version raus.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-8">
            Was Autohäuser sagen
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                quote: '"Unsere Rücklaufquote ist in 2 Wochen um 47% gestiegen. Unglaublich!"',
                name: 'Marcus W.',
                role: 'Autohaus-Inhaber, München',
              },
              {
                quote: '"Endlich antwortet unser Team nicht mehr mit langweiligen Standard-Texten."',
                name: 'Sandra K.',
                role: 'Verkaufsleiterin, Hamburg',
              },
              {
                quote: '"Das Tool zahlt sich schon nach dem ersten Abschluss aus."',
                name: 'Thomas B.',
                role: 'Vertrieb, Autopark Frankfurt',
              },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 italic mb-3">{t.quote}</p>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-whatsapp-teal to-whatsapp-green">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Für alle Kunden skalieren?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
            Das hier ist nur ein Vorgeschmack. Mit dem vollen System erstellst du
            optimierte Kampagnen für 100s von Kontakten auf Knopfdruck.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleDemoClick}
              className="
                px-8 py-4 bg-white text-whatsapp-teal font-bold rounded-xl
                hover:bg-gray-50 active:scale-95 transition-all
                shadow-lg text-lg
              "
            >
              🚀 Kostenlos testen
            </button>
            <a
              href="mailto:demo@whatsapp-coach.de?subject=Demo%20anfragen&body=Hallo%2C%20ich%20m%C3%B6chte%20eine%20Demo%20des%20WhatsApp%20KI-Coach%20f%C3%BCr%20mein%20Autohaus."
              className="
                px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-xl
                hover:bg-white/10 active:scale-95 transition-all
                text-lg
              "
            >
              📞 Demo anfragen
            </a>
          </div>

          <p className="text-white/60 text-sm mt-6">
            Kein Kreditkarte nötig · Sofort einsatzbereit · DSGVO-konform
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} WhatsApp KI-Coach · Gebaut mit{' '}
          <span className="text-whatsapp-green">♥</span> für Autohäuser
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Nicht offiziell von WhatsApp oder Meta. Alle Marken gehören ihren jeweiligen Eigentümern.
        </p>
      </footer>
    </>
  );
}
