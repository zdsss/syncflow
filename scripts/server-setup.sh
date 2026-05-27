#!/usr/bin/env bash
# =============================================================================
# SyncFlow Server Setup — one-time initialization for Ubuntu 22.04/24.04 (2GB)
# Usage: bash server-setup.sh    (run from extracted package directory)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="/opt/syncflow"
APP_USER="syncflow"

echo "=== SyncFlow Server Setup ==="
echo "Source: $SCRIPT_DIR"
echo "Target: $APP_DIR"
echo ""

# ---- Check root ----
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run as root: bash server-setup.sh"
  exit 1
fi

# ---- Memory check ----
TOTAL_MEM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
echo "Detected memory: ${TOTAL_MEM_MB}MB"
if [ "$TOTAL_MEM_MB" -lt 1800 ]; then
  echo "WARNING: Less than 1.8GB RAM. SyncFlow needs ~1.1GB for app layer."
  read -rp "Continue anyway? [y/N] " yn
  if [ "$yn" != "y" ] && [ "$yn" != "Y" ]; then
    exit 1
  fi
fi

# ---- 0. Create app user first (so we can set ownership immediately) ----
echo "[0/7] Creating app user..."
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -d "$APP_DIR" -s /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR"/{logs,data/minio}

# Copy package files to APP_DIR and set ownership
echo "  copying package files to $APP_DIR..."
for f in syncflow.jar minio env.example syncflow.service nginx-syncflow.conf syncflow-logrotate; do
  if [ -f "$SCRIPT_DIR/$f" ]; then
    cp "$SCRIPT_DIR/$f" "$APP_DIR/"
    echo "    -> $f"
  else
    echo "    WARNING: $f not found in $SCRIPT_DIR"
  fi
done

# Create env from template
if [ ! -f "$APP_DIR/env" ] && [ -f "$APP_DIR/env.example" ]; then
  cp "$APP_DIR/env.example" "$APP_DIR/env"
  echo "    -> env (from env.example)"
fi

# Everything in APP_DIR belongs to syncflow user
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
echo "  -> ownership set to $APP_USER"

# ---- 1. Install system packages ----
echo "[1/7] Installing apt packages..."
apt-get update -qq
apt-get install -y -qq \
  openjdk-21-jre-headless \
  postgresql \
  curl \
  ufw \
  nginx \
  logrotate \
  file

# ---- 2. MinIO ----
echo "[2/7] Installing MinIO..."
if [ -f /usr/local/bin/minio ] && file /usr/local/bin/minio 2>/dev/null | grep -q 'ELF'; then
  echo "  -> already installed"
elif [ -f "$APP_DIR/minio" ] && file "$APP_DIR/minio" | grep -q 'ELF'; then
  echo "  installing bundled minio..."
  cp "$APP_DIR/minio" /usr/local/bin/minio
  chmod 755 /usr/local/bin/minio
else
  echo "ERROR: minio binary not found."
  echo "  The deployment package should contain 'minio' alongside this script."
  exit 1
fi
echo "  -> $(minio --version 2>&1 | head -1)"

# ---- 3. PostgreSQL ----
echo "[3/7] Configuring PostgreSQL..."

PG_VERSION=$(ls /etc/postgresql/ 2>/dev/null | sort -n | tail -1)
if [ -z "$PG_VERSION" ]; then
  echo "ERROR: Cannot detect PostgreSQL version. Is postgresql installed?"
  exit 1
fi
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
echo "  -> PostgreSQL $PG_VERSION"

if ! grep -q 'SyncFlow' "$PG_CONF" 2>/dev/null; then
  cat >> "$PG_CONF" <<'PGCONF'

# SyncFlow — low memory tuning (2GB total server)
shared_buffers = 64MB
work_mem = 2MB
maintenance_work_mem = 32MB
effective_cache_size = 256MB
max_connections = 10
wal_buffers = 2MB
random_page_cost = 1.1
effective_io_concurrency = 200
PGCONF
  echo "  -> memory tuned"
else
  echo "  -> already tuned"
fi

if ! grep -q 'syncflow' "$PG_HBA" 2>/dev/null; then
  sed -i "/^local\s\+all\s\+all\s\+peer/i # SyncFlow — password auth over TCP\nhost    syncflow        syncflow        127.0.0.1/32            md5\nhost    syncflow        syncflow        ::1/128                 md5" "$PG_HBA"
  echo "  -> pg_hba.conf updated"
fi

systemctl restart postgresql
sleep 2

su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='syncflow'\"" 2>/dev/null | grep -q 1 || {
  su - postgres -c "psql -c \"CREATE USER syncflow WITH PASSWORD 'syncflow123'\""
  echo "  -> user 'syncflow' created"
}
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='syncflow'\"" 2>/dev/null | grep -q 1 || {
  su - postgres -c "psql -c \"CREATE DATABASE syncflow OWNER syncflow\""
  echo "  -> database 'syncflow' created"
}
echo "  -> PostgreSQL ready"

# ---- 4. MinIO systemd service ----
echo "[4/7] Configuring MinIO service..."
cat > /etc/systemd/system/minio.service <<'SVCONF'
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
Type=simple
User=syncflow
Group=syncflow
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin"
ExecStart=/usr/local/bin/minio server /opt/syncflow/data/minio --console-address ":9001"
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SVCONF

chown -R "$APP_USER":"$APP_USER" "$APP_DIR/data/minio"
systemctl daemon-reload
systemctl enable minio
systemctl restart minio
echo "  -> MinIO :9000 (console :9001)"

# ---- 5. SyncFlow systemd service ----
echo "[5/7] Configuring SyncFlow service..."
if [ -f "$APP_DIR/syncflow.service" ]; then
  cp "$APP_DIR/syncflow.service" /etc/systemd/system/syncflow.service
fi
systemctl daemon-reload

# Stop any failed+crashed service from previous attempts
systemctl reset-failed syncflow.service 2>/dev/null || true
systemctl enable syncflow
echo "  -> syncflow.service installed"

# ---- 6. nginx ----
echo "[6/7] Configuring nginx..."
if [ -f "$APP_DIR/nginx-syncflow.conf" ]; then
  cp "$APP_DIR/nginx-syncflow.conf" /etc/nginx/sites-available/syncflow
fi
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/syncflow /etc/nginx/sites-enabled/syncflow

if nginx -t 2>&1; then
  systemctl enable nginx
  systemctl restart nginx
  echo "  -> nginx :80 -> :8088"
else
  echo "WARNING: nginx -t failed"
fi

# ---- Logrotate ----
if [ -f "$APP_DIR/syncflow-logrotate" ]; then
  cp "$APP_DIR/syncflow-logrotate" /etc/logrotate.d/syncflow
fi

# ---- 7. Firewall ----
echo "[7/7] Configuring firewall..."
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true

echo ""
echo "============================================"
echo "  Setup Complete"
echo "============================================"
echo ""
echo "  App dir: $APP_DIR"
echo "  Access:  http://<server-ip>"
echo ""
echo "  Start:"
echo "    vim $APP_DIR/env           # set JWT_SECRET"
echo "    systemctl start syncflow"
echo "    journalctl -u syncflow -f"
