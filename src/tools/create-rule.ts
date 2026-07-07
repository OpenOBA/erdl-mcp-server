/**
 * ERDL MCP Server — create-rule tool
 *
 * Creates a new ERDL rule from a natural language description.
 * User says "remember X" → Agent calls this tool → rule saved to ~/.openoba/rules/
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { ruleStore } from '../engine/rule-store.js'
import type { RuleDefinition, RuleCategory } from '../engine/rule-definition.js'

/** Auto-incrementing rule ID counter per category */
const categoryCounters: Record<string, number> = {
  coding: 0,
  writing: 0,
  design: 0,
  custom: 0,
}

export const createRuleToolDef = {
  name: 'erdl_create_rule',
  title: 'Create ERDL Rule',
  description: `Create a new ERDL rule from natural language.
Use this when the user corrects your behavior and wants you to "remember" it.

EXAMPLE SCENARIOS:
- User: "Never use 'any' types" → Create: coding rule, intent: "write typescript code", DENY if "any" appears
- User: "Don't start with '在当今时代'" → Create: writing rule, intent: "write blog post", DENY
- User: "Always use Tailwind, never inline styles" → Create: design rule, intent: "create UI", ALLOW with instruction

The rule is saved to ~/.openoba/rules/ and takes effect immediately (no restart needed).`,

  inputSchema: {
    type: 'object',
    properties: {
      naturalLanguage: {
        type: 'string',
        description: 'The rule described in natural language, e.g., "Never use TypeScript any type, use unknown instead"',
      },
      category: {
        type: 'string',
        enum: ['coding', 'writing', 'design', 'custom'],
        description: 'Rule category',
      },
      triggers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Intent triggers (e.g., ["write_code", "output_typescript"])',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Keywords that should trigger this rule in the intent string',
      },
      decision: {
        type: 'string',
        enum: ['ALLOW', 'DENY'],
        description: 'ALLOW with instruction, or DENY with reason',
      },
      instruction: {
        type: 'string',
        description: 'What the Agent should do (for ALLOW) or the reason for blocking (for DENY)',
      },
    },
    required: ['naturalLanguage', 'category', 'decision', 'instruction'],
  },
}

export async function createRuleHandler(args: {
  naturalLanguage: string
  category: string
  triggers?: string[]
  keywords?: string[]
  decision: string
  instruction: string
}) {
  const category = args.category as RuleCategory

  // Generate ID
  if (!categoryCounters[category]) categoryCounters[category] = 0
  const existingInCategory = ruleStore.getAll().filter((r) => r.category === category).length
  categoryCounters[category] = Math.max(categoryCounters[category], existingInCategory)

  const prefix = category.substring(0, 2).toUpperCase()
  categoryCounters[category]++
  const num = String(categoryCounters[category]).padStart(3, '0')
  const ruleId = `${prefix}-${num}`

  // Build a short name from the NL description
  const name =
    args.naturalLanguage.length > 60
      ? args.naturalLanguage.substring(0, 57) + '...'
      : args.naturalLanguage

  const rule: RuleDefinition = {
    id: ruleId,
    name,
    description: args.naturalLanguage,
    category,
    triggers: args.triggers ?? [],
    conditions: [
      {
        kind: 'intent_contains',
        keywords: args.keywords ?? [],
      },
    ],
    action: {
      decision: args.decision as 'ALLOW' | 'DENY',
      instruction: args.decision === 'ALLOW' ? args.instruction : undefined,
      reason: args.decision === 'DENY' ? args.instruction : undefined,
    },
    priority: 10,
    enabled: true,
    version: 1,
  }

  const filePath = await ruleStore.saveRule(rule)

  return {
    content: [
      {
        type: 'text' as const,
        text: `Rule created: **${ruleId}** "${name}"\nCategory: ${category}\nSaved to: ${filePath}\n\nThis rule is now active. All future actions will be evaluated against it.`,
      },
    ],
    structuredContent: {
      ruleId,
      name,
      status: 'created' as const,
      filePath,
      category,
      decision: args.decision,
    },
  }
}
