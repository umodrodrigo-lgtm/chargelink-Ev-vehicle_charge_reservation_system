#!/bin/bash
cat <<'EOF'
╔══════════════════════════════════════════════════════════════╗
║          ChargeLink — Rocky Linux 9 Admin Shell              ║
╠══════════════════════════════════════════════════════════════╣
║  QUICK COMMANDS                                              ║
║                                                              ║
║  check-api      → Spring Boot health status                  ║
║  check-swagger  → List all API endpoints                     ║
║  check-db       → Open psql shell on chargelink DB           ║
║  check-redis    → Redis ping + server info                   ║
║                                                              ║
║  LOGS  (/var/log/chargelink/)                                ║
║  log-app        → tail app.log        (general)              ║
║  log-auth       → tail auth.log       (login/logout)         ║
║  log-reserve    → tail reservations.log                      ║
║  log-charger    → tail chargers.log                          ║
║  log-security   → tail security.log   (JWT/auth failures)    ║
║  log-admin      → tail admin.log      (station mgmt)         ║
║  log-nginx      → tail nginx-access.log                      ║
║  log-all        → tail all logs at once                      ║
║                                                              ║
║  SERVICES (Docker internal DNS)                              ║
║    app:80   postgres:5432   redis:6379                       ║
╚══════════════════════════════════════════════════════════════╝
EOF

LOG=/var/log/chargelink

# ── Service checks ─────────────────────────────────────────────────────────────
alias ll='ls -lahF --color=auto'
alias check-api='curl -s http://app/api/actuator/health | jq .'
alias check-swagger='curl -s http://app/api/v3/api-docs | jq "[.paths | keys[]]"'
alias check-db='PGPASSWORD="${DB_PASSWORD:-chargelink_dev}" psql -h postgres -U "${DB_USERNAME:-chargelink}" -d chargelink'
alias check-redis='redis-cli -h redis ${REDIS_PASSWORD:+-a "$REDIS_PASSWORD"} ping'

# ── Log tailing ────────────────────────────────────────────────────────────────
alias log-app='tail -f ${LOG}/app.log'
alias log-auth='tail -f ${LOG}/auth.log'
alias log-reserve='tail -f ${LOG}/reservations.log'
alias log-charger='tail -f ${LOG}/chargers.log'
alias log-security='tail -f ${LOG}/security.log'
alias log-admin='tail -f ${LOG}/admin.log'
alias log-nginx='tail -f ${LOG}/nginx-access.log'
alias log-all='tail -f ${LOG}/app.log ${LOG}/auth.log ${LOG}/reservations.log ${LOG}/chargers.log ${LOG}/security.log ${LOG}/admin.log ${LOG}/nginx-access.log'
alias log-list='ls -lh ${LOG}/'

export PS1='\[\e[1;32m\][chargelink-admin@rocky9]\[\e[0m\] \[\e[1;34m\]\w\[\e[0m\] \$ '
