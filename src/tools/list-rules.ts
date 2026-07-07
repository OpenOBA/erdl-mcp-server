/**
 * ERDL MCP Server — list-rules tool
 *
 * Lists all currently loaded rules with their status.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { ruleStore } from '../engine/rule-store.js'

export const listRulesToolDef = {
  name: 'erdl_list_rules',
  title: 'List ERDL Rules',
  description: `List all currently loaded ERDL rules.
Use this when the user asks "what rules do you have?" or wants to see what constraints are active.
Categorize by type: coding, writing, design, custom.`,

  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['coding', 'writing', 'design', 'custom', 'all'],
        description: 'Filter by category. Use "all" or omit to show everything.',
      },
    },
  },
}

export async function listRulesHandler(args: { category?: string }) {
  const allRules = ruleStore.getAll()
  const category = args.category ?? 'all'

  const filtered = category === 'all' ? allRules : allRules.filter((r) => r.category === category)
  const sorted = [...filtered].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.priority - b.priority
  })

  if (sorted.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No rules loaded yet. Create your first rule with erdl_create_rule or add YAML files to ~/.openoba/rules/.',
        },
      ],
      structuredContent: { count: 0, rules: [] },
    }
  }

  // Group by category
  const groups: Record<string, typeof sorted> = {}
  for (const rule of sorted) {
    if (!groups[rule.category]) groups[rule.category] = []
    groups[rule.category].push(rule)
  }

  let text = '## Your ERDL Rules\n\n'
  for (const [cat, rules] of Object.entries(groups)) {
    const emoji = cat === 'coding' ? '🧑‍💻' : cat === 'writing' ? '✍️' : cat === 'design' ? '🎨' : '📦'
    text += `### ${emoji} ${cat} (${rules.length})\n`
    for (const r of rules) {
      const status = r.enabled ? '✅' : '❌'
      const hits = r.hitCount ? ` (${r.hitCount} hits)` : ''
      text += `- ${status} **${r.id}** ${r.name}${hits}\n`
      text += `  ${r.description}\n`
    }
    text += '\n'
  }

  text += `\nTotal: ${sorted.length} rules. Create more: use erdl_create_rule or edit ~/.openoba/rules/`

  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: {
      count: sorted.length,
      categories: Object.keys(groups),
      rules: sorted.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        enabled: r.enabled,
        priority: r.priority,
        hitCount: r.hitCount ?? 0,
      })),
    },
  }
}
