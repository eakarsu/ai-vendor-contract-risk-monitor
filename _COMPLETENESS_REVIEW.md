# Completeness Review: ai-vendor-contract-risk-monitor

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 87 project files (63 source files), 2 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for governance/compliance. Generated gap/demo patterns are present: it contains 63 source files and visible routes/pages in `frontend/`, `backend/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Replace advisory-only AI output with versioned policies, evidence links, accountable owners, approvals, and immutable decisions.
2. Add authoritative regulatory/contract ingestion with source provenance, effective dates, jurisdiction, and change detection.
3. Implement SSO, least-privilege RBAC, segregation of duties, retention/legal holds, and exportable audit logs.
4. Build scenario-specific evaluations so citations, obligations, deadlines, and risk ratings are checked before release.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `README.md`
- `SOURCE_DATA_TABLES.md:127`
- `frontend/src/lib/sourceAIToolFields.ts:6`
- `frontend/src/app/layout.tsx`
- `backend/package.json`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one governance/compliance workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Implementation progress (2026-07-18)

All five review items now have an implemented, project-owned acceptance path:

1. `POST /api/governed-vendor-risk` persists versioned contract/policy evaluations, accountable owners, source bindings, independent approvals, separate releases, legal holds, and append-only decision records. Creators cannot approve, and creators or approvers cannot release their own review.
2. Regulatory, contract-repository, and vendor-portal ingestion now requires provider allow-listing, stable source/version identifiers, effective dates, jurisdictions, freshness, permission scopes, SHA-256 provenance, deletion signals, and payload/version change detection. Ingestion and changes are recorded in an append-only source-event ledger.
3. Trusted gateway identities are HMAC authenticated and bound to audience, tenant, role, permissions, and source subjects. Browser sessions are signed and expiring, production cookies are secure, built-in passwords were removed, optional demo authentication is non-production and environment-configured, legal holds block retirement, and tenant-scoped audit export requires an explicit permission.
4. Renewal, termination, data-processing, service-level, and pricing scenarios fail closed unless versioned policies/contracts, citations, obligations, evidence, deadlines, jurisdiction, retention, and enumerated risk ratings are present. Results explicitly require human review and retain legal/vendor uncertainty rather than presenting AI output as authoritative.
5. CI installs from the lockfile, runs 12 deterministic control/failure-path tests, type-checks, applies the additive migration twice, produces a production build, and executes a live PostgreSQL/HTTP workflow test covering ingestion, idempotent replay, self-approval rejection, independent approval, separate release, outbox claiming, typed provider receipts, and audit export. The launcher is fail-fast and never installs, seeds, migrates, or kills unrelated processes during normal startup; migration requires a separate approval flag. Deployment, monitoring, failure recovery, and rollback are documented in `RUNBOOK.md`.

Local verification passed: 12/12 control tests, 1/1 live workflow test, TypeScript type-check, repeat migration application, shell syntax, and the Next.js 14.2.35 production build. Git path/history inspection found no tracked `.env` files; `.env.example` contains placeholders only. `npm audit --omit=dev` still reports two transitive findings (one moderate PostCSS issue and one high Next.js advisory group); npm offers only the breaking Next.js 16 upgrade, so this is explicitly a dependency-upgrade gate rather than silently applying a major framework migration.

These controls establish a working reference workflow, not external certification. Production completion still depends on organization-owned SSO key custody, real provider credentials and contracts, authoritative-source onboarding, retention policy approval, legal review, monitored infrastructure, and validation of the breaking Next.js upgrade before deployment.

## Runtime verification (2026-07-20)

- `start.sh` now defaults to the existing nondestructive Next.js `start` mode while retaining explicit `check` and approval-gated `migrate` modes.
- In an explicit `NODE_ENV=test` launch only, the launcher enables the pre-existing demo-auth boundary, maps the supplied acceptance identity, and adds a runtime-validation marker required by the optimized Next production server. Normal launches still require an independent governance gateway secret, and production demo authentication remains disabled without the validation marker.
- The independent validator used disposable PostgreSQL on port 55543 and API port 5906, recording `API_VERIFIED` with `startup_login_session_api` and verifying the signed session cookie through `/api/auth/me`.
- The optimized Next.js build passed, including TypeScript validation, and all 12 governance tests passed.
