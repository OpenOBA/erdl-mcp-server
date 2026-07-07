# @openoba/erdl-mcp

## Your Agent finally remembers what you taught it.

**The Problem**: You told your Agent "no `any` types" yesterday.  
Today it used `any` again. The 5th time you're repeating yourself.

**The Solution**: `erdl-mcp` gives your Agent **muscle memory**.  
Say it once. It becomes a rule. Your Agent never forgets.

---

## Quick Start

```bash
npx -y @openoba/erdl-mcp
```

That's it. Your Agent now has a brain.

---

## What It Does

| Your Agent | Without ERDL | With ERDL |
|-----------|-------------|-----------|
| Writes TypeScript | Uses `any`, `@ts-ignore`, bad naming | Checks 5 coding rules before output |
| Writes content | "在当今数字化时代..." cliché openings | Writing tone rules fire automatically |
| Adds dependencies | Installs packages without asking | Blocked → asks for confirmation first |
| Creates UI | Inline styles with random colors | Tailwind-first, responsive, accessible |

---

## Five Tools

| Tool | When It's Used |
|------|---------------|
| `erdl_evaluate` | Agent checks rules before every output |
| `erdl_simulate` | Test a rule against 3 scenarios before creating |
| `erdl_create_rule` | "Remember this" → rule saved immediately |
| `erdl_list_rules` | "What rules do you have?" |
| `erdl_explain` | "Why did you do that?" → full decision trail |

---

## Built-in Rules (20 rules, ready to go)

### 🧑‍💻 Coding (10 rules)
- TypeScript: No `any`, no `@ts-ignore`, naming conventions, promise handling, no nested ternaries
- Git: Commit message format, one change per commit, PR title emoji prefix
- Dependencies: Confirm before adding, prefer existing packages

### ✍️ Writing (7 rules)
- Tone: No cliché openings, direct language, short sentences, no AI jargon
- Formatting: Chinese-English spacing, heading hierarchy, list consistency

### 🎨 Design (3 rules)
- Tailwind-first, responsive-first, accessibility (a11y)

---

## Supported Agents

| Agent | Setup |
|-------|-------|
| **OpenClaw** | `openclaw config set mcpServers.erdl.command "npx"` and `openclaw config set mcpServers.erdl.args '["-y", "@openoba/erdl-mcp"]'` |
| **Hermes** | Add to `~/.hermes/config.yaml` under `mcp_servers` |
| **Claude Code** | Add to `.claude/mcp.json` |
| **Cursor** | Add to `.cursor/mcp.json` |
| **Claude Desktop** | Add via MCP configuration UI |
| **Any MCP Host** | Standard stdio config |

---

## The Complete Loop

```
Agent makes a mistake
        ↓
You: "Don't do that. Remember this."
        ↓
Agent: erdl_simulate → 3 scenario previews
        ↓
Agent: erdl_create_rule → saved to ~/.openoba/rules/
        ↓
Next time: erdl_evaluate fires → Agent knows better
        ↓
You: "Why did you do that?" → Agent: erdl_explain (full trail)
```

---

## Custom Rules

Create YAML files in `~/.openoba/rules/`:

```yaml
# ~/.openoba/rules/custom/my-rules.yaml
rules:
  - id: MY-001
    name: My custom rule
    description: What I want my Agent to always remember
    category: custom
    triggers: [write_code, output_code]
    conditions:
      - kind: intent_contains
        keywords: [typescript, function]
    action:
      decision: ALLOW
      instruction: Always wrap API calls in try/catch with proper error handling.
    priority: 5
    enabled: true
```

Rules reload automatically when you save — no restart needed.

---

## Why ERDL vs SKILL.md?

| | SKILL.md (Prompt-based) | ERDL MCP Server |
|---|---|---|
| Execution | LLM "tries" to follow | **Deterministic engine** — guaranteed |
| Visibility | Invisible, can't tell if it worked | `erdl_explain` shows every decision |
| Reliability | LLM may ignore or forget | **Zero hallucination** — condition match is mathematical |
| Testing | Manual | `erdl_simulate` with 3 auto-scenarios |
| Portability | agentskills.io only | **All MCP-compatible Agents** |

ERDL rules don't suggest. They don't hope. They **enforce**.

---

## Documentation

- **[Tool API Reference](docs/tool-api-reference.md)** — Full input/output schemas for all 5 tools
- **[Rule File Format](docs/tool-api-reference.md#rule-file-format)** — YAML schema for custom rules
- **[GitHub](https://github.com/openoba/erdl-mcp-server)** — Source code + issues

---

## First-Run Experience

On first launch, `erdl-mcp` auto-deploys 20 preset rules to `~/.openoba/rules/`:

```
~/.openoba/rules/
├── coding/openoba-presets.yaml   (10 rules)
├── writing/openoba-presets.yaml  (7 rules)
├── design/openoba-presets.yaml   (3 rules)
```

Your Agent immediately starts checking them. No setup. No training.

---

## License

MIT · OpenOBA · [openoba.com](https://openoba.com)

---

Built by [OpenOBA](https://openoba.com) — AI Agents that actually work.
