/**
 * ERDL MCP Server — Writing Preset Rules (Tool Call Guard mode)
 *
 * Rules match against tool_name + tool_args, per ERDL Spec §5.3.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08 · updated 2026-07-11 (friendly explanations + bilingual support)
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
      explanation: {
        zh: '套话开头（"随着...的发展""在当今时代"）会立即降低读者信任——听起来像模板生成的、而不是人写的。直接切入主题，把最有价值的信息放在第一句。',
        en: 'Cliché openings ("In today\'s digital age" "It is noteworthy that") instantly erode reader trust — they sound template-generated rather than human. Start directly with the most valuable information in the first sentence.',
      },
    },
    priority: 3,
    enabled: true,
    version: 2,
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
      explanation: {
        zh: '被动语态和模糊措辞（"可能""也许""一定程度上"）让写作看起来犹豫不决。主动语态直接有力，读者不需要猜测谁做了什么。',
        en: 'Passive voice and hedging ("might" "could potentially" "to some extent") make writing look indecisive. Active voice is direct and forceful — readers never have to guess who did what.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
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
      explanation: {
        zh: '长句子要求读者在脑中保持多个嵌套逻辑关系。25 个单词大约是人脑工作记忆的一次性容量上限。超出这个长度的句子，读者需要回读才能理解。',
        en: 'Long sentences force readers to hold multiple nested logical relationships in working memory. 25 words is roughly the upper limit of what the brain can process in a single pass. Longer sentences demand re-reading.',
      },
    },
    priority: 10,
    enabled: true,
    version: 2,
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
      explanation: {
        zh: 'AI 套话（赋能、抓手、闭环、降本增效）是信噪比最低的语言——它们听起来很厉害，但什么也没说。用普通人能听懂的话解释你做了什么和为什么。',
        en: 'AI buzzwords (empower, leverage, ecosystem, synergy) have the lowest signal-to-noise ratio — they sound impressive but say nothing. Use plain language that any human would understand.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
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
      explanation: {
        zh: '中文与英文/数字之间不空格会让文字挤在一起，视觉上难以分辨词边界。这是中文排版的基本规范，也是专业内容的标志。',
        en: 'Missing spaces between Chinese and English text make characters visually merge, making word boundaries difficult to parse. It\'s basic Chinese typography and a hallmark of professional content.',
      },
    },
    priority: 3,
    enabled: true,
    version: 2,
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
      explanation: {
        zh: '跳级标题（H1 直接到 H3）破坏了文档的层级结构，让大纲失去导航作用。标题层级本身就是一种信息架构——不是装饰。',
        en: 'Skipping heading levels (H1 straight to H3) breaks the document hierarchy and makes outlines useless for navigation. Heading levels are information architecture, not decoration.',
      },
    },
    priority: 10,
    enabled: true,
    version: 2,
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
      explanation: {
        zh: '列表中混用不同语法结构会让读者无法形成扫描节奏。列表的价值在于可扫描性——如果每行的开头都在变化，就失去了这个优势。',
        en: 'Mixing grammatical structures in a list destroys the reader\'s scanning rhythm. Lists are valuable because they\'re scannable — if every line starts differently, that advantage is lost.',
      },
    },
    priority: 15,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
]

export const allWritingRules: RuleDefinition[] = [
  ...toneRules,
  ...formattingRules,
]
