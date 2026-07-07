/**
 * ERDL MCP Server — Coding Preset Rules
 *
 * 10 rules for TypeScript, Git, and dependency management.
 * These ship with the package and work immediately.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import type { RuleDefinition } from '../../engine/rule-definition.js'

export const typescriptRules: RuleDefinition[] = [
  {
    id: 'TS-001',
    name: 'No any types',
    description: 'Never use `any` in TypeScript. Use `unknown` with type guards, or define proper interfaces/types.',
    category: 'coding',
    triggers: ['write_code', 'output_code', 'generate_function', 'write_typescript'],
    conditions: [{ kind: 'intent_contains', keywords: ['typescript', '.ts', 'tsx', 'type', 'interface', 'function'] }],
    action: {
      decision: 'ALLOW',
      instruction:
        'Do NOT use `any` type. Use `unknown` with type guards, define a proper type/interface, or use generics. No `// @ts-ignore` either.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'TS-002',
    name: 'No @ts-ignore or @ts-expect-error without reason',
    description: 'Never suppress TypeScript errors without a documented reason.',
    category: 'coding',
    triggers: ['write_code', 'output_code', 'write_typescript'],
    conditions: [
      { kind: 'intent_contains', keywords: ['typescript', '.ts', 'tsx', 'fix', 'error', 'type error', 'build error'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Do NOT use `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why. If a type error occurs, fix it properly or use a type assertion with explanation.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'TS-003',
    name: 'Naming conventions',
    description: 'Use camelCase for variables/functions, PascalCase for classes/interfaces, UPPER_SNAKE_CASE for constants.',
    category: 'coding',
    triggers: ['write_code', 'output_code', 'write_typescript', 'write_javascript'],
    conditions: [
      { kind: 'intent_contains', keywords: ['typescript', 'javascript', '.ts', '.js', 'variable', 'function', 'class', 'interface', 'const'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Use camelCase for variables and functions, PascalCase for classes and interfaces, UPPER_SNAKE_CASE for constants. No Hungarian notation, no leading underscores unless private.',
    },
    priority: 10,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'TS-004',
    name: 'Handle promises properly',
    description: 'Always await promises or return them. Never fire-and-forget without .catch().',
    category: 'coding',
    triggers: ['write_code', 'output_code', 'write_typescript', 'write_javascript'],
    conditions: [
      { kind: 'intent_contains', keywords: ['async', 'await', 'promise', 'fetch', 'then', 'callback'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Always `await` promises or `.catch()` them. No floating promises. In React, use `useEffect` cleanup functions. In Node.js, handle `unhandledRejection`.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'TS-005',
    name: 'Avoid nested ternaries',
    description: 'Nested ternary operators are unreadable. Use if/else or extract to a function.',
    category: 'coding',
    triggers: ['write_code', 'output_code'],
    conditions: [{ kind: 'intent_contains', keywords: ['typescript', 'javascript', 'condition', 'ternary', 'inline'] }],
    action: {
      decision: 'ALLOW',
      instruction:
        'Do not use nested ternary operators (`a ? b : c ? d : e`). Use if/else statements or extract to a named function with early returns.',
    },
    priority: 20,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]

export const gitRules: RuleDefinition[] = [
  {
    id: 'GIT-001',
    name: 'Commit message format',
    description: 'Use conventional commit format: type(scope): description',
    category: 'coding',
    triggers: ['git_commit', 'commit_code', 'write_commit_message'],
    conditions: [{ kind: 'intent_contains', keywords: ['commit', 'git commit', 'git add'] }],
    action: {
      decision: 'ALLOW',
      instruction:
        'Use conventional commit format: `type(scope): description`. Types: feat, fix, docs, refactor, test, chore, style. Keep subject under 72 chars, use imperative mood.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'GIT-002',
    name: 'One commit one logical change',
    description: 'Each commit should address exactly one concern. Do not bundle unrelated changes.',
    category: 'coding',
    triggers: ['git_commit', 'commit_code'],
    conditions: [{ kind: 'intent_contains', keywords: ['commit', 'git commit', 'git add', 'bundle', 'multiple'] }],
    action: {
      decision: 'ALLOW',
      instruction:
        'One commit = one logical change. Do not mix refactoring with feature changes in the same commit. Split into separate commits if needed.',
    },
    priority: 10,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'GIT-003',
    name: 'PR title with emoji prefix',
    description: 'Pull request titles should start with a relevant emoji for quick scanning.',
    category: 'coding',
    triggers: ['git_commit', 'create_pr', 'pull_request'],
    conditions: [{ kind: 'intent_contains', keywords: ['pr', 'pull request', 'merge request', 'github', 'gitlab'] }],
    action: {
      decision: 'ALLOW',
      instruction:
        'PR titles should start with an emoji: ✨ feat, 🐛 fix, 📝 docs, ♻️ refactor, ✅ test, 🔧 chore, 🎨 style. Example: "✨ feat: add user authentication".',
    },
    priority: 15,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]

export const dependenciesRules: RuleDefinition[] = [
  {
    id: 'DEP-001',
    name: 'Confirm before adding dependencies',
    description: 'Ask for user confirmation before adding any new npm/pip/cargo dependency.',
    category: 'coding',
    triggers: ['write_code', 'add_dependency', 'install_package'],
    conditions: [
      { kind: 'intent_contains', keywords: ['install', 'add', 'dependency', 'npm install', 'pip install', 'cargo add', 'yarn add', 'pnpm add', 'bun add'] },
    ],
    action: {
      decision: 'DENY',
      reason:
        'Adding a new dependency requires confirmation. Check if the project already has a similar package. List the proposed dependency name and version for user approval before proceeding.',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'DEP-002',
    name: 'Prefer existing dependencies',
    description: 'Before adding a new package, check if the project already has one that can do the job.',
    category: 'coding',
    triggers: ['write_code', 'add_dependency', 'install_package'],
    conditions: [
      { kind: 'intent_contains', keywords: ['install', 'add', 'dependency', 'package', 'library', 'need'] },
    ],
    action: {
      decision: 'ALLOW',
      instruction:
        'Before suggesting a new dependency, review the project\'s existing dependencies (package.json / requirements.txt / Cargo.toml). If an existing package can serve the need, use that instead.',
    },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
]

export const allCodingRules: RuleDefinition[] = [
  ...typescriptRules,
  ...gitRules,
  ...dependenciesRules,
]
