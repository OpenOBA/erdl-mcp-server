/**
 * ERDL MCP Server — Rule Evaluator
 *
 * Evaluates rules against agent intent and context.
 * Adapted from openoba-starter erdl-rule-engine.ts.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import type { RuleCondition, RuleDefinition, RuleMatch, EvaluationResult } from './rule-definition.js'

export class Evaluator {
  /**
   * Evaluate all enabled rules against the given intent and context.
   *
   * @returns EvaluationResult with all matched rules and overall decision.
   */
  evaluate(rules: RuleDefinition[], intent: string, context: Record<string, unknown>): EvaluationResult {
    const enabled = rules.filter((r) => r.enabled)
    const sorted = [...enabled].sort((a, b) => a.priority - b.priority)

    const matchedRules: RuleMatch[] = []

    for (const rule of sorted) {
      if (this.matchesConditions(rule.conditions, intent, context)) {
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          decision: rule.action.decision,
          instruction: rule.action.instruction,
          reason: rule.action.reason,
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

    // Check if any rule denies
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

    // All matches are ALLOW — use highest-priority instruction
    const best = matchedRules[0]
    return {
      decision: 'ALLOW',
      matchedRules,
      primaryInstruction: best.instruction,
      totalEvaluated: sorted.length,
      totalMatched: matchedRules.length,
    }
  }

  /**
   * Simulate a rule against a synthetic scenario (no side effects).
   */
  simulate(rule: RuleDefinition, intent: string, context: Record<string, unknown>): RuleMatch | null {
    if (!rule.enabled) return null

    const matched = this.matchesConditions(rule.conditions, intent, context)
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

  /**
   * Check if any condition in the rule matches.
   * Multiple conditions = ALL must match (AND logic for simplicity).
   */
  private matchesConditions(
    conditions: RuleCondition[],
    intent: string,
    context: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) return true

    return conditions.every((cond) => this.matchSingle(cond, intent, context))
  }

  private matchSingle(cond: RuleCondition, intent: string, context: Record<string, unknown>): boolean {
    switch (cond.kind) {
      case 'intent_contains':
        if (!cond.keywords || cond.keywords.length === 0) return false
        return cond.keywords.some((kw) => intent.toLowerCase().includes(kw.toLowerCase()))

      case 'intent_matches':
        if (!cond.pattern) return false
        try {
          return new RegExp(cond.pattern, 'i').test(intent)
        } catch {
          return false
        }

      case 'context_matches':
        if (!cond.field || !cond.value) return false
        const fieldValue = this.resolveField(cond.field, context)
        const strValue = String(fieldValue ?? '')
        return strValue.toLowerCase().includes(cond.value.toLowerCase())

      default:
        return false
    }
  }

  private resolveField(field: string, context: Record<string, unknown>): unknown {
    return field.split('.').reduce<unknown>((obj, key) => {
      if (obj === null || obj === undefined || typeof obj !== 'object') return undefined
      return (obj as Record<string, unknown>)[key]
    }, context)
  }
}
