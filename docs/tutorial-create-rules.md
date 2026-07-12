# 创建你的第一条 ERDL 规则

> 10 分钟学会用 ERDL 给你的 Agent 装上"肌肉记忆"。

---

## 1. 规则是什么

ERDL 规则 = `when`（什么时候触发）+ `then`（触发后干什么）。

```yaml
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"
    - field: "tool.args.command"
      operator: match
      value: "rm -rf"
then: DENY
```

Agent 每次调用工具前，ERDL 都会检查所有规则。匹配到的第一条规则决定放行还是拦截。

---

## 2. 最简单的规则

在你的 `~/.openoba/rules/` 目录下，创建一个文件如 `custom/my-rules.erdl.yaml`：

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_any_type"
    description: "禁止使用 any 类型"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "\\bany\\b"
    then: DENY
    message: "禁止使用 any 类型，请用 unknown 替代。"
```

保存后 ERDL 自动加载。下次你的 Agent 试图写含 `any` 的代码时，会被拦截。

---

## 3. 规则结构

### 完整模板（ERDL SPEC §5）

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "规则名称"            # 规则的唯一标识
    description: "描述"          # 做什么
    priority: 10                # 优先级（1 最高，1000 最低）
    override: high              # 可选：critical|high|normal|low
    when:
      logic: AND                # AND | OR
      conditions:
        - field: "字段名"       # 要检查的上下文字段
          operator: 操作符      # 见下方运算符表
          value: 值             # 比较值
    then: 动作                  # 见下方动作表
    message: "说明消息"
```

### 支持的分类（rules 按目录分类即可）

| 目录 | 说明 |
|------|------|
| `coding` | 代码规范、命名、类型检查 |
| `engineering` | 工程纪律、流程、质量门禁 |
| `writing` | 文案风格、格式、语气 |
| `design` | UI/UX、响应式、可访问性 |
| `security` | 安全规则、漏洞防护 |
| `performance` | 性能优化约束 |
| `testing` | 测试覆盖率、质量门禁 |
| `observability` | 日志、监控、健康检查 |
| `custom` | 自定义/未分类 |

---

## 4. when — 条件表达式

### SPEC §5 结构

每个 `when` 包含一个 `logic`（`AND` 或 `OR`）和 `conditions` 数组。每个 condition 有三要素：`field`、`operator`、`value`。

```yaml
# 等于
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"

# 值在列表中
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: in
      value: ["exec", "write", "edit"]

# 正则匹配
when:
  logic: AND
  conditions:
    - field: "tool.args.command"
      operator: match
      value: "(rm -rf|sudo)"

# 逻辑与（两个条件都要满足）
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"
    - field: "tool.args.command"
      operator: match
      value: "git stash"

# 逻辑或（任一条件满足）
when:
  logic: OR
  conditions:
    - field: "tool.args.command"
      operator: match
      value: "Set-Content"
    - field: "tool.args.command"
      operator: match
      value: "Out-File"
```

---

## 5. then — 动作类型

| 动作 | 含义 | Agent 行为 |
|------|------|-----------|
| `ALLOW` | 放行，附建议 | 正常执行，Agent 遵循 message |
| `CORRECT` | 自动纠偏 | 参数被修正后放行 |
| `DENY` | 硬拦截 | 操作被阻止 |
| `REQUEST_HUMAN` | 请求人工审批 | 操作暂停，等待用户确认 |
| `EMERGENCY_HALT` | 紧急终止 | 全局停止，最高警戒 |

---

## 6. 实战示例

### 编码规范

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_console_log"
    description: "禁止提交 console.log"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "console\\.log"
    then: DENY
    message: "提交前请删除 console.log，使用项目 Logger 替代。"

  - name: "handle_promises"
    description: "Promise 必须处理"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "async|Promise"
    then: ALLOW
    message: "异步操作必须用 try-catch 包裹或 .catch() 处理。"
