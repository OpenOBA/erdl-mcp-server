/**
 * ERDL MCP Server — evaluate tool
 *
 * Evaluates all loaded rules against the agent's current intent.
 * Agent should call this BEFORE outputting code, content, or making decisions.
 *
 * Returns rich Markdown that the LLM will naturally relay to the user,
 * making ERDL's presence visible in every interaction.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07 · updated 2026-07-17 (rich Markdown for user-facing visibility)
 * @license MIT
 */

import { Evaluator } from '../engine/evaluator.js'
import { ruleStore } from '../engine/rule-store.js'
import type { EvaluationResult, RuleMatch } from '../engine/rule-definition.js'
import { i18n } from '../i18n/index.js'

const evaluator = new Evaluator()

export const evaluateToolDef = {
  name: 'erdl_evaluate',
  title: 'ERDL Action Guard — Tool Call Interceptor',
  description: i18n().evaluate.description,

  inputSchema: {
    type: 'object',
    properties: {
      tool_name: {
        type: 'string',
        description: 'Name of the tool being called (e.g., "exec", "write_file", "web_search")',
      },
      tool_args: {
        type: 'object',
        description: 'Arguments being passed to the tool',
        additionalProperties: true,
      },
      agent_id: {
        type: 'string',
        description: 'Optional agent identity for audit context',
      },
      session_id: {
        type: 'string',
        description: 'Optional session identifier for audit chain',
      },
    },
    required: ['tool_name'],
  },
}

export async function evaluateHandler(args: {
  tool_name: string
  tool_args?: Record<string, unknown>
  agent_id?: string
  session_id?: string
}) {
  // Runtime input validation (MCP SDK doesn't enforce inputSchema at runtime)
  if (typeof args.tool_name !== 'string' || !args.tool_name) {
    return { content: [{ type: 'text' as const, text: 'Invalid input: tool_name must be a non-empty string' }], isError: true }
  }

  const rules = ruleStore.getAll()

  // Build guard context from Tool Call parameters (ERDL Spec §5.3)
  const guardContext: Record<string, unknown> = {
    'tool.name': args.tool_name,
    'tool.args': args.tool_args ?? {},
    ...(args.agent_id ? { 'agent.id': args.agent_id } : {}),
    ...(args.session_id ? { 'session.id': args.session_id } : {}),
  }

  // Flatten tool_args for direct field access (e.g., tool.args.command)
  if (args.tool_args) {
    for (const [key, value] of Object.entries(args.tool_args)) {
      guardContext[`tool.args.${key}`] = value
    }
  }

  const result: EvaluationResult = evaluator.evaluate(rules, guardContext)

  // Record hits
  for (const match of result.matchedRules) {
    ruleStore.recordHit(match.ruleId)
  }

  const badge = BADGE[result.decision] ?? { emoji: '⚪', label: result.decision, color: 'gray' }
  const decisionRules = result.matchedRules.map((r) => ({
    id: r.ruleId,
    name: r.ruleName,
    decision: r.decision,
    reason: r.reason,
    instruction: r.instruction,
    explanation: r.explanation,
    alternative: r.alternative,
  }))

  // Build rich Markdown text — LLM will naturally relay this to the user
  const markdown = buildResultMarkdown(result, badge, args.tool_name)

  if (result.decision === 'EMERGENCY_HALT') {
    return {
      content: [{ type: 'text' as const, text: markdown }],
      structuredContent: { decision: 'EMERGENCY_HALT' as const, badge, reason: result.primaryReason, matchedRules: decisionRules },
      isError: true,
    }
  }

  if (result.decision === 'REQUEST_HUMAN') {
    return {
      content: [{ type: 'text' as const, text: markdown }],
      structuredContent: { decision: 'REQUEST_HUMAN' as const, badge, reason: result.primaryReason, matchedRules: decisionRules },
    }
  }

  return {
    content: [{ type: 'text' as const, text: markdown }],
    structuredContent: {
      decision: result.decision,
      badge,
      ...(result.primaryReason ? { reason: result.primaryReason } : {}),
      ...(result.primaryInstruction ? { instruction: result.primaryInstruction } : {}),
      ...(result.primaryCorrection ? { correction: result.primaryCorrection } : {}),
      matchedRules: decisionRules,
      totalEvaluated: result.totalEvaluated,
      totalMatched: result.totalMatched,
    },
  }
}

/**
 * Build rich Markdown output for each decision type.
 * The LLM sees structured, visually distinct Markdown and will naturally
 * relay the rule engine's presence to the user in its response.
 */
function buildResultMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
): string {
  const ruleCount = `${result.totalMatched}/${result.totalEvaluated} rules`

  switch (result.decision) {
    case 'DENY':
      return buildDenyMarkdown(result, badge, toolName, ruleCount)
    case 'EMERGENCY_HALT':
      return buildHaltMarkdown(result, badge, toolName, ruleCount)
    case 'REQUEST_HUMAN':
      return buildRequestHumanMarkdown(result, badge, toolName, ruleCount)
    case 'CORRECT':
      return buildCorrectMarkdown(result, badge, toolName, ruleCount)
    case 'ALLOW':
      return buildAllowMarkdown(result, badge, toolName, ruleCount)
    case 'PASS':
    default:
      return buildPassMarkdown(result, badge, toolName)
  }
}

