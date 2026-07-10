/**
 * ERDL MCP Server — Main Entry
 *
 * Assembles the MCP server with all tools and starts on stdio transport.
 *
 * Usage:
 *   npx @openoba-ai/erdl-mcp               Start the MCP server
 *   npx @openoba-ai/erdl-mcp --version     Show version
 *   npx @openoba-ai/erdl-mcp --help        Show help
 *   npx @openoba-ai/erdl-mcp --upgrade     Upgrade to latest version
 *   npx @openoba-ai/erdl-mcp --uninstall   Remove all ERDL files
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07 · updated 2026-07-10 (v1.0.0 public release)
 * @license MIT
 */

import { readFileSync, rmSync, existsSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

// Read version from package.json (source of truth)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))
const VERSION = pkg.version as string
const PKG_NAME = pkg.name as string

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { ruleStore } from './engine/rule-store.js'
import { createTelemetryReporter } from './engine/telemetry.js'
import { detectLanguage } from './i18n/index.js'

// Initialize language detection at import time (before tool registrations)
detectLanguage()

import { evaluateToolDef, evaluateHandler } from './tools/evaluate.js'
import { listRulesToolDef, listRulesHandler } from './tools/list-rules.js'
import { createRuleToolDef, createRuleHandler } from './tools/create-rule.js'
import { simulateToolDef, simulateHandler } from './tools/simulate.js'
import { explainToolDef, explainHandler } from './tools/explain.js'

// ============================================
// CLI Commands
// ============================================

const REGISTRY_URL = 'https://registry.npmjs.org'
const VERSION_CHECK_FILE = join(homedir(), '.openoba', '.last_version_check')

function showHelp(): void {
  console.error(`
🦞 ERDL MCP Server v${VERSION}

  ERDL (Entity-Rule Definition Language) gives your Agent deterministic rules.
  30 built-in presets. Unlimited private rules. Free forever.

Usage:
  npx ${PKG_NAME}               Start the MCP server (stdio transport)
  npx ${PKG_NAME} --lang zh     Chinese mode
  npx ${PKG_NAME} --pro-key sk-xxx  Activate Pro license
  npx ${PKG_NAME} --version     Show version
  npx ${PKG_NAME} --help        Show this help
  npx ${PKG_NAME} --upgrade     Upgrade to the latest version
  npx ${PKG_NAME} --uninstall   Remove all ERDL files and configurations

Rules directory: ~/.openoba/rules/
Docs: https://openoba.com/erdl
Source: https://github.com/OpenOBA/erdl-mcp-server
`)
  process.exit(0)
}

function showVersion(): void {
  console.error(`ERDL MCP Server v${VERSION}`)
  process.exit(0)
}

/** Handle --uninstall: remove all ERDL traces from the system */
function uninstall(): void {
  const home = homedir()
  const openobaDir = join(home, '.openoba')

  console.error('[erdl-mcp] 🧹 ERDL Uninstaller')
  console.error('[erdl-mcp] This will remove all ERDL MCP Server files and configurations.')

  const filesToRemove = [
    join(openobaDir, 'rules'),
    join(openobaDir, '.telemetry.json'),
    join(openobaDir, '.last_version_check'),
    join(openobaDir, '.deploy_id'),
  ]

  let removed = 0

  // Remove individual files first (cleaner error messages)
  for (const file of filesToRemove) {
    if (existsSync(file)) {
      try {
        rmSync(file, { recursive: true, force: true })
        console.error(`[erdl-mcp]   Removed: ${file.replace(home, '~')}`)
        removed++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[erdl-mcp]   Failed to remove ${file.replace(home, '~')}: ${msg}`)
      }
    }
  }

  // Remove the .openoba directory if empty after cleanup
  if (existsSync(openobaDir)) {
    try {
      const remaining = readdirSync(openobaDir)
      if (remaining.length === 0) {
        rmSync(openobaDir, { force: true })
        console.error(`[erdl-mcp]   Removed: ~/.openoba/ (empty directory)`)
        removed++
      } else {
        console.error(`[erdl-mcp]   Skipped ~/.openoba/ — directory not empty (remaining: ${remaining.join(', ')})`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[erdl-mcp]   Failed to check ~/.openoba/: ${msg}`)
    }
  }

  console.error(`[erdl-mcp] ✅ Uninstall complete. ${removed} directories removed.`)
  console.error('[erdl-mcp] To reinstall: npx @openoba-ai/erdl-mcp')
  process.exit(0)
}

/** Handle --upgrade: clear npm cache and re-pull latest version */
function upgrade(): void {
  console.error(`[erdl-mcp] ⚡ ERDL MCP Server v${VERSION}`)
  console.error('[erdl-mcp] Checking for latest version...')

  const npmNpxDir = join(homedir(), '.npm', '_npx')
  let cleaned = 0

  if (existsSync(npmNpxDir)) {
    try {
      for (const entry of readdirSync(npmNpxDir)) {
        const nodeModules = join(npmNpxDir, entry, 'node_modules', '@openoba-ai', 'erdl-mcp')
        if (existsSync(nodeModules)) {
          rmSync(nodeModules, { recursive: true, force: true })
          cleaned++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[erdl-mcp] ⚠️  Could not clean npx cache: ${msg}`)
    }
  }

  // Also clean version check timestamp to force re-check
  if (existsSync(VERSION_CHECK_FILE)) {
    try { rmSync(VERSION_CHECK_FILE, { force: true }) } catch { /* ok */ }
  }

  console.error(`[erdl-mcp] ✅ Upgrade complete. Cleaned ${cleaned} cached version(s).`)
  console.error('[erdl-mcp] Next start will use the latest version:')
  console.error(`[erdl-mcp]   npx ${PKG_NAME}`)
  process.exit(0)
}

// Dispatch CLI commands (exit early, don't start MCP server)
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
}
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  showVersion()
}
if (process.argv.includes('--uninstall')) {
  uninstall()
}
if (process.argv.includes('--upgrade')) {
  upgrade()
}

// ============================================
// Version Check (non-blocking, background)
// ============================================

async function checkForUpdates(): Promise<void> {
  // Throttle: check at most once every 24 hours
  try {
    if (existsSync(VERSION_CHECK_FILE)) {
      const lastCheck = parseInt(readFileSync(VERSION_CHECK_FILE, 'utf-8') || '0', 10)
      if (Date.now() - lastCheck < 24 * 60 * 60 * 1000) return
    }
  } catch { /* file doesn't exist, proceed */ }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const resp = await fetch(`${REGISTRY_URL}/-/package/${PKG_NAME}/dist-tags`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!resp.ok) return
    const tags = (await resp.json()) as Record<string, string>
    const latest = tags.latest

    if (latest && latest !== VERSION) {
      // Compare semver
      const [latestMajor, latestMinor, latestPatch] = latest.split('.').map(Number)
      const [curMajor, curMinor, curPatch] = VERSION.split('.').map(Number)
      const isNewer =
        latestMajor > curMajor ||
        (latestMajor === curMajor && latestMinor > curMinor) ||
        (latestMajor === curMajor && latestMinor === curMinor && latestPatch > curPatch)

      if (isNewer) {
        console.error(`\n⚡ ERDL MCP Server v${latest} is available! (you have v${VERSION})`)
        console.error(`   Upgrade: npx ${PKG_NAME} --upgrade`)
        console.error(`   Changelog: https://github.com/OpenOBA/erdl-mcp-server/blob/master/CHANGELOG.md\n`)
      }
    }
  } catch {
    // Network error or timeout → silently skip. Don't block startup.
  }

  // Record last check time
  try {
    const dir = join(homedir(), '.openoba')
    if (!existsSync(dir)) return
    writeFileSync(VERSION_CHECK_FILE, String(Date.now()), 'utf-8')
  } catch { /* ok */ }
}

// ============================================
// Tool Registry
// ============================================

const TOOLS = [
  { def: evaluateToolDef, handler: evaluateHandler },
  { def: listRulesToolDef, handler: listRulesHandler },
  { def: createRuleToolDef, handler: createRuleHandler },
  { def: simulateToolDef, handler: simulateHandler },
  { def: explainToolDef, handler: explainHandler },
] as const

// ============================================
// Resources
// ============================================

function registerResources(server: Server): void {
  const rules = ruleStore.getAll()

  // list all available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'erdl://rules/list',
        name: 'All Rules',
        description: `All ${rules.length} loaded ERDL rules as a JSON array`,
        mimeType: 'application/json',
      },
      {
        uri: 'erdl://status',
        name: 'Server Status',
        description: 'ERDL MCP Server runtime status',
        mimeType: 'application/json',
      },
    ],
  }))

  // read a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri

    if (uri === 'erdl://rules/list') {
      const currentRules = ruleStore.getAll()
      const data = currentRules.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        decision: r.action.decision,
        priority: r.priority,
        enabled: r.enabled,
        scopeLevel: r.scopeLevel ?? null,
        hitCount: r.hitCount ?? 0,
      }))
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data, null, 2),
        }],
      }
    }

    if (uri === 'erdl://status') {
      const currentRules = ruleStore.getAll()
      const cats: Record<string, number> = {}
      for (const r of currentRules) {
        cats[r.category] = (cats[r.category] || 0) + 1
      }
      const status = {
        server: 'erdl-mcp',
        version: VERSION,
        rules: {
          total: currentRules.length,
          byCategory: cats,
        },
        agentIdentity: ruleStore.getAgentIdentity(),
      }
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(status, null, 2),
        }],
      }
    }

    throw new Error(`Unknown resource: ${uri}`)
  })
}

