# ERDL MCP Server — Project Overview & Tracking Document

> **Owner:** OpenOBA · **License:** MIT · **Status:** Active (v1.1.3)
> **Created:** 2026-07-07 · **Last Updated:** 2026-07-12
> **Repository:** [github.com/OpenOBA/erdl-mcp-server](https://github.com/OpenOBA/erdl-mcp-server)
> **npm:** [@openoba-ai/erdl-mcp](https://www.npmjs.com/package/@openoba-ai/erdl-mcp)

---

## 1. Project Summary

ERDL MCP Server is a **Model Context Protocol (MCP) server** that gives AI Agents **deterministic, enforceable rules** — not prompt-based suggestions. It implements the **ERDL SPEC v1.0** (Entity-Rule Definition Language) as a portable MCP tool set.

**Value proposition**: "Say it once. Never repeat." Rules are engine-enforced at the protocol layer. Agents cannot bypass them.

**Differentiator**: Unlike prompt-based rules or SKILL.md files, ERDL rules are checked by a **deterministic engine** before every tool call. The engine uses SafeExpr (recursive descent parser, zero code injection) and does not rely on LLM self-discipline.

---

## 2. Release Status

| Item | Value |
|------|-------|
| **Current version** | `1.1.3` |
| **npm package** | `@openoba-ai/erdl-mcp` |
| **GitHub** | `OpenOBA/erdl-mcp-server` |
| **License** | MIT |
| **Node.js** | >= 18 |
| **Dependencies** | `@modelcontextprotocol/sdk`, `js-yaml` |
| **Total npm versions** | 17 (alpha → 1.1.3) |
| **Old versions** | All < 1.1.0 deprecated |

---

## 3. Architecture

```
erdl-mcp-server/
├── src/
│   ├── index.ts              # MCP Server entry (stdio transport)
│   ├── engine/
│   │   ├── rule-store.ts     # Rule loading, parsing, watch, persistence
│   │   ├── rule-definition.ts # Type definitions (RuleDefinition, RuleCondition, RuleAction)
│   │   ├── evaluator.ts      # SPEC §5 evaluation engine (11 ops, AND/OR, Execution Rings)
│   │   ├── erdl-expr-parser.ts # ERDL expression parser
│   │   ├── safe-expr.ts      # SafeExpr — recursive descent, zero injection
│   │   ├── telemetry.ts      # Opt-in telemetry
│   │   └── usage-tracker.ts  # Rule hit tracking
│   ├── tools/
│   │   ├── evaluate.ts       # erdl_evaluate — Action Guard before tool call
│   │   ├── simulate.ts       # erdl_simulate — test rule against 3 scenarios
│   │   ├── create-rule.ts    # erdl_create_rule — NL → rule → save
│   │   ├── list-rules.ts     # erdl_list_rules — list/filter loaded rules
│   │   └── explain.ts        # erdl_explain — full decision trail
│   └── presets/              # (DELETED in v1.1.0 — migrated to YAML files)
├── rules/                    # 67 .erdl.yaml files across 8 categories
│   ├── coding/       (10)    # TypeScript quality, Git discipline
│   ├── engineering/  (24)    # Workflow discipline, pipeline gates
│   ├── security/     (6)     # Vulnerability prevention (3 Guards)
│   ├── testing/      (11)    # Coverage, quality gates
│   ├── performance/  (3)     # N+1, pagination
│   ├── observability/(3)     # Logging, health checks
│   ├── design/       (3)     # a11y, responsive, Tailwind
│   └── writing/      (7)     # Tone, formatting, no cliches
├── test/
│   ├── engine/
│   │   ├── expression.test.ts (23 tests)
│   │   └── evaluator.test.ts  (21 tests)
│   └── presets/              # (DELETED in v1.1.0)
├── docs/
│   ├── README.md
│   ├── CHANGELOG.md
│   ├── TELEMETRY.md
│   ├── agent-context-schema.md
│   ├── tool-api-reference.md
│   ├── tutorial-create-rules.md     (zh)
│   ├── tutorial-create-rules.en.md  (en)
│   ├── rule-reference.md            (zh — full 67-rule reference)
│   └── rule-reference.en.md         (en — full 67-rule reference)
├── openclaw-plugin/          # OpenClaw Plugin for hard tool call interception
├── scripts/
│   ├── install.sh            # macOS/Linux install
│   └── install.ps1           # Windows install
├── bin/
│   └── erdl-mcp.js           # CLI entry
├── package.json
└── tsconfig.json
```

---

## 4. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Single SPEC §5 parser** | Removed 3 legacy format parsers. Only `parseSpecRule()` remains. |
| **Pure YAML-driven rules** | Deleted TS hardcoded presets (515 lines). Rules 100% in `.erdl.yaml` files. |
| **deepMatch/deepContains** | Object field recursive search for `match`/`contains` operators. Fixes `[object Object]` problem. |
| **conditionLogic (AND/OR)** | Parsed from SPEC §5 YAML `when.logic`. Evaluator uses `.every()`/`.some()`. |
| **Single evaluation loop** | No phase 1/2 separation. All rules evaluated in priority order. `override` short-circuits. |
| **BLOCK → DENY alias** | SPEC §3.4 standard name. Engine maps both. |
| **File extension `.erdl.yaml`** | SPEC §1.5 compliant. Engine only loads this extension. |
| **npx-based distribution** | No global install needed. `npx @openoba-ai/erdl-mcp@latest` always fetches latest. |
| **No internal references** | All rules and docs scrubbed of company-specific paths, names, and conventions. |

---

## 5. Quality Metrics

| Metric | Value |
|--------|-------|
| Build errors | 0 |
| Unit tests | 44 (23 expression + 21 evaluator) |
| Test pass rate | 100% |
| Guard rules | 6 (Ring 0, DENY — hard intercept) |
| Advisory rules | 61 (Ring 3, ALLOW/CORRECT) |
| Guard coverage | 12/12 scenarios verified |
| Empty conditions | 0 |
| Placeholder messages | 0 |
| Private content in all files | 0 |

---

## 6. 5 MCP Tools

| Tool | Purpose | Input |
|------|---------|-------|
| `erdl_evaluate` | Action Guard — check rules before tool call | `tool_name`, `tool_args`, `agent_id`, `session_id` |
| `erdl_simulate` | Test a rule against 3 auto-generated scenarios | `ruleName`, `naturalLanguage`, `category` |
| `erdl_create_rule` | Create rule from natural language | `naturalLanguage`, `category`, `decision` |
| `erdl_list_rules` | List all loaded rules, filter by category | `category?` |
| `erdl_explain` | Full decision trail for any action | `intent`, `context` |

---

## 7. Distribution Channels

| Channel | Status | Notes |
|---------|--------|-------|
| **npm** | ✅ `@openoba-ai/erdl-mcp@1.1.3` | Latest tag, free tier |
| **GitHub** | ✅ `OpenOBA/erdl-mcp-server` | MIT, clean 1-commit history |
| **OpenClaw Plugin** | ✅ `openclaw-plugin/` | Hard tool call interception |
| **Claude Desktop** | ✅ Compatible | MCP config in README |
| **Cursor** | ✅ Compatible | `.cursor/mcp.json` config |
| **VS Code Copilot** | ✅ Compatible | `.vscode/mcp.json` config |
| **Any MCP Client** | ✅ Compatible | Standard MCP stdio protocol |

---

## 8. Roadmap (Future)

### P0 — Short Term (Next Release)

| Task | Notes |
|------|-------|
| GitHub Actions CI | Already configured in repo, verify activation |
| npm downloads badge | Track adoption |
| Community feedback loop | GitHub Issues + Discussions monitoring |

### P1 — Medium Term

| Task | Notes |
|------|-------|
| `within` time window operator | SPEC §3.3 — detect patterns over time intervals |
| `rate` rate limiting operator | SPEC §3.3 — limit tool call frequency |
| Complete Execution Rings 0-3 | Implement QUARANTINE, ROLLBACK, ESCALATE (Pro tier) |
| Agent Identity + Trust Scoring | SPEC §4.1/§4.3 (Pro tier) |
| Structured Audit Log export | OCSF / OTLP format (Pro tier) |

### P2 — Long Term

| Task | Notes |
|------|-------|
| Guardian/Observed Agent model | SPEC §3.7 (Enterprise tier) |
| A2A Agent Card extension | SPEC §5.2 (Enterprise tier) |
| Agent BOM (Bill of Materials) | SPEC §4.2 (Enterprise tier) |
| LangChain / CrewAI / AutoGen adapters | Framework integrations |
| Rule Registry (global view) | Conflict detection, coverage analysis |

---

## 9. Operations Checklist

### Release Process
- [ ] Verify: `npm run build` — 0 errors
- [ ] Verify: `npm test` — 44/44 passed
- [ ] Verify: `node review.cjs` — 12/12 guard scenarios
- [ ] Verify: private content audit on all .md + .erdl.yaml
- [ ] Bump version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] `git push origin master`
- [ ] `npm publish`

### Monthly Maintenance
- [ ] Check npm download stats
- [ ] Review GitHub Issues
- [ ] Audit dependencies (`npm audit`)
- [ ] Check for ERDL SPEC updates
- [ ] Review rule hit counts (telemetry) for unused rules

### Upgrade Path
- Users on v1.0.x: MUST update MCP config from local path → `npx`
- See README upgrade guide section

---

## 10. Contact & Links

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/OpenOBA/erdl-mcp-server |
| **npm Package** | https://www.npmjs.com/package/@openoba-ai/erdl-mcp |
| **ERDL SPEC** | OpenOBA/erdl (MIT) |
| **ERDL Landing Page** | https://openoba.github.io/erdl-landing |
| **Website** | https://openoba.com |
| **Email** | support@openoba.com |

---

> *Deterministic architecture, not prompt engineering.*
> *OpenOBA · ERDL MCP Server · 2026-07-12*
