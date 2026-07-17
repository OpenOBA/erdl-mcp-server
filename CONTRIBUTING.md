# Contributing to ERDL MCP Server

Thanks for your interest in contributing. ERDL MCP Server is MIT-licensed and we welcome improvements of all sizes.

## How to Contribute

### Report Bugs

Open an issue on [GitHub Issues](https://github.com/OpenOBA/erdl-mcp-server/issues) with:
- Your OS and Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Any error messages

### Suggest Features

Open a discussion or issue with:
- The problem you're solving
- How ERDL would help
- Optional: proposed implementation approach

### Submit Code

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Make your changes
4. **Quality gate**: ensure `npm run build` (0 errors) and `npm test` (92 tests pass)
5. Commit with a descriptive message
6. Push and open a pull request

### Add Rules

To contribute new built-in rules:

1. Create a file in `rules/<category>/<rule-name>.erdl.yaml` following [ERDL SPEC §5 format](https://github.com/OpenOBA/erdl)
2. The rule must pass `erdl_simulate` validation (3 scenarios correct)
3. Include a `description` and `message` in English
4. Submit as a PR with the rule file only

### Add Tests

We use [Vitest](https://vitest.dev/). Tests live in `test/`:
- `test/engine/` — engine unit tests (evaluator, expression parser)
- `test/tools/` — tool integration tests (evaluate, explain, simulate, list, create)

Run tests: `npm test`

## Development Setup

```bash
git clone https://github.com/OpenOBA/erdl-mcp-server.git
cd erdl-mcp-server
npm install
npm run build
npm test          # 92 tests, must pass
node bin/erdl-mcp.js  # Start server locally
```

## Project Structure

```
erdl-mcp-server/
├── src/
│   ├── index.ts          # MCP Server entry
│   ├── engine/           # Rule engine (store, evaluator, expression parser)
│   ├── tools/            # 5 MCP tool handlers
│   └── i18n/             # zh/en translation
├── rules/                # 30 built-in .erdl.yaml files
├── test/                 # 92 tests (44 engine + 48 tools)
├── docs/                 # User documentation
└── scripts/              # Build & tooling
```

## Code Guidelines

- TypeScript strict mode
- No `any` — use `unknown` with type guards
- No `@ts-ignore`
- Commit messages in English, descriptive
- One logical change per commit

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

> OpenOBA · 2026-07-17
