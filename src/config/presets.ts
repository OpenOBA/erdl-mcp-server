/**
 * ERDL MCP Server — Built-in Preset YAML Strings
 *
 * These are written to ~/.openoba/rules/ on first run.
 * No file system dependency. Always available.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @license MIT
 */

export const PRESET_YAML_CODING = `# ERDL Rules — Coding · ERDL Spec v1.1
rules:
  no_any:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: ALLOW "禁止使用 any 类型。使用 unknown + 类型守卫替代。"
    priority: 5
    category: coding
    description: 禁止 TypeScript any 类型
  no_ts_ignore:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: BLOCK "不要用 @ts-ignore/@ts-expect-error。修复类型错误而非抑制。"
    priority: 5
    category: coding
    description: 禁止抑制 TS 编译错误
  naming_conventions:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "变量/函数用 camelCase，类/接口用 PascalCase，常量用 UPPER_SNAKE_CASE。"
    priority: 10
    category: coding
    description: 代码命名规范
  handle_promises:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "所有 Promise 必须 await 或 .catch()。不允许未处理 Promise。"
    priority: 5
    category: coding
    description: Promise 错误处理
  no_nested_ternary:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "禁止嵌套三元表达式 (a ? b : c ? d : e)。用 if/else 或提前返回。"
    priority: 20
    category: coding
    description: 避免嵌套三元运算符
  commit_format:
    when: tool.name = "exec"
    then: ALLOW "Commit 格式: type(scope): description。类型: feat/fix/docs/refactor/test/chore/style。主题 < 72 字符。"
    priority: 5
    category: coding
    description: Git commit 格式规范
  one_commit_one_change:
    when: tool.name = "exec"
    then: ALLOW "一个 commit = 一个逻辑变更。不要将重构和功能混在同一个 commit。"
    priority: 10
    category: coding
    description: 一个 commit 一个逻辑
  pr_emoji:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "PR 标题 emoji 前缀: ✨ feat / 🐛 fix / 📝 docs / ♻️ refactor / ✅ test / 🔧 chore / 🎨 style"
    priority: 15
    category: coding
    description: PR 标题 emoji
  confirm_dependencies:
    when: tool.name = "exec"
    then: BLOCK "添加新依赖需确认。先检查项目是否已有类似包。列出包名让用户确认。"
    priority: 3
    category: coding
    override: true
    description: 安装依赖前需确认
  prefer_existing:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: ALLOW "推荐新依赖前先检查已有依赖。优先使用项目已安装的包。"
    priority: 5
    category: coding
    description: 优先使用已有依赖
`

export const PRESET_YAML_WRITING = `# ERDL Rules — Writing
rules:
  no_cliche:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: BLOCK "不要用套话开头。直接切入主题。禁用: 在当今时代/众所周知/值得注意的是。"
    priority: 3
    category: writing
    description: 禁止套话开头
  direct_tone:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "主动语态。主语优先。直接有力。不用模糊表达 (might, could potentially)。"
    priority: 5
    category: writing
    description: 直接有力的语气
  short_sentences:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "句子 < 25 字。段落 < 4 句。用列表展示要点。"
    priority: 10
    category: writing
    description: 短句优先
  no_ai_jargon:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: BLOCK "不要用 AI 套话。禁用: 赋能/抓手/闭环/底层逻辑/降本增效/empower/leverage/ecosystem/synergy。"
    priority: 5
    category: writing
    description: 禁止 AI 套话
  chinese_english_spacing:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "中文和英文/数字加空格。用 Agent 编码 正确。用Agent编码 错误。"
    priority: 3
    category: writing
    description: 中英混排加空格
  heading_hierarchy:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "一个文档一个 H1。用 H2 分节。不跳级 (H2→H4)。"
    priority: 10
    category: writing
    description: 标题层级规范
  list_consistency:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "列表项保持相同语法结构。标点统一。"
    priority: 15
    category: writing
    description: 列表格式统一
`

export const PRESET_YAML_DESIGN = `# ERDL Rules — Design
rules:
  tailwind_first:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "优先 Tailwind CSS。不用 inline style 或 CSS module。"
    priority: 5
    category: design
    description: Tailwind 优先
  responsive_first:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "移动端优先。Tailwind 断点: sm: md: lg: xl: 2xl:。至少 3 个断点。"
    priority: 5
    category: design
    description: 响应式优先
  a11y_basics:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "无障碍: (1) 键盘可达 (2) WCAG AA 4.5:1 (3) 图片 alt (4) 表单 label (5) 语义 HTML。"
    priority: 5
    category: design
    override: true
    description: 无障碍基础
`

export const PRESET_YAML_ENGINEERING = `# ERDL Rules — Engineering · Core Discipline
rules:
  honesty_with_henry:
    when: true
    then: ALLOW "诚实汇报: 遇到问题如实知会 Henry。不隐瞒、不绕过、不假装没问题。不知道就说不知道。做错了就承认。"
    priority: 1
    category: coding
    override: true
    description: 诚实汇报 Henry — 最高承诺
  stay_on_target:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: ALLOW "长程任务: 先对齐目标再动手。不偏离 Spec。修改前: 读源码→问题分析→Henry 确认→动手。"
    priority: 1
    category: coding
    override: true
    description: 方向不漂移
  no_single_task_tunnel:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: ALLOW "全局优先: 不为当前任务破坏一致性。不追求速度，以质量为准。"
    priority: 2
    category: coding
    override: true
    description: 全局优先
  design_before_code:
    when: tool.name in ("write_file", "edit", "apply_patch")
    then: ALLOW "Spec 先行: 先与 ERDL Spec 对齐。不先写代码再补 Spec。"
    priority: 3
    category: coding
    override: true
    description: Spec 先行
  no_stash:
    when: tool.name = "exec"
    then: BLOCK "禁止 git stash 累积。所有变更必须入 commit。"
    priority: 4
    category: coding
    override: true
    description: 禁止 stash
  no_powershell_setcontent:
    when: tool.name = "exec"
    then: BLOCK "禁用 Set-Content/Out-File。会损坏 UTF-8 编码。"
    priority: 4
    category: coding
    override: true
    description: 禁止编码损坏
  pipeline_before_push:
    when: tool.name = "exec"
    then: ALLOW "推送前: typecheck 0 error → build 0 error → test all pass。"
    priority: 3
    category: coding
    override: true
    description: 推送前门禁
  no_shortcut:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: BLOCK "禁止临时方案。不要在任务中接受 workaround 或 hack。从根本上解决。"
    priority: 5
    category: coding
    description: 禁止工程债务
  docs_with_delivery:
    when: tool.name in ("write_file", "edit", "apply_patch", "exec")
    then: ALLOW "文档即交付。代码写完不算完，文档更新才算交付完成。"
    priority: 8
    category: coding
    description: 文档即交付
  no_force_push_main:
    when: tool.name = "exec"
    then: BLOCK "禁止 force push master/main。"
    priority: 1
    category: coding
    override: true
    description: 禁止 force push
`
