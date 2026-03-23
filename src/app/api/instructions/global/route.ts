import { NextRequest, NextResponse } from 'next/server';
import { getGlobalInstructions, saveGlobalInstructions } from '@/lib/kv';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return req.headers.get('x-admin-password') === adminPassword;
}

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
  if (!isAuthorized(req)) {
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
