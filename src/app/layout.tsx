import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhatsApp Message Optimizer | Better messages in seconds',
  description: 'KI optimiert deine WhatsApp-Nachrichten für maximale Rücklaufquoten. Für Autohäuser, Restaurants, Fitnessstudios und mehr.',
  keywords: 'WhatsApp Marketing, KI, Künstliche Intelligenz, Nachrichten optimieren, Message Optimizer',
  openGraph: {
    title: 'WhatsApp Message Optimizer',
    description: 'Better messages in seconds',
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
    <html lang="de" className={inter.variable}>
      <body
        className="antialiased min-h-screen bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#25D366]"
        style={{ backgroundAttachment: 'fixed' }}
      >
        {children}
      </body>
    </html>
  );
}
