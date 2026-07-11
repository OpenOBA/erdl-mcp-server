#!/usr/bin/env bash
#
# ERDL MCP Server — One-command Installer
# https://github.com/OpenOBA/erdl-mcp-server
#
# This script clones the repository, installs dependencies, builds, and
# configures ERDL MCP Server for use with any MCP-compatible Agent.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.sh | bash
#
# Or for a specific install directory:
#   INSTALL_DIR=/opt/erdl-mcp bash install.sh
#
# Requirements: Node.js 18+, npm, git

set -euo pipefail

OK="✓"
FAIL="✗"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  ERDL MCP Server — Quick Installer v1.1  ║"
echo "  ║  https://openoba.com/erdl-mcp            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ---- Configuration ----
INSTALL_DIR="${INSTALL_DIR:-$HOME/.erdl-mcp}"
REPO_URL="https://github.com/OpenOBA/erdl-mcp-server.git"

# ---- Prerequisites ----
echo "→ Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo "  ${FAIL} Node.js is not installed. Please install Node.js 18+ and try again."
  echo "  https://nodejs.org"
  exit 1
fi

# Cross-platform Node.js major version detection (no sed dependency)
NODE_VERSION=$(node -v)
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  ${FAIL} Node.js 18+ required (found: ${NODE_VERSION})"
  exit 1
fi
echo "  ${OK} Node.js ${NODE_VERSION}"

if ! command -v npm &> /dev/null; then
  echo "  ${FAIL} npm is not installed."
  exit 1
fi
echo "  ${OK} npm $(npm -v)"

if ! command -v git &> /dev/null; then
  echo "  ${FAIL} git is not installed. Please install git and try again."
  exit 1
fi
echo "  ${OK} git $(git --version | awk '{print $3}')"

# ---- Install ----
echo ""
echo "→ Installing ERDL MCP Server to $INSTALL_DIR..."

if [ -d "$INSTALL_DIR" ]; then
  echo "  Existing installation found. Updating..."
  cd "$INSTALL_DIR"
  if git pull --ff-only origin master 2>/dev/null; then
    echo "  ${OK} Updated to latest version"
  else
    echo "  Repository conflict. Backing up to ${INSTALL_DIR}.bak..."
    mv "$INSTALL_DIR" "${INSTALL_DIR}.bak.$(date +%s)"
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi
else
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "→ Installing dependencies..."
npm install 2>&1 | tail -3
echo "  ${OK} Dependencies installed"

echo "→ Building..."
npm run build
echo "  ${OK} Build complete"

# ---- Verify ----
echo ""
echo "→ Verifying installation..."
VERSION=$(node bin/erdl-mcp.js --version 2>&1)
echo "  ${OK} ${VERSION}"

# ---- Symlink (optional, requires sudo on most systems) ----
if [ -w "/usr/local/bin" ] || command -v sudo &> /dev/null; then
  echo ""
  echo "→ Creating global symlink..."
  SYMLINK_PATH="/usr/local/bin/erdl-mcp"
  if [ -w "/usr/local/bin" ]; then
    ln -sf "$INSTALL_DIR/bin/erdl-mcp.js" "$SYMLINK_PATH"
  else
    sudo ln -sf "$INSTALL_DIR/bin/erdl-mcp.js" "$SYMLINK_PATH"
  fi
  echo "  ${OK} erdl-mcp command available globally"
fi

# ---- Configure for OpenClaw ----
if command -v openclaw &> /dev/null; then
  echo ""
  echo "→ Configuring for OpenClaw..."
  if openclaw mcp set erdl "{\"command\":\"node\",\"args\":[\"$INSTALL_DIR/dist/index.js\"]}" 2>/dev/null; then
    echo "  ${OK} OpenClaw MCP configured"
  else
    echo "  ! Could not configure OpenClaw (you can do this manually: node $INSTALL_DIR/bin/erdl-mcp.js --setup)"
  fi
fi

# ---- Done ----
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  ${OK} ERDL MCP Server installed successfully ║"
echo "  ║                                          ║"
echo "  ║  Run:        erdl-mcp                    ║"
echo "  ║  Docs:       https://openoba.com/erdl    ║"
echo "  ║  Update:     cd $INSTALL_DIR && git pull ║"
echo "  ║  Uninstall:  rm -rf $INSTALL_DIR         ║"
echo "  ║  Setup:      node bin/erdl-mcp.js --setup ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
