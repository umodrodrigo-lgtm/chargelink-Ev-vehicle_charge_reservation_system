# upload.ps1 — DEPRECATED
# Use upload.sh instead (works in Git Bash, WSL, or any POSIX shell).
#
# Quick reference — run from project root in PowerShell:
#
#   $KEY  = "C:\Users\USER\Downloads\chargelink.pem"
#   $HOST = "ec2-user@107.20.189.168"
#
#   # 1. Upload JAR
#   scp -i $KEY backend\target\chargelink-backend-1.0.0.jar `
#       "${HOST}:~/chargelink/chargelink-backend.jar"
#
#   # 2. Package and upload frontend
#   tar -czf dist.tar.gz -C frontend dist
#   scp -i $KEY dist.tar.gz "${HOST}:~/chargelink/dist.tar.gz"
#   Remove-Item dist.tar.gz
#
#   # 3. Deploy (triggers server-side deploy.sh)
#   ssh -i $KEY $HOST "bash ~/chargelink/deploy.sh"