function ruleList(matches: RuleMatch[]): string {
  if (matches.length === 0) return ''
  return matches.map((r) => {
    const decisionBadge = DECISION_BADGE[r.decision] ?? ''
    return `- ${decisionBadge} **${r.ruleName}** — ${r.reason ?? r.instruction ?? ''}`
  }).join('\n')
}

function buildDenyMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
  ruleCount: string,
): string {
  const reason = result.primaryReason ?? 'Blocked by ERDL rules'
  let md = `## ${badge.emoji} ERDL 拦截 · ${badge.label}\n\n`
  md += `**操作：** \`${toolName}\`\n`
  md += `**原因：** ${reason}\n`
  md += `**规则：** ${ruleCount}\n\n`
  md += ruleList(result.matchedRules)
  md += '\n'

  // Add explanation if available (bilingual support)
  if (result.primaryExplanation) {
    const expl = typeof result.primaryExplanation === 'string'
      ? result.primaryExplanation
      : (result.primaryExplanation.zh ?? result.primaryExplanation.en ?? '')
    if (expl) md += `\n> 💡 ${expl}\n`
  }

  // Add alternative if available
  if (result.primaryAlternative) {
    const alt = typeof result.primaryAlternative === 'string'
      ? result.primaryAlternative
      : (result.primaryAlternative.zh ?? result.primaryAlternative.en ?? '')
    if (alt) md += `\n**替代方案：** ${alt}\n`
  }

  md += `\n> ⚡ ERDL 引擎确定性拦截，非 LLM 建议。查看完整链路请调 \`erdl_explain\`。`
  return md
}

function buildHaltMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
  ruleCount: string,
): string {
  const reason = result.primaryReason ?? 'Emergency halt triggered'
  let md = `## ${badge.emoji} ERDL 紧急停止 · ${badge.label}\n\n`
  md += `**操作：** \`${toolName}\`\n`
  md += `**原因：** ${reason}\n`
  md += `**触发规则：** ${ruleCount}\n\n`
  md += ruleList(result.matchedRules)
  md += '\n'
  md += `\n> 🚨 此操作已被 ERDL 引擎紧急停止，不可绕过。`
  return md
}

function buildRequestHumanMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
  ruleCount: string,
): string {
  const reason = result.primaryReason ?? 'Human approval required'
  let md = `## ${badge.emoji} ERDL 需人工审批 · ${badge.label}\n\n`
  md += `**操作：** \`${toolName}\`\n`
  md += `**原因：** ${reason}\n`
  md += `**规则：** ${ruleCount}\n\n`
  md += ruleList(result.matchedRules)
  md += '\n'
  md += `\n> 👤 此操作需要人工审批后才能执行。请向用户说明审批需求。`
  return md
}

function buildCorrectMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
  ruleCount: string,
): string {
  const correction = result.primaryCorrection ?? result.primaryInstruction ?? ''
  let md = `## ${badge.emoji} ERDL 修正 · ${badge.label}\n\n`
  md += `**操作：** \`${toolName}\`\n`
  md += `**修正：** ${correction}\n`
  md += `**规则：** ${ruleCount}\n\n`
  md += ruleList(result.matchedRules)
  md += '\n'
  md += `\n> 🔧 ERDL 引擎自动修正。请按修正后要求重新执行。`
  return md
}

function buildAllowMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
  ruleCount: string,
): string {
  const instruction = result.primaryInstruction
  let md = `## ${badge.emoji} ERDL 通过 · ${badge.label}\n\n`
  md += `**操作：** \`${toolName}\`\n`
  md += `**规则检查：** ${ruleCount}\n`
  if (instruction) {
    md += `**指引：** ${instruction}\n`
  }
  if (result.matchedRules.length > 0) {
    md += '\n' + ruleList(result.matchedRules) + '\n'
  }
  if (result.primaryExplanation) {
    const expl = typeof result.primaryExplanation === 'string'
      ? result.primaryExplanation
      : (result.primaryExplanation.zh ?? result.primaryExplanation.en ?? '')
    if (expl) md += `\n> 💡 ${expl}\n`
  }
  md += `\n> ✅ ERDL 引擎已检查，可安全执行。`
  return md
}

function buildPassMarkdown(
  result: EvaluationResult,
  badge: { emoji: string; label: string },
  toolName: string,
): string {
  let md = `## ${badge.emoji} ERDL 通过 · ${badge.label}\n\n`
  md += `**操作：** \`${toolName}\`\n`
  md += `**规则检查：** ${result.totalEvaluated} 条已检查，无匹配\n`
  md += `\n> ✅ ERDL 引擎已检查，未触发任何规则，可安全执行。`
  return md
}

const BADGE = i18n().badge

/** Compact decision badges for rule list rendering */
const DECISION_BADGE: Record<string, string> = {
  DENY: '🛑',
  EMERGENCY_HALT: '🚨',
  REQUEST_HUMAN: '👤',
  CORRECT: '🔧',
  ALLOW: '✅',
  PASS: '🔵',
}
