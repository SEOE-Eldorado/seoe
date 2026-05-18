param(
    [Parameter(Mandatory=$true)]
    [string]$KeystorePath,
    [Parameter(Mandatory=$true)]
    [string]$KeystorePassword,
    [string]$KeystoreAlias = "seoe-inspector",
    [string]$KeystoreAliasPassword = $KeystorePassword
)

Write-Host "=== SEOE Inspector - Release APK Build ===" -ForegroundColor Green

if (-not (Test-Path $KeystorePath)) {
    Write-Host "Error: Keystore not found at: $KeystorePath" -ForegroundColor Red
    Write-Host "Create one with: keytool -genkey -v -keystore seoe-release.keystore -alias seoe-inspector -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Building Next.js for mobile..." -ForegroundColor Cyan
npm run build:mobile
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[2/3] Syncing with Capacitor..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[3/3] Building release APK..." -ForegroundColor Cyan
npx cap build android `
    --androidreleasetype APK `
    --keystorepath "$KeystorePath" `
    --keystorepass "$KeystorePassword" `
    --keystorealias "$KeystoreAlias" `
    --keystorealiaspass "$KeystoreAliasPassword"

if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Release APK generated!" -ForegroundColor Green
Write-Host "Output: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Yellow
