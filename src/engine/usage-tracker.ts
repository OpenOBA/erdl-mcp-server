/**
 * ERDL MCP Server — Usage Tracker
 *
 * Tracks user behavior locally to trigger contextual recommendations
 * for Pro features. Never blocks functionality. Never phones home.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-09
 * @license MIT
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

interface RuleEvent {
  id: string
  category: string
  createdAt: string
  hasConditions: boolean
}

interface UsageData {
  schemaVersion: 1
  rulesCreated: RuleEvent[]
  recommendationsShown: Record<string, string> // key → ISO timestamp of last shown
}

interface Recommendation {
  condition: string
  message: string
  priority: 'low' | 'medium'
}

function getUsagePath(): string {
  const dir = join(homedir(), '.openoba')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, '.usage.json')
}

function load(): UsageData {
  const file = getUsagePath()
  try {
    if (existsSync(file)) {
      const data = JSON.parse(readFileSync(file, 'utf-8'))
      if (data.schemaVersion === 1 && Array.isArray(data.rulesCreated)) return data
    }
  } catch { /* corrupt file → start fresh */ }
  return { schemaVersion: 1, rulesCreated: [], recommendationsShown: {} }
}

function save(data: UsageData): void {
  writeFileSync(getUsagePath(), JSON.stringify(data, null, 2), 'utf-8')
}

function daysAgo(timestamp: string, days: number): boolean {
  const d = new Date(timestamp).getTime()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return d >= cutoff
}

export class UsageTracker {
  private data: UsageData

  constructor() {
    this.data = load()
  }

  /** Record a rule creation event */
  trackRule(rule: { id: string; category: string; hasConditions: boolean }): void {
    this.data.rulesCreated.push({
      id: rule.id,
      category: rule.category,
      createdAt: new Date().toISOString(),
      hasConditions: rule.hasConditions,
    })
    save(this.data)
  }

  /** Check for recommendation triggers. Returns null if nothing to recommend. */
  checkRecommendations(): Recommendation | null {
    const rules = this.data.rulesCreated
    const shown = this.data.recommendationsShown
    const now = new Date().toISOString()

    // T-1: Cross-domain pattern — 2+ different categories
    const categories = new Set(rules.map((r) => r.category))
    if (categories.size >= 2) {
      const catArray = [...categories].sort()
      const key = `cross-domain:${catArray.join('+')}`
      if (!shown[key] || !daysAgo(shown[key], 90)) {
        shown[key] = now
        save(this.data)
        return {
          condition: 'cross-domain',
          message: `你同时在管理 ${catArray.map(c => `[${c}]`).join(' 和 ')} 规则。Pro 版提供跨类别冲突检测，帮你发现规则间的矛盾。`,
          priority: 'medium',
        }
      }
    }

    // T-2: High usage — 10+ rules in 7 days
    const recent = rules.filter((r) => daysAgo(r.createdAt, 7))
    if (recent.length >= 10) {
      if (!shown['high-usage'] || !daysAgo(shown['high-usage'], 7)) {
        shown['high-usage'] = now
        save(this.data)
        return {
          condition: 'high-usage',
          message: `你最近 7 天创建了 ${recent.length} 条规则！社区规则市场有 1,000+ 条现成规则包。不用从零开始。`,
          priority: 'low',
        }
      }
    }

    // T-3: Quality suggestion — rules without conditions (too broad)
    const broadRules = rules.filter((r) => !r.hasConditions)
    if (broadRules.length >= 3) {
      if (!shown['quality-broad'] || !daysAgo(shown['quality-broad'], 90)) {
        shown['quality-broad'] = now
        save(this.data)
        return {
          condition: 'quality-broad',
          message: `你有 ${broadRules.length} 条无条件规则（在所有场景触发）。Pro 版提供规则模拟和测试，确保精准匹配。`,
          priority: 'low',
        }
      }
    }

    // T-4: First security rule
    const securityRules = rules.filter((r) => r.category === 'security')
    if (securityRules.length === 1) {
      if (!shown['security-first']) {
        shown['security-first'] = now
        save(this.data)
        return {
          condition: 'security-first',
          message: `你刚刚创建了第一条安全规则。Pro 版提供 OWASP Top 10 和 PCI-DSS 合规规则包，200+ 条专业规则。`,
          priority: 'medium',
        }
      }
    }

    return null
  }
}

/** Singleton */
let instance: UsageTracker | null = null

export function getUsageTracker(): UsageTracker {
  if (!instance) instance = new UsageTracker()
  return instance
}
