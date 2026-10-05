@echo off
setlocal

rem Local PHP API for development (Apache is not required).
rem Usage: start-api.cmd [port]      default port: 8080
rem
rem This launcher does not depend on the PowerShell execution policy,
rem so use it if start-api.ps1 is blocked by the system.

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8080"

set "ROOT=%~dp0"
set "PHP=%ROOT%.tools\php\php.exe"

if not exist "%PHP%" (
    echo Portable PHP not found: %PHP%
    echo See the "Local run" section in README.md
    exit /b 1
)

if not exist "%ROOT%backend\api\config.local.php" (
    echo WARNING: backend\api\config.local.php is missing.
    echo Settings from config.php will be used: placeholder password and local mode.
    echo.
)

echo PHP API:  http://127.0.0.1:%PORT%/DataSources/api/reports
echo Check:    http://127.0.0.1:%PORT%/DataSources/api/permissions.php
echo Stop:     Ctrl+C
echo.

"%PHP%" -S 127.0.0.1:%PORT% -t "%ROOT%backend" "%ROOT%backend\dev-router.php"
