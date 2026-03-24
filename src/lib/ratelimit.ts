import { Ratelimit } from '@upstash/ratelimit';

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;

  // Lazy import – only instantiate when KV is configured
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { kv } = require('@vercel/kv');
  _ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: false,
    prefix: 'wa-coach-rl',
  });
  return _ratelimit;
}

export async function checkRateLimit(
  ip: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const rl = getRatelimit();
    if (!rl) {
      // KV not configured → skip rate limiting gracefully
      return { success: true, remaining: 99, reset: 0 };
    }
    const { success, remaining, reset } = await rl.limit(ip);
    return { success, remaining, reset };
  } catch {
    // Wenn Upstash nicht verfügbar → Rate Limiting überspringen (graceful)
    return { success: true, remaining: 99, reset: 0 };
  }
}
