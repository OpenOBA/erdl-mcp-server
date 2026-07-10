# Create Your First ERDL Rule

> Give your Agent muscle memory in 10 minutes.

---

## 1. What's a Rule

An ERDL rule = `when` (trigger condition) + `then` (action to take).

```
when: tool.name = "exec" AND tool.args.command match "rm -rf"
then: DENY "Dangerous command blocked"
```

Before every tool call, ERDL checks all your rules. The first matching rule decides: allow or block.

---

## 2. Your First Rule

Create a `my-rules.yaml` in `~/.openoba/rules/`:

```yaml
rules:
  no_any_type:
    when: 'tool.name = "write_file" OR tool.name = "edit"'
    then: BLOCK "Never use 'any' type. Use 'unknown' instead."
    category: coding
    priority: 10
```

Save it. ERDL loads it automatically. Your Agent will be blocked the next time it tries to use `any`.

---

## 3. Rule Structure

### Full Template

```yaml
rules:
  rule_name:            # Unique rule identifier
    when: 'expression'   # When to fire (supports AND / OR / NOT / ())
    then: ACTION "msg"   # What to do
    category: coding     # coding/writing/design/engineering/security/custom
    priority: 10         # 1 = highest, 1000 = lowest (default 100)
    override: false      # Allow overriding a higher-priority block?
```

### Supported Categories

| Category | Use For |
|----------|---------|
| `coding` | Code standards, naming, types |
| `engineering` | Engineering discipline, workflow, quality gates |
| `writing` | Tone, formatting, clarity |
| `design` | UI/UX, responsive, accessibility |
| `security` | Security rules, vulnerability prevention |
| `performance` | Runtime efficiency constraints |
| `testing` | Test coverage, quality gates |
| `compliance` | Regulatory mandates |
| `accessibility` | Inclusive design |
| `custom` | Uncategorized |

---

## 4. when — Condition Expressions

### Basic Comparison

```yaml
# Equals
when: 'tool.name = "exec"'

# Not equals
when: 'tool.name != "web_search"'

# Greater than / Less than / GTE / LTE
when: 'priority > 5'
when: 'risk_level >= 3'
when: 'trust_score < 500'
when: 'count <= 10'
```

### Contains & Match

```yaml
# String contains
when: 'tool.args.command contains "rm"'

# Value in list
when: 'tool.name in ("exec", "write_file", "delete")'

# Regex match
when: 'tool.args.command match "(rm -rf|sudo|chmod 777)"'

# Field exists
when: 'tool.args.path exists'
```

### Logical Combinations

```yaml
# AND (all conditions must match)
when: 'tool.name = "exec" AND tool.args.command contains "delete"'

# OR (any condition matches)
when: 'tool.name = "exec" OR tool.name = "write_file"'

# NOT (negation)
when: 'NOT tool.args.path exists'

# Parentheses for grouping
when: '(role = "admin" OR role = "superadmin") AND action = "delete"'
```

---

## 5. then — Actions

| Action | Meaning | Agent Behavior |
|--------|---------|----------------|
| `ALLOW "hint"` | Allow with advice | Normal execution, Agent follows hint |
| `DENY "reason"` | Hard block | Operation blocked, must be revised |
| `BLOCK "reason"` | Same as DENY | Same as above |
| `CORRECT "fix"` | Auto-correct | Parameters corrected, then allowed |
| `REQUEST_HUMAN "reason"` | Request approval | Operation paused, waits for user confirmation |
| `EMERGENCY_HALT "reason"` | Emergency stop | Global halt, highest alert level |

---

## 6. Real Examples

### Coding Standards

```yaml
rules:
  no_console_log:
    when: 'tool.name in ("write_file", "edit") AND tool.args.content contains "console.log"'
    then: DENY "Remove console.log before committing. Use the project Logger."
    category: coding
    priority: 5

  require_try_catch:
    when: 'tool.name = "write_file" AND tool.args.path match "\\.tsx?$"'
    then: ALLOW "Async operations must use try-catch. Log errors in catch blocks."
    category: coding
    priority: 10
```

