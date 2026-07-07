#!/usr/bin/env node

/**
 * ERDL MCP Server CLI Entry
 *
 * Usage: npx @openoba/erdl-mcp
 */

import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// package root is one level up from bin/
const projectRoot = resolve(__dirname, '..')
const distIndex = resolve(projectRoot, 'dist', 'index.js')

try {
  await import('file:///' + distIndex.replace(/\\/g, '/'))
} catch (err) {
  // If first attempt fails, try to require-resolve the package
  try {
    const require = createRequire(import.meta.url)
    const resolved = require.resolve('@openoba/erdl-mcp/dist/index.js')
    await import(resolved)
  } catch {
    console.error('[erdl-mcp] Failed to start:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}
