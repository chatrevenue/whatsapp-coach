import type { MessageExample, Industry } from './types';
import { calculateScore } from './scoring';
import fallbackExamples from '../data/examples.json';

function isKvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

/** Normalize a raw stored example to the new shape (backward compat) */
function normalizeExample(raw: unknown): MessageExample {
  const e = raw as Record<string, unknown>;

  // Migrate stats
  const rawStats = (e.stats ?? {}) as Record<string, unknown>;
  const sent =
    typeof rawStats.sent === 'number'
      ? rawStats.sent
      : typeof rawStats.sentCount === 'number'
      ? rawStats.sentCount
      : 0;
  const openRate =
    typeof rawStats.openRate === 'number' ? rawStats.openRate : null;
  const responseRate =
    typeof rawStats.responseRate === 'number' ? rawStats.responseRate : null;
  const opened =
    typeof rawStats.opened === 'number'
      ? rawStats.opened
      : openRate !== null
      ? Math.round((sent * openRate) / 100)
      : 0;
  const responded =
    typeof rawStats.responded === 'number'
      ? rawStats.responded
      : responseRate !== null
      ? Math.round((sent * responseRate) / 100)
      : 0;

  const stats: MessageExample['stats'] = {
    sent,
    opened,
    responded,
    notes: typeof rawStats.notes === 'string' ? rawStats.notes : '',
    // keep legacy fields for backward compat
    openRate: openRate ?? undefined,
    responseRate: responseRate ?? undefined,
    sentCount: typeof rawStats.sentCount === 'number' ? rawStats.sentCount : sent,
  };

  // Migrate quickReplyPairs
  const quickReplies = Array.isArray(e.quick_replies) ? (e.quick_replies as string[]) : [];
  const autoResponses = Array.isArray(e.auto_responses) ? (e.auto_responses as string[]) : [];
  const quickReplyPairs: MessageExample['quickReplyPairs'] = Array.isArray(e.quickReplyPairs)
    ? (e.quickReplyPairs as MessageExample['quickReplyPairs'])
    : quickReplies.map((btn, idx) => ({
        button: btn,
        autoResponse: autoResponses[idx] ?? '',
      }));

  const score =
    typeof e.score === 'number' ? e.score : calculateScore(stats);

  return {
    id: String(e.id ?? ''),
    industry: e.industry as Industry,
    occasion: String(e.occasion ?? ''),
    message: String(e.message ?? ''),
    quickReplyPairs,
    quick_replies: quickReplies,
    auto_responses: autoResponses,
    stats,
    score,
    createdAt: String(e.createdAt ?? new Date().toISOString()),
    updatedAt: String(e.updatedAt ?? new Date().toISOString()),
  };
}

// ─── Read Operations ──────────────────────────────────────────────────────────

export async function getExamplesByIndustry(industry: Industry): Promise<MessageExample[]> {
  if (!isKvAvailable()) {
    return (fallbackExamples as unknown[]).map(normalizeExample).filter((e) => e.industry === industry);
  }

  try {
    const kv = await getKv();
    const ids = await kv.lrange<string>(`examples:${industry}`, 0, -1);
    if (!ids || ids.length === 0) return [];

    const raws = await Promise.all(ids.map((id) => kv.get(`example:${id}`)));
    return raws.filter(Boolean).map(normalizeExample);
  } catch (err) {
    console.error('[kv] getExamplesByIndustry error, falling back:', err);
    return (fallbackExamples as unknown[]).map(normalizeExample).filter((e) => e.industry === industry);
  }
}

