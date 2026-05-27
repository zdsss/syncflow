#!/usr/bin/env bash
# =============================================================================
# SyncFlow Build Script — produces deployable syncflow-{version}.tar.gz
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VERSION="${1:-$(date +%Y%m%d-%H%M)}"
OUTPUT_DIR="${PROJECT_DIR}/build-artifacts"
FRONTEND_DIR="${PROJECT_DIR}/frontend-next"

echo "=== SyncFlow Build v${VERSION} ==="

# ---- 1. Frontend (Next.js standalone) ----
echo "[1/4] Building frontend..."
cd "$FRONTEND_DIR"
pnpm install --frozen-lockfile
pnpm build
echo "  -> Next.js build ready"

# ---- 2. Backend fat JAR ----
echo "[2/4] Building backend fat JAR..."
cd "${PROJECT_DIR}/syncflow-java"
mvn clean package -DskipTests -q
JAR_FILE="$(find syncflow-app/target -name 'syncflow-app-*.jar' ! -name '*-sources.jar' | head -1)"
if [ ! -f "$JAR_FILE" ]; then
  echo "ERROR: JAR not found!"
  exit 1
fi
echo "  -> JAR: $(basename "$JAR_FILE") ($(du -sh "$JAR_FILE" | cut -f1))"

# ---- 3. Package ----
echo "[3/4] Packaging deployable archive..."
mkdir -p "$OUTPUT_DIR"
DEPLOY_DIR="${OUTPUT_DIR}/syncflow-${VERSION}"
mkdir -p "${DEPLOY_DIR}/frontend"
mkdir -p "${DEPLOY_DIR}/backend"

# Backend
cp "$JAR_FILE" "${DEPLOY_DIR}/backend/syncflow.jar"

# Frontend (Next.js standalone build)
cp -r "${FRONTEND_DIR}/.next" "${DEPLOY_DIR}/frontend/.next"
cp -r "${FRONTEND_DIR}/node_modules" "${DEPLOY_DIR}/frontend/node_modules"
cp "${FRONTEND_DIR}/package.json" "${DEPLOY_DIR}/frontend/"
cp -r "${FRONTEND_DIR}/public" "${DEPLOY_DIR}/frontend/public" 2>/dev/null || true

# Scripts & config
cp "${SCRIPT_DIR}/server-setup.sh"      "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/start.sh"             "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/stop.sh"              "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/env"                  "${DEPLOY_DIR}/env.example"
cp "${SCRIPT_DIR}/syncflow.service"     "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/nginx-syncflow.conf"  "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/syncflow-logrotate"   "${DEPLOY_DIR}/"
cp "${SCRIPT_DIR}/minio.bin"            "${DEPLOY_DIR}/minio"

# ---- 4. Archive ----
echo "[4/4] Creating archive..."
cd "$OUTPUT_DIR"
tar czf "syncflow-${VERSION}.tar.gz" "syncflow-${VERSION}"
rm -rf "syncflow-${VERSION}"

echo ""
echo "=== Build Complete ==="
echo "Output: ${OUTPUT_DIR}/syncflow-${VERSION}.tar.gz"
echo "Size:   $(du -sh "${OUTPUT_DIR}/syncflow-${VERSION}.tar.gz" | cut -f1)"
echo ""
echo "Deploy:"
echo "  scp ${OUTPUT_DIR}/syncflow-${VERSION}.tar.gz user@server:/opt/syncflow/"
echo "  ssh user@server 'cd /opt/syncflow && tar xzf syncflow-${VERSION}.tar.gz'"
echo "  # First time: sudo bash server-setup.sh"
echo "  # Start: sudo systemctl start syncflow"
