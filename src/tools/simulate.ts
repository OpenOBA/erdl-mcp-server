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
import { i18n } from '../i18n/index.js'

const evaluator = new Evaluator()

export const simulateToolDef = {
  name: 'erdl_simulate',
  title: 'Simulate ERDL Rule',
  description: i18n().simulate.description,

  inputSchema: {
    type: 'object',
    properties: {
      ruleName: {
        type: 'string',
        description: 'Proposed rule name',
      },
      category: {
        type: 'string',
        enum: ['coding', 'engineering', 'writing', 'design', 'security', 'performance', 'testing', 'compliance', 'accessibility', 'custom'],
        description: 'Rule category',
      },
      triggers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tool name triggers (e.g., ["exec", "write_file"])',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tool names or args values to match',
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
  matchField?: string
  decision: string
  instruction: string
}) {
  if (!args.ruleName || typeof args.ruleName !== 'string') {
    return { content: [{ type: 'text' as const, text: 'Invalid input: ruleName is required' }], isError: true }
  }
  // Build a temporary rule
  const tempRule: RuleDefinition = {
    id: 'SIM-TEMP',
    name: args.ruleName,
    description: args.ruleName,
    category: args.category as RuleCategory,
    conditions: [{
      kind: 'context_matches',
      field: args.matchField ?? 'tool.name',
      operator: 'in',
      value: args.keywords,
    }],
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
    const match = evaluator.simulate(tempRule, sc.context)
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
    text += `   Context: ${JSON.stringify(r.context)}\n`
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

function buildScenarios(args: { ruleName: string; keywords: string[]; decision: string; instruction: string; matchField?: string }) {
  const field = args.matchField ?? 'tool.name'
  const isBlockRule = args.decision === 'DENY'
  const kw = args.keywords.join(', ')

  // Tool call guard context
  function ctx(value: unknown): Record<string, unknown> {
    if (field === 'tool.name') return { 'tool.name': value }
    // For tool.args.* fields, construct nested context
    const parts = field.split('.')
    const nested: Record<string, unknown> = {}
    let node: Record<string, unknown> = nested
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = {}
      node = node[parts[i]] as Record<string, unknown>
    }
    node[parts[parts.length - 1]] = value
    // Also provide flattened access
    nested[field] = value
    if (field.startsWith('tool.args.')) {
      nested['tool.name'] = 'test_tool'
    }
    return nested
  }

  if (isBlockRule) {
    return [
      {
        description: `${args.ruleName} — should BLOCK`,
        intent: '',
        context: ctx(args.keywords[0]),
        expectedDecision: 'DENY' as const,
      },
      {
        description: `${args.ruleName} — should NOT block (different tool)`,
        intent: '',
        context: ctx('safe_tool'),
        expectedDecision: 'NONE' as const,
      },
      {
        description: `${args.ruleName} — should NOT block (empty context)`,
        intent: '',
        context: {},
        expectedDecision: 'NONE' as const,
      },
    ]
  }

  return [
    {
      description: `${args.ruleName} — should match (${field}: ${kw})`,
      intent: '',
      context: ctx(args.keywords[0]),
      expectedDecision: 'ALLOW' as const,
    },
    {
      description: `${args.ruleName} — should not match (different ${field})`,
      intent: '',
      context: ctx('unrelated'),
      expectedDecision: 'NONE' as const,
    },
    {
      description: `${args.ruleName} — edge case (empty context)`,
      intent: '',
      context: {},
      expectedDecision: 'NONE' as const,
    },
  ]
}
