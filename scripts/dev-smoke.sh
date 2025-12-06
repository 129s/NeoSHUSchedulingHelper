#!/usr/bin/env bash
set -euo pipefail

# Run app dev server briefly to catch boot errors, then terminate.
# Usage: ./scripts/dev-smoke.sh [seconds]
# Default duration: 15 seconds.

duration="${1:-15}"
root_dir="$(cd "$(dirname "$0")/.." && pwd)"
app_dir="$root_dir/app"
log_file="$root_dir/dev-smoke.log"

cd "$app_dir"
: "${VITE_HOST:=127.0.0.1}"
: "${VITE_PORT:=4173}"

npm run dev -- --host "$VITE_HOST" --port "$VITE_PORT" >"$log_file" 2>&1 &
server_pid=$!

cleanup() {
  if kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

sleep "$duration" || true
cleanup
wait "$server_pid" 2>/dev/null || true

echo "dev smoke finished after ${duration}s; log at $log_file"
