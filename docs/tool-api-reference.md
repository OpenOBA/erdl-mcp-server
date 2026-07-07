# ERDL MCP Server — Tool API Reference

## Overview

ERDL MCP Server exposes 5 MCP tools. All tools use standard MCP `tools/call` protocol over stdio transport.

---

## `erdl_evaluate`

Evaluate a planned action against your rules before executing.

**When to call**: Before outputting code, writing content, adding dependencies, or creating UI.

### Input

```json
{
  "intent": "string — what you are about to do",
  "context": "object — relevant context (file, language, platform, etc.)"
}
```

### Output

```json
{
  "decision": "ALLOW | DENY | PASS",
  "matchedRules": [{ "id": "TS-001", "name": "No any types", "instruction": "..." }],
  "totalEvaluated": 20,
  "totalMatched": 3
}
```

### Decision Meanings

| Decision | Meaning | Agent Action |
|----------|---------|-------------|
| `ALLOW` | Rule(s) matched, follow instructions | Execute with specified constraints |
| `DENY` | Rule blocks this action | Present reason to user, do NOT proceed |
| `PASS` | No rules matched | Use your best judgment |

---

## `erdl_simulate`

Test a potential rule against 3 scenarios BEFORE creating it.

### Input

```json
{
  "ruleName": "string — proposed rule name",
  "category": "coding | writing | design | custom",
  "triggers": ["string"],
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
  "category": "coding | writing | design | custom",
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
  "filePath": "~/.openoba/rules/coding/co-001.yaml"
}
```

---

## `erdl_list_rules`

List all currently loaded rules.

### Input

```json
{
  "category": "coding | writing | design | custom | all"
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
  "intent": "string — the intent to explain",
  "context": "object — same context used for evaluate"
}
```

### Output

```json
{
  "intent": "write typescript code with any",
  "decision": "DENY",
  "totalChecked": 20,
  "matched": [
    {
      "ruleId": "CO-001",
      "ruleName": "No any types",
      "category": "coding",
      "matched": true,
      "decision": "DENY",
      "conditionDetail": "intent contains any of: [any, typescript, .ts]"
    }
  ],
  "skipped": [
    {
      "ruleId": "WR-001",
      "ruleName": "No cliché openings",
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
│   ├── openoba-presets.yaml
│   └── my-custom.yaml
├── writing/
│   └── openoba-presets.yaml
├── design/
│   └── openoba-presets.yaml
└── custom/
    └── anything.yaml
```

### YAML Schema

```yaml
rules:
  - id: MY-001                          # Required: unique rule ID
    name: My custom rule                # Required: human-readable name
    description: What this rule does    # Required: one-line description
    category: custom                    # coding | writing | design | custom
    triggers: [write_code, output_code] # Optional: intent triggers
    conditions:
      - kind: intent_contains           # intent_contains | intent_matches | context_matches
        keywords: [typescript, function] # For intent_contains
    action:
      decision: ALLOW                   # ALLOW | DENY
      instruction: Always handle errors. # For ALLOW: what to do
      reason: This is not allowed.      # For DENY: why blocked
    priority: 10                        # Lower = higher priority (1-1000)
    enabled: true
    version: 1
```

Rules reload automatically on file save — no restart needed.

---

> 唐浩然 · OpenOBA AI 执行官 · 2026-07-07
