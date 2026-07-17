# ERDL MCP Server — Tool API Reference

> Version: 1.1.5 · 2026-07-17

## Overview

ERDL MCP Server exposes 5 MCP tools. All tools use standard MCP `tools/call` protocol over stdio transport.

---

## `erdl_evaluate`

Evaluate a planned tool call against loaded rules before execution.

**When to call**: Before every tool call (exec, write_file, edit, web_search, etc).

### Input

```json
{
  "tool_name": "string — name of the tool being called",
  "tool_args": { "object — arguments being passed to the tool" },
  "agent_id": "string (optional) — agent identity for audit",
  "session_id": "string (optional) — session identifier for audit"
}
```

### Output

```json
{
  "decision": "ALLOW | DENY | CORRECT | REQUEST_HUMAN | EMERGENCY_HALT | PASS",
  "badge": { "emoji": "🛑", "label": "ERDL Blocked" },
  "matchedRules": [{ "id": "no_any", "name": "No any types", "decision": "DENY", "reason": "..." }],
  "totalEvaluated": 37,
  "totalMatched": 3
}
```

### Decision Meanings

| Decision | Meaning | Agent Action |
|----------|---------|-------------|
| `ALLOW` | Rule(s) matched with instructions | Execute, follow the instruction |
| `DENY` | Rule blocks this action | Stop. Tell user what was blocked. |
| `CORRECT` | Rule requires correction | Fix the request and retry. |
| `REQUEST_HUMAN` | Human approval required | Ask user before proceeding. |
| `EMERGENCY_HALT` | Critical rule triggered | Global halt, cannot bypass. |
| `PASS` | No rules matched | Use best judgment. |

---

## `erdl_simulate`

Test a potential rule against 3 scenarios BEFORE creating it.

### Input

```json
{
  "ruleName": "string — proposed rule name",
  "category": "coding | engineering | writing | design | security | testing | performance | compliance | accessibility | custom",
  "keywords": ["string — keywords that trigger this rule"],
  "decision": "ALLOW | DENY",
  "instruction": "string — instruction or reason"
}
```

### Output

```json
{
  "results": [{
    "description": "Scenario description",
    "intent": "Simulated intent",
    "matched": true,
    "decision": "DENY",
    "correct": true
  }],
  "passCount": 2,
  "totalScenarios": 3,
  "recommendation": "ready | needs-adjustment"
}
```

---

## `erdl_create_rule`

Create a new rule from natural language and save to `~/.openoba/rules/`.

### Input

```json
{
  "naturalLanguage": "string — the rule in your own words",
  "category": "coding | engineering | writing | design | security | testing | performance | compliance | accessibility | custom",
  "triggers": ["string"],
  "keywords": ["string"],
  "decision": "ALLOW | DENY",
  "instruction": "string — what to do or why to block"
}
```

### Output

```json
{
  "ruleId": "CO-001",
  "name": "Never use TypeScript any type",
  "status": "created",
  "filePath": "~/.openoba/rules/coding/co-001.erdl.yaml"
}
```

---

## `erdl_list_rules`

List all currently loaded rules.

### Input

```json
{
  "category": "coding | engineering | writing | design | security | testing | performance | compliance | accessibility | custom | all"
}
```

### Output

```json
{
  "count": 20,
  "categories": ["coding", "design", "writing"],
  "rules": [{
    "id": "TS-001",
    "name": "No any types",
    "category": "coding",
    "enabled": true,
    "priority": 5,
    "hitCount": 12
  }]
}
```

---

## `erdl_explain`

Show the full decision trail: which rules fired, which didn't, and why.

### Input

```json
{
  "tool_name": "string — same tool name as used for erdl_evaluate",
  "tool_args": { "object — same tool args as used for erdl_evaluate" }
}
```

### Output

```json
{
  "tool_name": "exec",
  "decision": "ALLOW",
  "totalChecked": 37,
  "matched": [
    {
      "ruleId": "no_dangerous_commands",
      "ruleName": "No dangerous commands",
      "category": "security",
      "matched": true,
      "decision": "DENY",
      "conditionDetail": "tool.name in [exec] AND tool.args.command match rm -rf"
    }
  ],
  "skipped": [
    {
      "ruleId": "no_any",
      "ruleName": "No any types",
      "matched": false
    }
  ]
}
```

---

## Rule File Format

Rules are stored as YAML in `~/.openoba/rules/`. The directory is organized by category:

```
~/.openoba/rules/
├── coding/
│   ├── no-any.erdl.yaml
│   └── my-custom.erdl.yaml
├── writing/
│   └── no-cliche.erdl.yaml
├── design/
│   └── tailwind-first.erdl.yaml
└── custom/
    └── anything.erdl.yaml
```

### YAML Schema (ERDL SPEC §5)

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_console_log"            # Required: unique rule name
    description: "Description here"    # Required: one-line description
    priority: 10                       # Lower = higher priority (1-1000)
    override: high                     # Optional: critical|high|normal|low
    when:
      logic: AND                       # AND | OR
      conditions:
        - field: "tool.name"           # Field to check
          operator: eq                 # eq|ne|gt|gte|lt|lte|in|contains|match|exists
          value: "exec"               # Value to compare
        - field: "tool.args.command"
          operator: match
          value: "pattern"
    then: DENY                         # ALLOW|CORRECT|DENY|REQUEST_HUMAN|EMERGENCY_HALT
    message: "Explanation message"
```

Rules reload automatically on file save — no restart needed.

---

> OpenOBA · ERDL MCP Server · 2026-07-17
