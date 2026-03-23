import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE = 'wa-admin-session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 Stunden

function getSessionSecret(): string {
  return process.env.ADMIN_PASSWORD || 'dev-fallback-secret';
}

/**
 * Creates an HMAC-signed session token: `timestamp.hmac`
 * - No server-side storage needed (stateless)
 * - Validated by recomputing HMAC and checking expiry
 */
export function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac('sha256', getSessionSecret())
    .update(timestamp)
    .digest('hex');
  return `${timestamp}.${hmac}`;
}

/**
 * Validates a session token:
 * 1. Checks format (timestamp.hmac)
 * 2. Verifies HMAC signature (timing-safe)
 * 3. Checks expiry (24h)
 */
export function validateSessionToken(token: string): boolean {
  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const timestamp = token.substring(0, dotIndex);
  const hmac = token.substring(dotIndex + 1);
  if (!timestamp || !hmac) return false;

  // Check expiry
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  const age = Date.now() - ts;
  if (age < 0 || age > SESSION_MAX_AGE * 1000) return false;

  // Verify HMAC (timing-safe)
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(timestamp)
    .digest('hex');

  if (hmac.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
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

/**
 * Checks if the current request is admin-authenticated.
 * Accepts either:
 * 1. Valid `x-admin-password` header (or body password)
 * 2. Valid session cookie (HMAC-signed, not expired)
 *
 * Use this in all admin-protected API routes.
 */
export async function isAdminAuthenticated(password?: string | null): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no admin password configured, allow all (dev mode)
  if (!adminPassword) return true;

  // Check provided password (from header or body)
  if (password && password === adminPassword) return true;

  // Check session cookie
  try {
    const token = await getAdminSession();
    if (token && validateSessionToken(token)) return true;
  } catch {
    // cookies() can throw in some contexts (e.g. middleware)
  }

  return false;
}
