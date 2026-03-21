import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `Du bist ein WhatsApp Marketing Experte für Autohäuser.

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

AUSGABE IMMER als valides JSON:
{
  "optimized_message": "optimierter Text hier",
  "quick_replies": ["Button 1", "Button 2", "Button 3"],
  "tip": "kurzer Tipp warum diese Version besser ist"
}`;

export interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
}

export interface OptimizeRequest {
  message: string;
  history?: MessageHistory[];
}

export interface OptimizeResponse {
  optimized_message: string;
  quick_replies: string[];
  tip: string;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key nicht konfiguriert. Bitte ANTHROPIC_API_KEY setzen.' },
        { status: 500 }
      );
    }

    const body: OptimizeRequest = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Bitte gib eine Nachricht ein.' },
        { status: 400 }
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Nachricht ist zu lang. Maximal 2000 Zeichen.' },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build message history for multi-turn conversation
    const messages: Anthropic.MessageParam[] = [];

    // Add previous history
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: `Optimiere diese WhatsApp-Nachricht für ein Autohaus:\n\n"${message.trim()}"`,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Keine Textantwort von der KI erhalten.');
    }

    const rawText = textContent.text.trim();

    // Parse JSON from response (handle potential markdown code blocks)
    let parsed: OptimizeResponse;
    try {
      // Strip markdown code blocks if present
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText;
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('KI hat kein gültiges JSON zurückgegeben. Bitte nochmal versuchen.');
    }

    // Validate response structure
    if (
      typeof parsed.optimized_message !== 'string' ||
      !Array.isArray(parsed.quick_replies) ||
      typeof parsed.tip !== 'string'
    ) {
      throw new Error('Unvollständige Antwort von der KI. Bitte nochmal versuchen.');
    }

    // Ensure exactly 3 quick replies, trim to 20 chars
    const quickReplies = parsed.quick_replies
      .slice(0, 3)
      .map((r: string) => String(r).substring(0, 20));

    while (quickReplies.length < 3) {
      quickReplies.push(['Mehr Info', 'Termin buchen', 'Danke'][quickReplies.length]);
    }

    return NextResponse.json({
      optimized_message: parsed.optimized_message,
      quick_replies: quickReplies,
      tip: parsed.tip,
    });
  } catch (error) {
    console.error('[/api/optimize] Error:', error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'API Key ungültig. Bitte prüfe deinen Anthropic API Key.' },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate Limit erreicht. Bitte warte kurz und versuche es erneut.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `API Fehler: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unbekannter Fehler aufgetreten.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
