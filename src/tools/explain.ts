/**
 * ERDL MCP Server — explain tool
 *
 * Shows the full decision trail: which rules fired, which didn't, and why.
 * Builds trust by making ERDL's decisions transparent.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07 · updated 2026-07-17 (rich Markdown with explanations)
 * @license MIT
 */

import { Evaluator } from '../engine/evaluator.js'
import { ruleStore } from '../engine/rule-store.js'
import { i18n } from '../i18n/index.js'
import type { EvaluationResult, RuleDefinition } from '../engine/rule-definition.js'

const evaluator = new Evaluator()

export const explainToolDef = {
  name: 'erdl_explain',
  title: 'Explain ERDL Decision',
  description: i18n().explain.description,

  inputSchema: {
    type: 'object',
    properties: {
      tool_name: {
        type: 'string',
        description: 'The tool name to explain (same as you used for erdl_evaluate)',
      },
      tool_args: {
        type: 'object',
        description: 'The same tool arguments you used for erdl_evaluate',
        additionalProperties: true,
      },
    },
    required: ['tool_name'],
  },
}

export async function explainHandler(args: {
  tool_name: string
  tool_args?: Record<string, unknown>
}) {
  if (!args.tool_name || typeof args.tool_name !== 'string') {
    return { content: [{ type: 'text' as const, text: 'Invalid input: tool_name must be a non-empty string' }], isError: true }
  }
  const allRules = ruleStore.getAll()
  const enabled = allRules.filter((r) => r.enabled)
  const sorted = [...enabled].sort((a, b) => a.priority - b.priority)

  // Build guard context
  const ctx: Record<string, unknown> = {
    'tool.name': args.tool_name,
    'tool.args': args.tool_args ?? {},
  }
  if (args.tool_args) {
    for (const [key, value] of Object.entries(args.tool_args)) {
      ctx[`tool.args.${key}`] = value
    }
  }

  // Evaluate every rule individually
  type RuleTrace = {
    ruleId: string
    ruleName: string
    category: string
    priority: number
    matched: boolean
    decision?: string
    conditionDetail: string
    explanation?: string
    alternative?: string
    ring?: number
  }

  const traces: RuleTrace[] = sorted.map((rule) => {
    const match = evaluator.simulate(rule, ctx)
    const conditionDetail = formatCondition(rule)

    // Extract bilingual explanation (prefer zh if available)
    const expl = rule.action.explanation
    const explanation = typeof expl === 'string' ? expl : (expl?.zh ?? expl?.en)
    const alt = rule.action.alternative
    const alternative = typeof alt === 'string' ? alt : (alt?.zh ?? alt?.en)

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      priority: rule.priority,
      matched: match !== null,
      decision: match?.decision,
      conditionDetail,
      explanation,
      alternative,
      ring: rule.action.ring,
    }
  })

  const matched = traces.filter((t) => t.matched)
  const unmatched = traces.filter((t) => !t.matched)

  // Build rich Markdown output
  let text = buildExplainMarkdown(args.tool_name, matched, unmatched, sorted.length)

  // Overall result
  const result: EvaluationResult = evaluator.evaluate(enabled, ctx)
  text += `\n### 最终判定: ${DECISION_BADGE[result.decision] ?? ''} ${result.decision}\n`
  text += `已检查 ${sorted.length} 条规则 | 命中 ${matched.length} 条 | 跳过 ${unmatched.length} 条\n`

  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: {
      tool_name: args.tool_name,
      decision: result.decision,
      totalChecked: sorted.length,
      matched: traces.filter((t) => t.matched),
      skipped: traces.filter((t) => !t.matched),
    },
  }
}

/** Format a rule's conditions into a human-readable string */
function formatCondition(rule: RuleDefinition): string {
  if (rule.conditions.length === 0) return '始终匹配（无条件）'

  const parts = rule.conditions.map((cond) => {
    if (cond.kind === 'context_matches') {
      const field = cond.field ?? ''
      const op = OPERATOR_LABEL[cond.operator ?? 'eq'] ?? cond.operator
      const val = typeof cond.value === 'string' ? `"${cond.value}"` : String(cond.value ?? '')
      return `\`${field}\` ${op} ${val}`
    }
    return `${cond.kind}`
  })

  const logic = rule.conditionLogic === 'OR' ? ' OR ' : ' AND '
  return parts.join(logic)
}

/** Build full explain Markdown with rule details */
function buildExplainMarkdown(
  toolName: string,
  matched: Array<{
    ruleId: string
    ruleName: string
    category: string
    priority: number
    decision?: string
    conditionDetail: string
    explanation?: string
    alternative?: string
    ring?: number
  }>,
  unmatched: Array<{ ruleId: string; ruleName: string; category: string }>,
  total: number,
): string {
  let md = `## 🔍 ERDL 决策链路\n\n`
  md += `**工具调用：** \`${toolName}\`\n`
  md += `**规则总数：** ${total}\n\n`

  // Matched rules — show full detail
  if (matched.length > 0) {
    md += `### ✅ 命中规则 (${matched.length}条)\n\n`

    // Group by decision for clarity
    const byDecision: Record<string, typeof matched> = {}
    for (const t of matched) {
      const d = t.decision ?? 'UNKNOWN'
      if (!byDecision[d]) byDecision[d] = []
      byDecision[d].push(t)
    }

    for (const [decision, rules] of Object.entries(byDecision)) {
      const badge = DECISION_BADGE[decision] ?? ''
      md += `#### ${badge} ${decision}\n\n`
      for (const t of rules) {
        md += `**${t.ruleName}** (\`${t.ruleId}\` · ${t.category} · 优先级 ${t.priority})`
        if (t.ring !== undefined) md += ` · Ring ${t.ring}`
        md += `\n`
        md += `> 条件: ${t.conditionDetail}\n`
        if (t.explanation) {
          md += `> 💡 ${t.explanation}\n`
        }
        if (t.alternative) {
          md += `> 🔄 替代方案: ${t.alternative}\n`
        }
        md += '\n'
      }
    }
  }

  // Unmatched rules — compact list
  if (unmatched.length > 0) {
    md += `### ⏭️ 未命中规则 (${unmatched.length}条)\n\n`
    for (const t of unmatched) {
      md += `- \`${t.ruleId}\` ${t.ruleName} (${t.category})\n`
    }
    md += '\n'
  }

  if (matched.length === 0) {
    md += `### 🔵 无规则命中\n\n`
    md += `当前操作未触发任何 ERDL 规则，可安全执行。\n\n`
  }

  md += `> ⚡ ERDL 引擎确定性评估。所有决策基于规则条件精确匹配，非 LLM 判断。\n`
  return md
}

const DECISION_BADGE: Record<string, string> = {
  DENY: '🛑',
  EMERGENCY_HALT: '🚨',
  REQUEST_HUMAN: '👤',
  CORRECT: '🔧',
  ALLOW: '✅',
  PASS: '🔵',
}

const OPERATOR_LABEL: Record<string, string> = {
  eq: '=',
  ne: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: '∈',
  not_in: '∉',
  contains: '包含',
  not_contains: '不包含',
  match: '匹配',
  exists: '存在',
  not_exists: '不存在',
}
