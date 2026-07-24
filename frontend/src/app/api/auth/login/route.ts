import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { AUTH_COOKIE, encodeSession, type SessionUser } from '@/lib/auth';
import { ensurePostgres } from '@/lib/postgres';

const scrypt = promisify(crypto.scrypt);

async function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, expected] = encoded.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email ?? '';
  const password = body?.password ?? '';

  const db = await ensurePostgres();
  const result = await db.query<{
    id: string; tenant_id: string; email: string; password_hash: string;
    first_name: string; last_name: string; role: SessionUser['role'];
  }>(`SELECT id, tenant_id, email, password_hash, first_name, last_name, role
      FROM vendor_app_identities WHERE email = $1 AND active = TRUE LIMIT 1`,
      [String(email).trim().toLowerCase()]);
  const identity = result.rows[0];
  if (!identity || !(await verifyPassword(String(password), identity.password_hash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const user: SessionUser = {
    identityId: identity.id, tenantId: identity.tenant_id, email: identity.email,
    firstName: identity.first_name, lastName: identity.last_name, role: identity.role,
  };
  const cookieValue = encodeSession(user);
  const digest = crypto.createHash('sha256').update(cookieValue).digest('hex');
  await db.query(`INSERT INTO vendor_app_sessions(session_digest, identity_id, expires_at)
                  VALUES($1, $2, NOW() + INTERVAL '8 hours')`, [digest, identity.id]);

  const response = NextResponse.json({ user });
  response.cookies.set(AUTH_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}