```

### 安全规则

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "dangerous_command"
    description: "拦截危险系统命令"
    priority: 1
    override: critical
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
        - field: "tool.args.command"
          operator: match
          value: "(rm -rf|sudo|chmod 777|> /dev/)"
    then: EMERGENCY_HALT
    message: "检测到危险系统命令，已全局终止。"

  - name: "protect_env_file"
    description: "保护敏感配置文件"
    priority: 2
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit"]
        - field: "tool.args"
          operator: match
          value: "(\\.env|/etc/)"
    then: DENY
    message: "禁止修改敏感配置文件。"
```

### 写作规范

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_ai_jargon"
    description: "禁止 AI 陈词滥调"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "delve|unleash|game.changer|revolutionize"
    then: CORRECT
    message: "避免 AI 常用套话：delve、unleash、game-changer 等。"

  - name: "chinese_english_spacing"
    description: "中英文间距"
    priority: 20
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "[\\u4e00-\\u9fff][a-zA-Z]"
    then: CORRECT
    message: "中英文之间加空格。"
```

### 工程纪律

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_git_stash"
    description: "禁止 git stash 累积"
    priority: 4
    override: high
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
        - field: "tool.args.command"
          operator: match
          value: "git stash"
    then: DENY
    message: "禁止 git stash 累积。所有变更必须入 commit。"

  - name: "pipeline_before_push"
    description: "推送前质量检查"
    priority: 3
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
        - field: "tool.args.command"
          operator: match
          value: "push"
    then: ALLOW
    message: "推送前：typecheck → build → test。任一步失败即停止。"
```

---

## 7. 优先级与覆盖 (override)

### 优先级

- 数字越小越优先（1 最高）
- 优先级相同时按定义顺序
- 没有规则匹配时默认 PASS

### override 硬约束

`override: critical` 或 `override: high` 标记的规则匹配后立即终止所有其他规则评估。用于安全关键规则（如危险命令拦截）。

```yaml
rules:
  - name: "block_all_exec"     # 优先级 1，先匹配
    priority: 1
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
    then: DENY
    message: "所有命令被拦截"

  - name: "allow_git"          # 优先级 10，但在 DENY 之后不会被评估
    priority: 10
    override: high
    when:
      logic: AND
      conditions:
        - field: "tool.args.command"
          operator: match
          value: "git "
    then: ALLOW
    message: "git 命令放行"

# 结果：block_all_exec 先匹配，返回 DENY。allow_git 不会被评估。
# 如果需要 git 放行，应该把 allow_git 的优先级设为 < 1。
```

---

## 8. 测试你的规则

用 `erdl_simulate` 工具测试：

```
你: "创建一条规则：禁止使用 eval"

Agent: erdl_simulate → 给出 3 个场景的测试结果：
  ✅ 场景1 "eval(code)" → 正确拦截
  ✅ 场景2 "new Function(str)" → 正确拦截
  ❌ 场景3 "setTimeout(code, 100)" → 没有拦截
  建议: 把 setTimeout 加入匹配列表

你: "好，加进去"
Agent: erdl_create_rule → 规则保存，立即生效
```

---

## 9. 常用操作符速查

| 操作符 | 含义 | 示例 value |
|--------|------|-----------|
| `eq` | 等于 | `"exec"` |
| `ne` | 不等于 | `"production"` |
| `gt` | 大于 | `3` |
| `gte` | 大于等于 | `1` |
| `lt` | 小于 | `500` |
| `lte` | 小于等于 | `3` |
| `in` | 在列表中 | `["exec", "write", "edit"]` |
| `contains` | 包含子串 | `"delete"` |
| `match` | 正则匹配 | `"rm -rf|sudo"` |
| `exists` | 字段存在 | (不需要 value) |
| `not_exists` | 字段不存在 | (不需要 value) |

---

## 10. 下一步

1. 在 `~/.openoba/rules/` 下按分类目录创建你的规则文件
2. 用 `erdl_evaluate` 验证规则是否生效
3. 用 `erdl_explain` 查看决策追溯链
4. 遇到问题？[GitHub Issues →](https://github.com/OpenOBA/erdl-mcp-server/issues)

---

> 确定性架构，而非 Prompt 工程。
> OpenOBA · 2026
