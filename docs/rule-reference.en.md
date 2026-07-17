# ERDL Rule Reference — Complete Guide for Agents

> **30 rules across 6 categories. Deterministic enforcement, not suggestions.**
> Version: 1.1.5 · Format: ERDL SPEC §5 · Extension: `.erdl.yaml`

---

## How Agents Use This Document

1. **Read the rule description** to understand what each rule enforces
2. **Check the trigger conditions** to know when the rule fires
3. **Follow the modification guide** to safely edit rules
4. **Use the template** at the bottom of this document to add new rules

**All rules are stored in `~/.openoba/rules/<category>/<name>.erdl.yaml`.**
Agents can directly read, edit, and create these files.

---

## Rule Type Legend

| Type | Engine Behavior | Agent Action |
|------|----------------|-------------|
| **Guard (DENY)** | Hard intercept at Ring 0 — engine blocks tool call | Cannot bypass. Must fix and retry. |
| **Advisory (ALLOW)** | Matches → injects instruction into Agent context | Follow the instruction. |
| **Advisory (CORRECT)** | Matches → injects correction into Agent context | Apply the correction to your output. |

---

## Category 1: coding (6 rules)

Rules for TypeScript code quality, Git discipline, and dependency hygiene.
**Directory:** `~/.openoba/rules/coding/`

| # | Rule Name | Type | When It Fires | What It Does | How to Modify |
|---|-----------|------|---------------|-------------|---------------|
| 1 | `no_any` | CORRECT | Using `any` type in code | Reminds: never use `any`. Use `unknown` + type guard instead. | Edit `value` pattern to add more keywords. Change `then: DENY` to hard-block. |
| 2 | `no_ts_ignore` | ALLOW | Using `@ts-ignore` or `@ts-expect-error` | Reminds: fix the type error, don't suppress it. | Change to `then: DENY` for strict enforcement. |
| 3 | `no_nested_ternary` | ALLOW | Nested ternary expressions (`a ? b : c ? d : e`) | Reminds: use if/else or early returns instead. | Add more complex pattern matching. |
| 4 | `handle_promises` | ALLOW | `async` or `Promise` in code | Reminds: all Promises must be awaited or .catch() handled. | Add specific tool restriction (e.g., only for `edit`). |
| 5 | `naming_conventions` | ALLOW | Declaring variables, functions, classes | Reminds: camelCase/PascalCase/UPPER_SNAKE conventions. | Customize naming rules per project. |
| 6 | `commit_format` | ALLOW | Writing commit messages | Reminds: `type(scope): description` format. | Adjust allowed types (feat/fix/docs/refactor). |
| 7 | `one_commit_one_change` | ALLOW | Making git commits | Reminds: one logical change per commit. Don't mix. | Add `tool.name: exec` for strict git-call matching. |
| 8 | `pr_emoji` | ALLOW | Working with PRs/merge requests | Reminds: use emoji prefixes in PR titles. | Customize emoji list per team convention. |
| 9 | `confirm_dependencies` | ALLOW | Installing new packages | Reminds: check if project already has similar deps. | Add whitelist of pre-approved packages. |
| 10 | `prefer_existing` | ALLOW | Adding new libraries | Reminds: check existing deps before adding new ones. | Point to project-specific approved list. |

---

## Category 2: engineering (12 rules)

Rules for workflow discipline, pipeline gates, and engineering habits.
**Directory:** `~/.openoba/rules/engineering/`

