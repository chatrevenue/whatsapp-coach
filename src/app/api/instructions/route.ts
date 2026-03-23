import { NextRequest, NextResponse } from 'next/server';
import type { IndustryInstructions } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isKvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import('@vercel/kv');
  return kv;
}

function isAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return true;
  return req.headers.get('x-admin-password') === adminPassword;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');

    if (!industry) {
      return NextResponse.json({ error: 'industry parameter required' }, { status: 400 });
    }

    if (!isKvAvailable()) {
      return NextResponse.json({ instructions: null });
    }

    const kv = await getKv();
    const instructions = await kv.get<IndustryInstructions>(`instructions:${industry}`);
    return NextResponse.json({ instructions });
  } catch (err) {
    console.error('[GET /api/instructions]', err);
    return NextResponse.json({ error: 'Fehler beim Laden der Instruktionen.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { industry, schema, additionalInstructions } = body;

    if (!industry) {
      return NextResponse.json({ error: 'industry ist Pflichtfeld.' }, { status: 400 });
    }

    const instructions: IndustryInstructions = {
      schema: schema ?? '',
      additionalInstructions: additionalInstructions ?? '',
      updatedAt: new Date().toISOString(),
    };

    if (!isKvAvailable()) {
      // No KV available – return the object without persisting
      return NextResponse.json({ instructions });
    }

    const kv = await getKv();
    await kv.set(`instructions:${industry}`, instructions);
    return NextResponse.json({ instructions });
  } catch (err) {
    console.error('[PUT /api/instructions]', err);
    return NextResponse.json({ error: 'Fehler beim Speichern der Instruktionen.' }, { status: 500 });
  }
}
