# ERDL MCP Server — One-command Installer (Windows)
# https://github.com/OpenOBA/erdl-mcp-server
#
# Usage (PowerShell):
#   iwr https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.ps1 | iex
#
# Requirements: Node.js 18+, npm, git

param(
  [string]$InstallDir = "$env:USERPROFILE\.erdl-mcp"
)

$ErrorActionPreference = "Stop"

# ---- Status symbols (ASCII, safe for all PowerShell versions) ----
$ok   = "[OK]"
$fail = "[FAIL]"

Write-Host ""
Write-Host "  ============================================"
Write-Host "  ERDL MCP Server — Quick Installer v1.1"
Write-Host "  https://openoba.com/erdl-mcp"
Write-Host "  ============================================"
Write-Host ""

# ---- Prerequisites ----
Write-Host "-> Checking prerequisites..."
$prereqOk = $true

try {
  $nodeVersion = node -v
  $nodeMajor = [int]($nodeVersion -replace 'v', '').Split('.')[0]
  if ($nodeMajor -lt 18) {
    Write-Host "  $fail Node.js 18+ required (found: $nodeVersion)"
    $prereqOk = $false
  } else {
    Write-Host "  $ok Node.js $nodeVersion"
  }
} catch {
  Write-Host "  $fail Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
  $prereqOk = $false
}

try {
  $npmVersion = npm -v
  Write-Host "  $ok npm $npmVersion"
} catch {
  Write-Host "  $fail npm is not installed."
  $prereqOk = $false
}

try {
  $gitVersion = git --version
  Write-Host "  $ok $gitVersion"
} catch {
  Write-Host "  $fail git is not installed. Please install git from https://git-scm.com"
  $prereqOk = $false
}

if (-not $prereqOk) {
  Write-Host ""
  Write-Host "  Please install the missing prerequisites and run this script again."
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
    if ($LASTEXITCODE -ne 0) {
      throw "git pull failed"
    }
    Write-Host "  $ok Updated to latest version"
  } catch {
    $backup = "$InstallDir.bak.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Move-Item $InstallDir $backup
    Write-Host "  Repository conflict. Backed up to $backup"
    Pop-Location
    git clone --depth 1 "https://github.com/OpenOBA/erdl-mcp-server.git" $InstallDir
    Push-Location $InstallDir
  }
} else {
  git clone --depth 1 "https://github.com/OpenOBA/erdl-mcp-server.git" $InstallDir
  Push-Location $InstallDir
}

Write-Host "-> Installing dependencies..."
npm install 2>&1 | Select-String "added"
if ($LASTEXITCODE -ne 0) {
  Write-Host "  $fail npm install failed"
  Pop-Location
  exit 1
}
Write-Host "  $ok Dependencies installed"

Write-Host "-> Building..."
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  $fail Build failed — this may be a TypeScript compilation error"
  Pop-Location
  exit 1
}
Write-Host "  $ok Build complete"

# ---- Verify ----
Write-Host ""
Write-Host "-> Verifying installation..."
$versionResult = node bin\erdl-mcp.js --version 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "  $ok $versionResult"
} else {
  Write-Host "  $fail Version check failed — the server may not start correctly"
  Write-Host "  $versionResult"
}

# ---- Done ----
Write-Host ""
Write-Host "  ============================================"
Write-Host "  $ok ERDL MCP Server installed successfully"
Write-Host ""
Write-Host "  Docs:    https://openoba.com/erdl"
Write-Host "  Start:   cd $InstallDir ; npm start"
Write-Host "  Update:  cd $InstallDir ; git pull"
Write-Host ('  Remove:  Remove-Item -Recurse -Force "' + $InstallDir + '"')
Write-Host "  Setup:   node bin\erdl-mcp.js --setup"
Write-Host "  ============================================"
Write-Host ""

Pop-Location
