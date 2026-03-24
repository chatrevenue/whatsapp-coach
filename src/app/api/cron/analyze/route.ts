import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getExamplesForIndustry, saveInsight, getInsight } from '@/lib/kv';
import { isAdminAuthenticated } from '@/lib/session';
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

// POST: Manueller Trigger aus Admin (prüft x-admin-password Header, body.adminPassword, oder Session-Cookie)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { industry?: string; adminPassword?: string };
  const pw = req.headers.get('x-admin-password') ?? body.adminPassword ?? '';

  if (!(await isAdminAuthenticated(pw || null))) {
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

  // Top 5 + Bottom 3 über alle Branchen
  const sorted = [...allExamples].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const topOverall = sorted.slice(0, Math.min(5, Math.ceil(allExamples.length / 2)));
  const bottomOverall = sorted.slice(-Math.min(3, Math.floor(allExamples.length / 2)));

  const formatGlobalExample = (ex: ExampleWithIndustry, rank: string) => {
    const sent = ex.stats?.sent ?? 0;
    const openPct = sent > 0 ? Math.round(((ex.stats?.opened ?? 0) / sent) * 100) : '?';
    const respPct = sent > 0 ? Math.round(((ex.stats?.responded ?? 0) / sent) * 100) : '?';
    return `[${rank} | ${ex.industry}] Score: ${ex.score ?? 0} | Öffnung: ${openPct}% | Antwort: ${respPct}%
Nachricht: "${ex.message.substring(0, 100)}"`;
  };

  const topText = topOverall.map((ex, i) => formatGlobalExample(ex, `TOP-${i + 1}`)).join('\n\n');
  const bottomText = bottomOverall.map((ex, i) => formatGlobalExample(ex, `SCHWACH-${i + 1}`)).join('\n\n');

  // Lade bestehenden globalen Insight als Kontext
  const existingGlobalInsight = await getInsight('global');

  const response = await withRetry(() => client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1200,
    system: `Du bist ein erfahrener WhatsApp Marketing Analyst. Du kennst Cialdinis Influence-Prinzipien, das Hormozi-Framework und psychologische Trigger (Neugier-Lücke, Verlust-Aversion, Decoy-Effekt, Knappheit, Reziprozität). Antworte auf Deutsch. Sei konkret und umsetzbar.`,
    messages: [
      {
        role: 'user',
        content: `Analysiere diese WhatsApp-Nachrichten aus verschiedenen Branchen und finde universelle Muster.

<top_performers>
${topText}
</top_performers>

<weak_performers>
${bottomText}
</weak_performers>

${existingGlobalInsight?.insight ? `<previous_global_insight>\n${existingGlobalInsight.insight}\n</previous_global_insight>\n\nWichtig: Nicht wiederholen, nur neue oder bestätigte Erkenntnisse.\n\n` : ''}Denke zuerst still durch: Was funktioniert branchenübergreifend bei den Top-Performern, was nicht bei den Schwachen?

Nenne dann 5 universelle Prinzipien die branchenübergreifend den Unterschied machen:
- Welche psychologischen Trigger (Cialdini/Hormozi) setzten Top-Performer ein?
- Was für Hook-Muster wiederholen sich?
- Welche Button-Strategien funktionieren überall?
- Was vermeiden Top-Performer konsequent?
- Welche Tonalität gewinnt immer?

Format: 5 nummerierte Punkte, je 1-2 Sätze, konkret und umsetzbar.`,
      },
    ],
  }));

  const globalInsight = response.content.find((b) => b.type === 'text')?.text ?? '';

  // In KV als "insight:global" speichern – NICHT "instructions:global" (manuell vom User)!
  await saveInsight('global', {
    insight: globalInsight,
    generatedAt: new Date().toISOString(),
    exampleCount: allExamples.length,
  });
}

// Non-retryable HTTP status codes (client errors that won't fix themselves)
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 422]);