export async function getTopExamples(industry: Industry, limit = 5): Promise<MessageExample[]> {
  const all = await getExamplesByIndustry(industry);
  return all
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

export async function getExampleById(id: string): Promise<MessageExample | null> {
  if (!isKvAvailable()) {
    const found = (fallbackExamples as unknown[]).map(normalizeExample).find((e) => e.id === id);
    return found ?? null;
  }

  try {
    const kv = await getKv();
    const raw = await kv.get(`example:${id}`);
    if (!raw) return null;
    return normalizeExample(raw);
  } catch (err) {
    console.error('[kv] getExampleById error:', err);
    return null;
  }
}

export async function getAllExamples(): Promise<MessageExample[]> {
  if (!isKvAvailable()) {
    return (fallbackExamples as unknown[]).map(normalizeExample);
  }

  try {
    const industries: Industry[] = ['autohaus', 'restaurant', 'fitnessstudio', 'andere'];
    const results = await Promise.all(industries.map((ind) => getExamplesByIndustry(ind)));
    return results.flat();
  } catch (err) {
    console.error('[kv] getAllExamples error, falling back:', err);
    return (fallbackExamples as unknown[]).map(normalizeExample);
  }
}

// ─── Write Operations ─────────────────────────────────────────────────────────

export async function createExample(
  data: Omit<MessageExample, 'id' | 'createdAt' | 'updatedAt' | 'score'>
): Promise<MessageExample> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const score = calculateScore(data.stats);
  const example: MessageExample = { ...data, id, score, createdAt: now, updatedAt: now };

  if (!isKvAvailable()) {
    throw new Error('KV nicht konfiguriert. Bitte KV_REST_API_URL und KV_REST_API_TOKEN in Vercel setzen.');
  }

  const kv = await getKv();
  await kv.set(`example:${id}`, example);
  await kv.lpush(`examples:${data.industry}`, id);

  return example;
}

export async function updateExample(
  id: string,
  updates: Partial<Omit<MessageExample, 'id' | 'createdAt'>>
): Promise<MessageExample | null> {
  const existing = await getExampleById(id);
  if (!existing) return null;

  const mergedStats = { ...existing.stats, ...(updates.stats ?? {}) };
  const score = calculateScore(mergedStats);

  const updated: MessageExample = {
    ...existing,
    ...updates,
    stats: mergedStats,
    score,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (!isKvAvailable()) {
    throw new Error('KV nicht konfiguriert. Bitte KV_REST_API_URL und KV_REST_API_TOKEN in Vercel setzen.');
  }

  const kv = await getKv();
  await kv.set(`example:${id}`, updated);
  return updated;
}

export async function deleteExample(id: string): Promise<boolean> {
  const existing = await getExampleById(id);
  if (!existing) return false;

  if (!isKvAvailable()) {
    throw new Error('KV nicht konfiguriert. Bitte KV_REST_API_URL und KV_REST_API_TOKEN in Vercel setzen.');
  }

  const kv = await getKv();
  await kv.del(`example:${id}`);
  await kv.lrem(`examples:${existing.industry}`, 0, id);
  return true;
}

export async function getIndustryCounts(): Promise<Record<Industry, number>> {
  const industries: Industry[] = ['autohaus', 'restaurant', 'fitnessstudio', 'andere'];
  const counts = await Promise.all(
    industries.map(async (ind) => {
      const examples = await getExamplesByIndustry(ind);
      return [ind, examples.length] as [Industry, number];
    })
  );
  return Object.fromEntries(counts) as Record<Industry, number>;
}

// ─── Alias for cron usage (accepts string) ────────────────────────────────────

export async function getExamplesForIndustry(industry: string): Promise<MessageExample[]> {
  return getExamplesByIndustry(industry as Industry);
}

// ─── Global Instructions ──────────────────────────────────────────────────────

export interface GlobalInstructions {
  additionalInstructions: string;
  updatedAt: string;
}

export async function getGlobalInstructions(): Promise<GlobalInstructions | null> {
  if (!isKvAvailable()) return null;
  try {
    const kv = await getKv();
    return await kv.get<GlobalInstructions>('instructions:global');
  } catch (err) {
    console.error('[kv] getGlobalInstructions error:', err);
    return null;
  }
}

export async function saveGlobalInstructions(data: { additionalInstructions: string }): Promise<void> {
  if (!isKvAvailable()) return;
  const kv = await getKv();
  await kv.set('instructions:global', {
    additionalInstructions: data.additionalInstructions,
    updatedAt: new Date().toISOString(),
  } satisfies GlobalInstructions);
}

// ─── Industry Insights ────────────────────────────────────────────────────────

export interface IndustryInsight {
  insight: string;
  generatedAt: string;
  exampleCount: number;
}

export async function getInsight(industry: string): Promise<IndustryInsight | null> {
  if (!isKvAvailable()) return null;
  try {
    const kv = await getKv();
    return await kv.get<IndustryInsight>(`insight:${industry}`);
  } catch (err) {
    console.error('[kv] getInsight error:', err);
    return null;
  }
}

export async function saveInsight(industry: string, data: IndustryInsight): Promise<void> {
  if (!isKvAvailable()) return;
  const kv = await getKv();
  await kv.set(`insight:${industry}`, data);
}
