/**
 * ERDL MCP Server — Design Preset Rules
 *
 * 3 rules for Tailwind CSS, responsive design, and accessibility.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import type { RuleDefinition } from '../../engine/rule-definition.js'

export const tailwindRules: RuleDefinition[] = [
  {
    id: 'TW-001',
    name: 'Tailwind-first, no inline styles',
    description: 'Use Tailwind CSS classes. Never use inline styles or CSS modules unless absolutely necessary.',
    category: 'design',
    triggers: ['write_code', 'output_code', 'create_ui', 'write_component'],
    conditions: [
      { kind: 'intent_contains', keywords: ['ui', 'component', 'style', 'css', 'tailwind', 'frontend', 'react', 'vue'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Use Tailwind CSS utility classes exclusively. No inline `style={{}}` props. No CSS modules unless Tailwind cannot express the design (e.g., complex animations). Prefer Tailwind\'s built-in classes: `flex`, `grid`, `text-`, `bg-`, `p-`, `m-`, `rounded-`, `shadow-`.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'TW-002',
    name: 'Responsive-first design',
    description: 'Always consider mobile, tablet, and desktop. Use Tailwind breakpoint prefixes.',
    category: 'design',
    triggers: ['write_code', 'output_code', 'create_ui'],
    conditions: [
      { kind: 'intent_contains', keywords: ['ui', 'component', 'layout', 'responsive', 'mobile', 'desktop'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Design for mobile first, then enhance for larger screens. Use Tailwind breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px), `2xl:` (1536px). Test layout at 3 breakpoints minimum.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'A11Y-001',
    name: 'Accessibility basics',
    description: 'Ensure keyboard navigation, color contrast, and ARIA labels where needed.',
    category: 'design',
    triggers: ['write_code', 'output_code', 'create_ui'],
    conditions: [
      { kind: 'intent_contains', keywords: ['ui', 'component', 'button', 'form', 'input', 'modal', 'aria', 'accessibility', 'a11y'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Ensure accessibility: (1) All interactive elements are keyboard-focusable (tabIndex, onKeyDown). (2) Color contrast meets WCAG AA (4.5:1 for text). (3) Images have alt text. (4) Forms have labels associated with inputs. (5) Use semantic HTML (button, nav, main, article) instead of div-everything.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]

export const allDesignRules: RuleDefinition[] = [...tailwindRules]
