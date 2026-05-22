#!/bin/bash
# deploy.sh — build locally, upload only JAR + frontend dist + deploy script to EC2.
#
# Usage:
#   EC2_HOST=ec2-user@1.2.3.4 SSH_KEY=~/.ssh/key.pem ./deploy.sh
set -euo pipefail

EC2_HOST="${EC2_HOST:-ec2-user@107.20.189.168}"
SSH_KEY="${SSH_KEY:-~/.ssh/new-key.pem}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$EC2_HOST" ]; then
    echo "ERROR: EC2_HOST is not set." >&2
    echo "  EC2_HOST=ec2-user@1.2.3.4 SSH_KEY=~/.ssh/key.pem ./deploy.sh" >&2
    exit 1
fi

# ─── 2. Upload JAR + dist + server script ────────────────────────────────────
echo "Uploading JAR..."
scp "${SSH_ARGS[@]}" \
    "$SCRIPT_DIR/backend/target/chargelink-backend-1.0.0.jar" \
    "$EC2_HOST:/tmp/chargelink-backend.jar"

echo "Uploading frontend dist..."
TMPTAR="$(mktemp).tar.gz"
tar -czf "$TMPTAR" -C "$SCRIPT_DIR/frontend" dist
scp "${SSH_ARGS[@]}" "$TMPTAR" "$EC2_HOST:/tmp/chargelink-dist.tar.gz"
rm "$TMPTAR"

echo "Uploading deploy script..."
scp "${SSH_ARGS[@]}" "$SCRIPT_DIR/server-build.sh" "$EC2_HOST:/tmp/server-build.sh"

# ─── 3. Run deploy script on server ──────────────────────────────────────────
echo "Deploying on server..."
ssh "${SSH_ARGS[@]}" "$EC2_HOST" 'bash /tmp/server-build.sh'
