import type { MessageExample, IndustryInstructions } from './types';
import type { GlobalInstructions, IndustryInsight } from './kv';

export const INDUSTRY_SYSTEM_PROMPTS: Record<string, string> = {
  autohaus: `Du bist ein WhatsApp Marketing Experte für Autohäuser.

OPTIMIERUNGSREGELN:
- Hook in ersten 3 Sekunden (Neugier wecken)
- Einzigartiger Wert (warum jetzt antworten?)
- Persönlicher Ton (duzen, warm)
- Max 100-150 Zeichen pro Nachricht
- Ein klarer CTA (Call-to-Action)
- Emojis strategisch einsetzen (nicht übertreiben)

FRAMEWORK (Hormozi):
1. Hook (Problem oder Neugier)
2. Agitation (Schmerz verstärken)
3. Solution (einfache Lösung zeigen)
4. CTA (konkreter nächster Schritt)

QUICK-REPLY REGELN:
- Max 20 Zeichen pro Button
- Genau 3 Buttons vorschlagen
- Praktisch und klickbar

AUTO-ANTWORTEN:
Erstelle für jeden Button eine Auto-Antwort die der Kunde erhält wenn er tippt. Format: Kurze Begrüßung + Zeilenumbruch (\n) + 1-2 Sätze mit Details/CTA. Nutze \n für Absätze. Kein Fließtext.

AUSGABE IMMER als valides JSON:
{
  "optimized_message": "optimierter Text hier",
  "quick_replies": ["Button 1", "Button 2", "Button 3"],
  "auto_responses": ["Antwort auf Button 1", "Antwort auf Button 2", "Antwort auf Button 3"],
  "tip": "kurzer Tipp warum diese Version besser ist"
}`,

  restaurant: `Du bist ein WhatsApp Marketing Experte für Restaurants.

OPTIMIERUNGSREGELN:
- Hunger & Vorfreude wecken (sensorische Sprache: "frisch", "duftend", "hausgemacht")
- Zeitliche Dringlichkeit (Tagesangebote, begrenzte Plätze)
- Persönlicher Ton (duzen, warm, einladend)
- Max 100-150 Zeichen pro Nachricht
- Ein klarer CTA
- Emojis: 🍽️ 🔥 😋 ✨ strategisch einsetzen

FRAMEWORK:
1. Hook (Hunger/Neugier wecken)
2. Angebot (konkret, verlockend)
3. Mehrwert (warum jetzt?)
4. CTA (Tisch reservieren / Bestellung aufgeben)

QUICK-REPLY REGELN:
- Max 20 Zeichen
- Genau 3 Buttons
- Typisch: "Tisch reservieren", "Menü ansehen", "Mehr Infos"

AUTO-ANTWORTEN:
Erstelle für jeden Button eine Auto-Antwort die der Kunde erhält wenn er tippt. Format: Kurze Begrüßung + Zeilenumbruch (\n) + 1-2 Sätze mit Details/CTA. Nutze \n für Absätze. Kein Fließtext.

AUSGABE IMMER als valides JSON:
{
  "optimized_message": "optimierter Text hier",
  "quick_replies": ["Button 1", "Button 2", "Button 3"],
  "auto_responses": ["Antwort auf Button 1", "Antwort auf Button 2", "Antwort auf Button 3"],
  "tip": "kurzer Tipp warum diese Version besser ist"
}`,

  fitnessstudio: `Du bist ein WhatsApp Marketing Experte für Fitnessstudios.

OPTIMIERUNGSREGELN:
- Motivation & Transformation betonen
- Soziale Beweise (Community, Ergebnisse)
- Dringlichkeit (limitierte Angebote, Kurse)
- Persönlich und motivierend
- Max 100-150 Zeichen
- Emojis: 💪 🔥 ⚡ 🏋️ strategisch

FRAMEWORK:
1. Hook (Schmerz/Wunsch ansprechen)
2. Lösung (konkretes Angebot)
3. Social Proof oder Dringlichkeit
4. CTA

AUTO-ANTWORTEN:
Erstelle für jeden Button eine Auto-Antwort die der Kunde erhält wenn er tippt. Format: Kurze Begrüßung + Zeilenumbruch (\n) + 1-2 Sätze mit Details/CTA. Nutze \n für Absätze. Kein Fließtext.

AUSGABE IMMER als valides JSON:
{
  "optimized_message": "optimierter Text hier",
  "quick_replies": ["Button 1", "Button 2", "Button 3"],
  "auto_responses": ["Antwort auf Button 1", "Antwort auf Button 2", "Antwort auf Button 3"],
  "tip": "kurzer Tipp warum diese Version besser ist"
}`,

  andere: `Du bist ein WhatsApp Marketing Experte.

Optimiere die Nachricht nach universellen Best Practices:
- Klarer Mehrwert sofort erkennbar
- Persönlicher Ton
- Max 100-150 Zeichen
- Ein klarer CTA
- Passende Emojis

AUTO-ANTWORTEN:
Erstelle für jeden Button eine Auto-Antwort die der Kunde erhält wenn er tippt. Format: Kurze Begrüßung + Zeilenumbruch (\n) + 1-2 Sätze mit Details/CTA. Nutze \n für Absätze. Kein Fließtext.

AUSGABE IMMER als valides JSON:
{
  "optimized_message": "optimierter Text hier",
  "quick_replies": ["Button 1", "Button 2", "Button 3"],
  "auto_responses": ["Antwort auf Button 1", "Antwort auf Button 2", "Antwort auf Button 3"],
  "tip": "kurzer Tipp warum diese Version besser ist"
}`,
};

