# ERDL MCP Server

> **为 AI Agent 提供确定性规则。说一次，永不重复。**

[![npm version](https://img.shields.io/npm/v/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![license](https://img.shields.io/npm/l/@openoba-ai/erdl-mcp)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)
[![tests](https://img.shields.io/badge/tests-92%20passing-brightgreen)](https://github.com/OpenOBA/erdl-mcp-server/actions)

> 📖 [English](./README.md)

ERDL（Entity-Rule Definition Language，实体-规则定义语言）为你的 AI Agent 提供确定性规则执行。30 条内置规则覆盖 6 大类别。无限条个人规则。**永久免费。**

> 🆕 v1.1.5 — 富 Markdown 输出实现用户可感知的规则引擎 + P0 修复：30 条内置规则现已正确加载

---

## 为什么选 ERDL？

| 不用 ERDL | 用 ERDL |
|-------------|-----------|
| "别用 `any`" — 5 轮对话后就忘了 | 每次 Tool Call **确定性强制执行** |
| "写短一点" — 被无视 | 每次输出前执行写作规则 |
| "加依赖前确认一下" — 跳过了 | **直接拦截**，直到你确认 |
| "你为啥这么干？" — 没答案 | `erdl_explain` 展示完整决策链路 |

---

## 快速开始

```bash
# 启动 MCP Server（5 个工具，30 条规则 — 所有 MCP 客户端通用）
npx -y @openoba-ai/erdl-mcp
```

30 条规则立即生效。无需注册、无需配置、无需 API Key。

**中文用户：**
```bash
npx -y @openoba-ai/erdl-mcp --lang zh
```

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

### 一键安装

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.sh | bash
```

```powershell
# Windows（PowerShell）
iwr https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.ps1 | iex
```

---

## ERDL vs SKILL.md / Prompt 规则

| | Prompt 规则 | ERDL MCP Server |
|---|:---:|:---:|
| 执行方式 | LLM "尝试" 遵守 | **确定性引擎** — 保证执行 |
| 可见性 | 不可见，不知道是否生效 | `erdl_explain` 展示每条决策 |
| 可靠性 | LLM 可能忽略或遗忘 | **零幻觉** — 条件匹配是数学运算 |
| 测试 | 手动 | `erdl_simulate` 自动 3 场景测试 |
| 跨平台 | 单一平台 | **所有 MCP 兼容 Agent** |

ERDL 规则不"建议"。不"希望"。**强制执行。**

---

## 包含内容

### 30 条内置规则（6 大类别）

| 类别 | 规则数 | 覆盖范围 |
|----------|:---:|-------|
| `engineering`（工程） | 13 | 工作流规范、流水线门禁、杜绝走捷径、自验证、决策日志 |
| `coding`（编码） | 6 | TypeScript 质量：禁用 `any`、禁用 `@ts-ignore`、命名规范、依赖管理 |
| `security`（安全） | 6 | 禁用 eval 注入、禁用硬编码密钥、禁用 SQL 拼接、校验所有输入、安全 Header |
| `testing`（测试） | 2 | 覆盖率不下降、无测试不新增行为 |
| `writing`（写作） | 2 | 直接语气、禁用 AI 套话 |
| `observability`（可观测性） | 1 | 日志不泄露密钥 |

### 5 个 MCP 工具

| 工具 | 用途 |
|------|---------|
| `erdl_evaluate` | Action Guard — 每次 Tool Call 前检查规则 |
| `erdl_simulate` | 创建前用 3 个场景测试规则 |
| `erdl_create_rule` | 用自然语言创建规则 |
| `erdl_list_rules` | 列出所有活跃规则 |
| `erdl_explain` | 展示任何操作的完整决策链路 |

### MCP 资源

| 资源 | 内容 |
|----------|---------|
| `erdl://rules/list` | 所有规则（JSON） |
| `erdl://status` | 服务器运行时状态 |

---

## 安装

### 任何 MCP 客户端

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

或让 ERDL 为你的客户端生成配置：

```bash
npx @openoba-ai/erdl-mcp@latest --setup
```

### Claude Desktop

添加至 `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS），或对应操作系统的路径。

### Cursor

添加至项目根目录的 `.cursor/mcp.json`。

### OpenClaw

```bash
# MCP Server（所有 MCP 客户端）
openclaw mcp set erdl '{"command":"npx","args":["-y","@openoba-ai/erdl-mcp@latest"]}'

# OpenClaw 插件（通过 before_tool_call 实现硬件级拦截）
openclaw plugins install @openoba-ai/erdl-openclaw
```

> **插件 vs MCP Server**：MCP Server 为你的 Agent 提供 ERDL 工具。插件提供**确定性 Tool Call 拦截**——规则在每次 exec/write/search 之前执行，不依赖 LLM 的自我约束。两者都装，保护最全面。

### VS Code / GitHub Copilot

添加至 `.vscode/mcp.json` 或 Copilot MCP 配置。

---

## 创建第一条规则

```
你：   "永远不要用 any 类型。"

Agent： 1. erdl_simulate → 用 3 个场景测试规则
        2. erdl_create_rule → 保存至 ~/.openoba/rules/
        3. 规则立即生效。下次用 `any` 会被拦截。

你：   "为什么拒绝了我的代码？"
Agent： erdl_explain → 展示每条触发的规则
```

或手动在 `~/.openoba/rules/` 中创建规则（ERDL SPEC §5 格式）：

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

[📚 完整教程：创建你的第一条 ERDL 规则 →](./docs/tutorial-create-rules.md)（[English](./docs/tutorial-create-rules.en.md)）

[📖 完整规则参考手册（含全部 30 条规则的修改指南）→](./docs/rule-reference.md)（[English](./docs/rule-reference.en.md)）

---

## CLI 参考

```bash
npx @openoba-ai/erdl-mcp@latest          # 启动 MCP Server（始终最新版）
npx @openoba-ai/erdl-mcp@latest --lang zh # 中文模式
npx @openoba-ai/erdl-mcp@latest --upgrade  # 升级至最新版
npx @openoba-ai/erdl-mcp@latest --uninstall  # 干净卸载
npx @openoba-ai/erdl-mcp@latest --help     # 完整使用说明
npx @openoba-ai/erdl-mcp@latest --setup    # 显示 MCP 客户端配置
```

> **从 v1.0.x 升级？**必须更新 MCP 配置：
>
> **删除旧的本地路径配置：**
> ```bash
> openclaw mcp remove erdl  # 或从 mcp.servers 中删除 "erdl"
> ```
>
> **用 npx 重新添加（自动获取最新版）：**
> ```bash
> openclaw mcp set erdl "{\"command\":\"npx\",\"args\":[\"-y\",\"@openoba-ai/erdl-mcp@latest\"]}"
> ```
> 或手动编辑 `~/.openclaw/openclaw.json` → `mcp.servers.erdl`：
> ```json
> { "command": "npx", "args": ["-y", "@openoba-ai/erdl-mcp@latest"] }
> ```
>
> **清理 npm 缓存**（如果 `--version` 仍显示旧版本）：
> ```bash
> npm cache clean --force
> ```

### 从源码运行

```bash
git clone https://github.com/OpenOBA/erdl-mcp-server.git
cd erdl-mcp-server
npm install
npm run build
node bin/erdl-mcp.js --version
```

---

## 许可证

MIT · [OpenOBA](https://openoba.com) · [@OpenOBA](https://github.com/OpenOBA)

由 AI + 人类共同构建。确定性架构，而非 Prompt 工程。
