# deploy.ps1 — upload source to EC2 and build/deploy on the server.
# No Java, Node, or Git Bash needed on Windows.
#
# Usage:  .\deploy.ps1

$EC2_HOST = "ec2-user@107.20.189.168"
$SSH_KEY  = "C:\Users\USER\Downloads\new-key.pem"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

$SCP_ARGS = @("-o", "StrictHostKeyChecking=no", "-i", $SSH_KEY)
$SSH_ARGS = @("-o", "StrictHostKeyChecking=no", "-i", $SSH_KEY)

# ── 1. Package source (exclude build outputs) ─────────────────────────────────
Write-Host "Packaging source..."
$TMP_TAR = "$env:TEMP\chargelink-src.tar.gz"

Push-Location $SCRIPT_DIR
tar -czf $TMP_TAR `
    --exclude="./frontend/node_modules" `
    --exclude="./backend/target" `
    --exclude="./.git" `
    --exclude="./.env" `
    --exclude="./logs" `
    .
Pop-Location

# ── 2. Upload tarball + server-build script ────────────────────────────────────
Write-Host "Uploading to $EC2_HOST..."
& scp @SCP_ARGS $TMP_TAR "${EC2_HOST}:/tmp/chargelink-src.tar.gz"
& scp @SCP_ARGS "$SCRIPT_DIR\server-build.sh" "${EC2_HOST}:/tmp/server-build.sh"
Remove-Item $TMP_TAR

# ── 3. Extract and build on server (single-line command — reliable on Windows) ─
Write-Host "Building and deploying on server..."
$CMD = "sudo mkdir -p /opt/chargelink-src && " +
       "sudo tar -xzf /tmp/chargelink-src.tar.gz -C /opt/chargelink-src --overwrite --no-same-owner && " +
       "sudo chown -R ec2-user:ec2-user /opt/chargelink-src && " +
       "rm /tmp/chargelink-src.tar.gz && " +
       "bash /tmp/server-build.sh"

& ssh @SSH_ARGS $EC2_HOST $CMD
