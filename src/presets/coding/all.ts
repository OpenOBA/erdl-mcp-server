/**
 * ERDL MCP Server — Coding Preset Rules (Tool Call Guard mode)
 *
 * Rules match against tool_name + tool_args, per ERDL Spec §5.3.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08 · updated 2026-07-11 (friendly explanations + bilingual support)
 * @license MIT
 */

import type { RuleDefinition } from '../../engine/rule-definition.js'

const CODING_TOOLS = ['write_file', 'edit', 'apply_patch', 'exec', 'write']

export const codingRules: RuleDefinition[] = [
  {
    id: 'CD-001',
    name: 'no_any',
    description: 'Never use `any` in TypeScript.',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Do NOT use `any` type. Use `unknown` with type guards, define a proper type/interface, or use generics.',
      explanation: {
        zh: 'any 是 TypeScript 的"紧急出口"——用 any 等于关闭了类型检查，可能隐藏运行时错误。unknown 更安全：必须先做类型守卫才能使用，强迫你在使用前想清楚类型是什么。',
        en: 'any is TypeScript\'s "emergency exit" — using it disables type checking entirely, potentially hiding runtime errors. unknown is safer: you must type-guard before using, forcing you to think about what the type actually is.',
      },
      alternative: {
        zh: '用 unknown + 类型守卫、定义 interface/type、或使用泛型。仅在 API 边界且注释原因时可用 any。',
        en: 'Use unknown + type guards, define interface/type, or use generics. any only allowed at API boundaries with a comment explaining why.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-002',
    name: 'no_ts_ignore',
    description: 'Never suppress TypeScript errors without reason.',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Do NOT use @ts-ignore/@ts-expect-error without a comment explaining why.',
      explanation: {
        zh: '@ts-ignore 和 @ts-expect-error 是在告诉编译器"闭嘴"——但编译器报错通常有原因。如果确实需要忽略，必须注释说明原因，否则三个月后没人记得为什么。',
        en: '@ts-ignore and @ts-expect-error tell the compiler to "shut up" — but the compiler usually has a point. If you must silence it, document why, or nobody will remember three months from now.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-003',
    name: 'naming_conventions',
    description: 'camelCase for vars/functions, PascalCase for classes, UPPER_SNAKE for constants.',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Use camelCase, PascalCase, UPPER_SNAKE_CASE as appropriate.',
      explanation: {
        zh: '一致的命名规范让代码"自文档化"——看到 PascalCase 就知道是类/组件，看到 camelCase 就知道是函数/变量。命名不一致的代码阅读成本翻倍。',
        en: 'Consistent naming makes code self-documenting — PascalCase signals class/component, camelCase signals function/variable. Inconsistent naming doubles the cognitive cost of reading code.',
      },
    },
    priority: 10,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-004',
    name: 'handle_promises',
    description: 'Promise must be awaited or .catch()',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Every Promise must be awaited or have .catch() handler.',
      explanation: {
        zh: '未被 await 或 .catch 的 Promise 等于"扔出去不管"——如果它 reject 了，错误会被静默吞掉，排查极其困难。这是 Node.js 最常见的 bug 来源之一。',
        en: 'An un-awaited or uncatched Promise is "fire and forget" — if it rejects, the error is silently swallowed, making debugging incredibly hard. This is one of the most common Node.js bug sources.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-005',
    name: 'no_nested_ternary',
    description: 'No nested ternary expressions.',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'No nested ternary. Use if-else or switch.',
      explanation: {
        zh: '嵌套三元表达式（a ? b : c ? d : e）看似简洁，实则是一道阅读理解题。阅读者需要在脑中堆栈每个条件分支。超过一层的三元表达式不值得省那几行代码。',
        en: 'Nested ternaries (a ? b : c ? d : e) look terse but are a reading comprehension test. Readers must mentally stack every branch. Beyond one level, the line savings aren\'t worth the cognitive cost.',
      },
    },
    priority: 20,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-006',
    name: 'commit_format',
    description: 'Commit with type(scope): description format.',
    category: 'coding',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' }],
    action: {
      decision: 'ALLOW',
      instruction: 'Commit format: type(scope): description. E.g., feat(api): add user endpoint.',
      explanation: {
        zh: '规范的 commit message 是项目的"变更日志"——不需要翻代码就能知道每次提交做了什么。type(scope): description 格式已经被主流项目验证为最清晰的方式。',
        en: 'Well-formed commit messages are the project\'s changelog — you can understand every commit without reading the code. The type(scope): description format has been battle-tested by major projects.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-007',
    name: 'one_commit_one_change',
    description: 'One commit per logical change.',
    category: 'coding',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' }],
    action: {
      decision: 'ALLOW',
      instruction: 'One commit = one logical change. Separate concerns into distinct commits.',
      explanation: {
        zh: '一个 commit 包含多个无关改动时，cherry-pick/revert/bisect 都变得困难。只有原子化的 commit 才能被单独回溯、单独回滚、单独审查。',
        en: 'When a commit mixes unrelated changes, cherry-pick, revert, and bisect all become difficult. Only atomic commits can be individually traced, rolled back, and reviewed.',
      },
    },
    priority: 10,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-008',
    name: 'pr_emoji',
    description: 'PR title with emoji prefix.',
    category: 'coding',
    triggers: ['write_file', 'edit'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'PR title should start with emoji prefix: ✨ feat, 🐛 fix, 📖 docs, ♻️ refactor, etc.',
    },
    priority: 15,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-009',
    name: 'confirm_dependencies',
    description: 'New dependencies must be confirmed with Henry first.',
    category: 'coding',
    triggers: ['write_file', 'edit', 'exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'REQUEST_HUMAN',
      reason: 'New dependencies must be confirmed with Henry before adding.',
      explanation: {
        zh: '每个新依赖都是一份"技术债"——需要跟踪版本更新、处理 breaking changes、审计安全漏洞。不加节制地引入依赖会导致项目膨胀和脆弱。新增依赖前应该确认：现有依赖是否已能解决？轻量方案是否可以自己实现？',
        en: 'Every new dependency is technical debt — version updates to track, breaking changes to handle, security vulnerabilities to audit. Unchecked dependency growth leads to bloat and brittleness. Before adding: can existing dependencies solve this? Can a lightweight in-house solution work?',
      },
    },
    priority: 3,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
  {
    id: 'CD-010',
    name: 'prefer_existing',
    description: 'Prefer existing dependencies over adding new ones.',
    category: 'coding',
    triggers: ['write_file', 'edit', 'exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: CODING_TOOLS }],
    action: {
      decision: 'ALLOW',
      instruction: 'Check existing dependencies before adding new ones. Reuse what is already installed.',
      explanation: {
        zh: '项目中已经安装的依赖是经过验证的"工具箱"。优先使用它们，而不是每次都引入新工具——这样可以减少依赖冲突、降低 bundle 体积、统一技术栈。',
        en: 'Already-installed dependencies are your proven toolbox. Reuse them instead of introducing new tools every time — this reduces dependency conflicts, shrinks bundle size, and keeps the tech stack coherent.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    hitCount: 0,
  },
]
