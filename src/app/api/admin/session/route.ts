import { getAdminSession, validateSessionToken } from '@/lib/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = await getAdminSession();
    const authenticated = !!token && validateSessionToken(token);
    return NextResponse.json({ authenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
