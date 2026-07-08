/**
 * ERDL MCP Server — Main Entry
 *
 * Assembles the MCP server with all tools and starts on stdio transport.
 * One command: npx @openoba/erdl-mcp
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

// Read version from package.json (source of truth)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))
const VERSION = pkg.version as string
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { ruleStore } from './engine/rule-store.js'
import { evaluateToolDef, evaluateHandler } from './tools/evaluate.js'
import { listRulesToolDef, listRulesHandler } from './tools/list-rules.js'
import { createRuleToolDef, createRuleHandler } from './tools/create-rule.js'
import { simulateToolDef, simulateHandler } from './tools/simulate.js'
import { explainToolDef, explainHandler } from './tools/explain.js'

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
// Main
// ============================================

export async function main(): Promise<void> {
  // 1. Load rules from file system
  await ruleStore.load()

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

  // 3. Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ def }) => ({
      name: def.name,
      title: def.title,
      description: def.description,
      inputSchema: def.inputSchema,
    })),
  }))

  // 4. Register tool call handler
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

  // 5. Handle rule changes → notify clients
  ruleStore.onRulesChanged(() => {
    server.notification({
      method: 'notifications/tools/list_changed',
    } as never).catch((err: Error) => {
      console.error('[erdl-mcp] Failed to send tools/list_changed:', err.message)
    })
  })

  // 6. Start stdio transport
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error(`[erdl-mcp] 🧠 ERDL MCP Server v${VERSION} started`)
  console.error(`[erdl-mcp] 👤 Role: ${ruleStore.getAgentIdentity().role} | Ring: ${ruleStore.isGuardian() ? 0 : 3}`)
  console.error(`[erdl-mcp] 📁 Rules: ${ruleStore.count()} loaded from ~/.openoba/rules/`)
  console.error(`[erdl-mcp] 🔧 Tools: ${TOOLS.map((t) => t.def.name).join(', ')}`)
  console.error(`[erdl-mcp] ✅ Ready for Agent connections`)
}

// Entry point
main().catch((err) => {
  console.error('[erdl-mcp] Fatal error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
