/**
 * ERDL MCP Server — Rule Store
 *
 * Loads rules from file system, watches for changes, tracks hit counts.
 * Uses ~/.openoba/rules/ as the rules directory.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as yaml from 'js-yaml'
import type { RuleDefinition, RuleCategory, RuleAction, RuleCondition } from './rule-definition.js'

// ============================================
// Types
// ============================================

interface YamlRule {
  id?: string
  name?: string
  description?: string
  category?: string
  triggers?: string[]
  conditions?: Array<{
    kind?: string
    keywords?: string[]
    pattern?: string
    field?: string
    value?: string
  }>
  action?: {
    decision?: string
    instruction?: string
    reason?: string
  }
  priority?: number
  enabled?: boolean
  version?: number
}

interface YamlFile {
  rules?: YamlRule[]
}

// ============================================
// Rule Store
// ============================================

export class RuleStore {
  private rules = new Map<string, RuleDefinition>()
  private watcher: fs.FSWatcher | null = null
  private onChangeCallback: (() => void) | null = null

  /** Get the rules directory path */
  static getRulesDir(): string {
    const home = os.homedir()
    return path.join(home, '.openoba', 'rules')
  }

  /** Register callback for when rules change */
  onRulesChanged(cb: () => void): void {
    this.onChangeCallback = cb
  }

  /** Load all .yaml rule files from the rules directory */
  async load(): Promise<number> {
    const dir = RuleStore.getRulesDir()

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.error(`[erdl-mcp] Created rules directory: ${dir}`)
    }

    const loaded = this.loadFromDir(dir)

    // Start watching for changes
    this.startWatch(dir)

    console.error(`[erdl-mcp] Loaded ${loaded} rules from ${dir}`)
    return loaded
  }

  /** Reload all rules (called on file change) */
  reload(): number {
    this.rules.clear()
    const dir = RuleStore.getRulesDir()
    const count = this.loadFromDir(dir)
    console.error(`[erdl-mcp] Reloaded ${count} rules`)

    if (this.onChangeCallback) {
      this.onChangeCallback()
    }

    return count
  }

  /** Get all active rules */
  getAll(): RuleDefinition[] {
    return Array.from(this.rules.values())
  }

  /** Get a specific rule by ID */
  get(id: string): RuleDefinition | undefined {
    return this.rules.get(id)
  }

  /** Get rule count */
  count(): number {
    return this.rules.size
  }

  /** Increment hit count for a rule */
  recordHit(ruleId: string): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.hitCount = (rule.hitCount ?? 0) + 1
    }
  }

  /** Add a runtime rule (not persisted to disk) */
  addRuntime(rule: RuleDefinition): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Persist a rule to a YAML file.
   * Creates a new file or updates existing.
   */
  async saveRule(rule: RuleDefinition): Promise<string> {
    const dir = RuleStore.getRulesDir()
    const categoryDir = path.join(dir, rule.category)
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }

    const filename = `${rule.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.yaml`
    const filePath = path.join(categoryDir, filename)

    const yamlContent: YamlFile = {
      rules: [this.ruleToYaml(rule)],
    }

    const yamlStr = yaml.dump(yamlContent, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    })

    fs.writeFileSync(filePath, yamlStr, 'utf-8')
    console.error(`[erdl-mcp] Rule saved: ${filePath}`)

    // Add to in-memory store and trigger reload
    this.addRuntime(rule)

    return filePath
  }

  // ============================================
  // Private methods
  // ============================================

  private loadFromDir(dir: string): number {
    const entries = this.scanYamlFiles(dir)
    let count = 0

    for (const filePath of entries) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const parsed = yaml.load(content) as YamlFile | null

        if (!parsed?.rules || !Array.isArray(parsed.rules)) continue

        for (const raw of parsed.rules) {
          const rule = this.parseRule(raw, filePath)
          if (rule) {
            // Skip if ID already exists (first loaded wins)
            if (!this.rules.has(rule.id)) {
              this.rules.set(rule.id, rule)
              count++
            }
          }
        }
      } catch (err) {
        console.error(`[erdl-mcp] Error loading ${filePath}:`, err instanceof Error ? err.message : String(err))
      }
    }

    return count
  }

  private scanYamlFiles(dir: string): string[] {
    const results: string[] = []

    if (!fs.existsSync(dir)) return results

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...this.scanYamlFiles(fullPath))
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        results.push(fullPath)
      }
    }

    return results
  }

  private parseRule(raw: YamlRule, sourceFile: string): RuleDefinition | null {
    if (!raw.id || !raw.name) {
      console.error(`[erdl-mcp] Skipping rule without id/name in ${sourceFile}`)
      return null
    }

    const category = (raw.category as RuleCategory) ?? 'custom'
    const conditions: RuleCondition[] = (raw.conditions ?? []).map((c) => ({
      kind: (c.kind as RuleCondition['kind']) ?? 'intent_contains',
      keywords: c.keywords,
      pattern: c.pattern,
      field: c.field,
      value: c.value,
    }))

    const action: RuleAction = {
      decision: (raw.action?.decision as RuleAction['decision']) ?? 'ALLOW',
      instruction: raw.action?.instruction,
      reason: raw.action?.reason,
    }

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description ?? raw.name,
      category,
      triggers: raw.triggers ?? [],
      conditions,
      action,
      priority: raw.priority ?? 100,
      enabled: raw.enabled ?? true,
      version: raw.version ?? 1,
      hitCount: 0,
    }
  }

  private ruleToYaml(rule: RuleDefinition): YamlRule {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      triggers: rule.triggers,
      conditions: rule.conditions,
      action: rule.action,
      priority: rule.priority,
      enabled: rule.enabled,
      version: rule.version,
    }
  }

  private startWatch(dir: string): void {
    try {
      this.watcher = fs.watch(dir, { recursive: true }, (_event, filename) => {
        if (filename && (filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
          // Debounce: reload after a short delay
          setTimeout(() => {
            this.reload()
          }, 300)
        }
      })
    } catch (err) {
      console.error('[erdl-mcp] Failed to start file watcher:', err instanceof Error ? err.message : String(err))
    }
  }

  /** Clean up watcher on shutdown */
  destroy(): void {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}

/** Singleton instance */
export const ruleStore = new RuleStore()
