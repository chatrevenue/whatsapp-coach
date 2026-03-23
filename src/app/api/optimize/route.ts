import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/system-prompts';
import { getTopExamples, getGlobalInstructions, getInsight } from '@/lib/kv';
import type { Industry, OptimizeRequest, OptimizeResponse, IndustryInstructions } from '@/lib/types';

export { type OptimizeRequest, type OptimizeResponse };

async function loadInstructions(industry: string): Promise<IndustryInstructions | null> {
  try {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    if (!kvUrl || !kvToken) return null;

    const { kv } = await import('@vercel/kv');
    return await kv.get<IndustryInstructions>(`instructions:${industry}`);
  } catch {
    return null;
  }
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

    const body: OptimizeRequest & { goal?: string; tone?: string } = await req.json();
    const { message, history = [], industry = 'autohaus', goal, tone } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Bitte gib eine Nachricht ein.' }, { status: 400 });
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Nachricht ist zu lang. Maximal 2000 Zeichen.' },
        { status: 400 }
      );
    }

    // Load top 3 examples, instructions, global instructions and insight
    const [examples, instructions, globalInstructions, insight] = await Promise.all([
      getTopExamples(industry as Industry, 3),
      loadInstructions(industry),
      getGlobalInstructions(),
      getInsight(industry),
    ]);

    const systemPrompt = await buildSystemPrompt(industry, examples, instructions, globalInstructions, insight);

    const client = new Anthropic({ apiKey });

    const messages: Anthropic.MessageParam[] = [];

    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const industryLabels: Record<string, string> = {
      autohaus: 'ein Autohaus',
      restaurant: 'ein Restaurant',
      fitnessstudio: 'ein Fitnessstudio',
      andere: 'ein Unternehmen',
    };

    const goalLabels: Record<string, string> = {
      verkauf: 'Verkauf',
      erinnerung: 'Erinnerung',
      event: 'Event/Einladung',
      followup: 'Follow-up',
    };

    const toneLabels: Record<string, string> = {
      locker: 'Locker & entspannt',
      freundlich: 'Freundlich & herzlich',
      verkaufsstark: 'Verkaufsstark & überzeugend',
    };

    const contextLines = [
      `Optimiere diese WhatsApp-Nachricht für ${industryLabels[industry] ?? 'ein Unternehmen'}:`,
      goal ? `ZIEL: ${goalLabels[goal] ?? goal}` : null,
      tone ? `TON: ${toneLabels[tone] ?? tone}` : null,
      `OPTIMIERE: "${message.trim()}"`,
    ].filter(Boolean).join('\n');

    messages.push({
      role: 'user',
      content: contextLines,
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Keine Textantwort von der KI erhalten.');
    }

    const rawText = textContent.text.trim();

    let parsed: OptimizeResponse;
    try {
      const jsonMatch =
        rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText;
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('KI hat kein gültiges JSON zurückgegeben. Bitte nochmal versuchen.');
    }

    if (
      typeof parsed.optimized_message !== 'string' ||
      !Array.isArray(parsed.quick_replies) ||
      typeof parsed.tip !== 'string'
    ) {
      throw new Error('Unvollständige Antwort von der KI. Bitte nochmal versuchen.');
    }

    const quickReplies = parsed.quick_replies
      .slice(0, 3)
      .map((r: string) => String(r).substring(0, 20));

    while (quickReplies.length < 3) {
      quickReplies.push(['Mehr Info', 'Termin buchen', 'Danke'][quickReplies.length]);
    }

    const autoResponses: string[] = Array.isArray(parsed.auto_responses)
      ? parsed.auto_responses.slice(0, 3).map((r: string) => String(r))
      : [];

    return NextResponse.json({
      optimized_message: parsed.optimized_message,
      quick_replies: quickReplies,
      auto_responses: autoResponses,
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
