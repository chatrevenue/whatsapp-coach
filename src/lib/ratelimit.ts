import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// 20 Requests pro Stunde pro IP
export const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: false,
  prefix: 'wa-coach-rl',
});

export async function checkRateLimit(
  ip: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const { success, remaining, reset } = await ratelimit.limit(ip);
    return { success, remaining, reset };
  } catch {
    // Wenn Upstash nicht verfügbar → Rate Limiting überspringen (graceful)
    return { success: true, remaining: 99, reset: 0 };
  }
}
