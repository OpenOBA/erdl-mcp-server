# Changelog

All notable changes to ERDL MCP Server will be documented in this file.

## [1.1.0] — 2026-07-11

### Added
- **@openoba-ai/erdl-openclaw** — OpenClaw Plugin with `registerTrustedToolPolicy` for hard tool call interception
- **30 rules v2**: every rule now has bilingual explanation (zh + en) and DENY rules have alternative suggestions
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
- Removed reference to `openoba-starter` in test file header

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
