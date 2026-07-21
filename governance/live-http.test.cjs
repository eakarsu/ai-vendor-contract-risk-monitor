'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { sign } = require('./kernel.cjs');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5306';
const secret = process.env.GOVERNANCE_GATEWAY_SECRET || '';
const tenant = `tenant:${crypto.randomUUID()}`;
const subject = `contract:${crypto.randomUUID()}`;

function identity(actor, role, permissions) {
  const now = Math.floor(Date.now() / 1000);
  const encoded = Buffer.from(JSON.stringify({
    sub: actor, tenantId: tenant, role, permissions, subjects: [subject],
    aud: 'vendor-contract-risk', iat: now - 1, exp: now + 300,
  })).toString('base64url');
  return { 'x-governance-identity': encoded, 'x-governance-signature': sign(encoded, secret) };
}

async function post(actor, role, permissions, body, key = `request:${crypto.randomUUID()}`) {
  return fetch(`${baseUrl}/api/governed-vendor-risk`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'Idempotency-Key': key, ...identity(actor, role, permissions) },
    body: JSON.stringify(body),
  });
}

async function expectJson(response, status) {
  const text = await response.text();
  assert.equal(response.status, status, text);
  return text ? JSON.parse(text) : null;
}

test('live governed workflow ingests, evaluates, segregates approval/release, and records delivery evidence', async () => {
  const creator = 'user:creator';
  const sourceRef = `source:${crypto.randomUUID()}`;
  const ingested = await post(creator, 'analyst', ['source:ingest'], {
    action: 'source-ingest', provider: 'contract-repository', sourceId: sourceRef,
    sourceVersion: 'version:0001', effectiveAt: '2026-01-01', jurisdiction: 'US-NY',
    freshnessAt: new Date().toISOString(), permissionScope: [subject], payload: { section: '9.2' },
    provenance: [{ sourceRef, effectiveAt: '2026-01-01', jurisdiction: 'US-NY', sha256: 'a'.repeat(64) }],
  });
  const source = await expectJson(ingested, 200);

  const reviewInput = {
    contractId: subject, contractVersion: 'version:0001', policyId: 'policy:vendor-risk',
    policyVersion: 'version:0007', ownerId: 'owner:procurement', scenario: 'termination',
    jurisdiction: 'US-NY', effectiveAt: '2026-01-01', retentionUntil: '2033-01-01',
    obligations: [{ id: 'obligation:notice', citationRef: `${sourceRef}#section-9.2`,
      deadline: '2027-01-15', riskRating: 'high', evidenceRefs: [sourceRef] }],
  };
  const idempotencyKey = `review:${crypto.randomUUID()}`;
  const created = await post(creator, 'analyst', ['review:create'], {
    action: 'create', review: reviewInput, sourceIds: [source.id],
  }, idempotencyKey);
  const review = await expectJson(created, 201);

  const replay = await post(creator, 'analyst', ['review:create'], {
    action: 'create', review: reviewInput, sourceIds: [source.id],
  }, idempotencyKey);
  assert.equal((await expectJson(replay, 200)).id, review.id);

  const submitted = await post(creator, 'analyst', ['review:submit'], {
    action: 'transition', id: review.id, version: review.version,
    targetState: 'review_pending', reason: 'Evidence is ready for independent review.',
  });
  const pending = await expectJson(submitted, 200);

  const selfApproval = await post(creator, 'legal_reviewer', ['review:approve'], {
    action: 'transition', id: review.id, version: pending.version,
    targetState: 'approved', reason: 'Improper self approval attempt.',
  });
  assert.equal(selfApproval.status, 409);

  const approved = await post('user:legal', 'legal_reviewer', ['review:approve'], {
    action: 'transition', id: review.id, version: pending.version,
    targetState: 'approved', reason: 'Citations and obligations independently checked.',
  });
  const approvedReview = await expectJson(approved, 200);

  const released = await post('user:compliance', 'compliance_officer', ['review:release'], {
    action: 'transition', id: review.id, version: approvedReview.version,
    targetState: 'released', reason: 'Release controls and deadlines checked.',
  });
  await expectJson(released, 200);

  const claimed = await post('service:audit', 'service', ['provider:deliver'], {
    action: 'delivery-claim', provider: 'audit-export',
  });
  const delivery = await expectJson(claimed, 200);
  const delivered = await post('service:audit', 'service', ['provider:deliver'], {
    action: 'delivery-result', provider: 'audit-export', id: delivery.id,
    leaseToken: delivery.lease_token, status: 'delivered',
    receipt: { receiptRef: `receipt:${crypto.randomUUID()}`, deliveredAt: new Date().toISOString() },
  });
  await expectJson(delivered, 200);

  const audit = await fetch(`${baseUrl}/api/governed-vendor-risk?view=audit`, {
    headers: identity('user:auditor', 'auditor', ['audit:export']),
  });
  const exported = await expectJson(audit, 200);
  assert.ok(exported.decisions.some((event) => event.event_type === 'released'));
  assert.ok(exported.decisions.some((event) => event.event_type === 'delivery_delivered'));
});
