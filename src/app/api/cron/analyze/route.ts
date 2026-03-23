import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getExamplesForIndustry, saveInsight, getInsight } from '@/lib/kv';
import type { IndustryInsight } from '@/lib/kv';

export const dynamic = 'force-dynamic';

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
  const results = await analyzeIndustries(industries, targetIndustry);
  return NextResponse.json({ ok: true, results });
}

async function analyzeGlobal(client: Anthropic, perIndustryInsights: Record<string, string>) {
  // Nur wenn mindestens 2 Branchen Insights haben
  const validInsights = Object.entries(perIndustryInsights).filter(([, v]) => v && v !== 'skip');
  if (validInsights.length < 2) return;

  // Alle Beispiele aller Branchen mit Stats laden
  type ExampleWithIndustry = Omit<Awaited<ReturnType<typeof getExamplesForIndustry>>[number], 'industry'> & { industry: string };
  const allExamples: ExampleWithIndustry[] = [];
  for (const industry of INDUSTRIES) {
    const examples = await getExamplesForIndustry(industry);
    const withStats = examples.filter((e) => (e.stats?.sent ?? 0) > 0);
    allExamples.push(...withStats.map((e) => ({ ...e, industry } as ExampleWithIndustry)));
  }
  if (allExamples.length < 3) return;

  // Top-Performer über alle Branchen
  const topOverall = [...allExamples].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 8);

  const insightsSummary = validInsights.map(([ind, ins]) => `${ind}: ${ins}`).join('\n');
  const topExamplesText = topOverall
    .map((ex) => {
      const sent = ex.stats?.sent ?? 0;
      const openPct = sent > 0 ? Math.round(((ex.stats?.opened ?? 0) / sent) * 100) : '?';
      const respPct = sent > 0 ? Math.round(((ex.stats?.responded ?? 0) / sent) * 100) : '?';
      return `[${ex.industry}] Score ${ex.score ?? 0}: "${ex.message.substring(0, 80)}..." | Öffnung: ${openPct}% | Antwort: ${respPct}%`;
    })
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: 'Du bist ein WhatsApp Marketing Analyst. Antworte auf Deutsch, knapp und umsetzbar.',
    messages: [
      {
        role: 'user',
        content: `Analysiere die Top-Performer über alle Branchen hinweg.

Branchen-Insights:
${insightsSummary}

Top-Nachrichten aller Branchen:
${topExamplesText}

Was sind die 3-4 universellen Prinzipien die branchenübergreifend bei WhatsApp-Nachrichten funktionieren?
Gib konkrete, umsetzbare Regeln die für JEDE Branche gelten.`,
      },
    ],
  });

  const globalInsight = response.content.find((b) => b.type === 'text')?.text ?? '';

  // In KV als "insight:global" speichern – NICHT "instructions:global" (manuell vom User)!
  await saveInsight('global', {
    insight: globalInsight,
    generatedAt: new Date().toISOString(),
    exampleCount: allExamples.length,
  });
}

async function analyzeIndustries(
  industries: string[],
  targetIndustry?: string
): Promise<Record<string, string>> {
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

          const totalClicks = ex.quickReplyPairs?.reduce((s, p) => s + (p.clicks || 0), 0) || 0;
          const buttonDistribution = totalClicks > 0
            ? ex.quickReplyPairs?.map(p =>
                `"${p.button}": ${Math.round((p.clicks || 0) / totalClicks * 100)}%`
              ).join(', ')
            : 'keine Klick-Daten';

          return `Beispiel ${i + 1} (Score: ${ex.score ?? 0}):
Nachricht: "${ex.message.substring(0, 100)}"
Verschickt: ${sent} | Geöffnet: ${openPct}% | Beantwortet: ${respPct}%
Button-Klick-Verteilung: ${buttonDistribution}`;
        })
        .join('\n\n');

      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        system: 'Du bist ein WhatsApp Marketing Analyst. Antworte auf Deutsch, knapp und direkt.',
        messages: [
          {
            role: 'user',
            content: `Analysiere diese ${top5.length} WhatsApp-Nachrichten für "${industry}".

Berücksichtige dabei:
1. Welche Button-Kombinationen haben die höchste Gesamtklickrate?
2. Gibt es "Decoy-Buttons" (einer bekommt fast alle Klicks)? Wann funktioniert das?
3. Was für Button-Strategien passen zu welchen Nachrichtentypen?
4. Was machen die Top-Performer generell besser?

Gib max. 4 konkrete, umsetzbare Erkenntnisse – auch zu Button-Strategien.

${examplesText}`,
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

  // Wenn kein targetIndustry (alle Branchen) → globale Analyse nachschalten
  if (!targetIndustry) {
    try {
      const insightMap: Record<string, string> = {};
      for (const [ind] of Object.entries(results)) {
        const ins = await getInsight(ind);
        if (ins) insightMap[ind] = ins.insight;
      }
      await analyzeGlobal(client, insightMap);
      results['global'] = 'ok';
    } catch (err) {
      console.error('[cron/analyze] Fehler bei globalAnalysis:', err);
      results['global'] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return results;
}

async function analyzeAllIndustries(): Promise<Record<string, string>> {
  return analyzeIndustries(INDUSTRIES, undefined);
}
