import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WhatsApp KI-Coach | Mehr Antworten für Autohäuser',
  description: 'KI optimiert deine WhatsApp-Nachrichten für maximale Rücklaufquoten. Speziell für Autohäuser entwickelt.',
  keywords: 'WhatsApp Marketing, Autohaus, KI, Künstliche Intelligenz, Nachrichten optimieren',
  openGraph: {
    title: 'WhatsApp KI-Coach für Autohäuser',
    description: 'Mehr Antworten durch KI-optimierte WhatsApp-Nachrichten',
    type: 'website',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💬</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
