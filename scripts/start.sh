#!/usr/bin/env bash
# =============================================================================
# SyncFlow Start — starts both backend and frontend services
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "${SCRIPT_DIR}/env" ]; then
  set -a
  source "${SCRIPT_DIR}/env"
  set +a
fi

echo "Starting SyncFlow..."

# Start backend (Spring Boot)
echo "  Starting backend on :8088..."
nohup java \
  -Xms128m -Xmx384m \
  -XX:+UseSerialGC \
  -Dspring.profiles.active=prod \
  -Dserver.port=${SERVER_PORT:-8088} \
  -jar "${SCRIPT_DIR}/backend/syncflow.jar" \
  > /opt/syncflow/logs/backend.log 2>&1 &
echo $! > /opt/syncflow/backend.pid

# Start frontend (Next.js)
echo "  Starting frontend on :3000..."
cd "${SCRIPT_DIR}/frontend"
nohup node_modules/.bin/next start -p 3000 \
  > /opt/syncflow/logs/frontend.log 2>&1 &
echo $! > /opt/syncflow/frontend.pid

sleep 3
echo "SyncFlow started."
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:${SERVER_PORT:-8088}"
