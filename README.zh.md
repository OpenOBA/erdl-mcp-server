# ERDL MCP Server

> **与其反复提醒 Agent 守规矩，不如让他学规矩。**
> **用 when/then 一句话，就能教出一个懂规矩的 Agent。**

[![npm version](https://img.shields.io/npm/v/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![license](https://img.shields.io/npm/l/@openoba-ai/erdl-mcp)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)
[![tests](https://img.shields.io/badge/tests-92%20passing-brightgreen)](https://github.com/OpenOBA/erdl-mcp-server/actions)
[![MCP](https://img.shields.io/badge/MCP-protocol-blue)](https://modelcontextprotocol.io)
[![MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)

> 📖 [English](./README.md)

```bash
npx -y @openoba-ai/erdl-mcp
```

**30 条规则。5 个工具。零配置。自定义规则，无限添加。永久免费。**

![ERDL 演示 — 拦截 rm -rf /](./docs/demo.svg)

---

## 痛点

你跟 Agent 说"别用 `any`"、"写短一点"、"加依赖前先问我"。它点头说好。五轮对话后，又回到老样子。

**用 Prompt 管 Agent 不管用。** LLM 会遗忘、会曲解、会自我合理化。你不是在引导它——你是在跟它谈判。

---

## 解决

ERDL（Entity-Rule Definition Language，实体-规则定义语言）是一个**确定性规则引擎**，作为 MCP Server 运行。Agent 不是"尝试"遵守规则——引擎在每次 Tool Call 前**强制执行**。

| 你说的话 | 实际效果 |
|---------|---------|
| "别用 `any`" | **直接拦截**。引擎在 `write_file` 执行前扫描内容，发现 `any` 就阻止写入。 |
| "别用'在当今时代'开头" | **当场纠正**。写作规则在输出前触发，Agent 还没开口就被修好。 |
| "加 npm 依赖前先问我" | **卡住不动**。`exec npm install` 被拦截，你批准了才能执行。 |
| "你为啥这么干？" | **一清二楚**。`erdl_explain` 展示哪条规则触发、什么条件匹配、发生了什么。 |

---

## 工作原理

```
┌─────────────────────────────────────────────────────────┐
│                    Agent 工作流                          │
│                                                         │
│  用户说："帮我写个函数"                                   │
│       │                                                 │
│       ▼                                                 │
│  LLM 计划：write_file(path, code)                        │
│       │                                                 │
│       ▼                                                 │
│  ┌──────────────────────────────────────┐               │
│  │    ERDL Action Guard（MCP Server）    │  ← 协议层    │
│  │                                      │    拦截      │
│  │  1. 加载 30 条内置规则                │               │
│  │  2. 评估：field/operator/value       │               │
│  │  3. 判定：ALLOW / DENY / CORRECT      │               │
│  │  4. 返回徽章卡片 + 解释               │               │
│  └──────────────────────────────────────┘               │
│       │                                                 │
│       ▼                                                 │
│  工具执行（或被拦截）                                    │
│                                                         │
│  不靠 Prompt 工程。不靠谈判。协议层拦截。                  │
└─────────────────────────────────────────────────────────┘
```

---

## 快速开始

```bash
# 一行命令，30 条规则立即生效
npx -y @openoba-ai/erdl-mcp
```

就这一行。无需注册、无需 API Key、无需配置。

**中文用户（默认中文界面）：**
```bash
npx -y @openoba-ai/erdl-mcp --lang zh
```

加入你的 MCP 客户端配置：

```json
{
  "mcpServers": {
    "erdl": {
      "command": "npx",
      "args": ["-y", "@openoba-ai/erdl-mcp@latest"]
    }
  }
}
```

或者让 ERDL 自动生成配置：

```bash
npx @openoba-ai/erdl-mcp@latest --setup
```

**支持的客户端：** Claude Desktop · Cursor · VS Code / Copilot · OpenClaw · WorkBuddy · 任何 MCP 兼容客户端。

---

## ERDL vs Prompt 规则

| | Prompt / SKILL.md | ERDL |
|---|:---:|:---:|
| **执行方式** | LLM "尝试" 遵守 | **确定性引擎** — 保证执行 |
| **可靠性** | 5 轮对话后就忘了 | 条件匹配是数学运算 — **零幻觉** |
| **可见性** | 无法判断是否生效 | `erdl_explain` 展示每条决策、每条规则 |
| **可测试** | 手动验证 | `erdl_simulate` — 自动生成 3 个场景 |
| **跨平台** | 绑定单一平台 | **所有 MCP 兼容 Agent** |
| **可绕过性** | LLM 可以"重新理解" | **协议层拦截** — Agent 无法绕过 |

---

## 包含内容

### 30 条内置规则

| 类别 | 数量 | 覆盖 |
|----------|:---:|------|
| `engineering`（工程） | 13 | 流水线门禁、杜绝走捷径、自验证、决策日志、禁止 force-push、禁止 stash |
| `coding`（编码） | 6 | 禁用 `any`、禁用 `@ts-ignore`、命名规范、一次一提交、依赖卫生 |
| `security`（安全） | 6 | 禁用 eval 注入、禁用硬编码密钥、禁用 SQL 拼接、校验所有输入、安全 Header、禁止泄露堆栈 |
| `testing`（测试） | 2 | 覆盖率不下降、无测试不新增行为 |
| `writing`（写作） | 2 | 直接语气、禁用 AI 套话 |
| `observability`（可观测性） | 1 | 日志不泄露密钥 |

### 5 个 MCP 工具

| 工具 | 使用时机 |
|------|---------|
| `erdl_evaluate` | **每次 Tool Call 之前** — 强制 Action Guard |
| `erdl_simulate` | 创建规则前，用 3 个场景测试 |
| `erdl_create_rule` | 用户说"记住这个" → 自然语言创建规则 |
| `erdl_list_rules` | 用户问"有哪些规则？" |
| `erdl_explain` | 用户问"为什么？" → 完整决策链路 |

### 2 个资源

| 资源 | 用途 |
|----------|---------|
| `erdl://rules/list` | 所有活跃规则（JSON） |
| `erdl://status` | 运行时状态：各类别规则数、Agent 角色 |

---

## 创建规则

> **将你的痛点，用一句话转化成规则，令行禁止。**
> **将你的经验，用一句话转化成规则，发扬光大。**

每个痛点都是一个 `when(当) … then(应当) …` 的句子：

> 当(when) [触发条件] · 应当(then) [执行动作]

| 变量 | 含义 | 示例 |
|------|------|------|
| **when** | 什么时候触发 | 代码里出现 `any` · 日志里出现密码 · 用了 `git stash` |
| **then** | 触发后做什么 | **拦截**它 · **纠正**它 · **放行**但提醒 · **暂停**等审批 |

造个句：

> **when** 代码里出现 `any` **then** 拦截它\.

这就是一条规则。

```
你 →   "永远不要用 any 类型。"

Agent→ 1. erdl_simulate   → 用 3 个场景测试规则
       2. erdl_create_rule → 保存至 ~/.openoba/rules/
       3. 规则立即生效。   → 下次 `any` 被拦截

你 →   "为什么拒绝了我的代码？"

Agent→ erdl_explain → 完整决策链路：
        ✅ no_any: tool.name ∈ [write_file, edit, apply_patch] AND content 包含 "any"
        → DENY: 不要使用 `any` 类型。
```

或手动在 `~/.openoba/rules/` 中编写（ERDL SPEC §5 格式）：

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_console_log"
    description: "不要提交 console.log 语句"
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
    message: "提交前请删除 console.log"
```

[📚 完整教程 →](./docs/tutorial-create-rules.md) · [📖 规则参考手册（30 条）→](./docs/rule-reference.md)

---

## 免费版 vs Pro 版

| | 免费版 | Pro 版 |
|------|:---:|:---:|
| 5 个 MCP 工具 | ✅ | ✅ |
| 30 条预设规则 | ✅ | ✅ |
| 无限条个人规则 | ✅ | ✅ |
| 中文 / 英文 | ✅ | ✅ |
| 全部 11 种运算符 | ✅ | ✅ |
| MIT 开源 | ✅ | ✅ |
| **执行环 1–2**（REQUEST_HUMAN, ESCALATE, ROLLBACK, QUARANTINE） | — | ✅ |
| **Guardian Agent 角色**（监管者模式） | — | ✅ |
| **审计导出**（OCSF / OTLP） | — | ✅ |
| **团队规则**（组织级规则共享） | — | ✅ |
| **仪表盘**（规则命中统计） | — | ✅ |
| **企业合规包**（GB/Z 185, NIST, EU AI Act） | — | 企业版 |

[获取 Pro License →](https://openoba.com/erdl-mcp/pro)

---

## CLI 参考

```bash
npx @openoba-ai/erdl-mcp@latest           # 启动（npx 自动获取最新版）
npx @openoba-ai/erdl-mcp@latest --lang zh  # 中文模式
npx @openoba-ai/erdl-mcp@latest --upgrade   # 强制升级
npx @openoba-ai/erdl-mcp@latest --uninstall # 干净卸载
npx @openoba-ai/erdl-mcp@latest --setup     # 显示 MCP 客户端配置
npx @openoba-ai/erdl-mcp@latest --help      # 完整用法
```

---

## 从源码运行

```bash
git clone https://github.com/OpenOBA/erdl-mcp-server.git
cd erdl-mcp-server
npm install
npm run build
npm test        # 92 项测试
node bin/erdl-mcp.js
```

---

## 参与贡献

ERDL MCP Server 采用 MIT 许可证，欢迎参与。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## Star 历史

如果 ERDL 帮到了你，[在 GitHub 上 ⭐ 一下](https://github.com/OpenOBA/erdl-mcp-server)，让更多人发现这个项目。

[![Star History Chart](https://api.star-history.com/svg?repos=OpenOBA/erdl-mcp-server&type=Date)](https://star-history.com/#OpenOBA/erdl-mcp-server&Date)

---

## 许可证

MIT · [OpenOBA](https://openoba.com) · [@OpenOBA](https://github.com/OpenOBA)

> 确定性架构，而非 Prompt 工程。
