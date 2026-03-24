import type { MessageExample } from './types';
import { normalizeSentStats } from './types';

export function calculateScore(stats: MessageExample['stats']): number {
  const { sent, opened, responded } = normalizeSentStats(stats);
  if (!sent) return 0;

  const openRate = opened / sent;       // 0–1
  const responseRate = responded / sent; // 0–1

  // Gewichtung: Öffnungsrate 40%, Antwortrate 60%
  // WhatsApp Benchmarks: openRate >0.8 = gut, responseRate >0.3 = gut
  const openScore = Math.min(openRate / 0.8, 1) * 40;
  const responseScore = Math.min(responseRate / 0.3, 1) * 60;

  return Math.round(openScore + responseScore);
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: '🔥 Sehr gut', color: 'text-green-600' };
  if (score >= 60) return { label: '✅ Gut', color: 'text-blue-600' };
  if (score >= 40) return { label: '⚠️ Mittel', color: 'text-yellow-600' };
  if (score > 0)   return { label: '❌ Schwach', color: 'text-red-600' };
  return { label: '— Keine Daten', color: 'text-gray-400' };
}
