/**
 * ERDL MCP Server — Rule Definition Types
 *
 * Core type definitions for ERDL rules. Designed for personal use:
 * coding conventions, writing style, design constraints — not enterprise policies.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

// ============================================
// Rule Condition
// ============================================

/**
 * Condition types suited for personal-agent rules.
 *
 * - `intent_contains`: The agent's current intent contains a keyword.
 *   e.g., `write_code`, `git_commit`, `write_blog`
 * - `intent_matches`: The agent's intent matches a regex pattern.
 * - `context_matches`: A field in the evaluation context matches a pattern.
 *   e.g., `file: "*.ts"`, `language: "typescript"`
 */
export type ConditionKind = 'intent_contains' | 'intent_matches' | 'context_matches'

/** Spec v1.1 comparison operators */
export type ConditionOperator =
  | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'not_in'
  | 'contains' | 'not_contains'
  | 'match'
  | 'exists' | 'not_exists'

export interface RuleCondition {
  kind: ConditionKind

  /** Keywords to match against agent intent (intent_contains) */
  keywords?: string[]

  /** Regex pattern to match (intent_matches / context_matches) */
  pattern?: string

  /** Context field path for context_matches or Spec mode (e.g., "file", "language") */
  field?: string

  /** Expected value for context_matches comparison */
  value?: unknown

  /** Spec v1.1 comparison operator (when using field/operator/value mode) */
  operator?: ConditionOperator
}

// ============================================
// Rule Action / Decision
// ============================================

export type Decision = 'ALLOW' | 'DENY' | 'PASS'

export interface RuleAction {
  /** What should happen when this rule matches */
  decision: Decision
  /** Instruction for the LLM to follow */
  instruction?: string
  /** Reason shown to user when denied */
  reason?: string
}

// ============================================
// Rule Definition
// ============================================

export type RuleCategory = 'coding' | 'writing' | 'design' | 'custom'

export interface RuleDefinition {
  /** Unique rule ID (e.g., "TS-001") */
  id: string

  /** Human-readable rule name */
  name: string

  /** One-line description */
  description: string

  /** Category for organization */
  category: RuleCategory

  /** Intent triggers that should cause this rule to be evaluated */
  triggers: string[]

  /** Match conditions */
  conditions: RuleCondition[]

  /** Action to take when matched */
  action: RuleAction

  /** Priority: lower number = higher priority (1-1000) */
  priority: number

  /** Whether this rule is currently active */
  enabled: boolean

  /** Spec v1.1 Section 4.4: stops all further rule evaluation on match */
  override?: boolean

  /** Rule version (for tracking changes) */
  version?: number

  /** Hit count (runtime counter) */
  hitCount?: number
}

// ============================================
// Evaluation Result
// ============================================

export interface RuleMatch {
  ruleId: string
  ruleName: string
  decision: Decision
  instruction?: string
  reason?: string
  priority: number
}

export interface EvaluationResult {
  /** Overall decision: ALLOW if any matched, DENY if blocked, PASS if no rules fired */
  decision: Decision

  /** All matched rules, sorted by priority */
  matchedRules: RuleMatch[]

  /** The highest-priority instruction (for ALLOW) or reason (for DENY) */
  primaryInstruction?: string
  primaryReason?: string

  /** Total rules evaluated */
  totalEvaluated: number

  /** Total rules matched */
  totalMatched: number
}

// ============================================
// Create Rule from NL
// ============================================

export interface RuleCreationRequest {
  naturalLanguage: string
  category: RuleCategory
  autoActivate?: boolean
}

export interface RuleCreationResult {
  ruleId: string
  name: string
  status: 'created' | 'updated'
  filePath: string
}

// ============================================
// Simulate
// ============================================

export interface SimulateScenario {
  /** Human description of the scenario */
  description: string
  /** Simulated agent intent */
  intent: string
  /** Simulated context */
  context: Record<string, unknown>
  /** Expected outcome */
  expectedDecision: Decision
}

export interface SimulateResult {
  scenario: SimulateScenario
  actualDecision: Decision
  matched: boolean
  matchedRules: RuleMatch[]
}
