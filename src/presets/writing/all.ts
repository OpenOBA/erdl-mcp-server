/**
 * ERDL MCP Server — Writing Preset Rules
 *
 * 7 rules for tone, formatting, and avoiding AI jargon.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import type { RuleDefinition } from '../../engine/rule-definition.js'

export const toneRules: RuleDefinition[] = [
  {
    id: 'WR-001',
    name: 'No cliché openings',
    description: 'Avoid overused Chinese/English opening phrases that sound like AI-generated text.',
    category: 'writing',
    triggers: ['write_content', 'write_blog', 'write_post', 'write_article', 'write_tweet'],
    conditions: [
      { kind: 'intent_contains', keywords: ['write blog', 'write post', 'write article', 'write tweet', 'write content', '写文章', '写文案', 'blog post', 'newsletter'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'DO NOT use cliché openings: "在当今时代" "众所周知" "值得注意的是" "随着...的发展" "In today\'s digital age" "It is noteworthy that". Start directly with the point.',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'WR-002',
    name: 'Direct and forceful tone',
    description: 'Write with conviction. Subject-first sentences. Avoid passive voice.',
    category: 'writing',
    triggers: ['write_content', 'write_blog', 'write_post'],
    conditions: [
      { kind: 'intent_contains', keywords: ['write blog', 'write post', 'write article', 'write content', 'write copy', 'write marketing'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Use active voice. Subject-first. Short, punchy sentences. Avoid hedging: "might" "could potentially" "it is possible that". State your position clearly.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'WR-003',
    name: 'Short sentences preferred',
    description: 'Keep sentences under 25 words. Break up long paragraphs.',
    category: 'writing',
    triggers: ['write_content', 'write_blog'],
    conditions: [
      { kind: 'intent_contains', keywords: ['write blog', 'write article', 'write long', 'long-form', 'blog post'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Keep sentences under 25 words. Break paragraphs at 3-4 sentences max. Use bullet points for lists. A wall of text loses readers.',
    },
    priority: 10,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'WR-004',
    name: 'No AI jargon',
    description: 'Avoid words that scream "written by AI": empower, leverage, ecosystem, synergy, unlock potential.',
    category: 'writing',
    triggers: ['write_content', 'write_blog', 'write_post', 'write_article'],
    conditions: [
      { kind: 'intent_contains', keywords: ['write content', 'write blog', 'write marketing', 'write copy', '写文案', '写宣传'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'NO AI buzzwords: "赋能" "抓手" "闭环" "底层逻辑" "降本增效" "颗粒度" — and in English: "empower" "leverage" "ecosystem" "synergy" "unlock potential". Use plain, human language.',
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
    name: 'Chinese-English spacing',
    description: 'Insert a half-width space between Chinese and English/numbers.',
    category: 'writing',
    triggers: ['write_content', 'write_blog', 'write_post'],
    conditions: [
      { kind: 'intent_contains', keywords: ['中文', 'Chinese', 'write chinese', '中文内容', '中文文章', 'Chinese content'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Add a space between Chinese characters and English/numbers. Correct: "用 Agent 编码" ✗ "用Agent编码". Correct: "2026 年" ✗ "2026年" (unless it\'s a year expression in context).',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'FMT-002',
    name: 'Heading hierarchy',
    description: 'Use proper heading levels. Only one H1 per document.',
    category: 'writing',
    triggers: ['write_content', 'write_blog', 'write_document'],
    conditions: [
      { kind: 'intent_contains', keywords: ['write document', 'write markdown', 'write article', 'documentation', 'readme'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'One H1 (#) per document (the title). Use H2 for sections, H3 for subsections. Never skip levels (H2 → H4 without H3).',
    },
    priority: 10,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'FMT-003',
    name: 'List format consistency',
    description: 'Keep list formatting consistent: same punctuation style, same sentence structure.',
    category: 'writing',
    triggers: ['write_content', 'write_blog'],
    conditions: [
      { kind: 'intent_contains', keywords: ['bullet list', 'numbered list', 'checklist', 'write list', 'format list'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'All items in a list should follow the same grammatical structure (all nouns, or all verb phrases). End with consistent punctuation — either all periods or no periods, not mixed.',
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
