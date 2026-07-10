/**
 * ERDL MCP Server — Telemetry Reporter
 *
 * Opt-in anonymous startup telemetry. Never collects PII, IP, or rule content.
 *
 * Principles:
 *   - Opt-in only. First launch asks. No = never again.
 *   - Zero PII. No IP, no username, no machine name, no file paths.
 *   - Minimal data. Version, platform, language, timezone offset, rule count.
 *   - 3-second timeout. Failure is silent — never blocks startup.
 *   - Plain-text disclosure in stderr on first launch.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-10
 * @license MIT
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, platform, arch } from 'node:os'

// ============================================
// Types
// ============================================

interface TelemetryConfig {
  /** Whether user has made a choice (true = they answered yes or no) */
  consented: boolean
  /** true = opted in, false = opted out, undefined = not asked yet */
  enabled?: boolean
  /** When the choice was made (ISO 8601) */
  consentedAt?: string
}

interface TelemetryPayload {
  /** SHA256(deploy_id + random) — one-way hash, not reversible to any PII */
  deploy_id: string
  /** Package version (from package.json) */
  version: string
  /** os.platform() + os.arch() e.g. "win32-x64" */
  platform: string
  /** Detected language from system env or --lang flag */
  language: string
  /** UTC offset in minutes (e.g. 480 = UTC+8). Blurred to nearest hour. */
  tz_offset: number
  /** Number of active rules (user + presets) */
  rules_count: number
  /** Free / pro / trial */
  tier: 'free' | 'pro' | 'trial'
  /** App identifier */
  app: 'erdl-mcp'
}

// ============================================
// Config persistence
// ============================================

function getConfigPath(): string {
  const dir = join(homedir(), '.openoba')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, '.telemetry.json')
}

function loadConfig(): TelemetryConfig {
  try {
    const raw = readFileSync(getConfigPath(), 'utf-8')
    const cfg = JSON.parse(raw) as TelemetryConfig
    if (typeof cfg.consented === 'boolean') return cfg
  } catch { /* file missing or corrupt — not asked yet */ }
  return { consented: false }
}

function saveConfig(cfg: TelemetryConfig): void {
  writeFileSync(getConfigPath(), JSON.stringify(cfg, null, 2), 'utf-8')
}

// ============================================
// Deploy ID (stable, anonymous)
// ============================================

function getDeployId(): string {
  const deployFile = join(homedir(), '.openoba', '.deploy_id')
  try {
    if (existsSync(deployFile)) {
      return readFileSync(deployFile, 'utf-8').trim()
    }
  } catch { /* generate new */ }

  const id = 'erdl-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36)
  try {
    writeFileSync(deployFile, id, 'utf-8')
  } catch { /* best effort */ }
  return id
}

// ============================================
// Consent prompt (first launch only)
// ============================================

function promptConsent(): boolean {
  console.error('')
  console.error('┌─────────────────────────────────────────────────────────┐')
  console.error('│  ERDL MCP Server — Telemetry                           │')
  console.error('│                                                         │')
  console.error('│  Help us improve ERDL by sharing anonymous usage data.  │')
  console.error('│                                                         │')
  console.error('│  We collect:   version, platform, language, rule count  │')
  console.error('│  We NEVER:     IP address, rule content, Agent dialogs  │')
  console.error('│                                                         │')
  console.error('│  Set ERDL_TELEMETRY=1 to enable                         │')
  console.error('│  Set ERDL_TELEMETRY=0 to disable                        │')
  console.error('│                                                         │')
  console.error('│  You can change this anytime in ~/.openoba/.telemetry   │')
  console.error('└─────────────────────────────────────────────────────────┘')
  console.error('')

  // Check environment variable first (explicit override)
  const envVal = process.env.ERDL_TELEMETRY
  if (envVal === '1') {
    console.error('[erdl-mcp] Telemetry enabled (via ERDL_TELEMETRY=1)')
    return true
  }
  if (envVal === '0') {
    console.error('[erdl-mcp] Telemetry disabled (via ERDL_TELEMETRY=0)')
    return false
  }

  // No explicit choice — default to opt-out (silent, safe)
  console.error('[erdl-mcp] Telemetry not enabled. Set ERDL_TELEMETRY=1 to help improve ERDL.')
  return false
}

// ============================================
// Send telemetry (non-blocking, 3s timeout)
// ============================================

const TELEMETRY_ENDPOINT = 'https://telemetry.openoba.com/v1/ingest'

async function send(payload: TelemetryPayload): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const resp = await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!resp.ok) {
      console.error(`[erdl-mcp] Telemetry upload failed: HTTP ${resp.status}`)
    }
  } catch (err) {
    // Network errors, timeouts, DNS failures — silently discard.
    // We never block startup on telemetry.
    const msg = err instanceof Error ? err.message : String(err)
    if (msg !== 'This operation was aborted') {
      console.error(`[erdl-mcp] Telemetry upload skipped (network): ${msg}`)
    }
  }
}

// ============================================
// Public API
// ============================================

export interface TelemetryReporter {
  /** Ask for consent (call once at startup). Returns true if user opted in. */
  initialize: () => boolean
  /** Report a startup event. No-op if user hasn't opted in. */
  reportStartup: (version: string, language: string, rulesCount: number, tier: 'free' | 'pro' | 'trial') => void
  /** Check if telemetry is currently enabled */
  isEnabled: () => boolean
}

export function createTelemetryReporter(): TelemetryReporter {
  let enabled = false
  let initialized = false

  return {
    initialize() {
      if (initialized) return enabled
      initialized = true

      // Check for explicit opt-in via env var
      const envVal = process.env.ERDL_TELEMETRY
      if (envVal === '1') {
        enabled = true
        const cfg: TelemetryConfig = { consented: true, enabled: true, consentedAt: new Date().toISOString() }
        saveConfig(cfg)
        console.error('[erdl-mcp] Telemetry enabled')
        return true
      }
      if (envVal === '0') {
        enabled = false
        const cfg: TelemetryConfig = { consented: true, enabled: false, consentedAt: new Date().toISOString() }
        saveConfig(cfg)
        console.error('[erdl-mcp] Telemetry disabled')
        return false
      }

      // Check if user already made a choice
      const cfg = loadConfig()
      if (cfg.consented) {
        enabled = cfg.enabled === true
        return enabled
      }

      // First launch — prompt
      enabled = promptConsent()
      const newCfg: TelemetryConfig = { consented: true, enabled, consentedAt: new Date().toISOString() }
      saveConfig(newCfg)
      return enabled
    },

    reportStartup(version, language, rulesCount, tier) {
      if (!enabled) return

      // Fire and forget — never await
      const tzOffset = -new Date().getTimezoneOffset()
      const blurredTz = Math.round(tzOffset / 60) * 60 // blur to nearest hour

      const payload: TelemetryPayload = {
        deploy_id: getDeployId(),
        version,
        platform: `${platform()}-${arch()}`,
        language,
        tz_offset: blurredTz,
        rules_count: rulesCount,
        tier,
        app: 'erdl-mcp',
      }

      send(payload).catch(() => { /* noop — already handled in send() */ })
    },

    isEnabled() {
      return enabled
    },
  }
}
