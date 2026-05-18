Write-Host "=== SEOE Inspector - Debug APK Build ===" -ForegroundColor Green

Write-Host "[1/3] Building Next.js for mobile..." -ForegroundColor Cyan
npm run build:mobile
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[2/3] Syncing with Capacitor..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[3/3] Building debug APK..." -ForegroundColor Cyan
npx cap build android --androidreleasetype APK
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "APK generated successfully!" -ForegroundColor Green
Write-Host "Output: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Yellow
