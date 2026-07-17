# ERDL MCP Server

> **Deterministic rules for AI Agents. Say it once. Never repeat.**

[![npm version](https://img.shields.io/npm/v/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![license](https://img.shields.io/npm/l/@openoba-ai/erdl-mcp)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)
[![tests](https://img.shields.io/badge/tests-44%20passing-brightgreen)](https://github.com/OpenOBA/erdl-mcp-server/actions)

> 📖 [中文版](./README.zh.md)

ERDL (Entity-Rule Definition Language) gives your Agent deterministic rules. 30 built-in rules across 6 categories. Unlimited personal rules. **Free forever.**

> 🆕 v1.1.5 — Rich Markdown output for full user-facing visibility + P0 fix: 30 built-in rules now load correctly

---

## Why ERDL?

| Without ERDL | With ERDL |
|-------------|-----------|
| "Don't use `any`" — forgotten in 5 turns | Rules enforced **deterministically**, every tool call |
| "Write shorter sentences" — ignored | Writing rules fire before every output |
| "Confirm before adding deps" — skipped | **Blocked** until you confirm |
| "Why did you do that?" — no answer | `erdl_explain` shows the full decision trail |

---

## Quick Start

```bash
# Start MCP Server (5 tools, 30 rules — all MCP clients)
npx -y @openoba-ai/erdl-mcp

# Or: install OpenClaw Plugin for hardware enforcement
openclaw plugins install @openoba-ai/erdl-openclaw
```

30 rules active immediately. No account. No configuration. No API key.

**中文用户：**
```bash
npx -y @openoba-ai/erdl-mcp --lang zh
```

---

## Free vs Pro

| | Free | Pro |
|------|:---:|:---:|
| 5 MCP Tools | ✅ | ✅ |
| 30 Preset Rules | ✅ | ✅ |
| Unlimited Personal Rules | ✅ | ✅ |
| Chinese / English | ✅ | ✅ |
| All 11 Operators | ✅ | ✅ |
| MIT Open Source | ✅ | ✅ |
| **Execution Rings 1–2** (REQUEST_HUMAN, ESCALATE, ROLLBACK, QUARANTINE) | — | ✅ |
| **Guardian Agent Role** (监管者模式) | — | ✅ |
| **Audit Export** (OCSF / OTLP) | — | ✅ |
| **Team Rules** (组织级规则共享) | — | ✅ |
| **Dashboard** (规则命中统计) | — | ✅ |
| **Enterprise Compliance Packs** (GB/Z 185, NIST, EU AI Act) | — | Enterprise |

[Get a Pro License →](https://openoba.com/erdl-mcp/pro)

### One-command Install

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.sh | bash
```

```powershell
# Windows (PowerShell)
iwr https://raw.githubusercontent.com/OpenOBA/erdl-mcp-server/master/scripts/install.ps1 | iex
```

---

## Why ERDL vs SKILL.md / Prompt Rules?

| | Prompt-Based Rules | ERDL MCP Server |
|---|:---:|:---:|
| Execution | LLM "tries" to follow | **Deterministic engine** — guaranteed |
| Visibility | Invisible, can't tell if it worked | `erdl_explain` shows every decision |
| Reliability | LLM may ignore or forget | **Zero hallucination** — condition match is mathematical |
| Testing | Manual | `erdl_simulate` with 3 auto-scenarios |
| Portability | Single platform | **All MCP-compatible Agents** |

ERDL rules don't suggest. They don't hope. They **enforce**.

---

## What's Included

### 30 Built-in Rules (6 Categories)

| Category | Rules | Scope |
|----------|:-----:|-------|
| `engineering` | 13 | Workflow discipline, pipeline gates, no shortcuts, self-verify, decision logging |
| `coding` | 6 | TypeScript quality: no `any`, no `@ts-ignore`, naming conventions, dependency hygiene |
| `security` | 6 | No eval with input, no hardcoded secrets, no string SQL, validate all input, security headers |
| `testing` | 2 | Coverage never drops, no behavior without test |
| `writing` | 2 | Direct tone, no AI jargon |
| `observability` | 1 | No secrets in logs |

### 5 MCP Tools

| Tool | Purpose |
|------|---------|
| `erdl_evaluate` | Action Guard — check rules before every tool call |
| `erdl_simulate` | Test a rule against 3 scenarios before creating |
| `erdl_create_rule` | Create a rule from natural language |
| `erdl_list_rules` | List all active rules |
| `erdl_explain` | Full decision trail for any action |

### MCP Resources

| Resource | Content |
|----------|---------|
| `erdl://rules/list` | All rules as JSON |
| `erdl://status` | Server runtime status |

---

## Installation

### Any MCP Client

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

Or let ERDL generate the config for your client:

```bash
npx @openoba-ai/erdl-mcp@latest --setup
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or the equivalent path on your OS.

### Cursor

Add to `.cursor/mcp.json` in your project root.

### OpenClaw

```bash
# MCP Server (all MCP clients)
openclaw mcp set erdl '{"command":"npx","args":["-y","@openoba-ai/erdl-mcp@latest"]}'

# OpenClaw Plugin (hard enforcement via before_tool_call)
openclaw plugins install @openoba-ai/erdl-openclaw
```

> **Plugin vs MCP Server**: The MCP Server gives your Agent ERDL tools. The Plugin adds **deterministic tool call interception** — rules run BEFORE every exec/write/search, no relying on LLM self-discipline. Install both for maximum protection.

### VS Code / GitHub Copilot

Add to `.vscode/mcp.json` or the Copilot MCP configuration.

---

## Creating Your First Rule

```
You: "Never use `any` in TypeScript."

Agent: 1. erdl_simulate → tests the rule against 3 scenarios
       2. erdl_create_rule → saves to ~/.openoba/rules/
       3. Rule is now active. Next `any` will be blocked.

You: "Why did you reject my code?"
Agent: erdl_explain → shows every rule that fired
```

Or create rules manually in `~/.openoba/rules/` (ERDL SPEC §5 format):

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_console_log"
    description: "Don't commit console.log statements"
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
    message: "Remove console.log before committing"
```

[📚 Full tutorial: Create Your First ERDL Rule →](./docs/tutorial-create-rules.md) ([English](./docs/tutorial-create-rules.en.md))

[📖 Complete Rule Reference (all 30 rules with modification guides) →](./docs/rule-reference.md) ([English](./docs/rule-reference.en.md))

---

## CLI Reference

```bash
npx @openoba-ai/erdl-mcp@latest          # Start MCP server (always latest)
npx @openoba-ai/erdl-mcp@latest --lang zh # Chinese mode
npx @openoba-ai/erdl-mcp@latest --upgrade  # Upgrade to latest
npx @openoba-ai/erdl-mcp@latest --uninstall  # Clean removal
npx @openoba-ai/erdl-mcp@latest --help     # Full usage
npx @openoba-ai/erdl-mcp@latest --setup    # Show MCP client config
```

> **Upgrading from v1.0.x?** You MUST update your MCP config:
>
> **Remove old local-path config:**
> ```bash
> openclaw mcp remove erdl  # or remove "erdl" from mcp.servers in config
> ```
>
> **Re-add with npx (auto-latest):**
> ```bash
> openclaw mcp set erdl "{\"command\":\"npx\",\"args\":[\"-y\",\"@openoba-ai/erdl-mcp@latest\"]}"
> ```
> Or manually in `~/.openclaw/openclaw.json` → `mcp.servers.erdl`:
> ```json
> { "command": "npx", "args": ["-y", "@openoba-ai/erdl-mcp@latest"] }
> ```
>
> **npm cache clearing** (if `--version` shows an older release):
> ```bash
> npm cache clean --force
> ```

### Run from Source

```bash
git clone https://github.com/OpenOBA/erdl-mcp-server.git
cd erdl-mcp-server
npm install
npm run build
node bin/erdl-mcp.js --version
```

---

## License

MIT · [OpenOBA](https://openoba.com) · [@OpenOBA](https://github.com/OpenOBA)

Built by AI + Human. Deterministic architecture, not prompt engineering.
