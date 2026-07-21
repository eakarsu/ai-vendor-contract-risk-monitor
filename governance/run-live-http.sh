#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../frontend"
npm start -- -p "${PORT:-5306}" &
server_pid=$!
finish_server() {
  kill "$server_pid" >/dev/null 2>&1 || true
  wait "$server_pid" >/dev/null 2>&1 || true
}
trap finish_server EXIT

for attempt in $(seq 1 60); do
  if curl --fail --silent "http://127.0.0.1:${PORT:-5306}/login" >/dev/null; then
    BASE_URL="http://127.0.0.1:${PORT:-5306}" node ../governance/live-http.test.cjs
    exit 0
  fi
  sleep 1
done

printf 'application did not become ready\n' >&2
exit 1
