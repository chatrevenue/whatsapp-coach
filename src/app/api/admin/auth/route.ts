import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { setAdminSession, clearAdminSession, generateSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// POST /api/admin/auth - Login
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ valid: false, error: 'Not configured' }, { status: 200 });
    }

    if (typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const valid = safeEqual(password, adminPassword);

    if (valid) {
      const token = generateSessionToken();
      await setAdminSession(token);
    }

    return NextResponse.json({ valid }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/admin/auth]', err);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/admin/auth - Logout
export async function DELETE() {
  try {
    await clearAdminSession();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[DELETE /api/admin/auth]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
