import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, decodeSession } from '@/lib/auth';
import crypto from 'node:crypto';
import { ensurePostgres } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(AUTH_COOKIE)?.value;
  const user = decodeSession(cookieValue);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = await ensurePostgres();
  const digest = crypto.createHash('sha256').update(cookieValue || '').digest('hex');
  const valid = await db.query(`SELECT 1 FROM vendor_app_sessions s
    JOIN vendor_app_identities i ON i.id = s.identity_id
    WHERE s.session_digest = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
      AND i.id = $2 AND i.active = TRUE`, [digest, user.identityId]);
  if (valid.rowCount !== 1) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({ user });
}
