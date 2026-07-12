# Create Your First ERDL Rule

> Give your Agent muscle memory in 10 minutes.

---

## 1. What's a Rule

An ERDL rule = `when` (trigger condition) + `then` (action to take).

```yaml
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"
    - field: "tool.args.command"
      operator: match
      value: "rm -rf"
then: DENY
```

Before every tool call, ERDL checks all your rules. The first matching rule decides: allow or block.

---

## 2. Your First Rule

Create a file like `custom/my-rules.erdl.yaml` in `~/.openoba/rules/`:

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_any_type"
    description: "Disallow the any type"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "\\bany\\b"
    then: DENY
    message: "Never use 'any' type. Use 'unknown' instead."
```

Save it — ERDL auto-loads. Next time your Agent tries to write code with `any`, it gets blocked.

---

## 3. Rule Structure

### Complete Template (ERDL SPEC §5)

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "rule_name"            # Unique rule name
    description: "What it does"   # Brief description
    priority: 10                 # Priority (1 highest, 1000 lowest)
    override: high               # Optional: critical|high|normal|low
    when:
      logic: AND                 # AND | OR
      conditions:
        - field: "field.name"    # Context field to check
          operator: operator     # See operator table below
          value: value           # Comparison value
    then: action                 # See action table below
    message: "Explanation"
```

### Supported Categories (organize rules by directory)

| Directory | Scope |
|-----------|-------|
| `coding` | Code style, naming, type safety |
| `engineering` | Workflow discipline, pipeline gates |
| `writing` | Tone, formatting, clarity |
| `design` | UI/UX, responsive, accessibility |
| `security` | Vulnerability prevention |
| `performance` | Optimization constraints |
| `testing` | Coverage, quality gates |
| `observability` | Logging, monitoring, health checks |
| `custom` | Uncategorized |

---

## 4. when — Condition Expressions

### SPEC §5 Structure

Each `when` has a `logic` (`AND` or `OR`) and a `conditions` array. Each condition has three elements: `field`, `operator`, `value`.

```yaml
# Equality
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"

# Value in list
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: in
      value: ["exec", "write", "edit"]

# Regex match
when:
  logic: AND
  conditions:
    - field: "tool.args.command"
      operator: match
      value: "(rm -rf|sudo)"

# AND logic (both conditions must match)
when:
  logic: AND
  conditions:
    - field: "tool.name"
      operator: eq
      value: "exec"
    - field: "tool.args.command"
      operator: match
      value: "git stash"

# OR logic (any condition matches)
when:
  logic: OR
  conditions:
    - field: "tool.args.command"
      operator: match
      value: "Set-Content"
    - field: "tool.args.command"
      operator: match
      value: "Out-File"
```

---

## 5. then — Action Types

| Action | Meaning | Agent Behavior |
|--------|---------|---------------|
| `ALLOW` | Allow with suggestion | Execute, follow message |
| `CORRECT` | Auto-correct | Parameters fixed, then allow |
| `DENY` | Hard block | Operation denied |
| `REQUEST_HUMAN` | Require approval | Pause, wait for user |
| `EMERGENCY_HALT` | Emergency stop | Global halt, maximum alert |

---

## 6. Real-World Examples

### Coding Standards

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_console_log"
    description: "Don't commit console.log"
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
    message: "Remove console.log before committing. Use the project Logger."

  - name: "handle_promises"
    description: "All Promises must be handled"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "async|Promise"
    then: ALLOW
    message: "Async operations must use try-catch or .catch()."
```

### Security Rules

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "dangerous_command"
    description: "Block dangerous system commands"
    priority: 1
    override: critical
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
        - field: "tool.args.command"
          operator: match
          value: "(rm -rf|sudo|chmod 777|> /dev/)"
    then: EMERGENCY_HALT
    message: "Dangerous system command detected. Global halt."

  - name: "protect_env_file"
    description: "Protect sensitive config files"
    priority: 2
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit"]
        - field: "tool.args"
          operator: match
          value: "(\\.env|/etc/)"
    then: DENY
    message: "Modifying sensitive configuration files is forbidden."
```

### Writing Style

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_ai_jargon"
    description: "No AI cliches"
    priority: 10
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"
          operator: match
          value: "delve|unleash|game.changer|revolutionize"
    then: CORRECT
    message: "Avoid AI cliches: delve, unleash, game-changer, etc."

  - name: "short_sentences"
    description: "Short sentences preferred"
    priority: 20
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: in
          value: ["write", "edit", "apply_patch"]
    then: ALLOW
    message: "Use short sentences. One point per sentence."
```

### Engineering Discipline

```yaml
protocol: "erdl/v1"
version: "1.0.0"

rules:
  - name: "no_git_stash"
    description: "No git stash accumulation"
    priority: 4
    override: high
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
        - field: "tool.args.command"
          operator: match
          value: "git stash"
    then: DENY
    message: "No git stash. All changes must go into commits."

  - name: "pipeline_before_push"
    description: "Quality check before push"
    priority: 3
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
        - field: "tool.args.command"
          operator: match
          value: "push"
    then: ALLOW
    message: "Before push: typecheck -> build -> test. Stop on any failure."
```

---

## 7. Priority & Override

### Priority

- Lower number = higher priority (1 is highest)
- Same priority = definition order
- No match = default PASS

### Override (Hard Constraint)

Rules marked `override: critical` or `override: high` immediately terminate all further rule evaluation when matched. Use for security-critical rules.

```yaml
rules:
  - name: "block_all_exec"      # Priority 1, matches first
    priority: 1
    when:
      logic: AND
      conditions:
        - field: "tool.name"
          operator: eq
          value: "exec"
    then: DENY
    message: "All commands blocked"

  - name: "allow_git"           # Priority 10, never evaluated after DENY
    priority: 10
    override: high
    when:
      logic: AND
      conditions:
        - field: "tool.args.command"
          operator: match
          value: "git "
    then: ALLOW
    message: "Git commands allowed"

# Result: block_all_exec matches first → DENY. allow_git never evaluated.
# To allow git, set allow_git priority < block_all_exec priority.
```

---

## 8. Testing Your Rules

Use the `erdl_simulate` tool:

```
You: "Create a rule: never use eval"

Agent: erdl_simulate → tests against 3 scenarios:
  ✅ Scenario 1 "eval(code)" → correctly blocked
  ✅ Scenario 2 "new Function(str)" → correctly blocked
  ❌ Scenario 3 "setTimeout(code, 100)" → not blocked
  Suggestion: add "setTimeout" to the match list

You: "Add setTimeout"
Agent: erdl_create_rule → rule saved, instantly active
```

---

## 9. Operator Reference

| Operator | Meaning | Example value |
|----------|---------|--------------|
| `eq` | Equal to | `"exec"` |
| `ne` | Not equal to | `"production"` |
| `gt` | Greater than | `3` |
| `gte` | Greater than or equal | `1` |
| `lt` | Less than | `500` |
| `lte` | Less than or equal | `3` |
| `in` | In list | `["exec", "write", "edit"]` |
| `contains` | Substring match | `"delete"` |
| `match` | Regex match | `"rm -rf|sudo"` |
| `exists` | Field exists | (no value needed) |
| `not_exists` | Field missing | (no value needed) |

---

## 10. Next Steps

1. Create your first rule under `~/.openoba/rules/`
2. Verify with `erdl_evaluate`
3. Debug with `erdl_explain` to see the full decision trail
4. Have questions? [GitHub Issues →](https://github.com/OpenOBA/erdl-mcp-server/issues)

---

> Deterministic architecture, not prompt engineering.
> OpenOBA · 2026
