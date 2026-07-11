/**
 * ERDL MCP Server — Design Preset Rules (Tool Call Guard mode)
 *
 * Rules match against tool_name + tool_args, per ERDL Spec §5.3.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08 · updated 2026-07-11 (friendly explanations + bilingual support)
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
    action: {
      decision: 'ALLOW',
      instruction: 'Use Tailwind CSS classes. No inline styles or CSS modules unless absolutely necessary.',
      explanation: {
        zh: '内联样式（style="color:red"）无法被 Tailwind 的类名系统管理，会导致样式碎片化——一部分在 class 里，一部分在 JSX 的 style 属性里，维护时需要在两个地方查找。Tailwind 让所有样式统一在 class 中表达。',
        en: 'Inline styles bypass Tailwind\'s class system, causing style fragmentation — some in class, some in style attributes, requiring two places to find and update. Tailwind keeps all styling in one coherent system.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'DS-002',
    name: 'responsive_first',
    description: 'Mobile-first responsive design. Min 3 breakpoints.',
    category: 'design',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: UI_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Mobile-first design. At least 3 breakpoints: sm, md, lg (Tailwind default).',
      explanation: {
        zh: '移动优先不是"顺便适配手机"——是先设计手机版，再向桌面扩展。这样能确保核心功能在小屏幕上可用。反过来（desktop-first）往往导致移动版成为缩水的残次品。',
        en: 'Mobile-first isn\'t "make it work on phones too" — it means design for mobile first, then expand to desktop. This guarantees core functionality works on small screens. Desktop-first often produces a compromised mobile afterthought.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'DS-003',
    name: 'a11y_basics',
    description: 'Accessibility basics: keyboard reachable, contrast, alt text, labels, semantic HTML.',
    category: 'design',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: UI_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Ensure: (1) keyboard-reachable, (2) WCAG AA 4.5:1 contrast, (3) img alt, (4) form labels, (5) semantic HTML.',
      explanation: {
        zh: '无障碍设计不只是道德义务——键盘用户、屏幕阅读器用户、色弱用户加起来占互联网人口 15% 以上。而且对无障碍友好的代码通常也更利于 SEO 和自动化测试。这是一次努力、多方受益的投资。',
        en: 'Accessibility isn\'t just a moral obligation — keyboard users, screen reader users, and color-blind users together exceed 15% of internet users. Accessible code also tends to be better for SEO and automated testing. It\'s one investment that pays out in multiple ways.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
]
