# ERDL 规则参考手册 — Agent 完整指南

> **30 条规则，6 个分类。确定性执行，不是建议。**
> 版本：1.1.2 · 格式：ERDL SPEC §5 · 扩展名：`.erdl.yaml`

---

## Agent 如何使用本文档

1. **阅读规则描述** — 理解每条规则的执行目的
2. **查看触发条件** — 知道规则何时生效
3. **遵循修改指南** — 安全地编辑规则
4. **使用底部模板** — 添加新规则

**所有规则文件位于 `~/.openoba/rules/<分类>/<规则名>.erdl.yaml`。**
Agent 可以直接读取、编辑、创建这些文件。

---

## 规则类型说明

| 类型 | 引擎行为 | Agent 应如何响应 |
|------|---------|----------------|
| **Guard（DENY）** | Ring 0 硬拦截 — 引擎阻止 Tool Call | 无法绕过。必须修改后重试。 |
| **Advisory（ALLOW）** | 匹配后注入指令到 Agent 上下文 | 遵循指令执行。 |
| **Advisory（CORRECT）** | 匹配后注入纠偏建议到 Agent 上下文 | 修正输出内容。 |

---

## 分类 1：coding（10 条）

TypeScript 代码质量、Git 规范、依赖管理规则。
**目录：** `~/.openoba/rules/coding/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `no_any` | CORRECT | 代码中出现 `any` 类型 | 提醒：禁止 any。用 `unknown` + 类型守卫替代。 | 修改 `value` 正则扩展关键字。改 `then: DENY` 可升级为硬拦截。 |
| 2 | `no_ts_ignore` | ALLOW | 代码中出现 `@ts-ignore` 或 `@ts-expect-error` | 提醒：修复类型错误，不要抑制它。 | 改为 `then: DENY` 强制拦截。 |
| 3 | `no_nested_ternary` | ALLOW | 嵌套三元表达式（`a ? b : c ? d : e`） | 提醒：用 if/else 或提前返回替代。 | 增加更复杂的嵌套检测模式。 |
| 4 | `handle_promises` | ALLOW | 代码中出现 `async` 或 `Promise` | 提醒：所有 Promise 必须 await 或 .catch()。 | 限制触发范围到特定工具（如 `edit`）。 |
| 5 | `naming_conventions` | ALLOW | 声明变量、函数、类 | 提醒：camelCase/PascalCase/UPPER_SNAKE 规范。 | 按项目自定义命名规则。 |
| 6 | `commit_format` | ALLOW | 编写 commit message | 提醒：`type(scope): description` 格式。 | 调整允许的 type 列表。 |
| 7 | `one_commit_one_change` | ALLOW | 执行 git commit | 提醒：一个 commit = 一个逻辑变更。不混交。 | 加 `tool.name: exec` 精确匹配 git 调用。 |
| 8 | `pr_emoji` | ALLOW | 涉及 PR/merge request | 提醒：PR 标题加 emoji 前缀。 | 按团队约定自定义 emoji 列表。 |
| 9 | `confirm_dependencies` | ALLOW | 安装新包 | 提醒：检查项目是否已有类似依赖。 | 添加预批准包白名单。 |
| 10 | `prefer_existing` | ALLOW | 添加新库 | 提醒：先检查已有依赖再引入新包。 | 指向项目专用依赖清单。 |

---

## 分类 2：engineering（24 条）

工程纪律、质量门禁、工作流规范。
**目录：** `~/.openoba/rules/engineering/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `no_stash` | **Guard（DENY）** | `exec` 工具 + 命令含 `git stash` | **硬拦截**。所有变更必须入 commit。Stash 不追溯、易覆盖、难找回。 | 修改 `value` 白名单特定 stash 标志。**请勿删除** — 防止数据丢失。 |
| 2 | `no_force_push_main` | **Guard（DENY）** | `exec` 工具 + `push.*(-f\|--force)` | **硬拦截**。Force push 主分支 = 不可逆的生产事故。 | priority 1，override critical。未经明确授权不得放宽。 |
| 3 | `no_powershell_setcontent` | **Guard（DENY）** | PowerShell 命令含 `Set-Content` 或 `Out-File` | **硬拦截**。这两个命令损坏 UTF-8。用 `write` 工具替代。 | 添加更多危险 PowerShell 命令到 `value`。 |
| 4 | `pipeline_before_push` | ALLOW | `exec` + `push` 命令 | 提醒：推送前 typecheck → build → test 全过。 | 添加项目特定质量检查项。 |
| 5 | `honesty` | ALLOW | 任何代码/工程操作 | 提醒：诚实汇报。遇到问题如实知会，不知道就说不知道。 | 核心原则 — 请勿删除。 |
| 6 | `no_shortcut` | CORRECT | 任何代码/工程操作 | 提醒：不寻求临时方案。从根本解决，路径不写死。 | 添加常见临时方案反例。 |
| 7 | `no_single_task_tunnel` | CORRECT | 任何代码/工程操作 | 提醒：不为一任务破坏全局一致性。考虑产品/架构/UX 全链路影响。 | 添加上下文相关指导。 |
| 8 | `design_before_code` | CORRECT | 任何代码操作 | 提醒：先设计方案，再写代码。先对齐方向。 | 添加设计文档模板引用。 |
| 9 | `stay_on_target` | CORRECT | 任何操作 | 提醒：不偏离 spec 和当前目标。跑偏时主动拉回。 | 添加项目 spec 引用。 |
| 10 | `docs_with_delivery` | ALLOW | 任何操作 | 提醒：代码写完不算完，文档写完才算。 | 添加文档 checklist 链接。 |
| 11 | `doc_version_alignment` | CORRECT | 任何操作 | 提醒：文档版本号和代码版本号同步更新。 | 添加版本号更新 checklist。 |
| 12 | `read_before_code` | CORRECT | 任何代码操作 | 提醒：先读源码 + 调用链 + Entity 定义，再动手。 | 添加项目源码结构图。 |
| 13 | `self_verify` | CORRECT | 任何操作 | 提醒：提交前自测 — build → test → 实测。不依赖别人发现你的错误。 | 添加项目特定验证命令。 |
| 14 | `no_dead_code` | CORRECT | 写/编辑代码 | 提醒：删除死代码 — 注释掉的代码、废弃函数。Git 会记住。 | 扩展匹配更多死代码模式。 |
| 15 | `change_summary` | ALLOW | 任何操作 | 提醒：每次变更完成后写清晰中文摘要。 | 添加摘要模板。 |
| 16 | `session_memory` | ALLOW | 任何操作 | 提醒：每次会话结束后记录当天工作和决策。 | 添加知识库路径引用。 |
| 17 | `knowledge_capture` | ALLOW | 任何操作 | 提醒：踩坑就记录。解决新问题后更新知识库。 | 添加知识库格式引用。 |
| 18 | `decision_log` | ALLOW | 任何操作 | 提醒：关键决策记录语境、选项、理由、后果。 | 添加决策日志模板。 |
| 19 | `code_as_asset` | CORRECT | 任何代码操作 | 提醒：代码是长期资产，不是一次性交付。可读性 > 巧妙性。 | 添加代码评审 checklist。 |
| 20 | `config_as_code` | CORRECT | 任何操作 | 提醒：配置和代码同仓库、同 commit、同 review。 | 添加配置管理指南。 |
| 21 | `dependency_audit` | ALLOW | 任何操作 | 提醒：定期审计依赖 — 过期升级、不用删除、漏洞更换。 | 设定审计周期（每周/每月）。 |
| 22 | `error_output_caution` | CORRECT | 任何操作 | 提醒：错误信息不能泄露路径、堆栈、密码。用错误 ID 方案。 | 添加错误 ID 生成方案引用。 |
| 23 | `minimal_delivery` | CORRECT | 任何代码操作 | 提醒：一次只解决一个问题。不顺手重构、不夹带私货。 | 添加范围定义指南。 |
| 24 | `progress_visibility` | ALLOW | 任何操作 | 提醒：工作进度对团队可见。重大变更主动同步。 | 添加汇报频率规范。 |

