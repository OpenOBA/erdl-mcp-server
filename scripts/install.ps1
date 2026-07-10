# ERDL MCP Server — One-command Installer (Windows)
# https://github.com/OpenOBA/erdl-mcp-server
#
# Usage (PowerShell):
#   iwr https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.ps1 | iex

param(
  [string]$InstallDir = "$env:USERPROFILE\.erdl-mcp"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗"
Write-Host "  ║  ERDL MCP Server — Quick Installer v1.0  ║"
Write-Host "  ║  https://openoba.com/erdl-mcp            ║"
Write-Host "  ╚══════════════════════════════════════════╝"
Write-Host ""

# ---- Prerequisites ----
Write-Host "-> Checking prerequisites..."

try {
  $nodeVersion = node -v
  Write-Host "  $check Node.js $nodeVersion"
} catch {
  Write-Host "  X Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
  exit 1
}

try {
  $npmVersion = npm -v
  Write-Host "  $check npm $npmVersion"
} catch {
  Write-Host "  X npm is not installed."
  exit 1
}

try {
  $gitVersion = git --version
  Write-Host "  $check $gitVersion"
} catch {
  Write-Host "  X git is not installed. Please install git from https://git-scm.com"
  exit 1
}

# ---- Install ----
Write-Host ""
Write-Host "-> Installing ERDL MCP Server to $InstallDir..."

if (Test-Path $InstallDir) {
  Write-Host "  Existing installation found. Updating..."
  Push-Location $InstallDir
  try {
    git pull --ff-only origin master 2>&1 | Out-Null
  } catch {
    $backup = "$InstallDir.bak.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Move-Item $InstallDir $backup
    Write-Host "  Backed up to $backup"
    Pop-Location
    git clone --depth 1 "https://github.com/OpenOBA/erdl-mcp-server.git" $InstallDir
    Push-Location $InstallDir
  }
} else {
  git clone --depth 1 "https://github.com/OpenOBA/erdl-mcp-server.git" $InstallDir
  Push-Location $InstallDir
}

Write-Host "-> Installing dependencies..."
npm install --omit=dev 2>&1 | Select-String "added"

Write-Host "-> Building..."
npm run build 2>&1 | Out-Null

# ---- Verify ----
Write-Host ""
Write-Host "-> Verifying installation..."
$version = node bin\erdl-mcp.js --version 2>&1
Write-Host "  $check $version"

# ---- Configure for OpenClaw ----
try {
  $openclaw = Get-Command openclaw -ErrorAction Stop
  Write-Host ""
  Write-Host "-> Configuring for OpenClaw..."
  $config = @{command="node";args=@("$InstallDir\dist\index.js")} | ConvertTo-Json -Compress
  openclaw mcp set erdl $config 2>&1 | Out-Null
  Write-Host "  $check OpenClaw MCP configured"
} catch {
  # OpenClaw not installed — that's fine
}

# ---- Done ----
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗"
Write-Host "  ║  $check ERDL MCP Server installed successfully ║"
Write-Host "  ║                                          ║"
Write-Host "  ║  Docs:  https://openoba.com/erdl         ║"
Write-Host "  ║  Update:  cd $InstallDir ; git pull      ║"
Write-Host "  ║  Remove:  rm -rf $InstallDir             ║"
Write-Host "  ╚══════════════════════════════════════════╝"
Write-Host ""

Pop-Location
