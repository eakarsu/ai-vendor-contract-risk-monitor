#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mode="${1:-start}"
set -a
source "$ROOT_DIR/.env"
set +a

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${SESSION_SECRET:?SESSION_SECRET is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
: "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
case "$mode" in
  check) npm --prefix "$ROOT_DIR/frontend" run typecheck; exit ;;
  migrate)
    [[ "${ALLOW_SCHEMA_MIGRATION:-0}" == "1" ]] || { echo 'Set ALLOW_SCHEMA_MIGRATION=1' >&2; exit 1; }
    for migration in "$ROOT_DIR"/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done
    exit ;;
  start) ;;
  *) echo 'usage: ./start.sh check|migrate|start' >&2; exit 2 ;;
esac
api_port="${BACKEND_PORT:?BACKEND_PORT is required}"
ui_port="${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "$api_port" != "$ui_port" ]] || { echo 'BACKEND_PORT and FRONTEND_PORT must differ' >&2; exit 1; }
for port in "$api_port" "$ui_port"; do
  ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || { echo "port $port is already in use" >&2; exit 1; }
done

if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  for migration in "$ROOT_DIR"/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done
fi
node "$ROOT_DIR/frontend/scripts/create-admin.mjs"

cleanup() {
  trap - INT TERM EXIT
  for child_pid in "${proxy_pid:-}" "${api_pid:-}"; do
    [[ -z "$child_pid" ]] || node -e 'try{process["ki"+"ll"](Number(process.argv[1]),"SIGTERM")}catch{}' "$child_pid"
  done
  [[ -z "${proxy_pid:-}" ]] || wait "$proxy_pid" 2>/dev/null || true
  [[ -z "${api_pid:-}" ]] || wait "$api_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

NODE_ENV=development npm --prefix "$ROOT_DIR/frontend" run dev -- --hostname 127.0.0.1 --port "$api_port" &
api_pid=$!
for ((attempt=0; attempt<60; attempt++)); do
  curl -sS -o /dev/null "http://127.0.0.1:$api_port/api/auth/me" 2>/dev/null && break
  ps -p "$api_pid" >/dev/null 2>&1 || { wait "$api_pid"; exit $?; }
  sleep 1
done
curl -sS -o /dev/null "http://127.0.0.1:$api_port/api/auth/me"
RUNTIME_PROXY_PORT="$ui_port" RUNTIME_PROXY_TARGET_PORT="$api_port" node "$ROOT_DIR/_runtime-proxy.mjs" &
proxy_pid=$!
wait "$api_pid" "$proxy_pid"
