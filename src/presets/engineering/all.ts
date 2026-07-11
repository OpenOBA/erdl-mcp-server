/**
 * ERDL MCP Server — Engineering Preset Rules (Tool Call Guard mode)
 *
 * Core discipline rules for the OpenOBA workbench.
 * All rules are scopeLevel=1 (personal discipline).
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08 · updated 2026-07-11 (friendly explanations + bilingual support)
 * @license MIT
 */

import type { RuleDefinition, RuleCondition } from '../../engine/rule-definition.js'

const CODING_TOOLS = ['write_file', 'edit', 'apply_patch', 'exec', 'write']
const ALL_TOOLS = [
  ...CODING_TOOLS,
  'web_search', 'web_fetch', 'read_file', 'read',
  'memory_search', 'memory_get',
  'sessions_spawn', 'sessions_send',
  'cron', 'process', 'skill_workshop', 'canvas', 'browser',
]

const ALWAYS = [] as RuleCondition[]

export const engineeringRules: RuleDefinition[] = [
  {
    id: 'EN-001',
    name: 'honesty_with_henry',
    description: '诚实汇报: 遇到问题如实知会 Henry。不隐瞒、不绕过、不假装没问题。',
    category: 'engineering',
    triggers: ALL_TOOLS.slice(),
    conditions: ALWAYS,
    action: {
      decision: 'ALLOW',
      instruction: '诚实汇报: 遇到问题如实知会 Henry。不隐瞒、不绕过、不假装没问题。不知道就说不知道。做错了就承认。',
      explanation: {
        zh: '这条规则确保 AI 执行官像真正的执行合伙人一样工作——遇到障碍时坦诚沟通，而不是悄悄绕过问题。隐瞒的代价远大于坦白。',
        en: 'This rule ensures the AI executive works like a real partner — communicating blockers honestly instead of silently working around them. Hidden problems always cost more than admitted ones.',
      },
    },
    priority: 1,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-002',
    name: 'stay_on_target',
    description: '长程任务: 先对齐目标再动手。不偏离 Spec。',
    category: 'engineering',
    triggers: ['write_file', 'edit', 'apply_patch', 'exec'],
    conditions: ALWAYS,
    action: {
      decision: 'ALLOW',
      instruction: '长程任务: 先对齐目标再动手。不偏离 Spec。修改前: 读源码→问题分析→Henry 确认→动手。',
      explanation: {
        zh: '复杂任务容易在实施中偏离方向。这条规则要求每一步都与原始目标对齐，避免"做了一堆看起来相关、实际上跑偏了的工作"。',
        en: 'Complex tasks drift easily. This rule anchors every step to the original goal, preventing "busy work that looks relevant but missed the point."',
      },
    },
    priority: 1,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-003',
    name: 'no_single_task_tunnel',
    description: '全局优先: 不为当前任务破坏一致性。不追求速度，以质量为准。',
    category: 'engineering',
    triggers: CODING_TOOLS,
    conditions: ALWAYS,
    action: {
      decision: 'ALLOW',
      instruction: '全局优先: 不为当前任务破坏一致性。不追求速度，以质量为准。',
      explanation: {
        zh: '完成任务的捷径往往会留下技术债——硬编码、跳过测试、不一致的命名。这条规则要求每个修改都站在全局架构的视角考量，短期省下的时间会在未来加倍偿还。',
        en: 'Shortcuts taken for a single task — hardcoding, skipping tests, inconsistent naming — become debt that compounds. This rule demands every change consider the whole architecture, because time saved today costs double tomorrow.',
      },
    },
    priority: 2,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-004',
    name: 'design_before_code',
    description: 'Spec 先行: 先与 ERDL Spec 对齐。不先写代码再补 Spec。',
    category: 'engineering',
    triggers: ['write_file', 'edit', 'apply_patch'],
    conditions: ALWAYS,
    action: {
      decision: 'ALLOW',
      instruction: 'Spec 先行: 先与 ERDL Spec 对齐。不先写代码再补 Spec。',
      explanation: {
        zh: '先写代码再补文档，文档永远补不上。这条规则要求先明确定义（Spec/方案/文档），再动手实现，确保设计经过思考、代码只是设计的翻译。',
        en: 'Code written before documentation never gets documented. This rule demands definition before implementation — the design deserves thought, and code should be a faithful translation of that design.',
      },
    },
    priority: 3,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-005',
    name: 'no_stash',
    description: '禁止 stash 累积。所有变更入 commit。',
    category: 'engineering',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches' as const, field: 'tool.args.command', operator: 'contains' as const, value: 'stash' }],
    action: {
      decision: 'DENY',
      reason: '禁止 git stash 累积。所有变更必须入 commit。',
      explanation: {
        zh: 'git stash 是临时暂存，但累积的 stash 不可追溯、不可审查、容易丢失。每次 stash 都应该被及时转换成 commit——哪怕是不完美的草稿 commit，也比匿名的 stash 安全。commit 有 hash、有 message、不会被误删。',
        en: 'Stashes are untraceable temporary snapshots that accumulate silently and can be lost. Every stash should be promptly converted to a commit — even imperfect draft commits are safer than anonymous stashes. Commits have hashes, messages, and cannot be accidentally deleted.',
      },
      alternative: {
        zh: '使用 git commit --allow-empty 或 git commit -m "wip: ..." 创建草稿 commit，稍后用 git rebase -i 整理',
        en: 'Use git commit --allow-empty or git commit -m "wip: ..." to create a draft commit; clean up later with git rebase -i',
      },
    },
    priority: 4,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-006',
    name: 'no_powershell_setcontent',
    description: '禁用 Set-Content/Out-File。损坏 UTF-8。',
    category: 'engineering',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches' as const, field: 'tool.args.command', operator: 'match' as const, value: 'Set-Content|Out-File' }],
    action: {
      decision: 'DENY',
      reason: '禁用 Set-Content/Out-File。会损坏 UTF-8 编码。',
      explanation: {
        zh: 'PowerShell 的 Set-Content 和 Out-File 默认使用系统编码（GB2312/GBK），写入 UTF-8 内容时会产生乱码。这个问题已经多次导致文件损坏，完全修复费时费力。',
        en: 'PowerShell\'s Set-Content and Out-File default to system encoding (GB2312/GBK), corrupting UTF-8 content. This has caused file corruption multiple times, and repair is labor-intensive.',
      },
      alternative: {
        zh: '使用 write tool 写入文件内容，或使用 [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)',
        en: 'Use the write tool to write file content, or use [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)',
      },
    },
    priority: 4,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-007',
    name: 'pipeline_before_push',
    description: '推送前: typecheck 0 error → build 0 error → test all pass。',
    category: 'engineering',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches' as const, field: 'tool.args.command', operator: 'contains' as const, value: 'push' }],
    action: {
      decision: 'ALLOW',
      instruction: '推送前: typecheck 0 error → build 0 error → test all pass。如果任一失败，先修好再推送。',
      explanation: {
        zh: '推送前运行质量门禁是代码卫生的基础——一个未通过编译或测试的推送会阻塞整个团队。这条规则不是限制，是保护。',
        en: 'Running the quality gate before pushing is fundamental code hygiene — a push that fails build or tests blocks the whole team. This isn\'t a restriction; it\'s protection.',
      },
    },
    priority: 3,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-008',
    name: 'no_shortcut',
    description: '禁止临时方案/workaround/hack。现在就从根本上解决。',
    category: 'engineering',
    triggers: ['write_file', 'edit', 'apply_patch', 'exec'],
    conditions: ALWAYS,
    action: {
      decision: 'ALLOW',
      instruction: '禁止临时方案。不要在任务中接受 workaround 或 hack。从根本上解决。',
      explanation: {
        zh: '临时方案（hack/workaround）看似解决了眼前问题，但几乎一定会留下隐患——路径写死、边界条件未处理、与其他模块冲突。每一个 hack 都是一张未来要兑现的支票。',
        en: 'Workarounds seem to fix the immediate problem but almost always leave traps — hardcoded paths, untested edge cases, hidden conflicts. Every hack is a check written against future time.',
      },
    },
    priority: 5,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-009',
    name: 'docs_with_delivery',
    description: '文档即交付。代码写完不算完。',
    category: 'engineering',
    triggers: ['write_file', 'edit', 'apply_patch', 'exec'],
    conditions: ALWAYS,
    action: {
      decision: 'ALLOW',
      instruction: '文档即交付。代码写完不算完，文档更新才算交付完成。同步更新 README、CHANGELOG、API 文档。',
      explanation: {
        zh: '没有文档的功能等于不存在。代码是给机器看的，文档是给人看的。两者缺一不可。',
        en: 'A feature without documentation might as well not exist. Code speaks to machines; documentation speaks to humans. Neither is optional.',
      },
    },
    priority: 8,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
  {
    id: 'EN-010',
    name: 'no_force_push_main',
    description: '禁止 force push master。',
    category: 'engineering',
    triggers: ['exec'],
    conditions: [{ kind: 'context_matches' as const, field: 'tool.args.command', operator: 'match' as const, value: 'push.*(-f|--force)' }],
    action: {
      decision: 'DENY',
      reason: '禁止 force push master/main。',
      explanation: {
        zh: 'Force push 直接覆盖远程仓库历史，所有协作者本地分支将立即与远程不同步。恢复需要每个人手动 rebase 或重新 clone，严重时造成他人提交的永久丢失。这是最具破坏性的 Git 操作之一。',
        en: 'Force push rewrites remote history, instantly desynchronizing every collaborator\'s local branch. Recovery requires everyone to rebase or re-clone manually. In severe cases, others\' commits are permanently lost. This is one of the most destructive Git operations.',
      },
      alternative: {
        zh: '使用 git push --force-with-lease（至少检查远程是否被他人更新过）。更好的方案：git revert 或创建新的修复 commit，永不改写共享历史。',
        en: 'Use git push --force-with-lease (at minimum, checks if remote was updated by others). Better: git revert or create a new fix commit — never rewrite shared history.',
      },
    },
    priority: 1,
    enabled: true,
    version: 2,
    scopeLevel: 1,
    hitCount: 0,
  },
]
