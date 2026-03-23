import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getExamplesForIndustry, saveInsight } from '@/lib/kv';
import type { IndustryInsight } from '@/lib/kv';

const INDUSTRIES = ['autohaus', 'restaurant', 'fitnessstudio', 'andere'];

// GET: Vercel Cron (prüft Authorization: Bearer CRON_SECRET)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await analyzeAllIndustries();
  return NextResponse.json({ ok: true, results });
}

// POST: Manueller Trigger aus Admin (prüft x-admin-password Header oder body.adminPassword)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { industry?: string; adminPassword?: string };
  const pw = req.headers.get('x-admin-password') ?? body.adminPassword ?? '';

  if (pw !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetIndustry = body.industry;
  const industries = targetIndustry ? [targetIndustry] : INDUSTRIES;
  const results = await analyzeIndustries(industries);
  return NextResponse.json({ ok: true, results });
}

async function analyzeIndustries(industries: string[]): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Object.fromEntries(industries.map((ind) => [ind, 'skip (kein API Key)']));
  }

  const client = new Anthropic({ apiKey });
  const results: Record<string, string> = {};

  for (const industry of industries) {
    try {
      const examples = await getExamplesForIndustry(industry);
      const withStats = examples.filter((e) => (e.stats?.sent ?? 0) > 0);

      if (withStats.length < 2) {
        results[industry] = 'skip (zu wenig Daten)';
        continue;
      }

      const top5 = [...withStats]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5);

      const examplesText = top5
        .map((ex, i) => {
          const sent = ex.stats.sent ?? 0;
          const openPct = sent > 0 ? Math.round((ex.stats.opened / sent) * 100) : '?';
          const respPct = sent > 0 ? Math.round((ex.stats.responded / sent) * 100) : '?';
          return `Beispiel ${i + 1} (Score: ${ex.score ?? 0}):\nNachricht: "${ex.message}"\nÖffnungsrate: ${openPct}%\nAntwortrate: ${respPct}%`;
        })
        .join('\n\n');

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        system: 'Du bist ein WhatsApp Marketing Analyst. Antworte auf Deutsch, knapp und direkt.',
        messages: [
          {
            role: 'user',
            content: `Analysiere diese ${top5.length} WhatsApp-Nachrichten für die Branche "${industry}". Was machen die Top-Performer besser als die anderen? Gib max. 3 konkrete, umsetzbare Erkenntnisse in 2-3 kurzen Sätzen.\n\n${examplesText}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const insight = textBlock && textBlock.type === 'text' ? textBlock.text : '';

      const insightData: IndustryInsight = {
        insight,
        generatedAt: new Date().toISOString(),
        exampleCount: withStats.length,
      };

      await saveInsight(industry, insightData);
      results[industry] = 'ok';
    } catch (err) {
      console.error(`[cron/analyze] Fehler bei Branche "${industry}":`, err);
      results[industry] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return results;
}

async function analyzeAllIndustries(): Promise<Record<string, string>> {
  return analyzeIndustries(INDUSTRIES);
}
