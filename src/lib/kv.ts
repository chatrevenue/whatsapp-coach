import type { MessageExample, Industry } from './types';
import fallbackExamples from '../data/examples.json';

function isKvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

// ─── Read Operations ──────────────────────────────────────────────────────────

export async function getExamplesByIndustry(industry: Industry): Promise<MessageExample[]> {
  if (!isKvAvailable()) {
    return (fallbackExamples as MessageExample[]).filter((e) => e.industry === industry);
  }

  try {
    const kv = await getKv();
    const ids = await kv.lrange<string>(`examples:${industry}`, 0, -1);
    if (!ids || ids.length === 0) return [];

    const examples = await Promise.all(
      ids.map((id) => kv.get<MessageExample>(`example:${id}`))
    );

    return examples.filter((e): e is MessageExample => e !== null);
  } catch (err) {
    console.error('[kv] getExamplesByIndustry error, falling back:', err);
    return (fallbackExamples as MessageExample[]).filter((e) => e.industry === industry);
  }
}

export async function getTopExamples(industry: Industry, limit = 5): Promise<MessageExample[]> {
  const all = await getExamplesByIndustry(industry);
  return all
    .sort((a, b) => {
      const aRate = a.stats.openRate ?? -1;
      const bRate = b.stats.openRate ?? -1;
      return bRate - aRate;
    })
    .slice(0, limit);
}

export async function getExampleById(id: string): Promise<MessageExample | null> {
  if (!isKvAvailable()) {
    return (fallbackExamples as MessageExample[]).find((e) => e.id === id) ?? null;
  }

  try {
    const kv = await getKv();
    return await kv.get<MessageExample>(`example:${id}`);
  } catch (err) {
    console.error('[kv] getExampleById error:', err);
    return null;
  }
}

export async function getAllExamples(): Promise<MessageExample[]> {
  if (!isKvAvailable()) {
    return fallbackExamples as MessageExample[];
  }

  try {
    const kv = await getKv();
    const industries: Industry[] = ['autohaus', 'restaurant', 'fitnessstudio', 'andere'];
    const results = await Promise.all(industries.map((ind) => getExamplesByIndustry(ind)));
    return results.flat();
  } catch (err) {
    console.error('[kv] getAllExamples error, falling back:', err);
    return fallbackExamples as MessageExample[];
  }
}

// ─── Write Operations ─────────────────────────────────────────────────────────

export async function createExample(
  data: Omit<MessageExample, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MessageExample> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const example: MessageExample = { ...data, id, createdAt: now, updatedAt: now };

  if (!isKvAvailable()) {
    // In fallback mode we can't persist – just return the object
    return example;
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

  const updated: MessageExample = {
    ...existing,
    ...updates,
    stats: { ...existing.stats, ...(updates.stats ?? {}) },
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (!isKvAvailable()) return updated;

  const kv = await getKv();
  await kv.set(`example:${id}`, updated);
  return updated;
}

export async function deleteExample(id: string): Promise<boolean> {
  const existing = await getExampleById(id);
  if (!existing) return false;

  if (!isKvAvailable()) return false;

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
