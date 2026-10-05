# Local PHP API for development (Apache is not required).
#
#   .\start-api.ps1            # port 8080
#   .\start-api.ps1 -Port 9000 # another port (change it in vite.config.js too)
#
# Vite proxies /DataSources/api/* to this server, so the frontend runs separately:
#   npm run dev  ->  http://localhost:3000/DataSources/
#
# If the system blocks this script (execution policy), use start-api.cmd instead.
# Messages are ASCII on purpose: Windows PowerShell 5.1 reads BOM-less files as ANSI
# and would show Russian text as garbage.

param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$php = Join-Path $root '.tools\php\php.exe'
if (-not (Test-Path $php)) {
    throw "Portable PHP not found: $php. See the 'Local run' section in README.md"
}

$config = Join-Path $root 'backend\api\config.local.php'
if (-not (Test-Path $config)) {
    Write-Warning 'backend\api\config.local.php is missing - settings from config.php will be used (placeholder password, local mode)'
}

Write-Host "PHP API:  http://127.0.0.1:$Port/DataSources/api/reports"
Write-Host "Check:    http://127.0.0.1:$Port/DataSources/api/permissions.php"
Write-Host 'Stop:     Ctrl+C'
Write-Host ''

& $php -S "127.0.0.1:$Port" -t (Join-Path $root 'backend') (Join-Path $root 'backend\dev-router.php')
