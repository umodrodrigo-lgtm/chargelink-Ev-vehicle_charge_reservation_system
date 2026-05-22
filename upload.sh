#!/bin/bash
# upload.sh — SCP build artifacts to EC2 staging directory.
#
# Run this from the project root AFTER building:
#   Step 1 — build backend:
#     cd backend && ./mvnw clean package -DskipTests && cd ..
#
#   Step 2 — build frontend:
#     cd frontend && npm run build && cd ..
#
#   Step 3 — package frontend:
#     tar -czf dist.tar.gz -C frontend dist
#
#   Step 4 — upload:
#     bash upload.sh
#
#   Step 5 — deploy (triggers server-side deploy.sh):
#     ssh -i "$KEY" ec2-user@<IP> "bash ~/chargelink/deploy.sh"
#
# Override defaults:
#   KEY=/path/to/key.pem HOST=ec2-user@1.2.3.4 bash upload.sh
set -euo pipefail

KEY="${KEY:-$HOME/.ssh/chargelink.pem}"
HOST="${HOST:-ec2-user@107.20.189.168}"
STAGING="~/chargelink"

JAR="backend/target/chargelink-backend-1.0.0.jar"
DIST="dist.tar.gz"

SCP_OPTS="-i $KEY -o StrictHostKeyChecking=no -o BatchMode=yes"

# ── Validate ──────────────────────────────────────────────────────────────────
[[ -f "$KEY" ]]  || { echo "ERROR: SSH key not found: $KEY  (set KEY=/path/to/key.pem)"; exit 1; }
[[ -f "$JAR" ]]  || { echo "ERROR: JAR not found. Build with: cd backend && ./mvnw clean package -DskipTests"; exit 1; }
[[ -f "$DIST" ]] || { echo "ERROR: dist.tar.gz not found. Build with: cd frontend && npm run build && cd .. && tar -czf dist.tar.gz -C frontend dist"; exit 1; }

# ── Upload ────────────────────────────────────────────────────────────────────
echo "Uploading JAR     -> $HOST:$STAGING/chargelink-backend.jar"
scp $SCP_OPTS "$JAR"  "$HOST:$STAGING/chargelink-backend.jar"

echo "Uploading frontend -> $HOST:$STAGING/dist.tar.gz"
scp $SCP_OPTS "$DIST" "$HOST:$STAGING/dist.tar.gz"

rm -f "$DIST"

echo ""
echo "Upload complete. Run deploy:"
echo "  ssh -i $KEY $HOST 'bash ~/chargelink/deploy.sh'"
