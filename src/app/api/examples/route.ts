import { NextRequest, NextResponse } from 'next/server';
import { getTopExamples, createExample } from '@/lib/kv';
import type { Industry } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = (searchParams.get('industry') ?? 'autohaus') as Industry;
    const limit = parseInt(searchParams.get('limit') ?? '5', 10);

    const examples = await getTopExamples(industry, limit);
    return NextResponse.json({ examples });
  } catch (err) {
    console.error('[GET /api/examples]', err);
    return NextResponse.json({ error: 'Fehler beim Laden der Beispiele.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Simple admin auth check
    const authHeader = req.headers.get('x-admin-password');
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword && authHeader !== adminPassword) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    }

    const body = await req.json();
    const { industry, occasion, message, quick_replies, auto_responses, stats } = body;

    if (!industry || !occasion || !message) {
      return NextResponse.json(
        { error: 'industry, occasion und message sind Pflichtfelder.' },
        { status: 400 }
      );
    }

    const example = await createExample({
      industry,
      occasion,
      message,
      quick_replies: quick_replies ?? [],
      auto_responses: auto_responses ?? [],
      stats: {
        openRate: stats?.openRate ?? null,
        responseRate: stats?.responseRate ?? null,
        sentCount: stats?.sentCount ?? 0,
        notes: stats?.notes ?? '',
      },
    });

    return NextResponse.json({ example }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/examples]', err);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Beispiels.' }, { status: 500 });
  }
}
