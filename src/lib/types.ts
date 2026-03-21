export interface MessageExample {
  id: string;
  industry: Industry;
  occasion: string;
  message: string;
  quick_replies: string[];
  auto_responses: string[];
  stats: {
    openRate: number | null;
    responseRate: number | null;
    sentCount: number;
    notes: string;
  };
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
