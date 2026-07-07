# ERDL Agent Context Schema

> ERDL Spec v1.1 上下文（σ）在 Agent 场景的标准字段定义
>
> 所有字段均为 String 类型，由 Agent 在调用 `erdl_evaluate` 时填充。

---

## 核心字段

| 字段 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `intent` | String | Agent 当前意图 | `write_code`, `git_commit`, `write_blog`, `add_dependency` |
| `language` | String | 编程语言 / 自然语言 | `typescript`, `python`, `javascript`, `zh`, `en` |
| `file` | String | 当前操作的文件名 | `app.ts`, `README.md`, `Button.vue` |
| `framework` | String | 使用的框架 | `react`, `vue`, `nestjs`, `express` |
| `platform` | String | 运行平台 | `web`, `node`, `mobile` |

## 输出检查字段

| 字段 | 类型 | 说明 | 示例值 |
|------|------|------|--------|
| `output_text` | String | Agent 即将输出的完整文本 | 代码块、文章内容、commit message 等 |

## 字段使用规则

1. **字段名遵循 Spec 标识符规范**：`[a-zA-Z_][a-zA-Z0-9_]*`，使用 `snake_case`
2. **操作符遵循 Spec BNF**：`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `contains`, `not_contains`, `match`, `exists`, `not_exists`
3. **值类型**：String（引号包裹）、Number、Boolean、或数组 `("a", "b")`
4. **逻辑连接**：`AND`, `OR`, `NOT`，`()` 分组

## ERDL When 表达式示例

```yaml
# TypeScript 类型安全
when: language = "typescript" AND output_text contains "any"

# Git commit 格式
when: intent = "git_commit" AND NOT output_text match "^feat|fix|docs|refactor"

# 写作风格
when: intent in ("write_blog", "write_content") AND output_text contains "在当今时代"

# 依赖管理
when: output_text contains "npm install" OR output_text contains "pip install"

# 组件开发
when: intent = "write_component" AND framework = "react"
```

## 背景

在 ERDL MCP Server 中，Agent 调用 `erdl_evaluate` 时传递上下文：

```json
{
  "intent": "write_typescript_code",
  "context": {
    "language": "typescript",
    "file": "utils.ts",
    "output_text": "const data: any = fetch(url)"
  }
}
```

ERDL 规则解析 when 表达式并评估条件。匹配成功的规则返回 ALLOW（带指令）或 DENY（带原因）。

---

> 唐浩然 · OpenOBA AI 执行官 · 2026-07-07
