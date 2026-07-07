/**
 * ERDL MCP Server — simulate tool
 *
 * Test a rule against 3 synthetic scenarios before committing.
 * Uses the same evaluator as the actual production path.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { Evaluator } from '../engine/evaluator.js'
import type { RuleDefinition, RuleCategory } from '../engine/rule-definition.js'

const evaluator = new Evaluator()

export const simulateToolDef = {
  name: 'erdl_simulate',
  title: 'Simulate ERDL Rule',
  description: `Test a potential rule against 3 scenarios BEFORE creating it.
This prevents "wishful thinking" rules that sound right but don't work.

Always call this BEFORE erdl_create_rule when the user says "remember this" or "create a rule".
Show the simulation results and ask if the user wants to proceed.`,

  inputSchema: {
    type: 'object',
    properties: {
      ruleName: {
        type: 'string',
        description: 'Proposed rule name',
      },
      category: {
        type: 'string',
        enum: ['coding', 'writing', 'design', 'custom'],
        description: 'Rule category',
      },
      triggers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Intent triggers',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords that should trigger this rule',
      },
      decision: {
        type: 'string',
        enum: ['ALLOW', 'DENY'],
        description: 'What happens when rule matches',
      },
      instruction: {
        type: 'string',
        description: 'The instruction or reason',
      },
    },
    required: ['ruleName', 'category', 'keywords', 'decision', 'instruction'],
  },
}

export async function simulateHandler(args: {
  ruleName: string
  category: string
  triggers?: string[]
  keywords: string[]
  decision: string
  instruction: string
}) {
  // Build a temporary rule
  const tempRule: RuleDefinition = {
    id: 'SIM-TEMP',
    name: args.ruleName,
    description: args.ruleName,
    category: args.category as RuleCategory,
    triggers: args.triggers ?? [],
    conditions: [{ kind: 'intent_contains', keywords: args.keywords }],
    action: {
      decision: args.decision as 'ALLOW' | 'DENY',
      instruction: args.decision === 'ALLOW' ? args.instruction : undefined,
      reason: args.decision === 'DENY' ? args.instruction : undefined,
    },
    priority: 10,
    enabled: true,
    version: 1,
  }

  // Generate 3 test scenarios
  const scenarios = buildScenarios(args)

  const results = scenarios.map((sc) => {
    const match = evaluator.simulate(tempRule, sc.intent, sc.context)
    return {
      ...sc,
      matched: match !== null,
      decision: match?.decision ?? 'NONE',
      correct: sc.expectedDecision === (match?.decision ?? 'NONE'),
    }
  })

  // Build readable output
  let text = `## Rule Simulation: "${args.ruleName}"\n\n`
  for (const r of results) {
    const icon = r.correct ? '✅' : '⚠️'
    text += `${icon} **${r.description}**\n`
    text += `   Intent: "${r.intent}"\n`
    text += `   Result: ${r.matched ? r.decision : 'PASS (no match)'}`
    if (!r.correct) text += ` [Expected: ${r.expectedDecision}]`
    text += '\n\n'
  }

  const passCount = results.filter((r) => r.correct).length
  text += `### Summary: ${passCount}/${results.length} scenarios correct\n\n`
  if (passCount < results.length) {
    text += '⚠️ Some scenarios did not produce the expected outcome. Consider adjusting the keywords or triggers.\n\n'
  }
  text += 'Proceed to create? Use erdl_create_rule to save, or adjust the parameters and try again.'

  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: {
      ruleName: args.ruleName,
      results,
      passCount,
      totalScenarios: results.length,
      recommendation: passCount === results.length ? 'ready' : 'needs-adjustment',
    },
  }
}

function buildScenarios(args: { ruleName: string; keywords: string[]; decision: string; instruction: string }) {
  const isBlockRule = args.decision === 'DENY'
  const kw = args.keywords.join(', ')

  if (isBlockRule) {
    return [
      {
        description: `${args.ruleName} — should BLOCK`,
        intent: `I need to do something with ${args.keywords[0]}`,
        context: {},
        expectedDecision: 'DENY' as const,
      },
      {
        description: `${args.ruleName} — should NOT block (different intent)`,
        intent: 'I need to do something completely different',
        context: {},
        expectedDecision: 'NONE' as const,
      },
      {
        description: `${args.ruleName} — should NOT block (related but different)`,
        intent: `I need to check ${args.keywords[0]} alternatives`,
        context: {},
        expectedDecision: 'NONE' as const,
      },
    ]
  }

  return [
    {
      description: `${args.ruleName} — should match (keywords: ${kw})`,
      intent: `I need to do something with ${args.keywords[0]}`,
      context: {},
      expectedDecision: 'ALLOW' as const,
    },
    {
      description: `${args.ruleName} — should not match (different intent)`,
      intent: 'I need to do something completely different',
      context: {},
      expectedDecision: 'NONE' as const,
    },
    {
      description: `${args.ruleName} — edge case (partial keyword overlap)`,
      intent: `I need to check if this is related to ${args.keywords[0]}`,
      context: {},
      expectedDecision: 'ALLOW' as const,
    },
  ]
}
