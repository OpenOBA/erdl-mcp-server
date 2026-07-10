# ERDL MCP Server

> **Deterministic rules for AI Agents. Say it once. Never repeat.**

[![npm version](https://img.shields.io/npm/v/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![license](https://img.shields.io/npm/l/@openoba-ai/erdl-mcp)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)
[![tests](https://img.shields.io/badge/tests-67%20passing-brightgreen)](https://github.com/OpenOBA/erdl-mcp-server/actions)

ERDL (Entity-Rule Definition Language) gives your Agent deterministic rules. 30 built-in presets. Unlimited personal rules. **Free forever.**

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
npx -y @openoba-ai/erdl-mcp
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

### 30 Built-in Rules

| Category | Rules | Scope |
|----------|:-----:|-------|
| `coding` | 10 | TypeScript quality, Git discipline, dependency hygiene |
| `engineering` | 10 | Workflow discipline: honesty, no shortcuts, pipeline gates |
| `writing` | 7 | Tone, formatting, clarity |
| `design` | 3 | Tailwind-first, responsive, accessible |

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
      "args": ["-y", "@openoba-ai/erdl-mcp"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or the equivalent path on your OS.

### Cursor

Add to `.cursor/mcp.json` in your project root.

### OpenClaw

```bash
openclaw mcp set erdl '{"command":"npx","args":["-y","@openoba-ai/erdl-mcp"]}'
```

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

Or create rules manually in `~/.openoba/rules/`:

```yaml
rules:
  - id: MY-001
    name: no_console_log
    description: Don't commit console.log statements
    category: coding
    triggers: [write_file, edit, apply_patch]
    when: "tool.args.path match \"\\.tsx?$\""
    then: DENY "Remove console.log before committing"
    priority: 10
    enabled: true
```

[📚 Full tutorial: Create Your First ERDL Rule →](./docs/tutorial-create-rules.md) ([English](./docs/tutorial-create-rules.en.md))

---

## CLI Reference

```bash
npx @openoba-ai/erdl-mcp               # Start MCP server
npx @openoba-ai/erdl-mcp --lang zh     # Chinese mode
npx @openoba-ai/erdl-mcp --pro-key sk-xxx  # Activate Pro license
npx @openoba-ai/erdl-mcp --upgrade     # Upgrade to latest
npx @openoba-ai/erdl-mcp --uninstall   # Clean removal
npx @openoba-ai/erdl-mcp --help        # Full usage
```

---

## License

MIT · [OpenOBA](https://openoba.com) · [@OpenOBA](https://github.com/OpenOBA)

Built by AI + Human. Deterministic architecture, not prompt engineering.
