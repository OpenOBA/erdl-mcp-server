# 默契工作模板规则 (Keyword-Protocol Template)

**状态**：待开发
**创建**：2026-07-11 · OpenOBA
**优先级**：P1 — 通用规则基础设施

---

## 问题

当前 ERDL MCP Server 的 `erdl_evaluate` 上下文仅包含 `tool.name` / `tool.args` / `agent.id` / `session.id`，缺少用户消息内容。

无法匹配"用户说了什么"——这意味着**人与 Agent 之间的协作协议无法在 ERDL 规则层表达**。

## 场景

| 用户说 | Agent 应执行 |
|--------|-------------|
| "ERDL" | 加载 ERDL SPEC 文档，基于 SPEC 回答 |
| "status" | 加载项目上下文/身份定义，确认当前状态并报告 |
| "check" | 执行基线检查（git status / build / test） |
| "review" | 读取相关源码 → 分析 → 汇报 |

这些是人与 Agent 之间形成的"工作默契协议"，带有普遍性。

## 方案

在 `erdl_evaluate` 的 Tool Input Schema 中增加可选字段 `user_message?: string`，并注入 Guard Context：

```typescript
const guardContext = {
  'tool.name': args.tool_name,
  'tool.args': args.tool_args ?? {},
  'user.message': args.user_message ?? '',   // NEW
  ...
}
```

Agent 调用 `erdl_evaluate` 时传入最近一条用户消息，规则即可匹配关键词。

## 通用规则模板

```yaml
rules:
  - name: "keyword-protocol-xxx"
    description: "When user mentions TRIGGER_KEYWORD, execute PROTOCOL."
    priority: N
    when:
      logic: AND
      conditions:
        - field: "user.message"
          operator: contains | match      # contains 精确匹配 / match 模糊匹配
          value: "TRIGGER_KEYWORD"
    then: ALLOW
    message: |
      User triggered PROTOCOL_NAME via KEYWORD.

      Execute:
      1. ACTION_STEP_ONE
      2. ACTION_STEP_TWO
      3. Report result to user.
```

## 修改范围

| 文件 | 改动 |
|------|------|
| `src/tools/evaluate.ts` | `inputSchema` 增加 `user_message`；`guardContext` 增加 `user.message` |
| `src/tools/simulate.ts` | 同步增加（可选） |

## 依赖

- OpenClaw 侧：调用 `erdl_evaluate` 时传入最近一条用户消息
- 短期可用 `when:"true"` + message 模式绕过（Agent 自主判断）

---

_2026-07-11 · OpenOBA_
