import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { governedQuery, governedTransaction } from '@/lib/governedPostgres';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { KEY, digest, verifyIdentity, canTransition, provenanceErrors, retryState } = require('../../../../../governance/kernel.cjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { evaluate } = require('../../../../../governance/domain.cjs');

const AUDIENCE = 'vendor-contract-risk';
const SOURCE_PROVIDERS = new Set(['regulatory-registry', 'contract-repository', 'vendor-portal']);
const DELIVERY_PROVIDERS = new Set(['notification', 'audit-export']);
const APPROVERS = new Set(['legal_reviewer', 'compliance_officer', 'procurement_manager', 'admin']);
const RELEASERS = new Set(['compliance_officer', 'procurement_manager', 'admin']);

function context(request: NextRequest) {
  return verifyIdentity(request.headers, process.env.GOVERNANCE_GATEWAY_SECRET || '', AUDIENCE);
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const ctx = context(request);
  if (!ctx) return error('signed identity required', 401);
  if (request.nextUrl.searchParams.get('view') === 'audit') {
    if (!ctx.permissions.includes('audit:export')) return error('audit:export required', 403);
    const result = await governedQuery(
      `SELECT seq,review_id,actor_id,event_type,reason,details,created_at
       FROM vendor_risk_decisions WHERE tenant_id=$1 ORDER BY seq DESC LIMIT 1000`,
      [ctx.tenant],
    );
    return NextResponse.json({ exportVersion: 1, generatedAt: new Date().toISOString(), decisions: result.rows });
  }
  if (!ctx.permissions.includes('review:read')) return error('review:read required', 403);
  const result = await governedQuery(
    `SELECT id,workflow_type,owner_id,state,version,result,uncertainty,created_by,
      approved_by,retention_until,legal_hold,created_at,updated_at
     FROM vendor_risk_reviews WHERE tenant_id=$1 ORDER BY updated_at DESC LIMIT 100`,
    [ctx.tenant],
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const ctx = context(request);
  if (!ctx) return error('signed identity required', 401);
  const key = request.headers.get('Idempotency-Key') || '';
  if (!KEY.test(key)) return error('valid Idempotency-Key required', 400);

  try {
    const body = await request.json();

    if (body.action === 'source-ingest') {
      if (!ctx.permissions.includes('source:ingest') || !SOURCE_PROVIDERS.has(body.provider)
        || !KEY.test(String(body.sourceId || '')) || !KEY.test(String(body.sourceVersion || ''))) {
        return error('authorized provider, source ID, and version required', 403);
      }
      const scope: string[] = Array.isArray(body.permissionScope)
        ? [...new Set<string>(body.permissionScope.map(String))] : [];
      if (!scope.length || !scope.every((subject: string) => ctx.subjects.includes(subject))) {
        return error('permission-aware source scope required', 403);
      }
      const provenance = Array.isArray(body.provenance) ? body.provenance : [];
      const provenanceFailures = provenanceErrors(provenance);
      if (provenanceFailures.length || !body.freshnessAt || Number.isNaN(Date.parse(body.freshnessAt))) {
        return NextResponse.json({ error: 'valid provenance and freshness required', details: provenanceFailures }, { status: 422 });
      }
      const effectiveAt = body.effectiveAt || provenance[0]?.effectiveAt;
      const jurisdiction = String(body.jurisdiction || provenance[0]?.jurisdiction || '');
      if (!effectiveAt || Number.isNaN(Date.parse(effectiveAt)) || !jurisdiction) {
        return error('effective date and jurisdiction required', 422);
      }
      const payloadHash = digest({ payload: body.payload, provenance });
      const source = await governedTransaction(async (query) => {
        const prior = await query<any>(
          `SELECT id,payload_hash,source_version FROM vendor_risk_sources
           WHERE tenant_id=$1 AND provider=$2 AND source_id=$3 FOR UPDATE`,
          [ctx.tenant, body.provider, body.sourceId],
        );
        const previous = prior.rows[0];
        const result = await query<any>(
          `INSERT INTO vendor_risk_sources
            (tenant_id,id,provider,source_id,source_version,effective_at,jurisdiction,
             permission_scope,payload_hash,provenance,freshness_at,deleted_at_source)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT(tenant_id,provider,source_id) DO UPDATE SET
             source_version=EXCLUDED.source_version,effective_at=EXCLUDED.effective_at,
             jurisdiction=EXCLUDED.jurisdiction,permission_scope=EXCLUDED.permission_scope,
             payload_hash=EXCLUDED.payload_hash,provenance=EXCLUDED.provenance,
             freshness_at=EXCLUDED.freshness_at,deleted_at_source=EXCLUDED.deleted_at_source,
             updated_at=NOW() RETURNING *`,
          [ctx.tenant, randomUUID(), body.provider, body.sourceId, body.sourceVersion,
            effectiveAt, jurisdiction, scope, payloadHash, JSON.stringify(provenance), body.freshnessAt,
            body.deletedAtSource || null],
        );
        const changed = Boolean(previous && (previous.payload_hash !== payloadHash
          || previous.source_version !== body.sourceVersion));
        await query(
          `INSERT INTO vendor_risk_source_events
            (tenant_id,source_id,actor_id,event_type,prior_version,source_version,
             prior_hash,payload_hash,change_detected,details)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [ctx.tenant, result.rows[0].id, ctx.actor,
            body.deletedAtSource ? 'source_deleted' : previous ? 'source_updated' : 'source_ingested',
            previous?.source_version || null, body.sourceVersion, previous?.payload_hash || null,
            payloadHash, changed, { provider: body.provider, provenance }],
        );
        return { ...result.rows[0], changeDetected: changed };
      });
      return NextResponse.json(source);
    }

    if (body.action === 'create') {
      if (!ctx.permissions.includes('review:create')) return error('review:create required', 403);
      const assessment = evaluate(body.review);
      if (assessment.errors.length) return NextResponse.json(assessment, { status: 422 });
      const requested = [...new Set((body.sourceIds || []).map(String))] as string[];
      if (!requested.length) return error('authoritative source IDs required', 422);
      const sources = await governedQuery<{
        id: string; permission_scope: string[]; freshness_at: string; deleted_at_source: string | null;
        jurisdiction: string; effective_at: string;
      }>(
        `SELECT id,permission_scope,freshness_at,deleted_at_source,jurisdiction,effective_at
         FROM vendor_risk_sources WHERE tenant_id=$1 AND id=ANY($2::uuid[])`,
        [ctx.tenant, requested],
      );
      const staleBefore = Date.now() - 24 * 60 * 60 * 1000;
      const forbidden = sources.rows.length !== requested.length || sources.rows.some((source) =>
        source.deleted_at_source || Date.parse(source.freshness_at) < staleBefore
        || Date.parse(source.effective_at) > Date.now()
        || source.jurisdiction !== body.review.jurisdiction
        || !source.permission_scope.every((subject) => ctx.subjects.includes(subject)));
      if (forbidden) return error('fresh, effective, permission-aware sources for the jurisdiction required', 403);
      const requestHash = digest({ review: body.review, sourceIds: requested });
      const review = await governedTransaction(async (query) => {
        const inserted = await query<any>(
          `WITH created AS (
            INSERT INTO vendor_risk_reviews
              (tenant_id,id,workflow_type,owner_id,input,result,uncertainty,request_hash,
               idempotency_key,created_by,retention_until,legal_hold)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            ON CONFLICT(tenant_id,workflow_type,idempotency_key) DO NOTHING RETURNING *
          ) SELECT created.*,FALSE replay FROM created
            UNION ALL SELECT prior.*,TRUE replay FROM vendor_risk_reviews prior
            WHERE prior.tenant_id=$1 AND prior.workflow_type=$3 AND prior.idempotency_key=$9
              AND prior.request_hash=$8 AND NOT EXISTS(SELECT 1 FROM created) LIMIT 1`,
          [ctx.tenant, randomUUID(), body.review.scenario, body.review.ownerId, body.review,
            assessment.result, assessment.uncertainty, requestHash, key, ctx.actor,
            body.review.retentionUntil, body.legalHold === true],
        );
        const row = inserted.rows[0];
        if (row && !row.replay) {
          for (const sourceId of requested) {
            await query(
              `INSERT INTO vendor_risk_review_sources(tenant_id,review_id,source_id) VALUES($1,$2,$3)`,
              [ctx.tenant, row.id, sourceId],
            );
          }
          await query(
            `INSERT INTO vendor_risk_decisions
              (tenant_id,review_id,actor_id,event_type,details) VALUES($1,$2,$3,'draft_created',$4)`,
            [ctx.tenant, row.id, ctx.actor, { sourceIds: requested, inputDigest: digest(body.review) }],
          );
        }
        return row;
      });
      return review
        ? NextResponse.json(review, { status: review.replay ? 200 : 201 })
        : error('idempotency conflict', 409);
    }

    if (body.action === 'transition') {
      const target = String(body.targetState || '');
      const reason = String(body.reason || '').trim();
      if (!reason) return error('decision reason required', 422);
      const review = await governedTransaction(async (query) => {
        const selected = await query<any>(
          `SELECT * FROM vendor_risk_reviews WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,
          [ctx.tenant, body.id],
        );
        const current = selected.rows[0];
        if (!current || current.version !== Number(body.version) || !canTransition(current.state, target)) return null;
        if (target === 'review_pending' && !ctx.permissions.includes('review:submit')) return null;
        if (['approved', 'rejected'].includes(target)
          && (!ctx.permissions.includes('review:approve') || !APPROVERS.has(ctx.role) || current.created_by === ctx.actor)) return null;
        if (target === 'released'
          && (!ctx.permissions.includes('review:release') || !RELEASERS.has(ctx.role)
            || !current.approved_by || current.approved_by === ctx.actor || current.created_by === ctx.actor)) return null;
        if (target === 'retired'
          && (!ctx.permissions.includes('review:retire') || current.legal_hold)) return null;
        if (current.state === 'rejected' && target === 'draft' && !ctx.permissions.includes('review:edit')) return null;
        const updated = await query<any>(
          `UPDATE vendor_risk_reviews SET state=$1,version=version+1,
             approved_by=CASE WHEN $1='approved' THEN $2 ELSE approved_by END,updated_at=NOW()
           WHERE tenant_id=$3 AND id=$4 AND version=$5 RETURNING *`,
          [target, ctx.actor, ctx.tenant, body.id, Number(body.version)],
        );
        await query(
          `INSERT INTO vendor_risk_decisions
            (tenant_id,review_id,actor_id,event_type,reason,details) VALUES($1,$2,$3,$4,$5,$6)`,
          [ctx.tenant, body.id, ctx.actor, target, reason.slice(0, 1000),
            { priorState: current.state, version: current.version + 1 }],
        );
        if (target === 'released') {
          for (const provider of DELIVERY_PROVIDERS) {
            await query(
              `INSERT INTO vendor_risk_outbox
                (tenant_id,review_id,provider,operation,payload,idempotency_key)
               VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
              [ctx.tenant, body.id, provider, provider === 'audit-export' ? 'decision-export' : 'release-notice',
                { reviewId: body.id, version: current.version + 1 }, `${body.id}:${current.version + 1}:${provider}`],
            );
          }
        }
        return updated.rows[0];
      });
      return review ? NextResponse.json(review) : error('forbidden, stale, or invalid transition', 409);
    }

    if (body.action === 'legal-hold') {
      if (!ctx.permissions.includes('retention:manage') || !['compliance_officer', 'admin'].includes(ctx.role)) {
        return error('retention administrator required', 403);
      }
      if (!String(body.reason || '').trim()) return error('legal-hold reason required', 422);
      const result = await governedTransaction(async (query) => {
        const updated = await query<any>(
          `UPDATE vendor_risk_reviews SET legal_hold=$1,version=version+1,updated_at=NOW()
           WHERE tenant_id=$2 AND id=$3 AND version=$4 RETURNING *`,
          [body.enabled === true, ctx.tenant, body.id, Number(body.version)],
        );
        if (updated.rowCount) {
          await query(
            `INSERT INTO vendor_risk_decisions
              (tenant_id,review_id,actor_id,event_type,reason,details) VALUES($1,$2,$3,'legal_hold',$4,$5)`,
            [ctx.tenant, body.id, ctx.actor, String(body.reason || '').slice(0, 1000), { enabled: body.enabled === true }],
          );
        }
        return updated.rows[0];
      });
      return result ? NextResponse.json(result) : error('stale or missing review', 409);
    }

    if (body.action === 'delivery-claim') {
      if (!ctx.permissions.includes('provider:deliver') || !DELIVERY_PROVIDERS.has(body.provider)) {
        return error('provider:deliver required', 403);
      }
      const leaseToken = randomUUID();
      const result = await governedQuery<any>(
        `WITH picked AS (
          SELECT id FROM vendor_risk_outbox WHERE tenant_id=$1 AND provider=$2
            AND ((status IN('queued','failed') AND next_attempt_at<=NOW())
              OR (status='processing' AND lease_expires_at<NOW()))
            AND attempts<5 ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1
        ) UPDATE vendor_risk_outbox item SET status='processing',attempts=attempts+1,
          lease_token=$3,lease_expires_at=NOW()+INTERVAL '2 minutes'
          FROM picked WHERE item.id=picked.id RETURNING item.*`,
        [ctx.tenant, body.provider, leaseToken],
      );
      return result.rowCount ? NextResponse.json(result.rows[0]) : new NextResponse(null, { status: 204 });
    }

    if (body.action === 'delivery-result') {
      if (!ctx.permissions.includes('provider:deliver') || !DELIVERY_PROVIDERS.has(body.provider)) {
        return error('provider:deliver required', 403);
      }
      if (body.status === 'delivered'
        && (!KEY.test(String(body.receipt?.receiptRef || '')) || !body.receipt?.deliveredAt)) {
        return error('typed provider receipt required', 422);
      }
      const result = await governedTransaction(async (query) => {
        const claimed = await query<any>(
          `SELECT * FROM vendor_risk_outbox WHERE tenant_id=$1 AND id=$2 AND provider=$3
           AND status='processing' AND lease_token=$4 AND lease_expires_at>=NOW() FOR UPDATE`,
          [ctx.tenant, body.id, body.provider, body.leaseToken],
        );
        const current = claimed.rows[0];
        if (!current) return null;
        const status = body.status === 'delivered'
          ? 'delivered' : retryState(current.attempts, body.retryable !== false);
        const updated = await query<any>(
          `UPDATE vendor_risk_outbox SET status=$1,provider_receipt=$2,last_error_code=$3,
             lease_token=NULL,lease_expires_at=NULL,next_attempt_at=NOW()+INTERVAL '1 minute'
           WHERE id=$4 RETURNING *`,
          [status, body.status === 'delivered' ? body.receipt : null,
            status === 'delivered' ? null : String(body.errorCode || 'PROVIDER_FAILURE').slice(0, 64), current.id],
        );
        await query(
          `INSERT INTO vendor_risk_decisions
            (tenant_id,review_id,actor_id,event_type,details) VALUES($1,$2,$3,$4,$5)`,
          [ctx.tenant, current.review_id, ctx.actor, `delivery_${status}`,
            { provider: current.provider, receipt: body.status === 'delivered' ? body.receipt : undefined }],
        );
        return updated.rows[0];
      });
      return result ? NextResponse.json(result) : error('missing or expired delivery claim', 409);
    }

    return error('unsupported action', 422);
  } catch (caught) {
    const diagnostic = caught && typeof caught === 'object'
      ? { name: 'name' in caught ? String(caught.name) : 'unknown',
        code: 'code' in caught ? String(caught.code) : undefined,
        constraint: 'constraint' in caught ? String(caught.constraint) : undefined }
      : { name: 'unknown' };
    console.error('governed vendor risk operation failed', diagnostic);
    return error('governed vendor risk operation failed', 500);
  }
}
