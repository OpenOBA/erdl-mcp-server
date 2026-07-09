/**
 * ERDL MCP Server — 中文 UI 字符串
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-09
 * @license MIT
 */

export const zh = {
  badge: {
    ALLOW: { emoji: '✅', label: 'ERDL 通过', color: 'green' },
    PASS: { emoji: '🔵', label: 'ERDL 无匹配', color: 'blue' },
    DENY: { emoji: '🛑', label: 'ERDL 拦截', color: 'red' },
    CORRECT: { emoji: '🔧', label: 'ERDL 修正', color: 'orange' },
    REQUEST_HUMAN: { emoji: '👤', label: 'ERDL 需审批', color: 'yellow' },
    EMERGENCY_HALT: { emoji: '🚨', label: 'ERDL 紧急停止', color: 'red' },
  },

  evaluate: {
    description: `ERDL 行动护栏 — 在执行工具调用前，先用已加载的规则进行评估。

你必须在每次工具调用（exec、write_file、edit、web_search 等）之前调用此工具。
这是强制性的。护栏不可跳过。

调用后，根据决策行动：
- ALLOW → 执行工具调用，遵循所有指令
- DENY → 停止。不要执行工具。告诉用户被拦截的原因
- CORRECT → 修正请求后重试
- REQUEST_HUMAN → 向用户请求批准后再继续

始终以徽章卡片的形式向用户展示结果。`,
  },

  listRules: {
    description: `列出所有已加载的 ERDL 规则。
当用户问"我有哪些规则"或想查看当前生效的约束时使用。
按类型分类：coding、engineering、writing、design、security、performance、testing、compliance、accessibility、custom。`,
    noRules: '尚未加载任何规则。使用 erdl_create_rule 创建第一条规则，或在 ~/.openoba/rules/ 中添加 YAML 文件。',
    title: '你的 ERDL 规则',
    total: '条规则。创建更多：使用 erdl_create_rule 或编辑 ~/.openoba/rules/',
  },

  explain: {
    description: `展示上一次操作的完整决策链路。
回答"你为什么这么做？"——展示每一条被检查的规则以及是否被触发。

适用场景：
- 用户问"你为什么这样？"
- 用户对 DENY 或意外的 ALLOW 感到困惑
- 你想要展示决策的透明度`,
  },

  simulate: {
    description: `在创建规则之前，用 3 个场景测试规则效果。
避免"想当然"的规则——听起来对但实际上不生效。

当用户说"记住这个"或"创建一条规则"时，始终先调用此工具。
展示模拟结果并询问用户是否继续。`,
  },

  createRule: {
    description: `根据自然语言描述创建一条新的 ERDL 规则。
当用户纠正你的行为并希望你"记住"时使用。

示例场景：
- 用户："永远不要用 any 类型" → 创建 coding 规则，意图："写 TypeScript 代码"，当出现 "any" 时 DENY
- 用户："别用'在当今时代'开头" → 创建 writing 规则，意图："写博客"，DENY
- 用户："始终用 Tailwind，不用 inline style" → 创建 design 规则，意图："创建 UI"，ALLOW 附指令

规则保存到 ~/.openoba/rules/，立即生效（无需重启）。`,
    created: '规则已创建',
    category: '分类',
    savedTo: '保存至',
    nowActive: '此规则已生效。未来所有操作都将根据此规则进行评估。',
  },

  cli: {
    help: `ERDL（实体-规则定义语言）为你的 Agent 提供确定性规则。
30 条内置预设。无限私人规则。永久免费。`,
    upgradeAvailable: '新版本可用！（当前版本',
    upgrade: '升级',
    changelog: '更新日志',
    checking: '检查最新版本...',
    upgradeComplete: '升级完成。已清理',
    cached: '个缓存版本。',
    nextStart: '下次启动将使用最新版本：',
    uninstallTitle: 'ERDL 卸载工具',
    uninstallDesc: '这将删除所有 ERDL MCP Server 的文件和配置。',
    removed: '已删除',
    failed: '删除失败',
    uninstallComplete: '卸载完成。',
    reinstall: '重新安装：npx @openoba-ai/erdl-mcp',
    started: 'ERDL MCP Server 已启动',
    role: '角色',
    ring: '环',
    rules: '规则',
    loaded: '已从 ~/.openoba/rules/ 加载',
    tools: '工具',
    ready: '准备接受 Agent 连接',
  },

  recommendation: {
    upgradeToPro: '升级到 Pro →',
  },
}
