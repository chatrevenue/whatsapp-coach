import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'wa-admin-session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 Stunden

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function setAdminSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Validiert Session Token gegen gespeicherten Hash in KV (oder einfach gegen Passwort-Hash)
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
