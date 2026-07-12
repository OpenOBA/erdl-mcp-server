/**
 * ERDL MCP Server — Rule Store
 *
 * Loads rules from file system, watches for changes, tracks hit counts.
 * Uses ~/.openoba/rules/ as the rules directory.
 *
 * Strictly follows ERDL SPEC §5 file format:
 *   rules:
 *     - name: "rule-name"
 *       when:             # structured: { logic, conditions: [{ field, operator, value }] }
 *       then: BLOCK
 *       message: "..."
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07 · refactored 2026-07-12 (SPEC §5 strict compliance)
 * @license MIT
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as yaml from 'js-yaml'
import type { RuleDefinition, RuleCategory, RuleAction, RuleCondition, ConditionOperator, AgentIdentity } from './rule-definition.js'

// ============================================
// Types
// ============================================

interface YamlFile {
  rules?: Record<string, unknown>[]
  agent?: { role?: string; observes?: string[] }
  metadata?: Record<string, unknown>
}

// ============================================
// Rule Store
// ============================================

export class RuleStore {
  private rules = new Map<string, RuleDefinition>()
  private watcher: fs.FSWatcher | null = null
  private onChangeCallback: (() => void) | null = null
  private agentIdentity: AgentIdentity = { role: 'observed' }

  /** Get the rules directory path */
  static getRulesDir(): string {
    const home = os.homedir()
    return path.join(home, '.openoba', 'rules')
  }

  /** Register callback for when rules change */
  onRulesChanged(cb: () => void): void {
    this.onChangeCallback = cb
  }

  /** Load all .erdl.yaml / .yaml rule files from the rules directory */
  async load(): Promise<number> {
    const dir = RuleStore.getRulesDir()

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.error(`[erdl-mcp] Created rules directory: ${dir}`)
    }

    const loaded = this.loadFromDir(dir)
    this.startWatch(dir)

    console.error(`[erdl-mcp] Loaded ${loaded} rules from ${dir}`)
    return loaded
  }

  /** Reload all rules (called on file change) */
  reload(): number {
    this.rules.clear()
    const dir = RuleStore.getRulesDir()
    const count = this.loadFromDir(dir)
    console.error(`[erdl-mcp] Reloaded ${this.rules.size} rules (${count} from filesystem)`)

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

  /** Get agent identity */
  getAgentIdentity(): AgentIdentity {
    return this.agentIdentity
  }

  /** Check if this agent is a guardian */
  isGuardian(): boolean {
    return this.agentIdentity.role === 'guardian'
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
   * Persist a rule to a YAML file in SPEC §5 format.
   */
  async saveRule(rule: RuleDefinition): Promise<string> {
    const dir = RuleStore.getRulesDir()
    const categoryDir = path.join(dir, rule.category)
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true })
    }

    const filename = `${rule.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.yaml`
    const filePath = path.join(categoryDir, filename)

    const specRule: Record<string, unknown> = {
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      when: this.conditionsToSpecWhen(rule.conditions),
      then: rule.action.decision,
      message: rule.action.reason ?? rule.action.instruction ?? rule.action.correction ?? '',
    }

    if (rule.version) specRule.version = rule.version
    if (rule.enabled !== undefined && !rule.enabled) specRule.enabled = false

    const yamlContent: YamlFile = { rules: [specRule] }
    const yamlStr = yaml.dump(yamlContent, { indent: 2, lineWidth: 120, noRefs: true })
    fs.writeFileSync(filePath, yamlStr, 'utf-8')
    console.error(`[erdl-mcp] Rule saved: ${filePath}`)

    this.addRuntime(rule)
    return filePath
  }

  // ============================================
  // Private: Load
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
          if (typeof raw !== 'object' || raw === null) continue
          const rule = this.parseSpecRule(raw as Record<string, unknown>, filePath)
          if (rule && !this.rules.has(rule.id)) {
            this.rules.set(rule.id, rule)
            count++
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
      } else if (entry.name.endsWith('.erdl.yaml') || entry.name.endsWith('.erdl.yml')) {
        results.push(fullPath)
      }
    }

    return results
  }

  // ============================================
  // Private: SPEC §5 Parser
  // ============================================

  /**
   * Parse a single rule in ERDL SPEC §5 format.
   *
   * rules:
   *   - name: "dangerous-command-intercept"
   *     description: "..."
   *     priority: 10
   *     override: high           # critical | high | normal | low
   *     when:
   *       logic: AND
   *       conditions:
   *         - field: "tool.name"
   *           operator: eq
   *           value: "exec"
   *         - field: "tool.args.command"
   *           operator: match
   *           value: "(rm -rf|sudo)"
   *     then: BLOCK
   *     message: "Dangerous command intercepted"
   */
  private parseSpecRule(raw: Record<string, unknown>, sourceFile: string): RuleDefinition | null {
    const name = (raw.name as string) ?? ''
    if (!name) return null
    if (!raw.then) {
      console.error(`[erdl-mcp] Skipping rule "${name}" without 'then' in ${sourceFile}`)
      return null
    }

    // Infer category from parent directory name
    const parentDir = path.basename(path.dirname(sourceFile))
    const category = (raw.category as RuleCategory) ?? this.inferCategory(parentDir) ?? 'custom'
    const description = (raw.description as string) ?? name
    const priority = (raw.priority as number) ?? 100
    const enabled = (raw.enabled as boolean) ?? true

    // Parse override: SPEC §5 specifies critical|high|normal|low levels
    const overrideRaw = raw.override
    const override = overrideRaw === true || overrideRaw === 'true' ||
      overrideRaw === 'critical' || overrideRaw === 'high'

    // Parse when — supports both structured { logic, conditions } and legacy string expression
    const whenObj = raw.when
    const conditionLogic: 'AND' | 'OR' = (typeof whenObj === 'object' && whenObj !== null && (whenObj as Record<string,unknown>).logic === 'OR') ? 'OR' : 'AND'
    const conditions: RuleCondition[] = this.parseWhen(whenObj)

    // Parse then + message
    const thenDecision = String(raw.then)
    const message = (raw.message as string) ?? ''
    const action = this.parseThenAction(thenDecision, message)

    // Parse explanation / alternative (bilingual support)
    if (raw.explanation) {
      action.explanation = raw.explanation as string | { zh: string; en: string }
    }
    if (raw.alternative) {
      action.alternative = raw.alternative as string | { zh: string; en: string }
    }

    const id = name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()

    return {
      id,
      name,
      description,
      category,
      conditions,
      conditionLogic,
      action,
      priority,
      enabled,
      override,
      version: (raw.version as number) ?? 1,
      hitCount: 0,
    }
  }

  /**
   * Parse SPEC §5 when into RuleCondition[].
   *
   * Supports:
   *   when: { logic: AND, conditions: [{ field, operator, value }] }   — SPEC §5 structured
   *   when: "true"                                                     — always match (empty = advisory)
   *   when: "tool.name = \"exec\" AND tool.args.command match \"rm\""   — legacy string expr (no longer used)
   */
  private parseWhen(whenObj: unknown): RuleCondition[] {
    // Empty / null / "true" → always match (advisory rule)
    if (whenObj === undefined || whenObj === null || whenObj === 'true') return []

    // Structured SPEC §5 format: { logic, conditions: [...] }
    if (typeof whenObj === 'object' && !Array.isArray(whenObj)) {
      const w = whenObj as Record<string, unknown>
      const conds = w.conditions as Array<Record<string, unknown>> | undefined
      if (conds && Array.isArray(conds)) {
        return conds.map((c) => ({
          kind: 'context_matches' as const,
          field: (c.field as string) ?? '',
          operator: (c.operator as ConditionOperator) ?? 'eq',
          value: c.value as string | number | boolean | string[] | undefined,
        }))
      }
      // { logic: AND, conditions: [...] } with empty conditions → always match
      return []
    }

    return []
  }

  /**
   * Parse then + message into RuleAction.
   *
   * SPEC §5 then values: ALLOW | CORRECT | STRATEGIZE | AUDIT | BLOCK | DENY
   *                      | REQUEST_HUMAN | ESCALATE | EMERGENCY_HALT | VALIDATE | NOTIFY
   */
  private parseThenAction(decision: string, message: string): RuleAction {
    const upper = decision.toUpperCase()

    switch (upper) {
      case 'DENY':
      case 'BLOCK':  // SPEC §3.4 alias: BLOCK is the standard name, DENY is the synonym
        return { decision: 'DENY', reason: message || 'Blocked by rule', ring: 0 }
      case 'EMERGENCY_HALT':
        return { decision: 'EMERGENCY_HALT', reason: message || 'Emergency halt', ring: 0 }
      case 'REQUEST_HUMAN':
        return { decision: 'REQUEST_HUMAN', reason: message || 'Approval required', ring: 2 }
      case 'CORRECT':
        return { decision: 'CORRECT', correction: message || undefined }
      case 'ALLOW':
      default:
        return { decision: 'ALLOW', instruction: message || undefined }
    }
  }

  /** Convert conditions array back to SPEC §5 when structure (for save) */
  private conditionsToSpecWhen(conditions: RuleCondition[]): Record<string, unknown> | string {
    if (conditions.length === 0) return 'true'

    return {
      logic: 'AND',
      conditions: conditions.map((c) => {
        const entry: Record<string, unknown> = {
          field: c.field ?? '',
          operator: c.operator ?? 'eq',
          value: c.value,
        }
        return entry
      }),
    }
  }

  /** Infer rule category from directory name */
  private inferCategory(dirName: string): RuleCategory | null {
    const valid: RuleCategory[] = [
      'coding', 'engineering', 'security', 'writing', 'design',
      'performance', 'testing', 'compliance', 'accessibility', 'custom',
    ]
    return valid.includes(dirName as RuleCategory) ? (dirName as RuleCategory) : null
  }

  // ============================================
  // Private: File Watch
  // ============================================

  private watchTimer: ReturnType<typeof setTimeout> | null = null

  private startWatch(dir: string): void {
    try {
      this.watcher = fs.watch(dir, { recursive: true }, (_event, filename) => {
        if (filename && (filename.endsWith('.yaml') || filename.endsWith('.yml'))) {
          if (this.watchTimer) clearTimeout(this.watchTimer)
          this.watchTimer = setTimeout(() => {
            this.watchTimer = null
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