| # | Rule Name | Type | When It Fires | What It Does | How to Modify |
|---|-----------|------|---------------|-------------|---------------|
| 1 | `no_stash` | **Guard (DENY)** | `exec` tool called with `git stash` | **BLOCKS** the operation. All changes must go into commits. | Adjust `value` pattern to allow specific stash flags. Do NOT remove — this prevents data loss. |
| 2 | `no_force_push_main` | **Guard (DENY)** | `exec` tool called with `push.*(-f\|--force)` | **BLOCKS** force push to main/master. Irreversible. | Priority 1, override critical. Do not relax without approval. |
| 3 | `no_powershell_setcontent` | **Guard (DENY)** | `Set-Content` or `Out-File` in PowerShell commands | **BLOCKS** — these corrupt UTF-8 encoding. Use `write` tool. | Add other dangerous PowerShell commands to `value` array. |
| 4 | `pipeline_before_push` | ALLOW | `exec` tool called with `push` | Reminds: typecheck → build → test all pass before push. | Add project-specific quality gates. |
| 5 | `honesty` | ALLOW | Any code/engineering operation | Reminds: report problems truthfully, admit mistakes, say "I don't know". | Core principle — do not remove. |
| 6 | `no_shortcut` | CORRECT | Any code/engineering operation | Reminds: no temporary hacks. Fix from root. | Add examples of common shortcuts to avoid. |
| 7 | `no_single_task_tunnel` | CORRECT | Any code/engineering operation | Reminds: consider full product/architecture/UX impact, not just the single task. | Add context-specific guidance. |
| 8 | `design_before_code` | CORRECT | Any code operation | Reminds: plan the design first, then write code. | Add design document template reference. |
| 9 | `stay_on_target` | CORRECT | Any operation | Reminds: don't deviate from spec. Pull back when conversation drifts. | Add project-specific spec references. |
| 10 | `docs_with_delivery` | ALLOW | Any operation | Reminds: code isn't done until docs are done. | Add doc checklist link. |
| 11 | `doc_version_alignment` | CORRECT | Any operation | Reminds: documentation version must sync with code version. | Add version bump checklist. |
| 12 | `read_before_code` | CORRECT | Any code operation | Reminds: read source code + call chain first, then act. | Add project-specific source map. |
| 13 | `self_verify` | CORRECT | Any operation | Reminds: build → test → verify yourself before submitting. | Add project-specific test commands. |
| 14 | `no_dead_code` | CORRECT | Writing/editing code | Reminds: delete commented-out code, unused functions. Git remembers. | Adjust pattern to catch more dead code patterns. |
| 15 | `change_summary` | ALLOW | Any operation | Reminds: write clear Chinese summary after each change. | Add summary template. |
| 16 | `session_memory` | ALLOW | Any operation | Reminds: record work and decisions after each session. | Add knowledge base path reference. |
| 17 | `knowledge_capture` | ALLOW | Any operation | Reminds: log every pitfall. Update knowledge base after solving. | Add knowledge base format reference. |
| 18 | `decision_log` | ALLOW | Any operation | Reminds: log key decisions with context, options, reasons, consequences. | Add decision log template. |
| 19 | `code_as_asset` | CORRECT | Any code operation | Reminds: code is a long-term asset, not a one-time delivery. Readability > cleverness. | Add code review checklist. |
| 20 | `config_as_code` | CORRECT | Any operation | Reminds: config and code in same repo, same commit, same review. | Add config management guide. |
| 21 | `dependency_audit` | ALLOW | Any operation | Reminds: regularly audit dependencies — upgrade expired, remove unused, replace vulnerable. | Add audit schedule (weekly/monthly). |
| 22 | `error_output_caution` | CORRECT | Any operation | Reminds: error messages must not leak paths, stacks, or credentials. | Add error ID scheme reference. |
| 23 | `minimal_delivery` | CORRECT | Any code operation | Reminds: solve one problem at a time. No drive-by refactors. | Add scope definition guide. |
| 24 | `progress_visibility` | ALLOW | Any operation | Reminds: keep progress visible to the team. Proactively update on major changes. | Add reporting cadence. |

---

## Category 3: security (6 rules)

Rules for vulnerability prevention and secure coding practices.
**Directory:** `~/.openoba/rules/security/`

| # | Rule Name | Type | When It Fires | What It Does | How to Modify |
|---|-----------|------|---------------|-------------|---------------|
| 1 | `no_eval_with_input` | **Guard (DENY)** | Code containing `eval()`, `new Function()`, `setTimeout()` | **BLOCKS** — remote code execution risk. Use JSON.parse or sandboxed alternatives. | Add more dangerous functions to `value`. |
| 2 | `no_hardcoded_secrets` | **Guard (DENY)** | Hardcoded passwords, API keys, tokens, credentials | **BLOCKS** — once committed to Git, it's leaked forever. Use env vars. | Add project-specific secret patterns. |
| 3 | `no_string_sql` | **Guard (DENY)** | SQL queries built with string concatenation (`+`) | **BLOCKS** — SQL injection risk. Use parameterized queries or ORM. | Add more SQL injection patterns. |
| 4 | `no_stack_trace_to_user` | ALLOW | Returning error stack traces to users | Reminds: use error ID scheme. Users see IDs, backend logs details. | Add error ID generation reference. |
| 5 | `validate_all_input` | ALLOW | Processing `req.body/req.query/req.params` | Reminds: validate type → length → format → range. Whitelist > blacklist. | Add project-specific validation rules. |
| 6 | `security_headers` | ALLOW | Any code/engineering operation | Reminds: add CSP, X-Content-Type-Options, X-Frame-Options, HSTS. | Add header values per framework. |