// Helper für retry mit exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delayMs = 5000): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      // Don't retry client errors (e.g. 401 invalid API key, 400 bad request)
      if (
        err &&
        typeof err === 'object' &&
        'status' in err &&
        typeof (err as { status: unknown }).status === 'number' &&
        NON_RETRYABLE_STATUSES.has((err as { status: number }).status)
      ) {
        throw err;
      }
      if (attempt === maxAttempts) throw err;
      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs * attempt}ms...`, err);
      await new Promise<void>((r) => setTimeout(r, delayMs * attempt)); // linear backoff: 5s, 10s, 15s
    }
  }
  throw new Error('unreachable');
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

      // Alle Beispiele sortiert nach Score – Top + Bottom
      const sorted = [...withStats].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const topPerformers = sorted.slice(0, Math.min(5, Math.ceil(sorted.length / 2)));
      const bottomPerformers = sorted.slice(-Math.min(3, Math.floor(sorted.length / 2)));

      const formatExample = (ex: typeof withStats[number], rank: string) => {
        const sent = ex.stats.sent ?? 0;
        const openPct = sent > 0 ? Math.round((ex.stats.opened / sent) * 100) : '?';
        const respPct = sent > 0 ? Math.round((ex.stats.responded / sent) * 100) : '?';
        const totalClicks = ex.quickReplyPairs?.reduce((s, p) => s + (p.clicks || 0), 0) || 0;
        const buttonDist = totalClicks > 0
          ? ex.quickReplyPairs?.map(p =>
              `"${p.button}": ${Math.round((p.clicks || 0) / totalClicks * 100)}%`
            ).join(', ')
          : ex.quickReplyPairs?.map(p => `"${p.button}"`).join(', ') || 'keine';
        return `[${rank}] Score: ${ex.score ?? 0} | Öffnung: ${openPct}% | Antwort: ${respPct}%
Anlass: ${ex.occasion}
Nachricht: "${ex.message}"
Buttons: ${buttonDist}`;
      };

      const topText = topPerformers.map((ex, i) => formatExample(ex, `TOP-${i + 1}`)).join('\n\n');
      const bottomText = bottomPerformers.map((ex, i) => formatExample(ex, `SCHWACH-${i + 1}`)).join('\n\n');

      // Lade bestehenden Insight als Kontext
      const existingInsight = await getInsight(industry);

      const response = await withRetry(() => client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 900,
        system: `Du bist ein erfahrener WhatsApp Marketing Analyst und Copywriting-Experte. Du kennst Cialdinis Influence-Prinzipien (Knappheit, Reziprozität, Social Proof, Autorität, Sympathie, Dringlichkeit), das Hormozi-Framework (Hook/Agitation/Solution/CTA) und psychologische Trigger (Neugier-Lücke, Verlust-Aversion, Decoy-Effekt). Antworte auf Deutsch. Sei konkret, direkt und umsetzbar.`,
        messages: [
          {
            role: 'user',
            content: `Analysiere diese WhatsApp-Nachrichten für die Branche "${industry}".

${existingInsight?.insight ? `<previous_insight>\n${existingInsight.insight}\n</previous_insight>\n\nWichtig: Nicht wiederholen, nur neue oder bestätigte Erkenntnisse.\n\n` : ''}
<top_performers>
${topText}
</top_performers>

<weak_performers>
${bottomText}
</weak_performers>

Denke zuerst still durch: Was fällt dir beim Vergleich Top vs. Schwach sofort auf? Dann analysiere nach diesen 6 Dimensionen (je 1 konkreter Satz, immer Top vs. Schwach vergleichen):

1. HOOK: Was haben die ersten 5-10 Zeichen der Top-Performer gemeinsam – Frage, Emoji, Name, Zahl oder Neugier-Lücke? Was fehlt den Schwachen?
2. BUTTONS: Welche Button-Strategie hatte die beste Klickverteilung – Decoy, Segmentierung (Dabei/Kann nicht/Nein) oder Ja-Nein? Was fehlte den Schwachen?
3. LÄNGE & STRUKTUR: Optimale Zeichenzahl für diese Branche? Wo stehen Emojis? Was unterscheidet Top und Schwach strukturell?
4. TONALITÄT: Welche konkreten Wörter dominieren bei Top-Performern, fehlen bei Schwachen – persönlich/direkt oder formell/werblich?
5. PSYCHOLOGIE: Welche Cialdini-Trigger setzten Top-Performer ein – Knappheit, Neugier-Lücke, Reziprozität, Verlust-Aversion, Decoy? Was fehlte den Schwachen?
6. KONTEXT: Bei welchen Anlässen oder Triggern performt welcher Stil am besten für diese Branche?

Antworte im Format:
HOOK: [Erkenntnis]
BUTTONS: [Erkenntnis]
LÄNGE: [Erkenntnis]
TON: [Erkenntnis]
PSYCHOLOGIE: [Erkenntnis]
KONTEXT: [Erkenntnis]`,
          },
        ],
      }));

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