### Security

```yaml
rules:
  block_dangerous_commands:
    when: 'tool.name = "exec" AND tool.args.command match "(rm -rf|sudo|chmod 777|> /dev/sda)"'
    then: EMERGENCY_HALT "Dangerous system command detected. Global halt."
    category: security
    priority: 1
    override: false

  protect_sensitive_files:
    when: 'tool.name = "write_file" AND tool.args.path match "(\\.env|\\.git/config|/etc/)"'
    then: DENY "Cannot modify sensitive config files"
    category: security
    priority: 2
```

### Writing Style

```yaml
rules:
  no_cliches:
    when: 'tool.name = "write_file" AND tool.args.content contains "in today\'s world"'
    then: CORRECT "Replace empty opening clichés with concrete context"
    category: writing
    priority: 10

  add_spacing:
    when: 'tool.name = "write_file" AND tool.args.path match "\\.md$"'
    then: ALLOW "Add a space between Chinese and English characters, and between Chinese and digits"
    category: writing
    priority: 20
```

### Engineering Discipline

```yaml
rules:
  no_git_stash:
    when: 'tool.name = "exec" AND tool.args.command contains "stash"'
    then: DENY "No git stash accumulation. Every change goes into a commit."
    category: engineering
    priority: 4

  pipeline_check:
    when: 'tool.name = "exec" AND tool.args.command contains "push"'
    then: ALLOW "Before push: typecheck → build → test all pass."
    category: engineering
    priority: 3
```

---

## 7. Priority & Override

### Priority

- Lower numbers = higher priority (1 is highest)
- Same priority resolved by definition order
- Default when no rule matches: ALLOW

### Override (Hard Constraint)

```yaml
rule_A:
  when: 'tool.name = "exec"'
  then: DENY "All commands blocked"
  priority: 1
  override: false  # cannot be overridden

rule_B:
  when: 'tool.args.command contains "git"'
  then: ALLOW "Git commands allowed"
  priority: 1
  override: true   # can override rule_A

# Result: git commands pass, non-git commands are blocked
```

Override only relaxes (BLOCK → ALLOW), never tightens. Safety first.

---

## 8. Test Your Rules

Use the `erdl_simulate` tool:

```
You: "Create a rule: never use eval"

Agent: erdl_simulate → 3 scenario previews:
  ✅ "eval('code')" — correctly blocked
  ✅ "new Function('code')" — correctly blocked
  ❌ "setTimeout('code', 100)" — not detected
  Suggestion: add "setTimeout" to keyword list

You: "Add setTimeout"
Agent: erdl_create_rule → rule saved, immediately active
```

---

## 9. Operator Quick Reference

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equals | `tool.name = "exec"` |
| `!=` | Not equals | `env != "production"` |
| `>` | Greater than | `risk_level > 3` |
| `<` | Less than | `trust_score < 500` |
| `>=` | Greater or equal | `count >= 10` |
| `<=` | Less or equal | `retries <= 3` |
| `in ("a","b")` | In list | `tool.name in ("exec", "write")` |
| `contains "x"` | Contains substring | `command contains "delete"` |
| `match "regex"` | Regex match | `path match "\\.env$"` |
| `exists` | Field exists | `tool.args.path exists` |
| `AND` | Logical AND | `a = 1 AND b = 2` |
| `OR` | Logical OR | `a = 1 OR b = 2` |
| `NOT` | Logical NOT | `NOT field exists` |
| `()` | Grouping | `(A OR B) AND C` |

---

## 10. Next Steps

1. Create your first rule in `~/.openoba/rules/custom/`
2. Call `erdl_evaluate` to verify it fires correctly
3. Use `erdl_explain` to understand why your Agent made a decision
4. Questions? [GitHub Issues →](https://github.com/OpenOBA/erdl-mcp-server/issues)

---

> Deterministic architecture, not prompt engineering.
> OpenOBA · 2026
