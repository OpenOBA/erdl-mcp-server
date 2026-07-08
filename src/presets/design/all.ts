/**
 * ERDL MCP Server — Design Preset Rules (Tool Call Guard mode)
 *
 * Rules match against tool_name + tool_args, per ERDL Spec §5.3.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08
 * @license MIT
 */

import type { RuleDefinition } from '../../engine/rule-definition.js'

const UI_TOOLS = ['write_file', 'edit', 'apply_patch']

export const designRules: RuleDefinition[] = [
  {
    id: 'DS-001',
    name: 'tailwind_first',
    description: 'Use Tailwind CSS. No inline styles.',
    category: 'design',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: UI_TOOLS }],
    action: { decision: 'ALLOW', instruction: 'Use Tailwind CSS classes. No inline styles or CSS modules unless absolutely necessary.' },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'DS-002',
    name: 'responsive_first',
    description: 'Mobile-first responsive design. Min 3 breakpoints.',
    category: 'design',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: UI_TOOLS }],
    action: { decision: 'ALLOW', instruction: 'Mobile-first design. At least 3 breakpoints: sm, md, lg (Tailwind default).' },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'DS-003',
    name: 'a11y_basics',
    description: 'Accessibility basics: keyboard reachable, contrast, alt text, labels, semantic HTML.',
    category: 'design',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: UI_TOOLS }],
    action: { decision: 'ALLOW', instruction: 'Ensure: (1) keyboard-reachable, (2) WCAG AA 4.5:1 contrast, (3) img alt, (4) form labels, (5) semantic HTML.' },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]