---

## 分类 3：security（6 条）

安全漏洞防护、代码安全规范。
**目录：** `~/.openoba/rules/security/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `no_eval_with_input` | **Guard（DENY）** | 代码含 `eval()`、`new Function()`、`setTimeout()` | **硬拦截**。远程代码执行风险。用 JSON.parse 或沙箱替代。 | 添加更多危险函数到 `value`。 |
| 2 | `no_hardcoded_secrets` | **Guard（DENY）** | 硬编码密码、APIKey、Token、凭证 | **硬拦截**。提交到 Git = 视为已泄露。用环境变量。 | 添加项目专用密钥模式。 |
| 3 | `no_string_sql` | **Guard（DENY）** | SQL 查询用字符串拼接（`+`） | **硬拦截**。SQL 注入风险。用参数化查询或 ORM。 | 添加更多 SQL 注入模式。 |
| 4 | `no_stack_trace_to_user` | ALLOW | 响应含错误堆栈返回给用户 | 提醒：用错误 ID 方案。用户看到 ID，后端记详情。 | 添加错误 ID 生成引用。 |
| 5 | `validate_all_input` | ALLOW | 处理 `req.body/req.query/req.params` | 提醒：验证类型→长度→格式→范围。白名单>黑名单。服务端>客户端。 | 添加项目特定验证规则。 |
| 6 | `security_headers` | ALLOW | 任何代码/工程操作 | 提醒：响应含 CSP, X-Content-Type-Options, X-Frame-Options, HSTS。 | 按框架添加 Header 值。 |

---

## 分类 4：testing（11 条）

测试覆盖、质量门禁、TDD 流程。
**目录：** `~/.openoba/rules/testing/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `boundary_conditions_required` | CORRECT | 编写测试代码 | 提醒：测试覆盖边界 — null/undefined/空/0/负数/极大值。 | 添加领域特定边界条件。 |
| 2 | `coverage_never_drops` | CORRECT | 编写测试代码 | 提醒：新增代码覆盖率不低于现有水平。只升不降。 | 设定数值阈值（如 ≥80%）。 |
| 3 | `critical_path_full_coverage` | CORRECT | 编写测试代码 | 提醒：支付/登录/权限/删除等关键路径 100% 覆盖。 | 添加项目特定关键路径。 |
| 4 | `no_behavior_without_test` | CORRECT | 编写测试代码 | 提醒：每个功能/修复/重构都要有测试。先写测试。 | 改为 `then: DENY` 强制 TDD。 |
| 5 | `no_feature_on_broken_build` | CORRECT | 涉及 build/test 命令 | 提醒：不在 broken build 上加新功能。先修 build。 | 添加 CI 流水线检查引用。 |
| 6 | `no_flaky_tests` | CORRECT | 测试中用 setTimeout/sleep/Math.random | 提醒：避免不确定行为。用 mock timer 和 seed。 | 添加 seed/mock 模式引用。 |
| 7 | `no_implementation_coupled_tests` | ALLOW | 编写测试代码 | 提醒：测试验证行为，不验证实现。重构不破坏测试。 | 添加行为测试示例。 |
| 8 | `no_tautological_tests` | CORRECT | 编写测试代码 | 提醒：避免"期望 mock 返回 mock 结果"。测试真实逻辑。 | 添加反模式示例。 |
| 9 | `repro_before_fix` | CORRECT | 编写测试代码 | 提醒：RED（复现测试）→ GREEN（修复）→ REFACTOR。 | 改为 `DENY` 强制执行 TDD 顺序。 |
| 10 | `test_as_documentation` | ALLOW | 编写测试代码 | 提醒：测试即文档。名称和断言应描述业务行为。 | 添加命名规范示例。 |
| 11 | `test_audit_trail` | ALLOW | 编写测试代码 | 提醒：每个测试追溯到需求/Bug/Story。测试记录决策。 | 添加追溯格式。 |

