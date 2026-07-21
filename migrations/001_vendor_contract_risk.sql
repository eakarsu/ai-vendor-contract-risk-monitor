BEGIN;

CREATE TABLE IF NOT EXISTS vendor_risk_sources (
  tenant_id TEXT NOT NULL,id UUID NOT NULL,provider TEXT NOT NULL,
  source_id TEXT NOT NULL,source_version TEXT NOT NULL,effective_at TIMESTAMPTZ NOT NULL,
  jurisdiction TEXT NOT NULL,permission_scope TEXT[] NOT NULL,payload_hash CHAR(64) NOT NULL,provenance JSONB NOT NULL,
  freshness_at TIMESTAMPTZ NOT NULL,deleted_at_source TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,provider,source_id)
);

CREATE TABLE IF NOT EXISTS vendor_risk_reviews (
  tenant_id TEXT NOT NULL,id UUID NOT NULL,workflow_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN('draft','review_pending','approved','rejected','released','retired')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),input JSONB NOT NULL,result JSONB NOT NULL,
  uncertainty JSONB NOT NULL,request_hash CHAR(64) NOT NULL,idempotency_key TEXT NOT NULL,
  created_by TEXT NOT NULL,approved_by TEXT,retention_until TIMESTAMPTZ NOT NULL,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(tenant_id,id),
  UNIQUE(tenant_id,workflow_type,idempotency_key)
);

CREATE TABLE IF NOT EXISTS vendor_risk_source_events (
  seq BIGSERIAL PRIMARY KEY,tenant_id TEXT NOT NULL,source_id UUID NOT NULL,actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,prior_version TEXT,source_version TEXT NOT NULL,
  prior_hash CHAR(64),payload_hash CHAR(64) NOT NULL,change_detected BOOLEAN NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY(tenant_id,source_id) REFERENCES vendor_risk_sources(tenant_id,id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vendor_risk_review_sources (
  tenant_id TEXT NOT NULL,review_id UUID NOT NULL,source_id UUID NOT NULL,
  PRIMARY KEY(tenant_id,review_id,source_id),
  FOREIGN KEY(tenant_id,review_id) REFERENCES vendor_risk_reviews(tenant_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(tenant_id,source_id) REFERENCES vendor_risk_sources(tenant_id,id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vendor_risk_decisions (
  seq BIGSERIAL PRIMARY KEY,tenant_id TEXT NOT NULL,review_id UUID NOT NULL,
  actor_id TEXT NOT NULL,event_type TEXT NOT NULL,reason TEXT,details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY(tenant_id,review_id) REFERENCES vendor_risk_reviews(tenant_id,id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vendor_risk_outbox (
  id BIGSERIAL PRIMARY KEY,tenant_id TEXT NOT NULL,review_id UUID NOT NULL,
  provider TEXT NOT NULL,operation TEXT NOT NULL,payload JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN('queued','processing','delivered','failed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,lease_token UUID,lease_expires_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),provider_receipt JSONB,last_error_code TEXT,
  FOREIGN KEY(tenant_id,review_id) REFERENCES vendor_risk_reviews(tenant_id,id) ON DELETE RESTRICT,
  UNIQUE(tenant_id,provider,idempotency_key)
);

CREATE INDEX IF NOT EXISTS vendor_risk_state_idx ON vendor_risk_reviews(tenant_id,state,updated_at);
CREATE INDEX IF NOT EXISTS vendor_risk_outbox_ready_idx ON vendor_risk_outbox(status,next_attempt_at,lease_expires_at);

CREATE OR REPLACE FUNCTION vendor_risk_decisions_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'vendor risk decisions are append-only';
END
$$;
DROP TRIGGER IF EXISTS vendor_risk_decisions_append_only_trigger ON vendor_risk_decisions;
CREATE TRIGGER vendor_risk_decisions_append_only_trigger
BEFORE UPDATE OR DELETE ON vendor_risk_decisions
FOR EACH ROW EXECUTE FUNCTION vendor_risk_decisions_append_only();

CREATE OR REPLACE FUNCTION vendor_risk_source_events_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'vendor risk source events are append-only';
END
$$;
DROP TRIGGER IF EXISTS vendor_risk_source_events_append_only_trigger ON vendor_risk_source_events;
CREATE TRIGGER vendor_risk_source_events_append_only_trigger
BEFORE UPDATE OR DELETE ON vendor_risk_source_events
FOR EACH ROW EXECUTE FUNCTION vendor_risk_source_events_append_only();

COMMIT;
