import { NextRequest, NextResponse } from 'next/server';

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

    const valid = password === adminPassword;
    return NextResponse.json({ valid }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/admin/auth]', err);
    return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
  }
}
