import { NextRequest, NextResponse } from 'next/server';
import { getTopExamples, createExample } from '@/lib/kv';
import { isAdminAuthenticated } from '@/lib/session';
import type { Industry } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
    const pw = req.headers.get('x-admin-password');
    if (!(await isAdminAuthenticated(pw))) {
      return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      industry,
      occasion,
      message,
      quickReplyPairs,
      // backward compat
      quick_replies,
      auto_responses,
      stats,
    } = body;

    if (!industry || !occasion || !message) {
      return NextResponse.json(
        { error: 'industry, occasion und message sind Pflichtfelder.' },
        { status: 400 }
      );
    }

    // Normalize quickReplyPairs
    let pairs = quickReplyPairs;
    if (!pairs || !pairs.length) {
      const qr = quick_replies ?? [];
      const ar = auto_responses ?? [];
      pairs = qr.map((btn: string, idx: number) => ({
        button: btn,
        autoResponse: ar[idx] ?? '',
        clicks: 0,
      }));
    }

    const normalizedStats = {
      sent: stats?.sent ?? stats?.sentCount ?? 0,
      opened: stats?.opened ?? 0,
      responded: stats?.responded ?? 0,
      notes: stats?.notes ?? '',
    };

    const example = await createExample({
      industry,
      occasion,
      message,
      quickReplyPairs: pairs,
      quick_replies: pairs.map((p: { button: string }) => p.button),
      auto_responses: pairs.map((p: { autoResponse: string }) => p.autoResponse),
      stats: normalizedStats,
    });

    return NextResponse.json({ example }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/examples]', err);
    return NextResponse.json({ error: 'Fehler beim Erstellen des Beispiels.' }, { status: 500 });
  }
}
