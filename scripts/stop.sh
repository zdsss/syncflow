#!/usr/bin/env bash
# =============================================================================
# SyncFlow Stop — stops both backend and frontend services
# =============================================================================
set -euo pipefail

echo "Stopping SyncFlow..."

if [ -f /opt/syncflow/backend.pid ]; then
  kill "$(cat /opt/syncflow/backend.pid)" 2>/dev/null && echo "  Backend stopped." || echo "  Backend not running."
  rm -f /opt/syncflow/backend.pid
fi

if [ -f /opt/syncflow/frontend.pid ]; then
  kill "$(cat /opt/syncflow/frontend.pid)" 2>/dev/null && echo "  Frontend stopped." || echo "  Frontend not running."
  rm -f /opt/syncflow/frontend.pid
fi

echo "SyncFlow stopped."
