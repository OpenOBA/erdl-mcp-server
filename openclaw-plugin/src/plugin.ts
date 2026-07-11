/**
 * ERDL OpenClaw Plugin — Plugin Entry
 *
 * Registers a trusted tool policy that intercepts every tool call,
 * evaluates it against loaded ERDL rules, and blocks/corrects/requests-approval
 * based on the rule decision.
 *
 * This gives ERDL the "hard enforcement" capability — rules are evaluated
 * deterministically before the tool executes, not relying on LLM self-discipline.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-11
 * @license MIT
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry"

// @ts-ignore — engine modules are copied from erdl-mcp-server dist during build
import { RuleStore } from "./engine/rule-store.js"
// @ts-ignore
import { Evaluator } from "./engine/evaluator.js"

// ============================================
// Lazy initialization (loaded once on first tool call)
// ============================================

let ruleStore = null
let evaluator = null
let initialized = false

async function ensureInitialized() {
  if (initialized) return

  ruleStore = new RuleStore()
  await ruleStore.load()

  evaluator = new Evaluator()
  initialized = true

  const all = ruleStore.getAll()
  console.log(`[erdl] ERDL Action Guard loaded: ${all.length} rules active`)
}

function getRules() {
  return ruleStore?.getAll() ?? []
}

function getEvaluator() {
  return evaluator
}

// ============================================
// Context flatten: OpenClaw event params → ERDL context map
// ============================================

function buildEvalContext(toolName, params) {
  const ctx = { 'tool.name': toolName }

  for (const [key, value] of Object.entries(params)) {
    ctx[`tool.args.${key}`] = value
  }

  // Special handling for well-known tool types
  if (toolName === 'exec' && typeof params.command === 'string') {
    ctx['tool.args.command'] = params.command
    if (params.cwd) ctx['tool.args.cwd'] = params.cwd
    if (params.elevated) ctx['tool.args.elevated'] = params.elevated
  }
  if ((toolName === 'write' || toolName === 'edit') && typeof params.path === 'string') {
    ctx['tool.args.path'] = params.path
  }
  if (toolName === 'web_search' && typeof params.query === 'string') {
    ctx['tool.args.query'] = params.query
  }

  return ctx
}

// ============================================
// Decision mapping: ERDL Decision → OpenClaw Policy Decision
// ============================================

function toPolicyDecision(result) {
  switch (result.decision) {
    case 'DENY':
      return {
        block: true,
        blockReason: `🛑 ERDL Guard · ${result.primaryReason ?? 'Blocked by rule'}`,
      }

    case 'EMERGENCY_HALT':
      return {
        block: true,
        blockReason: `🚨 ERDL HALT · ${result.primaryReason ?? 'Emergency halt triggered'}`,
      }

    case 'REQUEST_HUMAN':
      return {
        requireApproval: {
          title: 'ERDL Guard — Approval Required',
          description: result.primaryReason ?? 'This action requires human approval per ERDL rules',
          severity: 'warning' as const,
        },
      }

    case 'CORRECT':
      return {
        block: true,
        blockReason: `🔧 ERDL Correct · ${result.primaryCorrection ?? result.primaryReason ?? 'Correction needed'}`,
      }

    case 'ALLOW':
    case 'PASS':
    default:
      return undefined
  }
}

// ============================================
// Plugin Entry
// ============================================

export default definePluginEntry({
  id: "erdl-guard",
  name: "ERDL Action Guard",
  description:
    "Deterministic rules for AI Agents — intercepts every tool call and enforces coding, writing, design, and engineering rules.",
  register(api) {
    api.registerTrustedToolPolicy({
      id: "guard",
      description:
        "ERDL rules evaluate every tool call before execution. Rules define what is ALLOWED, DENIED, CORRECTED, or requires human approval.",
      async evaluate(event, ctx) {
        // 1. Skip ERDL's own MCP tools
        if (event.toolName.startsWith("erdl_")) return

        // 2. Ensure rules are loaded
        await ensureInitialized()

        // 3. Build evaluation context from the tool call
        const evalCtx = buildEvalContext(event.toolName, event.params)

        // 4. Evaluate against loaded rules
        const result = getEvaluator().evaluate(getRules(), evalCtx)

        // 5. Map to OpenClaw policy decision
        const decision = toPolicyDecision(result)

        // 6. Log matched rules
        if (result.totalMatched > 0) {
          const matched = result.matchedRules.map(r => `${r.ruleId}(${r.decision})`).join(', ')
          console.log(`[erdl] ${event.toolName} → ${result.decision} (${result.totalMatched} rules matched: ${matched})`)
        }

        return decision
      },
    })
  },
})