---

## 分类 5：performance（3 条）

性能优化约束、数据库查询规范。
**目录：** `~/.openoba/rules/performance/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `measure_before_optimize` | ALLOW | 性能优化相关代码 | 提醒：先测量，再优化。没有 baseline = 猜测。 | 添加性能分析工具引用。 |
| 2 | `no_n_plus_one` | CORRECT | 循环内有数据库查询 | 提醒：用 JOIN 或批量查询避免 N+1 问题。 | 添加 ORM 急加载模式。 |
| 3 | `paginate_all_lists` | CORRECT | `findAll` 或 `SELECT *` 查询 | 提醒：列表查询必须分页。用 LIMIT + OFFSET。 | 设定默认每页条数。 |

---

## 分类 6：observability（3 条）

日志、监控、健康检查规范。
**目录：** `~/.openoba/rules/observability/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `no_secrets_in_logs` | ALLOW | 日志含密码/Token/PII | 提醒：日志只输出 ID/hash。日志管道泄露 = 所有历史暴露。 | 添加 PII 字段清单。 |
| 2 | `structured_logging` | CORRECT | 使用 console.log/日志库 | 提醒：用结构化 JSON 日志，含 timestamp/level/message/context。 | 添加日志格式 schema。 |
| 3 | `health_check` | ALLOW | 任何代码/工程操作 | 提醒：所有服务需 /health 端点，返回 200 + 依赖状态。 | 添加 health check 模板。 |

---

## 分类 7：design（3 条）

