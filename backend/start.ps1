# ChargeLink Backend — start script
# Forces Java 21 for the build regardless of the system JAVA_HOME setting

$java21 = "C:\Program Files\Java\jdk-21.0.11"

if (-not (Test-Path "$java21\bin\java.exe")) {
    Write-Host "Java 21 not found at $java21. Falling back to JAVA_HOME=$env:JAVA_HOME" -ForegroundColor Yellow
} else {
    $env:JAVA_HOME = $java21
    Write-Host "Using Java 21: $java21" -ForegroundColor Green
}

Write-Host "Starting ChargeLink backend..." -ForegroundColor Cyan
.\mvnw.cmd spring-boot:run
