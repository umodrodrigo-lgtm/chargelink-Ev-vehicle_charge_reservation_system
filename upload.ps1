# upload.ps1 — upload pre-built JAR + frontend dist to EC2 and restart the service.
#
# Run AFTER server-setup.sh has been run on the server.
# Build your JAR and frontend first, then run this script.
#
# Usage: .\upload.ps1

$EC2_HOST = "ec2-user@107.20.189.168"
$SSH_KEY  = "C:\Users\USER\Downloads\new-key.pem"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$JAR_PATH   = "$SCRIPT_DIR\backend\target\chargelink-backend-1.0.0.jar"
$DIST_PATH  = "$SCRIPT_DIR\frontend\dist"

$SCP_ARGS = @("-o", "StrictHostKeyChecking=no", "-i", $SSH_KEY)
$SSH_ARGS = @("-o", "StrictHostKeyChecking=no", "-i", $SSH_KEY)

# ── Validate files exist ───────────────────────────────────────────────────────
if (-not (Test-Path $JAR_PATH)) {
    Write-Host "ERROR: JAR not found at $JAR_PATH" -ForegroundColor Red
    Write-Host "  Build it first: mvn clean package -DskipTests"
    exit 1
}
if (-not (Test-Path $DIST_PATH)) {
    Write-Host "ERROR: Frontend dist not found at $DIST_PATH" -ForegroundColor Red
    Write-Host "  Build it first: npm run build  (inside frontend/)"
    exit 1
}

# ── 1. Upload JAR ─────────────────────────────────────────────────────────────
Write-Host "Uploading JAR..."
& scp @SCP_ARGS $JAR_PATH "${EC2_HOST}:/tmp/chargelink-backend.jar"
& ssh @SSH_ARGS $EC2_HOST "sudo mv /tmp/chargelink-backend.jar /opt/chargelink/chargelink-backend.jar && sudo chown chargelink:chargelink /opt/chargelink/chargelink-backend.jar && sudo chmod 640 /opt/chargelink/chargelink-backend.jar"

# ── 2. Upload frontend dist ───────────────────────────────────────────────────
Write-Host "Packaging and uploading frontend..."
$TMP_TAR = "$env:TEMP\chargelink-dist.tar.gz"
tar -czf $TMP_TAR -C "$SCRIPT_DIR\frontend" dist
& scp @SCP_ARGS $TMP_TAR "${EC2_HOST}:/tmp/chargelink-dist.tar.gz"
Remove-Item $TMP_TAR

& ssh @SSH_ARGS $EC2_HOST @"
sudo rm -rf /var/www/chargelink && sudo mkdir -p /var/www/chargelink && sudo tar -xzf /tmp/chargelink-dist.tar.gz -C /var/www/chargelink --strip-components=1 && sudo chown -R nginx:nginx /var/www/chargelink && rm /tmp/chargelink-dist.tar.gz
"@

# ── 3. Restart backend ────────────────────────────────────────────────────────
Write-Host "Restarting backend..."
& ssh @SSH_ARGS $EC2_HOST "sudo systemctl restart chargelink-backend"

# ── 4. Health check ───────────────────────────────────────────────────────────
Write-Host "Waiting for backend to start..."
for ($i = 1; $i -le 12; $i++) {
    $health = & ssh @SSH_ARGS $EC2_HOST "curl -sf http://localhost:8080/api/actuator/health 2>/dev/null || true"
    if ($health -match '"status"\s*:\s*"UP"') {
        $publicIp = & ssh @SSH_ARGS $EC2_HOST "curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<EC2-IP>'"
        Write-Host ""
        Write-Host "========================================"
        Write-Host "  Deploy complete!  http://$publicIp"
        Write-Host "========================================"
        exit 0
    }
    Write-Host "  Waiting... ($($i * 5)s)"
    Start-Sleep 5
}

Write-Host "Backend did not start. Check logs:" -ForegroundColor Red
Write-Host "  ssh -i $SSH_KEY $EC2_HOST 'sudo journalctl -u chargelink-backend -n 50 --no-pager'"
exit 1
