/**
 * ERDL MCP Server — Engineering Preset Rules (Tool Call Guard mode)
 *
 * Core discipline rules. Rules match against tool_name + tool_args,
 * per ERDL Spec §5.3. Previously inline YAML; now TypeScript RuleDefinition
 * for consistency with coding/design/writing presets.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08
 * @license MIT
 */

import type { RuleDefinition, RuleCondition } from '../../engine/rule-definition.js'

const CODING_TOOLS = ['write_file', 'edit', 'apply_patch', 'exec', 'write']
const ALL_TOOLS = [
  ...CODING_TOOLS,
  'web_search',
  'web_fetch',
  'read_file',
  'read',
  'memory_search',
  'memory_get',
  'sessions_spawn',
  'sessions_send',
  'cron',
  'apply_patch',
  'process',
  'skill_workshop',
  'canvas',
  'browser',
]

export const engineeringRules: RuleDefinition[] = [
  {
    id: 'EN-001',
    name: 'honesty_with_henry',
    description: '诚实汇报: 遇到问题如实知会 Henry。不隐瞒、不绕过、不假装没问题。',
    category: 'coding',
    triggers: ALL_TOOLS.slice(),
    conditions: [] as any[], // always matches
    action: {
      decision: 'ALLOW',
      instruction: '诚实汇报: 遇到问题如实知会 Henry。不隐瞒、不绕过、不假装没问题。不知道就说不知道。做错了就承认。',
    },
    priority: 1,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-002',
    name: 'stay_on_target',
    description: '长程任务: 先对齐目标再动手。不偏离 Spec。',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch', 'exec', 'apply_patch'],
    conditions: [] as any[], // always matches
    action: {
      decision: 'ALLOW',
      instruction: '长程任务: 先对齐目标再动手。不偏离 Spec。修改前: 读源码→问题分析→Henry 确认→动手。',
    },
    priority: 1,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-003',
    name: 'no_single_task_tunnel',
    description: '全局优先: 不为当前任务破坏一致性。不追求速度，以质量为准。',
    category: 'coding',
    triggers: CODING_TOOLS,
    conditions: [] as any[],
    action: {
      decision: 'ALLOW',
      instruction: '全局优先: 不为当前任务破坏一致性。不追求速度，以质量为准。',
    },
    priority: 2,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-004',
    name: 'design_before_code',
    description: 'Spec 先行: 先与 ERDL Spec 对齐。不先写代码再补 Spec。',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: [] as any[],
    action: {
      decision: 'ALLOW',
      instruction: 'Spec 先行: 先与 ERDL Spec 对齐。不先写代码再补 Spec。',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-005',
    name: 'no_stash',
    description: '禁止 stash 累积。所有变更入 commit。',
    category: 'coding',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' } as const],
    action: { decision: 'DENY', reason: '禁止 git stash 累积。所有变更必须入 commit。' },
    priority: 4,
    enabled: true,
    override: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-006',
    name: 'no_powershell_setcontent',
    description: '禁用 Set-Content/Out-File。损坏 UTF-8。',
    category: 'coding',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches' as const, field: 'tool.args.command', operator: 'match' as const, value: 'Set-Content|Out-File' }],
    action: { decision: 'DENY', reason: '禁用 Set-Content/Out-File。会损坏 UTF-8 编码。' },
    priority: 4,
    enabled: true,
    override: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-007',
    name: 'pipeline_before_push',
    description: '推送前: typecheck 0 error → build 0 error → test all pass。',
    category: 'coding',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' } as const],
    action: {
      decision: 'ALLOW',
      instruction: '推送前: typecheck 0 error → build 0 error → test all pass。',
    },
    priority: 3,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-008',
    name: 'no_shortcut',
    description: '禁止临时方案/workaround/hack。现在就从根本上解决。',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch', 'exec'],
    conditions: [] as RuleCondition[],
    action: { decision: 'ALLOW', instruction: '禁止临时方案。不要在任务中接受 workaround 或 hack。从根本上解决。' },
    priority: 5,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-009',
    name: 'docs_with_delivery',
    description: '文档即交付。代码写完不算完。',
    category: 'coding',
    triggers: ['write_file', 'edit', 'apply_patch', 'exec'],
    conditions: [] as any[],
    action: {
      decision: 'ALLOW',
      instruction: '文档即交付。代码写完不算完，文档更新才算交付完成。',
    },
    priority: 8,
    enabled: true,
    version: 1,
    hitCount: 0,
  },
  {
    id: 'EN-010',
    name: 'no_force_push_main',
    description: '禁止 force push master。',
    category: 'coding',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' } as const],
    action: { decision: 'DENY', reason: '禁止 force push master/main。' },
    priority: 1,
    enabled: true,
    override: true,
    version: 1,
    hitCount: 0,
  },
]
