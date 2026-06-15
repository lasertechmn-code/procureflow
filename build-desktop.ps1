<#
  build-desktop.ps1 — Reproducible build for the ProcureFlow desktop (Electron) app.

  Usage:
    ./build-desktop.ps1            # full build -> installer in ./release
    ./build-desktop.ps1 -Run       # build the web bundle then launch Electron (no packaging)
    ./build-desktop.ps1 -SkipInstall   # skip npm install (deps already present)

  Requirements: Node.js + npm on PATH. Internet access on first run (npm install,
  and the app uses CDN Tailwind + Google Fonts at runtime).
#>

param(
    [switch]$Run,
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

# 1. Dependencies
if (-not $SkipInstall) {
    Write-Step "Installing dependencies (npm install)"
    npm install
} else {
    Write-Step "Skipping npm install (-SkipInstall)"
}

# 2. App icon (build/icon.png + public/icon.svg)
Write-Step "Generating application icon"
npm run icon

# 3. Clean previous output and stop any running instance (avoids file-lock errors)
Write-Step "Cleaning previous build output"
Get-Process ProcureFlow -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist, release -ErrorAction SilentlyContinue

if ($Run) {
    # 4a. Dev/preview path: build web bundle and launch Electron against it
    Write-Step "Building web bundle (vite build)"
    npm run build

    Write-Step "Launching Electron"
    npx electron .
    return
}

# 4b. Full packaged build
Write-Step "Building web bundle (vite build)"
npm run build

Write-Step "Packaging desktop installer (electron-builder)"
npx electron-builder --win nsis

Write-Step "Done"
$release = Join-Path $PSScriptRoot 'release'
if (Test-Path $release) {
    Write-Host "Artifacts in: $release" -ForegroundColor Green
    Get-ChildItem $release -File | Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB,1)}} | Format-Table -AutoSize
}
