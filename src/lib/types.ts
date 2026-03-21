export interface QuickReplyPair {
  button: string;       // max 20 Zeichen
  autoResponse: string; // automatische Antwort auf Button-Klick
}

export interface MessageExample {
  id: string;
  industry: Industry;
  occasion: string;
  message: string;
  quickReplyPairs: QuickReplyPair[];  // NEU – primäre Struktur
  // Backward compat (deprecated, werden aus quickReplyPairs abgeleitet)
  quick_replies?: string[];
  auto_responses?: string[];
  stats: {
    sent: number;       // Verschickt (absolut)
    opened: number;     // Geöffnet (absolut)
    responded: number;  // Geantwortet (absolut)
    notes: string;      // Freies Textfeld
    // Backward compat
    openRate?: number | null;
    responseRate?: number | null;
    sentCount?: number;
  };
  score: number;        // 0–100, berechnet automatisch
  createdAt: string;
  updatedAt: string;
}

export type Industry = 'autohaus' | 'restaurant' | 'fitnessstudio' | 'andere';

export interface IndustryInfo {
  id: Industry;
  label: string;
  icon: string;
  count?: number;
}

export const INDUSTRIES: IndustryInfo[] = [
  { id: 'autohaus', label: 'Autohaus', icon: '🚗' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'fitnessstudio', label: 'Fitnessstudio', icon: '💪' },
  { id: 'andere', label: 'Andere', icon: '📱' },
];

export interface OptimizeRequest {
  message: string;
  industry?: Industry;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface OptimizeResponse {
  optimized_message: string;
  quick_replies: string[];
  tip: string;
  auto_responses?: string[];
}

export interface IndustryInstructions {
  schema: string;
  additionalInstructions: string;
  updatedAt: string;
}

/** Helper: get quick_replies array from a MessageExample (backward compat) */
export function getQuickReplies(ex: MessageExample): string[] {
  if (ex.quickReplyPairs?.length) {
    return ex.quickReplyPairs.map((p) => p.button);
  }
  return ex.quick_replies ?? [];
}

/** Helper: get auto_responses array from a MessageExample (backward compat) */
export function getAutoResponses(ex: MessageExample): string[] {
  if (ex.quickReplyPairs?.length) {
    return ex.quickReplyPairs.map((p) => p.autoResponse);
  }
  return ex.auto_responses ?? [];
}

/** Helper: normalize legacy stats fields to new format */
export function normalizeSentStats(stats: MessageExample['stats']): {
  sent: number;
  opened: number;
  responded: number;
} {
  // If new fields present
  if (typeof stats.sent === 'number' && stats.sent > 0) {
    return { sent: stats.sent, opened: stats.opened ?? 0, responded: stats.responded ?? 0 };
  }
  // Fall back to legacy
  const sent = stats.sentCount ?? 0;
  const openRate = stats.openRate ?? 0;
  const responseRate = stats.responseRate ?? 0;
  return {
    sent,
    opened: Math.round((sent * openRate) / 100),
    responded: Math.round((sent * responseRate) / 100),
  };
}
