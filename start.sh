#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

check() {
  local governance_secret="${GOVERNANCE_GATEWAY_SECRET:-}"
  local session_secret="${SESSION_SECRET:-}"
  case "${DATABASE_URL:-}" in
    postgres://*|postgresql://*) ;;
    *) fail "DATABASE_URL must be an explicit PostgreSQL connection string" ;;
  esac
  [ "${#session_secret}" -ge 32 ] || fail "SESSION_SECRET must contain at least 32 characters"
  if [ "${NODE_ENV:-development}" = test ]; then
    ENABLE_DEMO_AUTH="${ENABLE_DEMO_AUTH:-true}"
    DEMO_ADMIN_EMAIL="${DEMO_ADMIN_EMAIL:-${ADMIN_EMAIL:-${DEMO_EMAIL:-}}}"
    DEMO_ADMIN_PASSWORD="${DEMO_ADMIN_PASSWORD:-${ADMIN_PASSWORD:-${DEMO_PASSWORD:-}}}"
    RUNTIME_VALIDATION_AUTH=true
    export ENABLE_DEMO_AUTH DEMO_ADMIN_EMAIL DEMO_ADMIN_PASSWORD RUNTIME_VALIDATION_AUTH
  else
    [ "${#governance_secret}" -ge 32 ] || fail "GOVERNANCE_GATEWAY_SECRET must contain at least 32 characters"
  fi
  if [ "${NODE_ENV:-development}" = production ]; then
    [ -n "${PGSSLROOTCERT:-}" ] || fail "PGSSLROOTCERT is required for remote production database verification"
  fi
}

case "${1:-start}" in
  check)
    check
    ;;
  migrate)
    check
    [ "${ALLOW_SCHEMA_MIGRATION:-0}" = 1 ] || fail "set ALLOW_SCHEMA_MIGRATION=1 for the approved migration step"
    command -v psql >/dev/null 2>&1 || fail "psql is required"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/migrations/001_vendor_contract_risk.sql"
    ;;
  start)
    check
    [ -d "$ROOT_DIR/frontend/node_modules" ] || fail "frontend dependencies are missing; install explicitly"
    [ -f "$ROOT_DIR/frontend/.next/BUILD_ID" ] || fail "production build is missing; build explicitly"
    cd "$ROOT_DIR/frontend"
    exec npm start -- -p "${PORT:-5306}"
    ;;
  *) fail "usage: ./start.sh [check|migrate|start]" ;;
esac
