# Changelog

All notable changes to ERDL MCP Server will be documented in this file.

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
