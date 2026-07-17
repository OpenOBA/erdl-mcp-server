# Changelog

All notable changes to ERDL MCP Server will be documented in this file.

## [1.1.5] — 2026-07-17

### Fixed (P0)
- **rule-store.ts**: 删除 `loadBuiltinPresets()` 方法及其 CommonJS `require()` 调用 — ESM 运行时 `require is not defined` 导致 30 条内置规则静默加载失败（P0-1）
- **rule-store.ts**: 内置规则改为从 npm 包自带的 `rules/` 目录（SPEC §5 YAML 文件）直接加载，与用户规则使用相同的 `loadFromDir()` 路径 — 无需 `src/presets/`（P0-2）
- **rule-store.ts**: `load()` 日志改为分别显示 built-in 和 user 规则数量，便于诊断

### Changed
- 版本号 1.1.4 → 1.1.5

### Verified
- Build: 0 errors | Test: 44/44 pass
- 运行时实测：30 built-in + 7 user = 37 rules 正常加载
- 不再出现 "Built-in presets skipped: require is not defined"
- Plugin + standalone MCP Server 均走同一加载路径

## [1.1.4] — 2026-07-14

### Fixed
- **rule-store.ts**: Parse YAML `ring` field and override hardcoded defaults from `parseThenAction()` — rules with `ring: 0` in YAML were silently ignored, now aligns with ERDL SPEC §3.5 Execution Rings
- **rule-store.ts**: Parse `scope_level` / `scopeLevel` field into `RuleDefinition.scopeLevel` — supports SPEC §4 compliance scope levels (1=personal, 2=org, 3=national, 4=regional, 5=global)
- **rules/coding/no-nested-ternary.erdl.yaml**: Corrected `then: ALLOW` → `then: DENY` — rule message said "禁止嵌套三元表达式" but decision was ALLOW, causing it to pass instead of block

### Changed
- **openclaw-plugin**: `contracts.agentToolResultMiddleware` changed from `true` (boolean) to `["openclaw", "codex"]` (platform array) — required by OpenClaw 2026.6.8+
- **openclaw-plugin**: Bump version to 1.0.0-alpha.2

### Verified
- Build: 0 errors | Test: 44/44 pass
- 37 rules loaded from `~/.openoba/rules/` (30 presets + 6 Rulsynor iron laws + 1 user rule)
- `openclaw plugins doctor` → No plugin issues detected
- Ring distribution: 11 DENY (Ring 0) + 15 ALLOW (Ring 3) + 11 other

## [1.1.0] — 2026-07-12

### Changed
- **SPEC §5 compliance overhaul**: rule files migrated from `when: "true"` to structured `when: { logic, conditions }` format
- 67 rules now distributed across 8 categories (coding, design, engineering, security, testing, performance, observability, writing)
- All 67 rules have meaningful bilingual messages — 0 placeholder messages

### Removed
- Community rules (14 packs) — non-SPEC format, removed
- TS presets (515 lines in `src/presets/`) — all migrated to YAML SPEC §5 files
- `parseRule()`, `parseYamlSimple()`, `loadBuiltinPresets()` — dead code removed

### Fixed
- Evaluator: `match`/`contains` on object values now uses deep search (was `[object Object]`)
- Evaluator: `conditionLogic` (AND/OR) from SPEC §5 YAML now parsed and respected
- Evaluator: override rules restored — all rules evaluated in one loop, override short-circuits
- All private/internal references scrubbed from rule messages (names, file paths, etc.)

### Added
- `conditionLogic` field in `RuleDefinition` (AND | OR)
- `deepMatch()` / `deepContains()` for recursive object value search

## [1.0.1] — 2026-07-11

### Added
- **@openoba-ai/erdl-openclaw** — OpenClaw Plugin with `registerTrustedToolPolicy` for hard tool call interception
- **Rules v2**: every rule now has bilingual explanation (zh + en) and DENY rules have alternative suggestions
- `explanation` and `alternative` fields in `RuleAction`, `RuleMatch`, `EvaluationResult`
- `after_tool_call` friendly feedback injection via `registerAgentToolResultMiddleware`
- ERDL Plugin coexists with ERDL MCP Server on the same OpenClaw instance