UI/UX、响应式设计、无障碍规范。
**目录：** `~/.openoba/rules/design/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `a11y_basics` | CORRECT | UI 代码含 aria/alt/role 属性 | 提醒：图片加 alt，交互元素加 aria，表单用 label。 | 添加 WCAG 级别要求。 |
| 2 | `responsive_first` | CORRECT | 响应式/自适应 UI 代码 | 提醒：移动端优先。先写手机布局，@media 适配桌面。 | 添加断点定义。 |
| 3 | `tailwind_first` | CORRECT | 使用 Tailwind/CSS 类 | 提醒：优先 Tailwind utility classes，不写内联 style。 | 添加设计系统 class 引用。 |

---

## 分类 8：writing（7 条）

语气、格式、清晰度、避免 AI 套话。
**目录：** `~/.openoba/rules/writing/`

| # | 规则名 | 类型 | 触发条件 | 执行内容 | 修改指导 |
|---|--------|------|---------|---------|---------|
| 1 | `chinese_english_spacing` | CORRECT | 中文英文混排 | 提醒：中文和英文/数字之间加空格。 | 添加更多语言对规则。 |
| 2 | `direct_tone` | CORRECT | 任何写作输出 | 提醒：直接精准，不绕弯。长话短说。 | 添加语气示例。 |
| 3 | `heading_hierarchy` | ALLOW | 使用 markdown 标题 | 提醒：标题不跳级（H1→H3 无 H2）。 | 添加标题 checklist。 |
| 4 | `list_consistency` | ALLOW | 使用 markdown 列表 | 提醒：列表内各项结构、标点保持一致。 | 添加列表格式示例。 |
| 5 | `no_ai_jargon` | CORRECT | 使用 AI 套话（delve/unleash 等） | 提醒：避免 AI 填充词。用具体描述。 | 添加更多禁用词。 |
| 6 | `no_cliche` | CORRECT | 使用商业空话（synergy/paradigm 等） | 提醒：避免空洞词汇。用具体语言。 | 添加行业专用禁用词。 |
| 7 | `short_sentences` | ALLOW | 任何写作输出 | 提醒：用短句。一句一意。超 25 字考虑拆分。 | 调整句子长度阈值。 |

---

## Agent 修改规则标准模板

添加或修改规则时，严格按照此格式：

```yaml
protocol: "erdl/v1"
version: "1.0.0"

metadata:
  name: "规则名称"                # 小写字母 + 下划线
  description: "这条规则做什么（一行）"
  tags: [分类]                    # coding|engineering|security|testing|performance|observability|design|writing

rules:
  - name: "规则名称"
    description: "详细描述规则做什么"
    priority: 5                   # 1=最高，1000=最低。Guard 用 1-10。
    override: normal              # critical|high|normal|low — critical = 不可绕过
    when:
      logic: AND                  # AND（全部满足）或 OR（任一满足）
      conditions:
        - field: "tool.name"      # 要检查的上下文字段
          operator: in            # eq|ne|gt|gte|lt|lte|in|contains|match|exists|not_exists|not_in|not_contains
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"      # 第二个条件（如需）
          operator: match
          value: "匹配模式"
    then: ALLOW                   # ALLOW|CORRECT|DENY|REQUEST_HUMAN|EMERGENCY_HALT（BLOCK 是 DENY 的别名）
    message: "给 Agent 的明确指令。一句话，具体，可操作。"
```

### 模板规则

1. **文件位置**：`~/.openoba/rules/<分类>/<规则名>.erdl.yaml`
2. **命名**：小写字母 + 下划线，`metadata.name` 和 `rules[0].name` 必须一致
3. **优先级**：Guard（DENY）用 1-10。Advisory 用 5-100。数字越小越优先。
4. **操作符**：`match` 正则匹配，`contains` 子串匹配，`in` 列表成员，`eq` 精确匹配
5. **override 级别**：
   - `critical` — 紧急规则，不可绕过
   - `high` — 安全/工程 Guard
   - `normal` — 标准规则（默认）
   - `low` — 尽力而为建议
6. **message**：必须一句话。告诉 Agent **应该做什么**，而不仅是什么不能做。
7. **conditions**：至少一个 `tool.name` 条件限定触发范围。如需内容匹配则加 `tool.args`。
8. **测试**：创建/修改规则后调用 `erdl_simulate` 验证正确性。
9. **禁止使用 `when: "true"`** — 这会绕过引擎，退化为 prompt injection。
10. **禁止删除 Guard 规则** — 未经明确授权不得动。它们保护数据安全和代码质量。

---

> 确定性架构，而非 Prompt 工程。
> OpenOBA · ERDL MCP Server v1.1.2 · 2026-07-12
