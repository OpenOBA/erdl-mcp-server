/**
 * ERDL MCP Server — Rule Evaluator (ERDL Spec v1.1 §11.4 compliant)
 *
 * Execution Rings + override semantics + dual-mode condition evaluation.
 *
 * Algorithm (Spec §11.4):
 *   1. Rules sorted by priority ascending (lower == higher priority)
 *   2. Evaluate in Ring order: Ring 0 first, then Ring 1, 2, 3
 *   3. Within each Ring, first-match-wins (short-circuit)
 *   4. override=true can override a BLOCK/DENY from a HIGHER-priority Ring
 *      (only BLOCK→ALLOW direction; never to a less-safe state)
 *   5. override within same Ring: override rule runs first regardless of priority
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07 · updated 2026-07-09 (override + rings)
 * @license MIT
 */

import type { RuleDefinition, RuleCondition, EvaluationResult, RuleMatch, Decision, RingLevel } from './rule-definition.js'
import { SafeExpr } from './safe-expr.js'

const safeExpr = new SafeExpr()

/** Safety severity: lower number = more restrictive */
const DECISION_SEVERITY: Record<string, number> = {
  EMERGENCY_HALT: 0,
  DENY: 1,
  REQUEST_HUMAN: 2,
  CORRECT: 3,
  ALLOW: 4,
  PASS: 5,
}

/**
 * override is only permitted in the safe direction:
 * BLOCK/DENY/HALT → ALLOW is safe (override relaxes).
 * ALLOW → DENY is NOT override; it's already handled by Ring ordering.
 */
function isOverrideSafe(from: Decision, to: Decision): boolean {
  // override only moves from more restrictive → less restrictive
  return DECISION_SEVERITY[to] > DECISION_SEVERITY[from]
}

export class Evaluator {
  evaluate(
    rules: RuleDefinition[],
    context: Record<string, unknown>,
  ): EvaluationResult {
    const enabled = rules.filter((r) => r.enabled)
    if (enabled.length === 0) {
      return { decision: 'PASS', matchedRules: [], totalEvaluated: 0, totalMatched: 0 }
    }

    // Group by Ring, sort within each Ring by priority (override rules jump to front)
    const byRing = new Map<number, RuleDefinition[]>()
    for (const rule of enabled) {
      const ring = rule.action.ring ?? 3
      if (!byRing.has(ring)) byRing.set(ring, [])
      byRing.get(ring)!.push(rule)
    }

    // Sort Ring keys ascending (Ring 0 evaluates first)
    const ringKeys = [...byRing.keys()].sort((a, b) => a - b)

    const allMatched: RuleMatch[] = []
    let finalDecision: Decision = 'PASS'
    let finalInstruction: string | undefined
    let finalReason: string | undefined
    let finalCorrection: string | undefined

    for (const ring of ringKeys) {
      const ringRules = byRing.get(ring)!

      // Separate override and normal rules
      const overrideRules = ringRules.filter((r) => r.override)
      const normalRules = ringRules.filter((r) => !r.override)

      // Phase 1: Evaluate normal rules with first-match-wins (per §11.4 step 2-3)
      for (const rule of normalRules.sort((a, b) => a.priority - b.priority)) {
        const matched = rule.conditions.length === 0 ||
          rule.conditions.every((cond) => this.evaluateLeaf(cond, context))
        if (!matched) continue

        const match = this.makeMatch(rule, ring as RingLevel)
        allMatched.push(match)
        finalDecision = match.decision
        finalReason = match.reason
        finalInstruction = match.instruction
        finalCorrection = match.correction

        // Ring 0 BLOCK/HALT: short-circuit all further evaluation
        if (ring === 0 && (match.decision === 'EMERGENCY_HALT' || match.decision === 'DENY')) {
          return {
            decision: finalDecision,
            matchedRules: allMatched,
            primaryReason: finalReason ?? `${finalDecision} triggered by Ring 0 rule`,
            totalEvaluated: enabled.length,
            totalMatched: allMatched.length,
          }
        }

        // First match wins in this ring (for normal rules); move to next ring
        break
      }

      // Phase 2: Evaluate override rules AFTER normal rules have produced a decision.
      // Override rules can only relax (BLOCK/DENY → ALLOW), never tighten.
      // Override rules without a prior decision are skipped (they patch, not decide).
      if (finalDecision !== 'PASS') {
        for (const rule of overrideRules.sort((a, b) => a.priority - b.priority)) {
          const matched = rule.conditions.length === 0 ||
            rule.conditions.every((cond) => this.evaluateLeaf(cond, context))
          if (!matched) continue

          const match = this.makeMatch(rule, ring as RingLevel)

          if (isOverrideSafe(finalDecision, match.decision)) {
            allMatched.push(match)
            finalDecision = match.decision
            finalReason = match.reason
            finalInstruction = match.instruction
            finalCorrection = match.correction
          }
          // unsafe override → silently ignored, rule is recorded as skipped
        }
      }
    }

    if (allMatched.length === 0) {
      return { decision: 'PASS', matchedRules: [], totalEvaluated: enabled.length, totalMatched: 0 }
    }

    return {
      decision: finalDecision,
      matchedRules: allMatched,
      primaryReason: finalReason,
      primaryInstruction: finalInstruction,
      primaryCorrection: finalCorrection,
      totalEvaluated: enabled.length,
      totalMatched: allMatched.length,
    }
  }

