#!/bin/bash
# server-setup.sh — run ONCE on a fresh Amazon Linux 2023 EC2 instance.
# Auto-generates secure passwords. No Maven or Node needed on the server.
#
# How to run (from your local machine):
#   scp -i new-key.pem server-setup.sh ec2-user@<IP>:~/
#   ssh -i new-key.pem ec2-user@<IP> 'bash server-setup.sh'
set -euo pipefail

APP_DIR="/opt/chargelink"
WEB_DIR="/var/www/chargelink"
SVC_USER="chargelink"

log() { echo ""; echo ">>> $*"; }

# ─── 1. Packages (JRE only — no Maven/Node) ──────────────────────────────────
log "Installing packages..."
sudo dnf update -y -q
sudo dnf install -y -q \
    java-21-amazon-corretto-headless \
    postgresql15 \
    postgresql15-server \
    redis6 \
    nginx

# ─── 2. PostgreSQL ────────────────────────────────────────────────────────────
log "Setting up PostgreSQL..."
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    sudo postgresql-setup --initdb
    sudo systemctl enable postgresql
    sudo systemctl start postgresql

    PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
    sudo sed -i 's/^\(host.*127\.0\.0\.1.*\)ident/\1scram-sha-256/' "$PG_HBA"
    sudo sed -i 's/^\(host.*::1.*\)ident/\1scram-sha-256/'           "$PG_HBA"
    sudo systemctl restart postgresql
fi

# ─── 3. App directories + .env ───────────────────────────────────────────────
log "Creating directories and .env..."
sudo mkdir -p "$APP_DIR" "$WEB_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
    REDIS_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sudo tee "$APP_DIR/.env" > /dev/null <<EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/chargelink
DB_USERNAME=chargelink
DB_PASSWORD=${DB_PASS}
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASS}
JWT_SECRET=${JWT_SECRET}
CORS_ORIGINS=https://chargelink.limalshaumod.online
EOF
    sudo chmod 600 "$APP_DIR/.env"

    echo ""
    echo "  ╔══════════════════════════════════════════════╗"
    echo "  ║  Auto-generated passwords — SAVE THESE NOW  ║"
    echo "  ╠══════════════════════════════════════════════╣"
    echo "  ║  DB_PASSWORD   : $DB_PASS"
    echo "  ║  REDIS_PASSWORD: $REDIS_PASS"
    echo "  ╚══════════════════════════════════════════════╝"
    echo ""
else
    echo "  .env already exists — skipping."
    set -a; source <(sudo cat "$APP_DIR/.env"); set +a
    DB_PASS="${DB_PASSWORD}"
    REDIS_PASS="${REDIS_PASSWORD}"
fi

set -a; source <(sudo cat "$APP_DIR/.env"); set +a
DB_PASS="${DB_PASSWORD}"
REDIS_PASS="${REDIS_PASSWORD}"

# ─── 4. PostgreSQL user + database ───────────────────────────────────────────
log "Creating database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='chargelink'" \
    | grep -q 1 \
    || sudo -u postgres psql -c "CREATE USER chargelink WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='chargelink'" \
    | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE chargelink OWNER chargelink;"

# ─── 5. Redis ────────────────────────────────────────────────────────────────
log "Configuring Redis..."
REDIS_CONF="/etc/redis6.conf"
if grep -q "^requirepass" "$REDIS_CONF"; then
    sudo sed -i "s|^requirepass .*|requirepass ${REDIS_PASS}|" "$REDIS_CONF"
else
    echo "requirepass ${REDIS_PASS}" | sudo tee -a "$REDIS_CONF" > /dev/null
fi
sudo sed -i 's/^bind .*/bind 127.0.0.1/' "$REDIS_CONF"
sudo systemctl enable redis6
sudo systemctl restart redis6

# ─── 6. App user + permissions ───────────────────────────────────────────────
log "Creating app user..."
id "$SVC_USER" &>/dev/null \
    || sudo useradd --system --no-create-home --shell /sbin/nologin "$SVC_USER"

sudo chown -R "$SVC_USER:$SVC_USER" "$APP_DIR"
sudo chmod 750 "$APP_DIR"
sudo chown -R nginx:nginx "$WEB_DIR"

# ─── 7. Systemd service ──────────────────────────────────────────────────────
log "Writing systemd service..."
sudo tee /etc/systemd/system/chargelink-backend.service > /dev/null <<'UNIT'
[Unit]
Description=ChargeLink Backend
After=network.target postgresql.service redis6.service
Requires=postgresql.service

[Service]
Type=simple
User=chargelink
WorkingDirectory=/opt/chargelink
EnvironmentFile=/opt/chargelink/.env
ExecStart=/usr/bin/java \
    -XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=70.0 \
    -Djava.security.egd=file:/dev/./urandom \
    -jar /opt/chargelink/chargelink-backend.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=chargelink-backend

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable chargelink-backend

