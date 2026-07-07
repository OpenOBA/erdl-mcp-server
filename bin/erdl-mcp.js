#!/usr/bin/env node

/**
 * ERDL MCP Server CLI Entry
 *
 * Usage: npx @openoba/erdl-mcp
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const distIndex = resolve(projectRoot, 'dist', 'index.js')

try {
  await import(distIndex)
} catch (err) {
  console.error('[erdl-mcp] Failed to start:', err instanceof Error ? err.message : String(err))
  process.exit(1)
}
