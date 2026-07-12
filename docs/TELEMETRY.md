# ERDL MCP Server — Telemetry Policy

> **We default to zero data collection. Telemetry is strictly opt-in.**
> Version: V1.0 · 2026-07-10

---

## Our Commitment

ERDL MCP Server is a CLI tool for developers. We need to know that people are using it so we can improve it — but we don't need to know who you are, where exactly you are, or what you're doing.

**We never collect your rules, your Agent conversations, your IP address, or any personally identifiable information.**

---

## What We Collect (opt-in only)

| Field | Example | Why |
|-------|---------|-----|
| `deploy_id` | `erdl-a7xf2m9k-lp3q8n2r` | Distinguish unique installations (local random hash, not reversible) |
| `version` | `1.0.0` | Version distribution |
| `platform` | `win32-x64` / `darwin-arm64` | OS and architecture compatibility |
| `language` | `zh` / `en` | Language preference |
| `tz_offset` | `480` (UTC+8, blurred to nearest hour) | Broad geographic region (continent-level, not country) |
| `rules_count` | `37` | Usage scale |
| `tier` | `free` / `pro` / `trial` | Commercial segment |

---

## What We NEVER Collect

- ❌ IP address
- ❌ Username, machine name, hostname
- ❌ Rule content or schema
- ❌ Agent conversations or tool call arguments
- ❌ File paths
- ❌ Any data that could identify a specific person or organization

---

## How It Works

1. **First launch**: A disclosure message appears on stderr. You are **never** opted in by default.
2. **To enable**: `export ERDL_TELEMETRY=1` — or set it once in `~/.openoba/.telemetry.json`
3. **To disable**: `export ERDL_TELEMETRY=0` — immediately stops all reporting
4. **Reporting**: Once per startup. 3-second timeout. Failures silently discarded.

The telemetry endpoint is `https://telemetry.openoba.com/v1/ingest`.

---

## Data Retention

Telemetry data is retained for **90 days** from collection date, then automatically deleted.

---

## Regional Insights Without Privacy Invasion

We use `platform`, `language`, and `tz_offset` (blurred to the nearest hour — i.e., ±30 minutes precision) to understand broad geographic distribution without ever collecting precise location data. This tells us "~40% of users are in APAC timezones" without knowing which country, city, or even hemisphere they're in.

For precise geographic data, we use **npm download statistics** — which npm provides independently and anonymously.

---

> © 2026 OpenOBA
