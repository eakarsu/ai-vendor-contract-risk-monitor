# Governed vendor contract risk runbook

## Deployment gates

Provide a PostgreSQL `DATABASE_URL`, a 32-character-or-longer `GOVERNANCE_GATEWAY_SECRET`, and an independent 32-character-or-longer `SESSION_SECRET`. Production database TLS requires `PGSSLROOTCERT`. Keep demo authentication disabled in production. Identity assertions must be created by the trusted SSO gateway for audience `vendor-contract-risk`; do not expose the signing secret to browsers.

Install with `npm ci` in `frontend`, run `npm test` at the project root or `node --test governance/governance.test.cjs`, apply the migration through an approved change step, then build the frontend. `./start.sh check` is read-only. `./start.sh migrate` requires `ALLOW_SCHEMA_MIGRATION=1`; normal startup never installs packages, migrates, seeds, or terminates another process.

## Operations and evidence

Contract and regulatory sources must have stable versions, hashes, effective dates, jurisdictions, freshness timestamps, permission scopes, and provenance. Alert on stale/deleted sources, repeated failed deliveries, expired leases, dead-letter records, reviews awaiting approval, and retention dates. Audit exports are tenant-scoped and require `audit:export`.

Approvals and releases are separate actions. Creators cannot approve; creators and approvers cannot release their own work. Legal holds block retirement. Provider delivery requires a typed receipt, and failures retry to a bounded dead-letter state. External legal interpretations and vendor acceptance remain human responsibilities.

## Rollback

Stop routing traffic to the new build and restore the prior application artifact. The migration is additive; preserve its tables and immutable decision history during application rollback. Do not drop or truncate them. Replay only outbox rows without a valid provider receipt, using their existing idempotency keys. If an identity key is suspected compromised, rotate it at the gateway and application together before resuming traffic.
