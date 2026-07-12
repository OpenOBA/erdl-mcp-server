# ERDL OpenClaw Plugin

> **Deterministic rules for OpenClaw — intercept every tool call before execution.**

ERDL Action Guard installs as an OpenClaw plugin and evaluates every tool call
against your ERDL rules **before** the tool executes. Rules can BLOCK, CORRECT,
or REQUEST_HUMAN approval — deterministically, without relying on LLM discipline.

## Features

- **Hard enforcement** — rules run as a `registerTrustedToolPolicy`, the highest-priority tool interceptor in OpenClaw
- **67 preset rules** — coding, writing, design, engineering, security, testing, performance, and observability rules active immediately
- **Custom rules** — add your own `~/.openoba/rules/*.yaml` files
- **Zero config** — works out of the box with the same rules as `@openoba-ai/erdl-mcp`

## Install

```bash
openclaw plugins install @openoba-ai/erdl-openclaw
```

Or from local:

```bash
openclaw plugins install ./openclaw-plugin
```

## Usage

Once installed, the plugin activates automatically on Gateway startup. Every tool call
will be checked against ERDL rules.

### What you'll see

When a rule matches:

| Decision | Effect |
|----------|--------|
| **DENY** | Tool call blocked. Agent sees: `🛑 ERDL Guard · <reason>` |
| **CORRECT** | Tool call blocked. Agent sees: `🔧 ERDL Correct · <correction>` |
| **REQUEST_HUMAN** | Tool call paused, user approval requested |
| **EMERGENCY_HALT** | Tool call immediately halted: `🚨 ERDL HALT · <reason>` |
| **ALLOW** | Tool proceeds normally |
| **PASS** | No rules matched, tool proceeds |

### Custom rules

Place YAML files in `~/.openoba/rules/`. Example:

```yaml
id: CUSTOM-001
name: no_force_delete
description: Never allow force-delete on production data
category: engineering
triggers:
  - exec
  - write
conditions:
  - kind: context_matches
    field: tool.args.command
    pattern: "(rm -rf|DROP TABLE|DELETE.*FORCE)"
action:
  decision: DENY
  reason: "Destructive operation blocked. Use safer alternatives."
priority: 1
enabled: true
```

## Configuration

In `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "erdl": {
        "config": {
          "verbose": true
        }
      }
    }
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `verbose` | boolean | `false` | Log matched rules to Gateway console |
| `rulesDir` | string | `~/.openoba/rules` | Custom rules directory |

## How it works

```
Agent calls exec("rm -rf /important")
  ↓
OpenClaw before_tool_call hook
  ↓
ERDL Guard evaluates against 67 rules
  ↓
Match: EN-010 no_force_push_main → DENY
  ↓
Tool call blocked. Agent receives:
  "🛑 ERDL Guard · Forbidden operation"
```

## Related

- [ERDL MCP Server](https://www.npmjs.com/package/@openoba-ai/erdl-mcp) — standalone MCP server for any MCP client
- [ERDL Spec](https://openoba.com/erdl) — full ERDL language specification
- [OpenOBA](https://openoba.com) — AI Executive for Enterprises

## License

MIT © OpenOBA
