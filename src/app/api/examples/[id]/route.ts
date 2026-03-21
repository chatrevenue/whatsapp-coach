import { NextRequest, NextResponse } from 'next/server';
import { getExampleById, updateExample, deleteExample } from '@/lib/kv';

function isAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true; // No password set → open
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
    const updates = await req.json();
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
