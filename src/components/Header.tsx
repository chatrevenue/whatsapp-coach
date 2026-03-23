'use client';

import type { Industry } from '@/lib/types';

interface HeaderProps {
  industry: Industry;
  onIndustryChange: (industry: Industry) => void;
  disabled?: boolean;
}

// Header is intentionally minimal – the industry selector lives in the Hero section
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Header(_props: HeaderProps) {
  return null;
}
