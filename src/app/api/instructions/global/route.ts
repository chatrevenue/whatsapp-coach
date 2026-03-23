import { NextRequest, NextResponse } from 'next/server';
import { getGlobalInstructions, saveGlobalInstructions } from '@/lib/kv';
import { isAdminAuthenticated } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const instructions = await getGlobalInstructions();
    return NextResponse.json({ instructions });
  } catch (err) {
    console.error('[GET /api/instructions/global]', err);
    return NextResponse.json({ error: 'Fehler beim Laden.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (!(await isAdminAuthenticated(pw))) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  try {
    const body = await req.json() as { additionalInstructions?: string };
    const { additionalInstructions } = body;

    if (typeof additionalInstructions !== 'string') {
      return NextResponse.json({ error: 'additionalInstructions ist Pflichtfeld.' }, { status: 400 });
    }

    await saveGlobalInstructions({ additionalInstructions });
    const instructions = await getGlobalInstructions();
    return NextResponse.json({ instructions });
  } catch (err) {
    console.error('[PUT /api/instructions/global]', err);
    return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 });
  }
}
