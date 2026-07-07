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
import type { EvaluationResult } from '../engine/rule-definition.js'

const evaluator = new Evaluator()

export const explainToolDef = {
  name: 'erdl_explain',
  title: 'Explain ERDL Decision',
  description: `Show the FULL decision trail for the last action.
Answers "why did you do that?" — shows every rule that was checked and whether it fired.

Use this when:
- User asks "why did you act that way?"
- User is confused about a DENY or unexpected ALLOW
- You want to show transparency in your decision-making`,

  inputSchema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        description: 'The intent to explain (same as you used for erdl_evaluate)',
      },
      context: {
        type: 'object',
        description: 'The same context you used for erdl_evaluate',
        additionalProperties: true,
      },
    },
    required: ['intent'],
  },
}

export async function explainHandler(args: { intent: string; context?: Record<string, unknown> }) {
  const allRules = ruleStore.getAll()
  const enabled = allRules.filter((r) => r.enabled)
  const sorted = [...enabled].sort((a, b) => a.priority - b.priority)

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
    const match = evaluator.simulate(rule, args.intent, args.context ?? {})
    let conditionDetail = ''
    if (rule.conditions.length > 0) {
      const cond = rule.conditions[0]
      switch (cond.kind) {
        case 'intent_contains':
          conditionDetail = `intent contains any of: [${(cond.keywords ?? []).join(', ')}]`
          break
        case 'intent_matches':
          conditionDetail = `intent matches: /${cond.pattern ?? ''}/`
          break
        case 'context_matches':
          conditionDetail = `context.${cond.field ?? ''} contains "${cond.value ?? ''}"`
          break
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
  let text = `## Decision Trail for: "${args.intent}"\n\n`

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
  const result: EvaluationResult = evaluator.evaluate(enabled, args.intent, args.context ?? {})
  text += `### Final Decision: ${result.decision}\n`
  text += `Total rules checked: ${sorted.length} | Matched: ${matched.length} | Skipped: ${unmatched.length}\n`

  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: {
      intent: args.intent,
      decision: result.decision,
      totalChecked: sorted.length,
      matched: traces.filter((t) => t.matched),
      skipped: traces.filter((t) => !t.matched),
    },
  }
}
