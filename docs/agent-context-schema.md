# ERDL Agent Context Schema

> ERDL Spec v1.1 上下文在 Agent 场景的标准字段定义
>
> Agent 在调用 `erdl_evaluate` 时传递 `tool_name` 和 `tool_args`，引擎自动构建 guard context。

---

## 核心字段（由 ERDL 引擎自动构建）

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| `tool.name` | String | `args.tool_name` | 被调用的工具名称 |
| `tool.args` | Object | `args.tool_args` | 工具参数对象 |
| `tool.args.<key>` | Any | `args.tool_args.<key>` | 扁平化后的参数字段 |
| `agent.id` | String | `args.agent_id` (可选) | Agent 身份标识 |
| `session.id` | String | `args.session_id` (可选) | 会话标识 |

## 字段使用规则

1. **字段名遵循 Spec 标识符规范**：`[a-zA-Z_][a-zA-Z0-9_.]*`
2. **操作符**：`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `contains`, `not_contains`, `match`, `exists`, `not_exists`
3. **值类型**：String、Number、Boolean、或数组
4. **逻辑连接**：`AND`, `OR`，`()` 分组

## ERDL When 条件示例

```yaml
# 拦截 exec 工具调用（含危险命令）
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"
    - field: "tool.args.command"
      operator: match
      value: "rm -rf"

# 拦截写入含 any 类型的代码
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: in
      value: ["write_file", "edit", "apply_patch"]
    - field: "tool.args.content"
      operator: match
      value: "\\\\bany\\\\b"

# 禁止 git stash
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"
    - field: "tool.args.command"
      operator: match
      value: "git stash"
```

## 调用示例

Agent 调用 `erdl_evaluate` 时传递当前 Tool Call 参数：

```json
{
  "tool_name": "exec",
  "tool_args": {
    "command": "git stash push -m 'wip'"
  }
}
```

ERDL 引擎自动构建 guard context 并评估所有规则：

```
{
  "tool.name": "exec",
  "tool.args.command": "git stash push -m 'wip'",
  "tool.args": { "command": "git stash push -m 'wip'" }
}
```

匹配成功的规则返回 ALLOW（带指令）或 DENY（带原因）。

---

> OpenOBA · ERDL MCP Server · 2026-07-17
