'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  digest, sign, verifyIdentity, canTransition, provenanceErrors, retryState,
} = require('./kernel.cjs');
const { evaluate } = require('./domain.cjs');

const root = path.resolve(__dirname, '..');
const valid = {
  contractId: 'contract:acme', contractVersion: 'v3', policyId: 'policy:vendor-risk',
  policyVersion: 'v7', ownerId: 'owner:procurement', scenario: 'termination',
  jurisdiction: 'US-NY', effectiveAt: '2026-01-01', retentionUntil: '2033-01-01',
  obligations: [{
    id: 'obligation:notice', citationRef: 'contract:acme#section-9.2',
    deadline: '2027-01-15', riskRating: 'high', evidenceRefs: ['source:contract-v3'],
  }],
};

test('digest is stable and payload bound', () => {
  assert.equal(digest({ b: 2, a: 1 }), digest({ a: 1, b: 2 }));
  assert.notEqual(digest({ a: 1 }), digest({ a: 2 }));
});

test('gateway assertion scopes audience, tenant, role, permissions, and subjects', () => {
  const secret = 'x'.repeat(32);
  const encoded = Buffer.from(JSON.stringify({
    sub: 'user:legal', tenantId: 'tenant:1', role: 'legal_reviewer',
    permissions: ['review:approve'], subjects: ['contract:acme'],
    aud: 'vendor-contract-risk', iat: 1, exp: 200,
  })).toString('base64url');
  const headers = new Headers({
    'x-governance-identity': encoded,
    'x-governance-signature': sign(encoded, secret),
  });
  const identity = verifyIdentity(headers, secret, 'vendor-contract-risk', 100);
  assert.deepEqual(identity.subjects, ['contract:acme']);
  assert.equal(verifyIdentity(headers, secret, 'wrong-audience', 100), null);
});

test('workflow transitions fail closed', () => {
  assert.equal(canTransition('draft', 'review_pending'), true);
  assert.equal(canTransition('review_pending', 'released'), false);
  assert.equal(canTransition('retired', 'draft'), false);
});

test('authoritative provenance requires source, effective date, jurisdiction, and digest', () => {
  assert.deepEqual(provenanceErrors([{
    sourceRef: 'contract:acme', effectiveAt: '2026-01-01', jurisdiction: 'US-NY', sha256: 'a'.repeat(64),
  }]), []);
  assert.ok(provenanceErrors([{}]).length >= 4);
});

test('valid scenario evaluation is deterministic, cited, and human reviewed', () => {
  const result = evaluate(valid);
  assert.deepEqual(result, evaluate(valid));
  assert.equal(result.result.obligations[0].citationRef, 'contract:acme#section-9.2');
  assert.equal(result.result.releaseState, 'human_review_required');
  assert.equal(result.result.decisionAutomated, false);
});

test('contract, policy, owner, scenario, jurisdiction, effective date, and retention are required', () => {
  const result = evaluate({});
  assert.ok(result.errors.length >= 8);
});

test('obligations require citations, deadlines, risk ratings, and evidence', () => {
  const result = evaluate({ ...valid, obligations: [{ id: 'x' }] });
  assert.match(result.errors.join(','), /citation/);
  assert.match(result.errors.join(','), /deadline/);
  assert.match(result.errors.join(','), /riskRating/);
  assert.match(result.errors.join(','), /evidence/);
});

test('change detection fails closed without a change reference', () => {
  assert.match(evaluate({ ...valid, changeDetected: true }).errors.join(','), /changeRef/);
  assert.deepEqual(evaluate({ ...valid, changeDetected: true, changeRef: 'registry:change-1' }).errors, []);
});

test('retry policy dead-letters bounded and permanent provider failures', () => {
  assert.equal(retryState(4), 'failed');
  assert.equal(retryState(5), 'dead_letter');
  assert.equal(retryState(1, false), 'dead_letter');
});

test('migration is additive and covers provenance, retention, legal hold, outbox, and immutable decisions', () => {
  const migration = fs.readFileSync(path.join(root, 'migrations/001_vendor_contract_risk.sql'), 'utf8');
  assert.match(migration, /permission_scope/);
  assert.match(migration, /provenance/);
  assert.match(migration, /retention_until/);
  assert.match(migration, /legal_hold/);
  assert.match(migration, /lease_expires_at/);
  assert.match(migration, /decisions_append_only/);
  assert.match(migration, /source_events_append_only/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE/i);
});

test('API enforces idempotency, scoped sources, independent release, immutable events, and typed delivery', () => {
  const api = fs.readFileSync(path.join(root, 'frontend/src/app/api/governed-vendor-risk/route.ts'), 'utf8');
  assert.match(api, /Idempotency-Key/);
  assert.match(api, /subjects\.includes/);
  assert.match(api, /created_by === ctx\.actor/);
  assert.match(api, /approved_by === ctx\.actor/);
  assert.match(api, /vendor_risk_decisions/);
  assert.match(api, /receiptRef/);
  assert.match(api, /SKIP LOCKED/);
});

test('CI, launcher, authentication, and runbook expose production controls', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/governed-vendor-risk.yml'), 'utf8');
  const launcher = fs.readFileSync(path.join(root, 'start.sh'), 'utf8');
  const auth = fs.readFileSync(path.join(root, 'frontend/src/lib/auth.ts'), 'utf8');
  assert.match(workflow, /npm run build/);
  assert.match(auth, /createHmac/);
  assert.doesNotMatch(auth, /admin123|manager123|analyst123/);
  assert.doesNotMatch(launcher, /kill|npm install|seed|db push/);
  assert.match(launcher, /ALLOW_SCHEMA_MIGRATION/);
  assert.match(fs.readFileSync(path.join(root, 'RUNBOOK.md'), 'utf8'), /Rollback/);
});