  /** Build a RuleMatch from a matched rule */
  private makeMatch(rule: RuleDefinition, ring: RingLevel): RuleMatch {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      decision: rule.action.decision,
      instruction: rule.action.instruction,
      reason: rule.action.reason,
      ring: rule.action.ring ?? ring,
      correction: rule.action.correction,
      priority: rule.priority,
    }
  }

  simulate(
    rule: RuleDefinition,
    context: Record<string, unknown>,
  ): RuleMatch | null {
    if (!rule.enabled) return null
    const ctx = { ...context }
    const matched = rule.conditions.length === 0 || rule.conditions.every((cond) => this.evaluateLeaf(cond, ctx))
    if (!matched) return null

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      decision: rule.action.decision,
      instruction: rule.action.instruction,
      reason: rule.action.reason,
      priority: rule.priority,
    }
  }

  // ============================================
  // Leaf condition evaluation (dual mode)
  // ============================================

  private evaluateLeaf(cond: RuleCondition, context: Record<string, unknown>): boolean {
    // --- Spec v1.1 mode: field + operator + value ---
    if (cond.field && cond.operator) {
      return this.evaluateSpec(cond, context)
    }

    // --- Legacy intent_contains ---
    if (cond.kind === 'intent_contains') {
      const intent = String(context.intent ?? '').toLowerCase()
      return (cond.keywords ?? []).some((kw) => intent.includes(kw.toLowerCase()))
    }

    // --- Legacy intent_matches ---
    if (cond.kind === 'intent_matches') {
      if (!cond.pattern) return false
      try {
        return new RegExp(cond.pattern, 'i').test(String(context.intent ?? ''))
      } catch {
        return false
      }
    }

    // --- Legacy context_matches ---
    if (cond.kind === 'context_matches') {
      if (!cond.field || !cond.value) return false
      const fieldVal = String(this.resolveField(cond.field, context) ?? '')
      return fieldVal.toLowerCase().includes(String(cond.value).toLowerCase())
    }

    return false
  }

  // ============================================
  // Spec v1.1: field/operator/value evaluation
  // ============================================

  private evaluateSpec(cond: RuleCondition, context: Record<string, unknown>): boolean {
    const { field, operator } = cond
    if (!field || !operator) return false

    const raw = this.resolveField(field, context)

    // Build a numeric context for SafeExpr arithmetic evaluation
    const numCtx: Record<string, number> = {}
    if (typeof raw === 'number') numCtx[field] = raw
    for (const [k, v] of Object.entries(context)) {
      if (typeof v === 'number') numCtx[k] = v
    }

    switch (operator) {
      case 'eq': return raw === cond.value
      case 'ne': return raw !== cond.value
      case 'gt': {
        if (typeof raw === 'number' && typeof cond.value === 'number') return raw > (cond.value as number)
        return safeExpr.evaluate(`${field} > ${cond.value}`, numCtx) > 0
      }
      case 'gte': {
        if (typeof raw === 'number' && typeof cond.value === 'number') return raw >= (cond.value as number)
        return safeExpr.evaluate(`${field} >= ${cond.value}`, numCtx) > 0
      }
      case 'lt': {
        if (typeof raw === 'number' && typeof cond.value === 'number') return raw < (cond.value as number)
        return safeExpr.evaluate(`${field} < ${cond.value}`, numCtx) > 0
      }
      case 'lte': {
        if (typeof raw === 'number' && typeof cond.value === 'number') return raw <= (cond.value as number)
        return safeExpr.evaluate(`${field} <= ${cond.value}`, numCtx) > 0
      }
      case 'in':
        return Array.isArray(cond.value) && (cond.value as unknown[]).includes(raw)
      case 'not_in':
        return Array.isArray(cond.value) && !(cond.value as unknown[]).includes(raw)
      case 'contains': {
        return String(raw ?? '').includes(String(cond.value))
      }
      case 'not_contains': {
        return !String(raw ?? '').includes(String(cond.value))
      }
      case 'match': {
        try {
          return new RegExp(cond.value as string).test(String(raw ?? ''))
        } catch {
          return false
        }
      }
      case 'exists': return raw !== undefined && raw !== null
      case 'not_exists': return raw === undefined || raw === null
      default: return false
    }
  }

  private resolveField(field: string, context: Record<string, unknown>): unknown {
    // Try direct key lookup first (for dotted keys like 'tool.name')
    if (field in context) return context[field]
    // Fall back to nested path resolution
    return field.split('.').reduce<unknown>((obj, key) => {
      if (obj === null || obj === undefined || typeof obj !== 'object') return undefined
      return (obj as Record<string, unknown>)[key]
    }, context)
  }
}
