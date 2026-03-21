# 💬 WhatsApp KI-Coach für Autohäuser

Eine KI-gestützte Landingpage, die WhatsApp-Nachrichten für Autohäuser nach dem Hormozi-Framework optimiert.

## Features

- 🤖 KI-Optimierung mit Claude (claude-sonnet-4-6)
- 💬 WhatsApp-Style Chat-Bubbles
- ⚡ Quick-Reply Button Vorschläge
- 🔄 Chat-History für iterative Verbesserungen
- 📱 Mobile-first Design
- 🚀 Vercel-ready (Zero Config)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **KI:** Anthropic Claude API
- **Deploy:** Vercel

## Setup

### 1. Repository klonen / Dateien kopieren

```bash
cd whatsapp-coach
npm install
```

### 2. Environment Variables setzen

```bash
cp .env.example .env.local
```

Dann in `.env.local` eintragen:

```env
ANTHROPIC_API_KEY=sk-ant-api03-dein-key-hier
```

API Key holen unter: [https://console.anthropic.com/](https://console.anthropic.com/)

### 3. Lokal starten

```bash
npm run dev
```

→ App läuft auf [http://localhost:3000](http://localhost:3000)

## Deploy auf Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B: GitHub → Vercel

1. Code auf GitHub pushen
2. [vercel.com](https://vercel.com) → "New Project" → GitHub Repo auswählen
3. Environment Variable setzen: `ANTHROPIC_API_KEY`
4. Deploy klicken ✅

## API Endpoint

### `POST /api/optimize`

**Request Body:**
```json
{
  "message": "Hallo Herr Müller, wir haben noch das Auto für Sie...",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "optimized_message": "🚗 Dein Traumauto wartet – nur noch heute verfügbar!",
  "quick_replies": ["Jetzt anschauen", "Termin buchen", "Preis erfragen"],
  "tip": "Der Hook erzeugt Dringlichkeit ohne aufdringlich zu wirken."
}
```

## Projekt-Struktur

```
src/
├── app/
│   ├── layout.tsx          # Root Layout + Metadaten
│   ├── page.tsx            # Haupt-Landingpage
│   ├── globals.css         # Globale Styles
│   └── api/optimize/
│       └── route.ts        # API Route (Anthropic)
└── components/
    ├── HeroSection.tsx     # Hero mit Textarea + Button
    ├── ResultSection.tsx   # Ergebnis-Container mit Chat
    ├── WhatsAppBubble.tsx  # Chat-Bubble Komponente
    ├── QuickReplies.tsx    # Quick-Reply Buttons
    └── CTASection.tsx      # Call-to-Action Section
```

## Customization

### System Prompt anpassen
`src/app/api/optimize/route.ts` → `SYSTEM_PROMPT` Variable

### Farben anpassen
`tailwind.config.js` → `theme.extend.colors.whatsapp`

### Branding
`src/app/layout.tsx` → Titel, Description, Favicon anpassen

## License

MIT – Mach was du willst damit. 🚀
