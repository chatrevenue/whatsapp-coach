import { NextRequest, NextResponse } from 'next/server';
import { getInsight } from '@/lib/kv';

export const dynamic = 'force-dynamic';

// GET /api/insights?industry=autohaus  → loads insight for one industry
// GET /api/insights?industry=global    → loads the global cross-industry insight
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry') ?? '';

  if (!industry) {
    return NextResponse.json({ error: 'industry parameter required' }, { status: 400 });
  }

  try {
    const insight = await getInsight(industry);
    return NextResponse.json({ insight });
  } catch (err) {
    console.error('[GET /api/insights]', err);
    return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 });
  }
}