// ============================================
// Main
// ============================================

export async function main(): Promise<void> {
  // 1. Load rules from file system
  await ruleStore.load()

  // 1.5 Initialize telemetry (opt-in, non-blocking)
  const telemetry = createTelemetryReporter()
  telemetry.initialize()
  const lang = (process.env.ERDL_LANG || detectLanguage() || 'en') as string

  // 2. Create MCP Server
  const server = new Server(
    {
      name: 'erdl-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: {},
      },
    },
  )

  // 3. Register resources (rule data exposed as readable resources)
  registerResources(server)

  // 4. Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ def }) => ({
      name: def.name,
      title: def.title,
      description: def.description,
      inputSchema: def.inputSchema,
    })),
  }))

  // 5. Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    const tool = TOOLS.find((t) => t.def.name === name)
    if (!tool) {
      throw new Error(`Unknown tool: ${name}. Available: ${TOOLS.map((t) => t.def.name).join(', ')}`)
    }

    try {
      return await tool.handler(args as never)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[erdl-mcp] Tool "${name}" failed:`, message)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  })

  // 6. Handle rule changes → notify clients
  ruleStore.onRulesChanged(() => {
    server.notification({
      method: 'notifications/tools/list_changed',
    } as never).catch((err: Error) => {
      console.error('[erdl-mcp] Failed to send tools/list_changed:', err.message)
    })
  })

  // 7. Start stdio transport
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error(`[erdl-mcp] 🧠 ERDL MCP Server v${VERSION} started`)
  console.error(`[erdl-mcp] 👤 Role: ${ruleStore.getAgentIdentity().role} | Ring: ${ruleStore.isGuardian() ? 0 : 3}`)
  console.error(`[erdl-mcp] 📁 Rules: ${ruleStore.count()} loaded from ~/.openoba/rules/`)
  console.error(`[erdl-mcp] 🔧 Tools: ${TOOLS.map((t) => t.def.name).join(', ')}`)
  console.error(`[erdl-mcp] ✅ Ready for Agent connections`)

  // 8. Report telemetry startup (non-blocking, opt-in only)
  telemetry.reportStartup(VERSION, lang, ruleStore.count(), 'free')

  // 9. Background version check (non-blocking, throttled to once per 24h)
  checkForUpdates().catch(() => { /* silence */ })

  // 8. Graceful shutdown
  const shutdown = () => {
    ruleStore.destroy()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

// Entry point
main().catch((err) => {
  console.error('[erdl-mcp] Fatal error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
