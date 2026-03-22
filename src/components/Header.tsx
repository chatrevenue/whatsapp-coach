'use client';

import type { Industry } from '@/lib/types';

interface HeaderProps {
  industry: Industry;
  onIndustryChange: (industry: Industry) => void;
  disabled?: boolean;
}

// Minimal header – industry selector is now integrated in the main page content
// This component is kept for backwards compatibility but renders nothing visible
export default function Header({ industry: _industry, onIndustryChange: _onIndustryChange, disabled: _disabled }: HeaderProps) {
  return null;
}
