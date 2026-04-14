#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🦞 Starting Lobster Community Demo..."

cleanup() {
  echo ""
  echo "Stopping demo services..."
  jobs -p | xargs -r kill 2>/dev/null || true
}

trap cleanup EXIT INT TERM

cd "$REPO_ROOT"

echo "Starting server on :3888..."
pnpm --filter server dev &
SERVER_PID=$!

sleep 2
if curl -sf http://localhost:3888/health >/dev/null 2>&1; then
  echo "  ✓ Server healthy"
else
  echo "  ⚠ Server may not be ready yet"
fi

echo "Starting web on :5173..."
pnpm --filter web dev -- --host 127.0.0.1 --port 5173 &
WEB_PID=$!

echo "Starting installer (Electron demo mode)..."
VITE_DEMO_MODE=true pnpm --filter lobster-installer dev &
INSTALLER_PID=$!

echo ""
echo "=== Lobster Demo Running ==="
echo "  Web:       http://127.0.0.1:5173"
echo "  Server:    http://127.0.0.1:3888"
echo "  Installer: Electron window (demo mode)"
echo ""
echo "Press Ctrl+C to stop all"

wait "$SERVER_PID" "$WEB_PID" "$INSTALLER_PID"
