'use strict';

const crypto = require('node:crypto');
const KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const SCOPE = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/;
const STATES = Object.freeze({
  draft: ['review_pending'],
  review_pending: ['approved', 'rejected'],
  approved: ['released', 'retired'],
  released: ['retired'],
  rejected: ['draft'],
  retired: [],
});

function canonical(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('non-finite number');
  return JSON.stringify(value);
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function verifyIdentity(headers, secret, audience, now = Math.floor(Date.now() / 1000)) {
  if (typeof secret !== 'string' || secret.length < 32) return null;
  const encoded = headers.get('x-governance-identity') || '';
  const supplied = headers.get('x-governance-signature') || '';
  const expected = sign(encoded, secret);
  if (!/^[a-f0-9]{64}$/i.test(supplied)
    || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;
  try {
    const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (claims.aud !== audience || !SCOPE.test(String(claims.sub || ''))
      || !SCOPE.test(String(claims.tenantId || '')) || !SCOPE.test(String(claims.role || ''))
      || !Array.isArray(claims.permissions) || !Array.isArray(claims.subjects)
      || claims.iat > now + 60 || claims.exp < now) return null;
    return {
      actor: String(claims.sub), tenant: String(claims.tenantId), role: String(claims.role),
      permissions: claims.permissions.map(String), subjects: claims.subjects.map(String),
    };
  } catch (_) {
    return null;
  }
}

function canTransition(from, to) {
  return Boolean(STATES[from] && STATES[from].includes(to));
}

function provenanceErrors(items) {
  if (!Array.isArray(items) || !items.length) return ['provenance required'];
  const errors = [];
  items.forEach((item, index) => {
    if (!item || !KEY.test(String(item.sourceRef || ''))) errors.push(`provenance[${index}].sourceRef invalid`);
    if (!item?.effectiveAt || Number.isNaN(Date.parse(item.effectiveAt))) errors.push(`provenance[${index}].effectiveAt invalid`);
    if (!SCOPE.test(String(item?.jurisdiction || ''))) errors.push(`provenance[${index}].jurisdiction invalid`);
    if (!/^[a-f0-9]{64}$/i.test(String(item?.sha256 || ''))) errors.push(`provenance[${index}].sha256 invalid`);
  });
  return errors;
}

function retryState(attempt, retryable = true) {
  return !retryable || Number(attempt) >= 5 ? 'dead_letter' : 'failed';
}

module.exports = { KEY, SCOPE, STATES, canonical, digest, sign, verifyIdentity, canTransition, provenanceErrors, retryState };
