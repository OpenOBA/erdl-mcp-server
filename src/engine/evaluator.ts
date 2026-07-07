/**
 * ERDL MCP Server — Rule Evaluator (ERDL Spec v1.1 compliant)
 *
 * Dual mode: Spec field/operator/value + legacy keyword matching.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import type { RuleDefinition, RuleCondition, EvaluationResult, RuleMatch } from './rule-definition.js'
import { SafeExpr } from './safe-expr.js'

const safeExpr = new SafeExpr()

export class Evaluator {
  evaluate(
    rules: RuleDefinition[],
    intent: string,
    context: Record<string, unknown>,
  ): EvaluationResult {
    const extendedCtx = { intent, ...context }
    const enabled = rules.filter((r) => r.enabled)
    const sorted = [...enabled].sort((a, b) => a.priority - b.priority)

    const matchedRules: RuleMatch[] = []

    for (const rule of sorted) {
      const matched = rule.conditions.length === 0 || rule.conditions.every((cond) => this.evaluateLeaf(cond, extendedCtx))
      if (matched) {
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          decision: rule.action.decision,
          instruction: rule.action.instruction,
          reason: rule.action.reason,
          ring: rule.action.ring,
          correction: rule.action.correction,
          priority: rule.priority,
        })
      }
    }

    if (matchedRules.length === 0) {
      return {
        decision: 'PASS',
        matchedRules: [],
        totalEvaluated: sorted.length,
        totalMatched: 0,
      }
    }

    const decisionPriority: Record<string, number> = {
      EMERGENCY_HALT: 0, DENY: 1, REQUEST_HUMAN: 2, CORRECT: 3, ALLOW: 4, PASS: 5,
    }
    const worst = matchedRules.reduce((a, b) =>
      decisionPriority[a.decision] < decisionPriority[b.decision] ? a : b,
    )

    if (worst.decision === 'EMERGENCY_HALT') {
      return {
        decision: 'EMERGENCY_HALT',
        matchedRules,
        primaryReason: worst.reason ?? 'Emergency halt triggered',
        totalEvaluated: sorted.length,
        totalMatched: matchedRules.length,
      }
    }

    const denied = matchedRules.find((r) => r.decision === 'DENY')
    if (denied) {
      return {
        decision: 'DENY',
        matchedRules,
        primaryReason: denied.reason ?? `Blocked by rule: ${denied.ruleName}`,
        totalEvaluated: sorted.length,
        totalMatched: matchedRules.length,
      }
    }

    const humanReq = matchedRules.find((r) => r.decision === 'REQUEST_HUMAN')
    if (humanReq) {
      return {
        decision: 'REQUEST_HUMAN',
        matchedRules,
        primaryReason: humanReq.reason ?? 'Human approval required',
        totalEvaluated: sorted.length,
        totalMatched: matchedRules.length,
      }
    }

    const correct = matchedRules.find((r) => r.decision === 'CORRECT')
    if (correct) {
      return {
        decision: 'CORRECT',
        matchedRules,
        primaryInstruction: correct.correction ?? correct.instruction ?? 'Correction applied',
        totalEvaluated: sorted.length,
        totalMatched: matchedRules.length,
      }
    }

    return {
      decision: 'ALLOW',
      matchedRules,
      primaryInstruction: matchedRules[0].instruction,
      totalEvaluated: sorted.length,
      totalMatched: matchedRules.length,
    }
  }

  simulate(
    rule: RuleDefinition,
    intent: string,
    context: Record<string, unknown>,
  ): RuleMatch | null {
    if (!rule.enabled) return null
    const ctx = { intent, ...context }
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
    return field.split('.').reduce<unknown>((obj, key) => {
      if (obj === null || obj === undefined || typeof obj !== 'object') return undefined
      return (obj as Record<string, unknown>)[key]
    }, context)
  }
}
