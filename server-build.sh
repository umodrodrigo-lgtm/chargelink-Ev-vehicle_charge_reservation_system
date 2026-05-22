#!/bin/bash
# server-build.sh — runs on EC2: builds backend + frontend, deploys, restarts, then cleans up source.
set -euo pipefail

SRC="/opt/chargelink-src"
APP_DIR="/opt/chargelink"
WEB_DIR="/var/www/chargelink"

log() { echo ""; echo ">>> $*"; }

# Restrict source dir — only ec2-user can read it
chmod 700 "$SRC"

export JAVA_HOME
JAVA_HOME=$(ls -d /usr/lib/jvm/java-21-amazon-corretto* 2>/dev/null | head -1)
[ -z "$JAVA_HOME" ] && JAVA_HOME=$(dirname "$(dirname "$(readlink -f "$(which java)")")")

# ─── Build backend ────────────────────────────────────────────────────────────
log "Building backend..."
cd "$SRC/backend"
mvn clean package -DskipTests -q

# ─── Build frontend ───────────────────────────────────────────────────────────
log "Building frontend..."
cd "$SRC/frontend"
npm install --prefer-offline --no-audit --no-fund 2>&1 | grep -v "^npm warn"
npm run build

# ─── Deploy ───────────────────────────────────────────────────────────────────
log "Deploying..."
sudo cp "$SRC/backend/target/chargelink-backend-1.0.0.jar" "$APP_DIR/chargelink-backend.jar"
sudo chown chargelink:chargelink "$APP_DIR/chargelink-backend.jar"

sudo rm -rf "$WEB_DIR"
sudo mkdir -p "$WEB_DIR"
sudo cp -r "$SRC/frontend/dist/." "$WEB_DIR/"
sudo chown -R nginx:nginx "$WEB_DIR"

sudo systemctl restart chargelink-backend

# ─── Health check ─────────────────────────────────────────────────────────────
log "Waiting for backend..."
for i in $(seq 1 12); do
    if curl -sf http://localhost:8080/api/actuator/health 2>/dev/null | grep -q '"UP"'; then
        PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<EC2-IP>")

        # ─── Clean up source after successful deploy ───────────────────────────
        log "Cleaning up build artifacts..."
        rm -rf "$SRC"
        # Maven local repo can grow large — clean downloaded artifacts
        rm -rf ~/.m2/repository/com/chargelink
        # npm cache
        npm cache clean --force 2>/dev/null || true

        echo ""
        echo "========================================"
        echo "  Deploy complete!  http://$PUBLIC_IP"
        echo "========================================"
        exit 0
    fi
    echo "  Waiting... ($((i * 5))s)"
    sleep 5
done

# Health check failed — clean up source anyway, log for diagnostics
rm -rf "$SRC" 2>/dev/null || true
echo "Backend did not start. Check logs:"
echo "  sudo journalctl -u chargelink-backend -n 50 --no-pager"
exit 1
