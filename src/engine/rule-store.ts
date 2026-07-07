/**
 * ERDL MCP Server 閳?Rule Store
 *
 * Loads rules from file system, watches for changes, tracks hit counts.
 * Uses ~/.openoba/rules/ as the rules directory.
 *
 * @author 閸炴劖鏃﹂悞?(Tang Haoran) 璺?OpenOBA AI 閹笛嗩攽鐎?
 * @since 2026-07-07
 * @license MIT
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as yaml from 'js-yaml'
import { compileWhen } from './erdl-expr-parser.js'
import { PRESET_YAML_CODING, PRESET_YAML_WRITING, PRESET_YAML_DESIGN } from '../config/presets.js'
import { PRESET_YAML_ENGINEERING } from '../config/presets-engineering.js'
import type { RuleDefinition, RuleCategory, RuleAction, RuleCondition, ConditionOperator, AgentIdentity } from './rule-definition.js'

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
    context_matches?: string
    value?: unknown
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
  rules?: YamlRule[] | Record<string, unknown>
  agent?: { role?: string; observes?: string[] }
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

  /** Load all .yaml rule files from the rules directory */
  async load(): Promise<number> {
    const dir = RuleStore.getRulesDir()

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.error(`[erdl-mcp] Created rules directory: ${dir}`)
    }

    // Deploy preset rules on first run (if directory is empty)
    this.deployPresets(dir)

    const loaded = this.loadFromDir(dir)

    // Start watching for changes
    this.startWatch(dir)

    console.error(`[erdl-mcp] Loaded ${loaded} rules from ${dir}`)
    return loaded
  }

  /**
   * Deploy preset rules on first run from inline YAML (no file system dependency).
   */
  private deployPresets(dir: string): void {
    const existing = this.scanYamlFiles(dir)
    if (existing.length > 0) {
      console.error(`[erdl-mcp] Found ${existing.length} existing rule files, skipping preset deployment`)
      return
    }

    console.error('[erdl-mcp] First run detected. Writing 20 preset rules from inline YAML...')

    const categories: Record<string, string> = {
      coding: PRESET_YAML_CODING,
      writing: PRESET_YAML_WRITING,
      design: PRESET_YAML_DESIGN,
      engineering: PRESET_YAML_ENGINEERING,
    }

    for (const [name, yamlStr] of Object.entries(categories)) {
      const catDir = path.join(dir, name)
      if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true })
      const filePath = path.join(catDir, 'openoba-presets.erdl.yaml')
      try {
        fs.writeFileSync(filePath, yamlStr, 'utf-8')
        console.error(`[erdl-mcp] Deployed ${name} rules to ${filePath}`)
      } catch (err) {
        console.error(`[erdl-mcp] Failed to write ${filePath}:`, err instanceof Error ? err.message : String(err))
      }
    }
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

        if (!parsed?.rules) continue

        // Spec v1.1 format: rules as keyed map { rule_name: { when, then, ... } }
        if (typeof parsed.rules === 'object' && !Array.isArray(parsed.rules)) {
          for (const [ruleId, ruleDef] of Object.entries(parsed.rules)) {
            const rule = this.parseSpecRule(ruleId, ruleDef as Record<string, unknown>, filePath)
            if (rule && !this.rules.has(rule.id)) {
              this.rules.set(rule.id, rule)
              count++
            }
          }
        }

        // Legacy format: rules as array
        if (Array.isArray(parsed.rules)) {
          for (const raw of parsed.rules) {
            const rule = this.parseRule(raw, filePath)
            if (rule && !this.rules.has(rule.id)) {
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
      value: c.value as string,
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

  /**
   * Parse a rule in ERDL Spec keyed-map format.
   *
   * rules:
   *   no_any:
   *     when: language = "typescript" AND output_text contains "any"
   *     then: BLOCK "娑撳秷顩︽担璺ㄦ暏 any 缁鐎?
   */
  private parseSpecRule(ruleId: string, raw: Record<string, unknown>, _sourceFile: string): RuleDefinition | null {
    if (!ruleId) return null

    const category = (raw.category as RuleCategory) ?? 'custom'
    const description = (raw.description as string) ?? ruleId
    const whenExpr = (raw.when as string) ?? ''
    const thenExpr = (raw.then as string) ?? ''

    // Parse when 閳?conditions[]
    const conditions: RuleCondition[] = this.parseWhenExpression(whenExpr)

    // Parse then 閳?action
    const action = this.parseThenExpression(thenExpr)

    return {
      id: ruleId,
      name: ruleId,
      description,
      category,
      triggers: [ruleId],
      conditions,
      action,
      priority: (raw.priority as number) ?? 100,
      enabled: (raw.enabled as boolean) ?? true,
      override: (raw.override as boolean) ?? false,
      version: (raw.version as number) ?? 1,
      hitCount: 0,
    }
  }

  /**
   * Parse when expression 閳?RuleCondition[]
   *
   * Supports ERDL Spec operators + extensions:
   *   field = "value" | field != "value" | field in ("a","b")
   *   field contains "val" | field match "regex"
   *   AND / OR / NOT logic with () grouping
   */
  private parseWhenExpression(expr: string): RuleCondition[] {
    if (!expr || expr === 'true') return []

    try {
      const ast = compileWhen(expr)
      if (ast.conditions && Array.isArray(ast.conditions)) {
        return (ast.conditions as Array<Record<string, unknown>>).map((c) => ({
          kind: 'context_matches' as const,
          field: c.field as string ?? '',
          value: c.value,
          operator: mapSpecOp(c.operator as string),
        }))
      }
    } catch (err) {
      console.error(`[erdl-mcp] Failed to compile when expression: ${expr}`, err instanceof Error ? err.message : String(err))
    }

    return []
  }

  private parseThenExpression(expr: string): RuleAction {
    if (!expr) return { decision: 'ALLOW' }
    const upper = expr.toUpperCase()
    if (upper.startsWith('BLOCK') || upper.startsWith('DENY')) {
      const reason = expr.replace(/^(BLOCK|DENY)\s*/i, '').replace(/^["']|["']$/g, '').trim()
      return { decision: 'DENY', reason: reason || 'Blocked by rule' }
    }
    if (upper.startsWith('EMERGENCY_HALT')) {
      const reason = expr.replace(/^EMERGENCY_HALT\s*/i, '').replace(/^["']|["']$/g, '').trim()
      return { decision: 'EMERGENCY_HALT', reason: reason || 'Emergency halt', ring: 0 }
    }
    if (upper.startsWith('REQUEST_HUMAN')) {
      const reason = expr.replace(/^REQUEST_HUMAN\s*/i, '').replace(/^["']|["']$/g, '').trim()
      return { decision: 'REQUEST_HUMAN', reason: reason || 'Approval required' }
    }
    if (upper.startsWith('CORRECT')) {
      const correction = expr.replace(/^CORRECT\s*/i, '').replace(/^["']|["']$/g, '').trim()
      return { decision: 'CORRECT', correction: correction || undefined }
    }
    if (upper.startsWith('ALLOW') || upper.startsWith('SUGGEST')) {
      const instruction = expr.replace(/^(ALLOW|SUGGEST)\s*/i, '').replace(/^["']|["']$/g, '').trim()
      return { decision: 'ALLOW', instruction: instruction || undefined }
    }
    return { decision: 'ALLOW', instruction: expr || undefined }
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

// ============================================
// Helper functions
// ============================================


function mapSpecOp(op: string): ConditionOperator {
  const map: Record<string, ConditionOperator> = {
    '=': 'eq', '==': 'eq', 'eq': 'eq',
    '!=': 'ne', '<>': 'ne', 'ne': 'ne',
    '>': 'gt', 'gt': 'gt',
    '<': 'lt', 'lt': 'lt',
    '>=': 'gte', 'gte': 'gte',
    '<=': 'lte', 'lte': 'lte',
    'in': 'in', 'not_in': 'not_in',
    'contains': 'contains', 'not_contains': 'not_contains',
    'match': 'match',
    'exists': 'exists', 'not_exists': 'not_exists',
  }
  return map[op] ?? 'eq'
}

