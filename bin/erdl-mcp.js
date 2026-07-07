#!/usr/bin/env node

/**
 * ERDL MCP Server CLI Entry
 *
 * Usage: npx @openoba/erdl-mcp
 *
 * This is the entry point referenced by package.json "bin".
 * It simply boots the MCP server on stdio transport.
 */

import('../dist/index.js').catch((err) => {
  console.error('[erdl-mcp] Failed to start:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
