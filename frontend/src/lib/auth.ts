import crypto from 'node:crypto';
import { AUTH_COOKIE, rolePermissions, type SessionUser } from '@/lib/authShared';

export { AUTH_COOKIE, rolePermissions, type SessionUser } from '@/lib/authShared';

const roles = new Set<SessionUser['role']>(['admin', 'manager', 'analyst']);

function sessionSecret() {
  const secret = process.env.SESSION_SECRET || '';
  if (secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  return secret;
}

export function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({
    ...user,
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
  }), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function decodeSession(value?: string | null): SessionUser | null {
  if (!value) return null;
  try {
    const [payload, signature] = value.split('.');
    if (!payload || !/^[a-f0-9]{64}$/i.test(signature || '')) return null;
    const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser & { expiresAt: number };
    if (!parsed.email || !roles.has(parsed.role) || parsed.expiresAt < Math.floor(Date.now() / 1000)) return null;
    if (!parsed.identityId || !parsed.tenantId) return null;
    return { identityId: parsed.identityId, tenantId: parsed.tenantId, email: parsed.email, firstName: parsed.firstName, lastName: parsed.lastName, role: parsed.role };
  } catch (_) {
    return null;
  }
}

export function canManageDocuments(user: SessionUser | null) {
  return Boolean(user && rolePermissions[user.role].canManageDocuments);
}

export function canApprove(user: SessionUser | null) {
  return Boolean(user && rolePermissions[user.role].canApprove);
}
