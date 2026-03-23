import { NextRequest, NextResponse } from 'next/server';
import { getExampleById, updateExample, deleteExample } from '@/lib/kv';
import { calculateScore } from '@/lib/scoring';

function isAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return req.headers.get('x-admin-password') === adminPassword;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const example = await getExampleById(id);
    if (!example) {
      return NextResponse.json({ error: 'Beispiel nicht gefunden.' }, { status: 404 });
    }
    return NextResponse.json({ example });
  } catch (err) {
    console.error('[GET /api/examples/[id]]', err);
    return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { quickReplyPairs, quick_replies, auto_responses, stats, ...rest } = body;

    // Normalize quickReplyPairs
    let pairs = quickReplyPairs;
    if (!pairs || !pairs.length) {
      const qr = quick_replies ?? [];
      const ar = auto_responses ?? [];
      pairs = qr.map((btn: string, idx: number) => ({
        button: btn,
        autoResponse: ar[idx] ?? '',
      }));
    }

    const normalizedStats = stats
      ? {
          sent: stats.sent ?? stats.sentCount ?? 0,
          opened: stats.opened ?? 0,
          responded: stats.responded ?? 0,
          notes: stats.notes ?? '',
        }
      : undefined;

    const score = normalizedStats ? calculateScore(normalizedStats) : undefined;

    const updates = {
      ...rest,
      ...(pairs ? {
        quickReplyPairs: pairs,
        quick_replies: pairs.map((p: { button: string }) => p.button),
        auto_responses: pairs.map((p: { autoResponse: string }) => p.autoResponse),
      } : {}),
      ...(normalizedStats ? { stats: normalizedStats } : {}),
      ...(score !== undefined ? { score } : {}),
    };

    const updated = await updateExample(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Beispiel nicht gefunden.' }, { status: 404 });
    }

    // Fire-and-forget: Analyse triggern wenn stats vorhanden
    if (normalizedStats && normalizedStats.sent > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
      fetch(`${appUrl}/api/cron/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': process.env.ADMIN_PASSWORD ?? '',
        },
        body: JSON.stringify({ industry: updated.industry }),
      }).catch(() => {});
    }

    return NextResponse.json({ example: updated });
  } catch (err) {
    console.error('[PUT /api/examples/[id]]', err);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await deleteExample(id);
    if (!success) {
      return NextResponse.json({ error: 'Beispiel nicht gefunden oder KV nicht verfügbar.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/examples/[id]]', err);
    return NextResponse.json({ error: 'Fehler beim Löschen.' }, { status: 500 });
  }
}
