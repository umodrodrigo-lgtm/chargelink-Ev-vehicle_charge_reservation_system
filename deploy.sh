#!/bin/bash
# deploy.sh — runs ON the EC2 server after artifacts are uploaded to ~/chargelink/
#
# Required files in ~/chargelink/ before running:
#   chargelink-backend.jar   <- Spring Boot JAR
#   dist.tar.gz              <- frontend: tar -czf dist.tar.gz -C frontend dist
#
# Run from local machine:
#   ssh -i /path/to/key.pem ec2-user@<IP> "bash ~/chargelink/deploy.sh"
#
# Or on the server directly:
#   bash ~/chargelink/deploy.sh
set -euo pipefail

STAGING="$HOME/chargelink"
APP_DIR="/opt/chargelink"
WEB_DIR="/var/www/chargelink"
SERVICE="chargelink-backend"
JAR="chargelink-backend.jar"
DIST="dist.tar.gz"

log()  { printf '\n>>> %s\n' "$*"; }
fail() { printf '\n[ERROR] %s\n' "$*" >&2; exit 1; }

# ── 1. Validate uploads ───────────────────────────────────────────────────────
log "Validating uploaded artifacts..."
[[ -f "$STAGING/$JAR"  ]] || fail "$JAR not found in $STAGING/  — upload it first"
[[ -f "$STAGING/$DIST" ]] || fail "$DIST not found in $STAGING/ — upload it first"
[[ -s "$STAGING/$JAR"  ]] || fail "$JAR is empty (upload failed?)"
[[ -s "$STAGING/$DIST" ]] || fail "$DIST is empty (upload failed?)"
tar -tzf "$STAGING/$DIST" &>/dev/null || fail "$DIST is corrupt or not a valid tar.gz"

# ── 2. Backup current JAR for rollback ───────────────────────────────────────
if [[ -f "$APP_DIR/$JAR" ]]; then
    sudo cp "$APP_DIR/$JAR" "$APP_DIR/${JAR}.bak"
    log "Backup saved: $APP_DIR/${JAR}.bak"
fi

# ── 3. Deploy backend JAR ─────────────────────────────────────────────────────
log "Deploying backend JAR..."
sudo cp    "$STAGING/$JAR" "$APP_DIR/$JAR"
sudo chown chargelink:chargelink "$APP_DIR/$JAR"
sudo chmod 640               "$APP_DIR/$JAR"

# ── 4. Deploy frontend ────────────────────────────────────────────────────────
log "Deploying frontend..."
sudo rm    -rf "$WEB_DIR"
sudo mkdir -p  "$WEB_DIR"
sudo tar   -xzf "$STAGING/$DIST" -C "$WEB_DIR" --strip-components=1
sudo chown -R   nginx:nginx "$WEB_DIR"
sudo chmod -R   755         "$WEB_DIR"

# ── 5. Restart backend ────────────────────────────────────────────────────────
log "Restarting $SERVICE..."
sudo systemctl restart "$SERVICE"

# ── 6. Health check ───────────────────────────────────────────────────────────
log "Waiting for backend to start..."
for i in $(seq 1 12); do
    if curl -sf http://localhost:8080/api/actuator/health 2>/dev/null | grep -q '"UP"'; then
        PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<server-ip>")
        # Clean staging — artifacts no longer needed
        rm -f "$STAGING/$JAR" "$STAGING/$DIST"
        printf '\n========================================\n'
        printf '  Deploy complete!\n'
        printf '  https://%s\n' "$PUBLIC_IP"
        printf '========================================\n\n'
        exit 0
    fi
    printf '  Waiting... (%ds)\n' "$((i * 5))"
    sleep 5
done

# ── 7. Health check failed — rollback ─────────────────────────────────────────
log "Health check failed. Attempting rollback..."
if [[ -f "$APP_DIR/${JAR}.bak" ]]; then
    sudo cp "$APP_DIR/${JAR}.bak" "$APP_DIR/$JAR"
    sudo systemctl restart "$SERVICE"
    log "Rolled back to previous JAR. Check what went wrong:"
else
    log "No backup found — manual recovery required."
fi
fail "Backend did not start.\n  Logs: sudo journalctl -u $SERVICE -n 50 --no-pager"