# ─── 8. Nginx ────────────────────────────────────────────────────────────────
log "Configuring Nginx..."
sudo tee /etc/nginx/conf.d/chargelink.conf > /dev/null <<'NGINX'
server {
    listen 80;
    server_name chargelink.limalshaumod.online;

    root /var/www/chargelink;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /ws/ {
        proxy_pass         http://127.0.0.1:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_read_timeout 86400s;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx

# ─── 9. Staging directory + deploy script ────────────────────────────────────
log "Creating staging directory and installing deploy script..."
STAGING_DIR="/home/ec2-user/chargelink"
mkdir -p "$STAGING_DIR"
chmod 700 "$STAGING_DIR"

cat > "$STAGING_DIR/deploy.sh" << 'DEPLOY_EOF'
#!/bin/bash
# deploy.sh — run on EC2 after uploading artifacts to ~/chargelink/
# Required files: chargelink-backend.jar  and  dist.tar.gz
set -euo pipefail

STAGING="$HOME/chargelink"
APP_DIR="/opt/chargelink"
WEB_DIR="/var/www/chargelink"
SERVICE="chargelink-backend"
JAR="chargelink-backend.jar"
DIST="dist.tar.gz"

log()  { printf '\n>>> %s\n' "$*"; }
fail() { printf '\n[ERROR] %s\n' "$*" >&2; exit 1; }

log "Validating uploaded artifacts..."
[[ -f "$STAGING/$JAR"  ]] || fail "$JAR not found in $STAGING/ — upload it first"
[[ -f "$STAGING/$DIST" ]] || fail "$DIST not found in $STAGING/ — upload it first"
[[ -s "$STAGING/$JAR"  ]] || fail "$JAR is empty (upload may have failed)"
[[ -s "$STAGING/$DIST" ]] || fail "$DIST is empty (upload may have failed)"
tar -tzf "$STAGING/$DIST" &>/dev/null || fail "$DIST is corrupt or not a valid tar.gz"

if [[ -f "$APP_DIR/$JAR" ]]; then
    sudo cp "$APP_DIR/$JAR" "$APP_DIR/${JAR}.bak"
    log "Previous JAR backed up -> ${JAR}.bak"
fi

log "Deploying backend JAR..."
sudo cp    "$STAGING/$JAR" "$APP_DIR/$JAR"
sudo chown chargelink:chargelink "$APP_DIR/$JAR"
sudo chmod 640               "$APP_DIR/$JAR"

log "Deploying frontend..."
sudo rm    -rf "$WEB_DIR"
sudo mkdir -p  "$WEB_DIR"
sudo tar   -xzf "$STAGING/$DIST" -C "$WEB_DIR" --strip-components=1
sudo chown -R   nginx:nginx "$WEB_DIR"
sudo chmod -R   755         "$WEB_DIR"

log "Restarting $SERVICE..."
sudo systemctl restart "$SERVICE"

log "Waiting for backend to start..."
for i in $(seq 1 12); do
    if curl -sf http://localhost:8080/api/actuator/health 2>/dev/null | grep -q '"UP"'; then
        PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<server-ip>")
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

log "Health check failed — attempting rollback..."
if [[ -f "$APP_DIR/${JAR}.bak" ]]; then
    sudo cp "$APP_DIR/${JAR}.bak" "$APP_DIR/$JAR"
    sudo systemctl restart "$SERVICE"
    log "Rolled back to previous JAR."
fi
fail "Backend did not start.\n  Logs: sudo journalctl -u $SERVICE -n 50 --no-pager"
DEPLOY_EOF

chmod 750 "$STAGING_DIR/deploy.sh"
log "Staging directory ready: $STAGING_DIR"

# ─── Done ────────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<YOUR-IP>")
echo ""
echo "========================================================"
echo "  Server setup complete!"
echo ""
echo "  DNS: point $PUBLIC_IP to chargelink.limalshaumod.online"
echo ""
echo "  ── Deployment workflow ─────────────────────────────"
echo ""
echo "  1. Build locally:"
echo "     cd backend && ./mvnw clean package -DskipTests && cd .."
echo "     cd frontend && npm run build && cd .."
echo "     tar -czf dist.tar.gz -C frontend dist"
echo ""
echo "  2. Upload artifacts to staging:"
echo "     scp -i /path/to/key.pem backend/target/chargelink-backend-1.0.0.jar \\"
echo "         ec2-user@$PUBLIC_IP:~/chargelink/chargelink-backend.jar"
echo "     scp -i /path/to/key.pem dist.tar.gz \\"
echo "         ec2-user@$PUBLIC_IP:~/chargelink/dist.tar.gz"
echo ""
echo "  3. Deploy:"
echo "     ssh -i /path/to/key.pem ec2-user@$PUBLIC_IP 'bash ~/chargelink/deploy.sh'"
echo ""
echo "  App: https://chargelink.limalshaumod.online"
echo "========================================================"
