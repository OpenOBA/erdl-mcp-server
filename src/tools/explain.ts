/**
 * ERDL MCP Server — explain tool
 *
 * Shows the full decision trail: which rules fired, which didn't, and why.
 * Builds trust by making ERDL's decisions transparent.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { Evaluator } from '../engine/evaluator.js'
import { ruleStore } from '../engine/rule-store.js'
import { i18n } from '../i18n/index.js'
import type { EvaluationResult } from '../engine/rule-definition.js'

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
  }

  const traces: RuleTrace[] = sorted.map((rule) => {
    const match = evaluator.simulate(rule, ctx)
    let conditionDetail = ''
    if (rule.conditions.length > 0) {
      const cond = rule.conditions[0]
      switch (cond.kind) {
        case 'context_matches':
          conditionDetail = `context.${cond.field ?? ''} ${cond.operator ?? 'contains'} "${cond.value ?? ''}"`
          break
        case 'intent_contains':
          conditionDetail = `legacy intent_contains: [${(cond.keywords ?? []).join(', ')}]`
          break
        case 'intent_matches':
          conditionDetail = `legacy intent_matches: /${cond.pattern ?? ''}/`
          break
        default:
          conditionDetail = `${cond.kind}`
      }
    } else {
      conditionDetail = 'always matches (no conditions)'
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      priority: rule.priority,
      matched: match !== null,
      decision: match?.decision,
      conditionDetail,
    }
  })

  const matched = traces.filter((t) => t.matched)
  const unmatched = traces.filter((t) => !t.matched)

  // Build output
  let text = `## Decision Trail for tool call: "${args.tool_name}"\n\n`

  if (matched.length > 0) {
    text += `### ✅ Matched Rules (${matched.length})\n`
    for (const t of matched) {
      text += `- **${t.ruleId}** ${t.ruleName} → ${t.decision}\n`
      text += `  Condition: ${t.conditionDetail}\n`
    }
    text += '\n'
  }

  if (unmatched.length > 0) {
    text += `### ⏭️ Skipped Rules (${unmatched.length})\n`
    for (const t of unmatched) {
      text += `- **${t.ruleId}** ${t.ruleName} — didn't match\n`
    }
    text += '\n'
  }

  // Overall result
  const result: EvaluationResult = evaluator.evaluate(enabled, ctx)
  text += `### Final Decision: ${result.decision}\n`
  text += `Total rules checked: ${sorted.length} | Matched: ${matched.length} | Skipped: ${unmatched.length}\n`

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