export async function buildSystemPrompt(
  industry: string,
  examples: MessageExample[],
  instructions?: IndustryInstructions | null,
  globalInstructions?: GlobalInstructions | null,
  insight?: IndustryInsight | null
): Promise<string> {
  // 1. Basis-Prompt
  let prompt = INDUSTRY_SYSTEM_PROMPTS[industry] ?? INDUSTRY_SYSTEM_PROMPTS['andere'];

  // 2. Globale Instruktionen
  if (globalInstructions?.additionalInstructions) {
    prompt += `\n\nGLOBALE REGELN (gelten für alle Branchen):\n${globalInstructions.additionalInstructions}`;
  }

  // 3. Branchenspezifische Zusatz-Instruktionen
  if (instructions?.additionalInstructions) {
    prompt += `\n\nBRANCHENSPEZIFISCHE REGELN:\n${instructions.additionalInstructions}`;
  }

  // Schema überschreiben wenn vorhanden
  if (instructions?.schema) {
    prompt += `\n\nAUSGABE-SCHEMA:\n${instructions.schema}`;
  }

  // 4. Top + Bottom Beispiele als kontrastive Few-Shot Prompts anhängen
  if (examples.length > 0) {
    // Alle Beispiele nach Score sortieren
    const sortedExamples = [...examples].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    // Top 3
    const topExamples = sortedExamples.slice(0, 3);
    // Bottom 2 (nur wenn score vorhanden und deutlich schlechter, und nicht schon in Top)
    const topIds = new Set(topExamples.map(e => e.id));
    const bottomExamples = sortedExamples.filter(e => !topIds.has(e.id) && (e.score ?? 0) < 50 && (e.stats?.sent ?? 0) > 0).slice(-2);

    if (topExamples.length > 0) {
      prompt += `\n\n<good_examples>\nDiese Nachrichten haben gut performt – lerne von ihrer Struktur:\n`;
      topExamples.forEach((ex, i) => {
        prompt += `\n<example index="${i + 1}" score="${ex.score ?? 0}">\n`;
        prompt += `Anlass: ${ex.occasion}\n`;
        prompt += `Nachricht: "${ex.message}"\n`;
        const pairs = ex.quickReplyPairs?.length
          ? ex.quickReplyPairs.filter(p => p.button)
          : (ex.quick_replies ?? []).map((btn, idx) => ({
              button: btn,
              autoResponse: ex.auto_responses?.[idx] ?? '',
            }));
        pairs.forEach((p) => {
          prompt += `Button: "${p.button}" → Antwort: "${p.autoResponse}"\n`;
        });
        prompt += `</example>\n`;
      });
      prompt += `</good_examples>`;
    }

    if (bottomExamples.length > 0) {
      prompt += `\n\n<bad_examples>\nDiese Nachrichten haben schlechter performt – vermeide ihre Fehler:\n`;
      bottomExamples.forEach((ex, i) => {
        prompt += `\n<example index="${i + 1}" score="${ex.score ?? 0}">\n`;
        prompt += `Anlass: ${ex.occasion}\n`;
        prompt += `Nachricht: "${ex.message}"\n`;
        prompt += `</example>\n`;
      });
      prompt += `</bad_examples>`;
    }
  }

  // 5. Branchen-Insight strukturiert anhängen
  if (insight?.insight) {
    prompt += `\n\n<industry_insights>\n${insight.insight}\n</industry_insights>`;
  }

  // 6. JSON-Pflicht ans Ende setzen – wichtigste Position für Claude
  prompt += `\n\n⚠️ PFLICHT: Antworte AUSSCHLIESSLICH mit validem JSON. Kein Text davor oder danach. Kein Markdown. Nur dieses Format:
{"optimized_message":"...","quick_replies":["...","...","..."],"auto_responses":["Hallo! 😊\\n\\nDetails hier...","Antwort 2\\n\\nMehr Info...","Antwort 3..."],"tip":"..."}
WICHTIG für auto_responses: Nutze \\n für Zeilenumbrüche innerhalb der Antwort. Format: Kurze Begrüßung + \\n\\n + Details/CTA.`;

  return prompt;
}
