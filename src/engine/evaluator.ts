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
    let finalExplanation: RuleDefinition['action']['explanation'] | undefined
    let finalAlternative: RuleDefinition['action']['alternative'] | undefined

    for (const ring of ringKeys) {
      const ringRules = byRing.get(ring)!

      // Evaluate all rules in priority order.
      // override=true rules short-circuit further evaluation on match (SPEC §4.4).
      for (const rule of ringRules.sort((a, b) => a.priority - b.priority)) {
        const matched = rule.conditions.length === 0 ||
          (rule.conditionLogic === 'OR'
            ? rule.conditions.some((cond) => this.evaluateLeaf(cond, context))
            : rule.conditions.every((cond) => this.evaluateLeaf(cond, context)))
        if (!matched) continue

        const match = this.makeMatch(rule, ring as RingLevel)
        allMatched.push(match)

        // ALLOW / REQUEST_HUMAN / CORRECT: accumulate but keep evaluating
        if (match.decision === 'ALLOW' || match.decision === 'REQUEST_HUMAN' || match.decision === 'CORRECT') {
          if (finalDecision === 'PASS') {
            finalDecision = match.decision
          }
          if (match.instruction && match.decision === 'ALLOW') {
            finalInstruction = finalInstruction
              ? `${finalInstruction}; ${match.instruction}`
              : match.instruction
          }
          if (match.reason && match.decision === 'REQUEST_HUMAN') {
            finalReason = match.reason
            finalExplanation = match.explanation
          }
          if (match.correction && match.decision === 'CORRECT') {
            finalCorrection = match.correction
            finalExplanation = match.explanation
          }
          continue // keep evaluating for potential DENY rules
        }

        // DENY/HALT: win immediately
        finalDecision = match.decision
        finalReason = match.reason
        finalInstruction = match.instruction
        finalCorrection = match.correction
        finalExplanation = match.explanation
        finalAlternative = match.alternative

        // Ring 0 BLOCK/HALT: short-circuit all further evaluation
        if (ring === 0 && (match.decision === 'EMERGENCY_HALT' || match.decision === 'DENY')) {
          return {
            decision: finalDecision,
            matchedRules: allMatched,
            primaryReason: finalReason ?? `${finalDecision} triggered by Ring 0 rule`,
            primaryExplanation: finalExplanation,
            primaryAlternative: finalAlternative,
            totalEvaluated: enabled.length,
            totalMatched: allMatched.length,
          }
        }

        // For guard rules with override: short-circuit (don't keep evaluating this ring)
        if (rule.override) break

        break // DENY/HALT stops evaluation in this ring
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
      primaryExplanation: finalExplanation,
      primaryAlternative: finalAlternative,
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
      explanation: rule.action.explanation,
      alternative: rule.action.alternative,
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
  // SPEC §5: field/operator/value evaluation
  // ============================================

  private evaluateLeaf(cond: RuleCondition, context: Record<string, unknown>): boolean {
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
        const search = String(cond.value)
        if (typeof raw === 'object' && raw !== null) {
          return this.deepContains(raw as Record<string, unknown>, search)
        }
        return String(raw ?? '').includes(search)
      }
      case 'not_contains': {
        const search = String(cond.value)
        if (typeof raw === 'object' && raw !== null) {
          return !this.deepContains(raw as Record<string, unknown>, search)
        }
        return !String(raw ?? '').includes(search)
      }
      case 'match': {
        try {
          const re = new RegExp(cond.value as string)
          // When matching against a complex object, recursively search all string values
          if (typeof raw === 'object' && raw !== null) {
            return this.deepMatch(raw as Record<string, unknown>, re)
          }
          return re.test(String(raw ?? ''))
        } catch {
          return false
        }
      }
      case 'exists': return raw !== undefined && raw !== null
      case 'not_exists': return raw === undefined || raw === null
      default: return false
    }
  }

  /** Recursively search all string values in an object for a regex match */
  private deepMatch(obj: Record<string, unknown>, re: RegExp): boolean {
    for (const v of Object.values(obj)) {
      if (typeof v === 'string') {
        if (re.test(v)) return true
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        if (this.deepMatch(v as Record<string, unknown>, re)) return true
      }
    }
    return false
  }

  /** Recursively search all string values in an object for a substring */
  private deepContains(obj: Record<string, unknown>, search: string): boolean {
    for (const v of Object.values(obj)) {
      if (typeof v === 'string') {
        if (v.includes(search)) return true
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        if (this.deepContains(v as Record<string, unknown>, search)) return true
      }
    }
    return false
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
