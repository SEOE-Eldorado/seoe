@echo off
set NEXT_PUBLIC_APP_ENV=inspector
set NEXT_OUTPUT=export
set NODE_OPTIONS=--openssl-legacy-provider
set PATH=%ProgramFiles%\nodejs;%PATH%
cd /d C:\Users\ECO-1\Desktop\seoe-fundamental
echo Node version:
node --version
echo Building Next.js...
call node node_modules\next\dist\bin\next build
if %ERRORLEVEL% neq 0 (
    echo Next.js build failed with error %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
echo Build complete!
