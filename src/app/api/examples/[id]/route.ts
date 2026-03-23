import { NextRequest, NextResponse } from 'next/server';
import { getExampleById, updateExample, deleteExample } from '@/lib/kv';
import { isAdminAuthenticated } from '@/lib/session';
import { calculateScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

async function checkAuth(req: NextRequest): Promise<boolean> {
  const pw = req.headers.get('x-admin-password');
  return isAdminAuthenticated(pw);
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
  if (!(await checkAuth(req))) {
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
        clicks: 0,
      }));
    } else {
      // Preserve clicks from incoming payload (already in pairs objects)
      pairs = pairs.map((p: { button: string; autoResponse: string; clicks?: number }) => ({
        button: p.button,
        autoResponse: p.autoResponse,
        ...(p.clicks !== undefined ? { clicks: p.clicks } : {}),
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
  if (!(await checkAuth(req))) {
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