### Fixed
- install.ps1: `--omit=dev` deadlock preventing npm run build (P0)
- install.ps1: undefined `$check` variable → `$ok`/`$fail` status markers
- install.ps1: removed Unix `rm -rf` → `Remove-Item`
- install.ps1: replaced Unicode box-drawing chars with ASCII (PowerShell parser compatibility)
- install.sh: replaced `sed` dependency with `node -e` for cross-platform compatibility
- install.sh: removed `--omit=dev`

### Changed
- Both install scripts now check Node.js >=18 and report errors per-step
- Both install scripts now include `--setup` hint in output
- Rule definitions upgraded from v1 to v2 (backward compatible)

## [1.0.0] — 2026-07-10

### Added
- Public GitHub release: OpenOBA/erdl-mcp-server
- Free vs Pro tier comparison in README
- `--pro-key` CLI flag for Pro license activation
- `.editorconfig` for consistent encoding (UTF-8, LF)

### Changed
- README rewritten: simplified, Free/Pro split, removed MCP platform status table and roadmap
- Version bumped from beta.9 → 1.0.0 (first public release)
- package.json repository URL corrected to `OpenOBA/erdl-mcp-server`
- Removed internal project references from test file headers

### Removed
- MCP platform "Coming soon" table (will re-add when listings are live)
- Roadmap section (will publish separately)
- Dead tutorial link

## [1.0.0-beta.1] — 2026-07-09

### Added
- CHANGELOG.md
- GitHub Actions CI (typecheck + build + test + pack, Node 18/20/22)
- Compact badge card output for front-end rendering

### Fixed
- ALLOW advisory rules no longer block DENY evaluation
- Removed incorrect override=true from advisory ALLOW rules
- EN-008 always-match DENY fixed (was blocking all coding operations)
- EN-006 added real conditions (Set-Content/Out-File match)

## [1.0.0-alpha.5] — 2026-07-09

### Added
- Execution Rings (Ring 0–3) evaluation per ERDL Spec §3.5
- override semantics per ERDL Spec §11.4 (safe override: BLOCK→ALLOW only)
- `primaryCorrection` field to EvaluationResult for CORRECT decisions
- Engineering preset rule tests (EN-001 to EN-010)
- Stable YAML parser: regex-tolerant for simplified format, js-yaml fallback

### Changed
- Evaluator rewritten: Ring-based evaluation with first-match-wins per ring
- Ring 0 BLOCK/HALT short-circuits all further evaluation
- Override rules evaluate after normal rules, can only relax (not tighten)

### Fixed
- YAML parser now correctly falls back from regex to js-yaml for standard format

## [1.0.0-alpha.4] — 2026-07-08

### Added
- Tool Call Guard architecture (ERDL Spec §5.3)
- Agent calls `erdl_evaluate` before every tool execution

## [1.0.0-alpha.3] — 2026-07-08

### Added
- ERDL ExprParser integration with dual-mode evaluator
- Version read from package.json (no longer hardcoded)

### Fixed
- parseOr return-early bug: correctly handles 3+ OR chains in parenthesized expressions

## [1.0.0-alpha.2] — 2026-07-08

### Changed
- Package renamed to `@openoba-ai/erdl-mcp`
- Bin path and repo URL normalized

## [1.0.0-alpha.1] — 2026-07-07

### Added
- Initial scaffold with 5 MCP Tools
- 20 preset rules (coding 10, writing 7, design 3)
- ERDL ExprParser compileWhen with CONTAINS/MATCH support
- Spec v1.1 .erdl.yaml rule format + agent context schema
- SafeExpr expression engine (zero code injection)
- Execution Rings + CORRECT/REQUEST_HUMAN/EMERGENCY_HALT decisions
- Http Dashboard API (later removed, rules shown via MCP in Chat)
- Tolerant regex YAML parser for simplified .erdl.yaml format
- 9 core engineering discipline rules
- AgentIdentity type + agent block parsing
- Tool API reference documentation
- 50 tests: expression engine (23), evaluator (14), presets (13)

---

## Types of Changes

- `Added` — new features
- `Changed` — changes in existing functionality
- `Deprecated` — soon-to-be removed features
- `Removed` — removed features
- `Fixed` — bug fixes
- `Security` — vulnerability fixes