---

## Category 4: testing (2 rules)

Rules for test coverage and quality gates.
**Directory:** `~/.openoba/rules/testing/`

| # | Rule Name | Type | When It Fires | What It Does | How to Modify |
|---|-----------|------|---------------|-------------|---------------|
| 1 | `coverage_never_drops` | ALLOW | Modifying test code | Reminds: new code coverage must not be lower than existing. | Set numeric coverage threshold (e.g., >= 80%). |
| 2 | `no_behavior_without_test` | ALLOW | Adding new feature code | Reminds: every feature/fix needs a test. Write test first. | Enforce TDD: block untested code with DENY. |

---

## Category 5: observability (1 rule)

Rules for logging security.
**Directory:** `~/.openoba/rules/observability/`

| # | Rule Name | Type | When It Fires | What It Does | How to Modify |
|---|-----------|------|---------------|-------------|---------------|
| 1 | `no_secrets_in_logs` | ALLOW | Logging passwords/tokens/PII | Reminds: log only IDs/hashes, never raw secrets or PII. | Add PII field list. |

---

## Category 6: writing (2 rules)

Rules for tone and avoiding AI cliches.
**Directory:** `~/.openoba/rules/writing/`

| # | Rule Name | Type | When It Fires | What It Does | How to Modify |
|---|-----------|------|---------------|-------------|---------------|
| 1 | `direct_tone` | CORRECT | Any writing output | Reminds: be direct and precise. No roundabout language. | Add tone examples. |
| 2 | `no_ai_jargon` | CORRECT | Using AI cliches (delve, unleash, etc.) | Reminds: avoid AI-generated filler words. Be specific. | Add more banned words. |

---

## Rule Modification Template for Agents

When adding or modifying a rule, follow this EXACT format:

```yaml
protocol: "erdl/v1"
version: "1.0.0"

metadata:
  name: "your_rule_name"          # lowercase_with_underscores
  description: "What this rule enforces (one line)"
  tags: [category]                # coding|engineering|security|testing|performance|observability|design|writing

rules:
  - name: "your_rule_name"
    description: "Detailed description of what this rule does"
    priority: 5                   # 1=highest, 1000=lowest. Guards use 1-10.
    override: normal              # critical|high|normal|low — critical = cannot be bypassed
    when:
      logic: AND                  # AND (all conditions) or OR (any condition)
      conditions:
        - field: "tool.name"      # Context field to check
          operator: in            # eq|ne|gt|gte|lt|lte|in|contains|match|exists|not_exists|not_in|not_contains
          value: ["write", "edit", "apply_patch"]
        - field: "tool.args"      # Second condition (if needed)
          operator: match
          value: "pattern_to_match"
    then: ALLOW                   # ALLOW|CORRECT|DENY|REQUEST_HUMAN|EMERGENCY_HALT (BLOCK is alias for DENY)
    message: "Clear instruction for the Agent. One sentence, specific, actionable."
```

### Template Rules

1. **File location**: `~/.openoba/rules/<category>/<rule_name>.erdl.yaml`
2. **Naming**: lowercase, underscores, must match across `metadata.name` and `rules[0].name`
3. **Priority**: Guards (DENY) use 1-10. Advisory rules use 5-100. Lower = higher priority.
4. **Operators**: Use `match` for regex, `contains` for substring, `in` for list membership, `eq` for exact match
5. **Override levels**:
   - `critical` — emergency rules, cannot be bypassed
   - `high` — security/engineering guard rules
   - `normal` — standard rules (default)
   - `low` — best-effort suggestions
6. **Message**: Must be one sentence. Include what the Agent should DO, not just what to avoid.
7. **Conditions**: At least one `tool.name` condition to scope the trigger. Add `tool.args` conditions if needed for content matching.
8. **Testing**: After creating/modifying a rule, call `erdl_simulate` to verify it works correctly.
9. **NEVER use `when: "true"`** — this bypasses the engine and degrades to prompt injection.
10. **Never remove Guard rules** without explicit authorization. They protect against data loss and security breaches.

---

> Deterministic architecture, not prompt engineering.
> OpenOBA · ERDL MCP Server v1.1.2 · 2026-07-12
