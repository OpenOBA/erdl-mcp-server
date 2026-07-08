/**
 * ERDL MCP Server — Writing Preset Rules (Tool Call Guard mode)
 *
 * Rules match against tool_name + tool_args, per ERDL Spec §5.3.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08
 * @license MIT
 */

import type { RuleDefinition } from '../../engine/rule-definition.js'

const CONTENT_TOOLS = ['write_file', 'edit', 'apply_patch']

export const toneRules: RuleDefinition[] = [
  {
    id: 'WR-001',
    name: 'no_cliche',
    description: 'No cliché openings in Chinese or English.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'DO NOT use cliché openings: "在当今时代" "众所周知" "值得注意的是" "随着...的发展" "In today\'s digital age" "It is noteworthy that". Start directly.',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'WR-002',
    name: 'direct_tone',
    description: 'Active voice. Short, punchy sentences.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Use active voice. Subject-first. Avoid hedging: "might" "could potentially". State your position clearly.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'WR-003',
    name: 'short_sentences',
    description: 'Keep sentences under 25 words.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Keep sentences under 25 words. Break paragraphs at 3-4 sentences max. Use bullet points for lists.',
    },
    priority: 10,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'WR-004',
    name: 'no_ai_jargon',
    description: 'No AI buzzwords: 赋能 抓手 闭环 降本增效 leverage etc.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'NO AI buzzwords: "赋能" "抓手" "闭环" "底层逻辑" "降本增效". English: "empower" "leverage" "ecosystem" "synergy". Use plain human language.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]

export const formattingRules: RuleDefinition[] = [
  {
    id: 'FMT-001',
    name: 'chinese_english_spacing',
    description: 'Space between Chinese and English/numbers.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Add space between Chinese and English/numbers. Correct: "用 Agent 编码", not "用Agent编码".',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'FMT-002',
    name: 'heading_hierarchy',
    description: 'One H1. H2→H3, no skip levels.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'One H1 per document. H2 for sections, H3 for subsections. Never skip levels.',
    },
    priority: 10,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'FMT-003',
    name: 'list_consistency',
    description: 'Consistent list formatting and punctuation.',
    category: 'writing',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CONTENT_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'All list items same grammatical structure. Consistent end punctuation.',
    },
    priority: 15,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]

export const allWritingRules: RuleDefinition[] = [
  ...toneRules,
  ...formattingRules,
]
