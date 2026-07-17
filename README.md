# ERDL MCP Server

> **Stop reminding your Agent to behave. Teach it.**
> **One when/then sentence is all it takes.**

[![npm version](https://img.shields.io/npm/v/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@openoba-ai/erdl-mcp)](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)
[![license](https://img.shields.io/npm/l/@openoba-ai/erdl-mcp)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)
[![tests](https://img.shields.io/badge/tests-92%20passing-brightgreen)](https://github.com/OpenOBA/erdl-mcp-server/actions)
[![MCP](https://img.shields.io/badge/MCP-protocol-blue)](https://modelcontextprotocol.io)
[![MIT](https://img.shields.io/badge/license-MIT-green)](https://github.com/OpenOBA/erdl-mcp-server/blob/master/LICENSE)

> 📖 [中文版](./README.zh.md)

```bash
npx -y @openoba-ai/erdl-mcp
```

**30 rules. 5 tools. Zero config. Unlimited custom rules. Free forever.**

![ERDL demo — intercepting rm -rf /](./docs/demo.svg)

---

## The Problem

You tell your Agent "don't use `any`", "keep it short", "ask before adding dependencies". It nods. Five turns later, it's back to its old habits.

**Prompt-based rules don't work.** LLMs forget. They reinterpret. They rationalize. You're not guiding them — you're negotiating with them.

---

## The Solution

ERDL (Entity-Rule Definition Language) is a **deterministic rule engine** that runs as an MCP Server. Your Agent doesn't *try* to follow rules — the engine *enforces* them before every tool call.

| You say | What actually happens |
|---------|----------------------|
| "Never use `any`" | **Blocked**. The engine intercepts `write_file` calls, scans the content, and rejects `any` before the write happens. |
| "Don't start with 'In today's world'" | **Denied**. Writing rules fire before every output. The Agent receives the correction before it speaks. |
| "Ask before adding npm dependencies" | **Intercepted**. `exec` of `npm install` is stopped. You approve it, or it doesn't happen. |
| "Why did you do that?" | **Explained**. `erdl_explain` shows exactly which rule fired, what condition matched, and what happened. |

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Workflow                        │
│                                                         │
│  User says: "Write me a function"                       │
│       │                                                 │
│       ▼                                                 │
│  LLM plans: use write_file(path, code)                  │
│       │                                                 │
│       ▼                                                 │
│  ┌──────────────────────────────────────┐               │
│  │    ERDL Action Guard (MCP Server)    │  ← Protocol   │
│  │                                      │    Layer      │
│  │  1. Load 30 built-in rules           │               │
│  │  2. Evaluate: field/operator/value   │               │
│  │  3. Decision: ALLOW / DENY / CORRECT │               │
│  │  4. Return badge card + explanation  │               │
│  └──────────────────────────────────────┘               │
│       │                                                 │
│       ▼                                                 │
│  Tool executes (or is blocked)                          │
│                                                         │
│  No prompt engineering. No negotiation. Protocol-level. │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# One command. 30 rules active immediately.
npx -y @openoba-ai/erdl-mcp
```

That's it. No account. No API key. No configuration.

**Chinese / 中文：**
```bash
npx -y @openoba-ai/erdl-mcp --lang zh
```

Add it to your MCP client:

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

Or let ERDL generate the config:

```bash
npx @openoba-ai/erdl-mcp@latest --setup
```

**Supported clients:** Claude Desktop · Cursor · VS Code / Copilot · OpenClaw · WorkBuddy · any MCP-compatible client.

---

## ERDL vs Prompt Rules

| | Prompt / SKILL.md | ERDL |
|---|:---:|:---:|
| **Enforcement** | LLM "tries" to follow | **Deterministic engine** — guarantees execution |
| **Reliability** | May forget after 5 turns | Condition match is mathematical — **zero hallucination** |
| **Visibility** | Can't tell if it worked | `erdl_explain` shows every decision, every rule |
| **Testing** | Manual verification | `erdl_simulate` — 3 auto-generated scenarios |
| **Portability** | Tied to one platform | **All MCP-compatible Agents** |
| **Overridability** | LLM can "reinterpret" | **Protocol-layer block** — Agent cannot bypass |

---

## What's Included

### 30 Built-in Rules

| Category | Count | Covers |
|----------|:-----:|--------|
| `engineering` | 13 | Pipeline gates, no shortcuts, self-verify, decision logging, no force-push, no stash |
| `coding` | 6 | No `any`, no `@ts-ignore`, naming conventions, one-commit-one-change, dependency hygiene |
| `security` | 6 | No eval with input, no hardcoded secrets, no string SQL, validate all input, security headers, no stack traces |
| `testing` | 2 | Coverage never drops, no behavior without test |
| `writing` | 2 | Direct tone, no AI jargon |
| `observability` | 1 | No secrets in logs |

### 5 MCP Tools

| Tool | Use it when |
|------|-------------|
| `erdl_evaluate` | **Before every tool call** — mandatory Action Guard |
| `erdl_simulate` | Test a rule against 3 scenarios before creating it |
| `erdl_create_rule` | User says "remember this" → create a rule from NL |
| `erdl_list_rules` | User asks "what rules are active?" |
| `erdl_explain` | User asks "why did you do that?" → full decision trail |

### 2 Resources

| Resource | Purpose |
|----------|---------|
| `erdl://rules/list` | All active rules as JSON |
| `erdl://status` | Runtime status: rule counts by category, agent role |

---

## Creating a Rule

> **Turn your pain points into rules, one sentence at a time — banned, period.**
> **Turn your experience into rules, one sentence at a time — shared, forever.**

Every pain point is a `when(…) then(…)` sentence:

> when [trigger] · then [action]

| Variable | Meaning | Example |
|----------|---------|---------|
| **when** | What triggers it | code contains `any` · logs contain secrets · `git stash` used |
| **then** | What happens | **Block** it · **Correct** it · **Allow** with a warning · **Pause** for approval |

Fill in the blanks:

> **when** code contains `any` **then** block it\.

That's a rule.

```
You →   "Never use `any` in TypeScript."

Agent → 1. erdl_simulate   → tests against 3 scenarios
        2. erdl_create_rule → saves to ~/.openoba/rules/
        3. Rule is active.  → next `any` is blocked.

You →   "Why was my code rejected?"

Agent → erdl_explain → full decision trail:
         ✅ no_any: tool.name in [write_file, edit, apply_patch] AND content contains "any"
         → DENY: Do not use `any` type.
```

Or write rules by hand in `~/.openoba/rules/` (ERDL SPEC §5 format):

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

[📚 Full Tutorial →](./docs/tutorial-create-rules.md) · [📖 Rule Reference (30 rules) →](./docs/rule-reference.md)

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
| **Guardian Agent Role** | — | ✅ |
| **Audit Export** (OCSF / OTLP) | — | ✅ |
| **Team Rules** | — | ✅ |
| **Dashboard** (hit statistics) | — | ✅ |
| **Enterprise Compliance** (GB/Z 185, NIST, EU AI Act) | — | Enterprise |

[Get a Pro License →](https://openoba.com/erdl-mcp/pro)

---

## CLI Reference

```bash
npx @openoba-ai/erdl-mcp@latest           # Start (auto-latest via npx)
npx @openoba-ai/erdl-mcp@latest --lang zh  # Chinese mode
npx @openoba-ai/erdl-mcp@latest --upgrade   # Force upgrade
npx @openoba-ai/erdl-mcp@latest --uninstall # Clean removal
npx @openoba-ai/erdl-mcp@latest --setup     # Show MCP config
npx @openoba-ai/erdl-mcp@latest --help      # Full usage
```

---

## From Source

```bash
git clone https://github.com/OpenOBA/erdl-mcp-server.git
cd erdl-mcp-server
npm install
npm run build
npm test        # 92 tests
node bin/erdl-mcp.js
```

---

## Contributing

ERDL MCP Server is MIT-licensed and open to contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Star History

If ERDL helps your workflow, [give us a ⭐ on GitHub](https://github.com/OpenOBA/erdl-mcp-server) — it helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=OpenOBA/erdl-mcp-server&type=Date)](https://star-history.com/#OpenOBA/erdl-mcp-server&Date)

---

## License

MIT · [OpenOBA](https://openoba.com) · [@OpenOBA](https://github.com/OpenOBA)

> Deterministic architecture, not prompt engineering.
