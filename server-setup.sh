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

# ─── Done ────────────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "<YOUR-IP>")
echo ""
echo "========================================================"
echo "  Server setup complete!"
echo ""
echo "  Make sure your domain DNS A record points to: $PUBLIC_IP"
echo ""
echo "  Upload your built files from Windows:"
echo ""
echo "  1. JAR:"
echo "     scp -i new-key.pem chargelink-backend-1.0.0.jar \\"
echo "         ec2-user@$PUBLIC_IP:/tmp/chargelink-backend.jar"
echo ""
echo "  2. Frontend dist:"
echo "     tar -czf dist.tar.gz -C frontend dist"
echo "     scp -i new-key.pem dist.tar.gz \\"
echo "         ec2-user@$PUBLIC_IP:/tmp/chargelink-dist.tar.gz"
echo ""
echo "  App will be at: http://chargelink.limalshaumod.online"
echo "========================================================"
