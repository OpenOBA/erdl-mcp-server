/**
 * ERDL OpenClaw Plugin — Plugin Entry
 *
 * Registers a trusted tool policy (before_tool_call) for hard enforcement,
 * and an after_tool_call hook for friendly feedback to users.
 *
 * This gives ERDL the "hard enforcement" capability — rules are evaluated
 * deterministically before the tool executes, not relying on LLM self-discipline.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-11 · updated 2026-07-11 (after_tool_call feedback)
 * @license MIT
 */

import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry"

// @ts-ignore — engine modules are copied from erdl-mcp-server dist during build
import { RuleStore } from "./engine/rule-store.js"
// @ts-ignore
import { Evaluator } from "./engine/evaluator.js"

// ============================================
// Lazy initialization
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

function getRules() { return ruleStore?.getAll() ?? [] }
function getEvaluator() { return evaluator }

// ============================================
// Cross-hook cache: toolCallId → evaluation result
// (before_tool_call evaluates, after_tool_call adds feedback)
// ============================================

const evalCache = new Map()
const MAX_CACHE = 100

function cacheResult(toolCallId, result) {
  if (!toolCallId) return
  if (evalCache.size >= MAX_CACHE) {
    // FIFO eviction
    const first = evalCache.keys().next().value
    evalCache.delete(first)
  }
  evalCache.set(toolCallId, result)
}

function popResult(toolCallId) {
  if (!toolCallId) return null
  const r = evalCache.get(toolCallId)
  evalCache.delete(toolCallId)
  return r ?? null
}

// ============================================
// Context flatten: OpenClaw event params → ERDL context map
// ============================================

function buildEvalContext(toolName, params) {
  const ctx = { 'tool.name': toolName }
  for (const [key, value] of Object.entries(params)) {
    ctx[`tool.args.${key}`] = value
  }
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
// Resolve i18n field: string | { zh, en } → preferred language
// ============================================

function t(field, lang) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (lang === 'zh' && field.zh) return field.zh
  return field.en || field.zh || ''
}

// ============================================
// Build friendly feedback text for after_tool_call
// ============================================

function buildFeedback(result, toolName, lang) {
  if (!result || result.totalMatched === 0) {
    return `✅ ERDL · ${result?.totalEvaluated ?? 0} rules checked · PASS`
  }

  const { decision, matchedRules, totalEvaluated, totalMatched, primaryExplanation, primaryAlternative } = result

  // Separate block rules and advisory rules
  const blockRules = matchedRules.filter(r => r.decision === 'DENY' || r.decision === 'EMERGENCY_HALT' || r.decision === 'CORRECT')
  const humanRules = matchedRules.filter(r => r.decision === 'REQUEST_HUMAN')
  const advisoryRules = matchedRules.filter(r => r.decision === 'ALLOW')

  const lines = []

  if (blockRules.length > 0) {
    // Show the blocking rule prominently
    const rule = blockRules[0]
    lines.push(`🛑 ${rule.ruleId} ${rule.ruleName} · ${decision}`)
    lines.push(`   ${t(rule.reason, lang)}`)

    const expl = t(rule.explanation, lang)
    if (expl && expl !== t(rule.reason, lang)) {
      lines.push(`   ${expl}`)
    }

    const alt = t(rule.alternative, lang)
    if (alt) {
      lines.push(`   ${lang === 'zh' ? '替代方案' : 'Alternative'}: ${alt}`)
    }
  } else if (humanRules.length > 0) {
    const rule = humanRules[0]
    lines.push(`👤 ${rule.ruleId} ${rule.ruleName} · ${lang === 'zh' ? '需要人工审批' : 'Approval Required'}`)
    lines.push(`   ${t(rule.reason, lang)}`)
    const expl = t(rule.explanation, lang)
    if (expl) lines.push(`   ${expl}`)
  } else {
    // All ALLOW — show summary + one-line reminder of the most relevant advisory
    lines.push(`✅ ERDL · ${totalEvaluated} ${lang === 'zh' ? '条规则检查通过' : 'rules checked'} · ALLOW`)

    // Pick the highest-priority advisory rule to highlight (not all)
    if (advisoryRules.length > 0) {
      const top = advisoryRules[0]
      const instruction = top.instruction || t(top.reason, lang)
      if (instruction && instruction.length < 80) {
        lines.push(`   📌 ${top.ruleId} ${top.ruleName}: ${instruction}`)
      }
    }
  }

  return lines.join('\n')
}

// ============================================
// Decision mapping: ERDL Decision → OpenClaw Policy Decision
// ============================================

function toPolicyDecision(result, lang) {
  const expl = result.primaryExplanation ? t(result.primaryExplanation, lang) : ''
  const alt = result.primaryAlternative ? t(result.primaryAlternative, lang) : ''
  const reason = result.primaryReason ?? ''

  switch (result.decision) {
    case 'DENY': {
      let msg = `🛑 ERDL Guard · ${reason}`
      if (expl && expl !== reason) msg += `\n\n${expl}`
      if (alt) msg += `\n\n${lang === 'zh' ? '替代方案' : 'Alternative'}: ${alt}`
      return { block: true, blockReason: msg }
    }
    case 'EMERGENCY_HALT': {
      let msg = `🚨 ERDL HALT · ${reason}`
      if (expl && expl !== reason) msg += `\n\n${expl}`
      return { block: true, blockReason: msg }
    }
    case 'REQUEST_HUMAN': {
      let desc = reason
      if (expl) desc = `${reason}\n\n${expl}`
      return { requireApproval: { title: 'ERDL Guard — Approval Required', description: desc, severity: 'warning' as const } }
    }
    case 'CORRECT': {
      let msg = `🔧 ERDL Correct · ${result.primaryCorrection ?? reason}`
      if (expl) msg += `\n\n${expl}`
      return { block: true, blockReason: msg }
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
    // ===== before_tool_call: hard enforcement =====
    api.registerTrustedToolPolicy({
      id: "guard",
      description:
        "ERDL rules evaluate every tool call before execution. Rules define what is ALLOWED, DENIED, CORRECTED, or requires human approval.",
      async evaluate(event, ctx) {
        if (event.toolName.startsWith("erdl_")) return
        await ensureInitialized()

        const evalCtx = buildEvalContext(event.toolName, event.params)
        const result = getEvaluator().evaluate(getRules(), evalCtx)

        // Cache for after_tool_call feedback
        cacheResult(event.toolCallId, result)

        const decision = toPolicyDecision(result, lang)

        if (result.totalMatched > 0) {
          const matched = result.matchedRules.map(r => `${r.ruleId}(${r.decision})`).join(', ')
          console.log(`[erdl] ${event.toolName} → ${result.decision} (${result.totalMatched} rules matched: ${matched})`)
        }

        return decision
      },
    })

    // ===== after_tool_call: friendly feedback =====
    // Inject ERDL status text into every tool call result
    // so users see the Guard working, not just when rules block.

    const lang = 'zh' // Default to Chinese for OpenOBA users

    api.registerAgentToolResultMiddleware(async (item, ctx) => {
      const result = popResult(item.toolCallId)
      if (!result) return

      const feedback = buildFeedback(result, item.toolName, lang)
      return { content: item.content ? `${item.content}\n\n${feedback}` : feedback }
    })
  },
})
