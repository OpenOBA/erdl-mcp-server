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
    when: language = "typescript" AND output_text contains "any"
    then: ALLOW "禁止使用 any 类型。使用 unknown + 类型守卫替代。"
    priority: 5
    category: coding
    description: 禁止 TypeScript any 类型
  no_ts_ignore:
    when: language = "typescript" AND (output_text contains "@ts-ignore" OR output_text contains "@ts-expect-error")
    then: BLOCK "不要用 @ts-ignore/@ts-expect-error。修复类型错误而非抑制。"
    priority: 5
    category: coding
    description: 禁止抑制 TS 编译错误
  naming_conventions:
    when: language in ("typescript", "javascript")
    then: ALLOW "变量/函数用 camelCase，类/接口用 PascalCase，常量用 UPPER_SNAKE_CASE。"
    priority: 10
    category: coding
    description: 代码命名规范
  handle_promises:
    when: language in ("typescript", "javascript") AND output_text contains "Promise"
    then: ALLOW "所有 Promise 必须 await 或 .catch()。不允许未处理 Promise。"
    priority: 5
    category: coding
    description: Promise 错误处理
  no_nested_ternary:
    when: language in ("typescript", "javascript")
    then: ALLOW "禁止嵌套三元表达式 (a ? b : c ? d : e)。用 if/else 或提前返回。"
    priority: 20
    category: coding
    description: 避免嵌套三元运算符
  commit_format:
    when: intent = "git_commit"
    then: ALLOW "Commit 格式: type(scope): description。类型: feat/fix/docs/refactor/test/chore/style。主题 < 72 字符。"
    priority: 5
    category: coding
    description: Git commit 格式规范
  one_commit_one_change:
    when: intent = "git_commit"
    then: ALLOW "一个 commit = 一个逻辑变更。不要将重构和功能混在同一个 commit。"
    priority: 10
    category: coding
    description: 一个 commit 一个逻辑
  pr_emoji:
    when: intent in ("create_pr", "pull_request")
    then: ALLOW "PR 标题 emoji 前缀: ✨ feat / 🐛 fix / 📝 docs / ♻️ refactor / ✅ test / 🔧 chore / 🎨 style"
    priority: 15
    category: coding
    description: PR 标题 emoji
  confirm_dependencies:
    when: output_text contains "npm install" OR output_text contains "yarn add" OR output_text contains "pnpm add" OR output_text contains "pip install" OR output_text contains "cargo add"
    then: BLOCK "添加新依赖需确认。先检查项目是否已有类似包。列出包名让用户确认。"
    priority: 3
    category: coding
    override: true
    description: 安装依赖前需确认
  prefer_existing:
    when: output_text contains "add package" OR output_text contains "install package" OR output_text contains "new library"
    then: ALLOW "推荐新依赖前先检查已有依赖。优先使用项目已安装的包。"
    priority: 5
    category: coding
    description: 优先使用已有依赖
`

export const PRESET_YAML_WRITING = `# ERDL Rules — Writing
rules:
  no_cliche:
    when: intent in ("write_blog", "write_content", "write_post") AND (output_text contains "在当今时代" OR output_text contains "众所周知" OR output_text contains "值得注意的是")
    then: BLOCK "不要用套话开头。直接切入主题。禁用: 在当今时代/众所周知/值得注意的是。"
    priority: 3
    category: writing
    description: 禁止套话开头
  direct_tone:
    when: intent in ("write_blog", "write_content", "write_post")
    then: ALLOW "主动语态。主语优先。直接有力。不用模糊表达 (might, could potentially)。"
    priority: 5
    category: writing
    description: 直接有力的语气
  short_sentences:
    when: intent in ("write_blog", "write_article")
    then: ALLOW "句子 < 25 字。段落 < 4 句。用列表展示要点。"
    priority: 10
    category: writing
    description: 短句优先
  no_ai_jargon:
    when: intent in ("write_content", "write_blog") AND (output_text contains "赋能" OR output_text contains "抓手" OR output_text contains "闭环" OR output_text contains "底层逻辑" OR output_text contains "降本增效" OR output_text contains "leverage")
    then: BLOCK "不要用 AI 套话。禁用: 赋能/抓手/闭环/底层逻辑/降本增效/empower/leverage/ecosystem/synergy。"
    priority: 5
    category: writing
    description: 禁止 AI 套话
  chinese_english_spacing:
    when: language = "zh"
    then: ALLOW "中文和英文/数字加空格。用 Agent 编码 正确。用Agent编码 错误。"
    priority: 3
    category: writing
    description: 中英混排加空格
  heading_hierarchy:
    when: intent in ("write_document", "write_markdown")
    then: ALLOW "一个文档一个 H1。用 H2 分节。不跳级 (H2→H4)。"
    priority: 10
    category: writing
    description: 标题层级规范
  list_consistency:
    when: intent in ("write_content", "format_list")
    then: ALLOW "列表项保持相同语法结构。标点统一。"
    priority: 15
    category: writing
    description: 列表格式统一
`

export const PRESET_YAML_DESIGN = `# ERDL Rules — Design
rules:
  tailwind_first:
    when: intent in ("write_component", "create_ui")
    then: ALLOW "优先 Tailwind CSS。不用 inline style 或 CSS module。"
    priority: 5
    category: design
    description: Tailwind 优先
  responsive_first:
    when: intent in ("write_component", "create_ui")
    then: ALLOW "移动端优先。Tailwind 断点: sm: md: lg: xl: 2xl:。至少 3 个断点。"
    priority: 5
    category: design
    description: 响应式优先
  a11y_basics:
    when: intent in ("write_component", "create_ui") AND (output_text contains "button" OR output_text contains "form" OR output_text contains "input" OR output_text contains "modal")
    then: ALLOW "无障碍: (1) 键盘可达 (2) WCAG AA 4.5:1 (3) 图片 alt (4) 表单 label (5) 语义 HTML。"
    priority: 5
    category: design
    override: true
    description: 无障碍基础
`
