/**
 * ERDL MCP Server — Evaluator Tests
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { describe, it, expect } from 'vitest'
import { Evaluator } from '../../src/engine/evaluator.js'
import type { RuleDefinition } from '../../src/engine/rule-definition.js'

const evaluator = new Evaluator()

function makeRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: 'TEST-001',
    name: 'Test Rule',
    description: 'A test rule',
    category: 'custom',
    triggers: ['test_trigger'],
    conditions: [{ kind: 'intent_contains', keywords: ['any'] }],
    action: { decision: 'DENY', reason: 'No any types allowed' },
    priority: 10,
    enabled: true,
    version: 1,
    ...overrides,
  }
}

describe('Evaluator', () => {
  describe('intent_contains matching', () => {
    it('matches keyword in intent', () => {
      const rules = [makeRule({ conditions: [{ kind: 'intent_contains', keywords: ['typescript'] }] })]
      const result = evaluator.evaluate(rules, 'write typescript code', {})
      expect(result.decision).toBe('DENY')
      expect(result.matchedRules).toHaveLength(1)
    })

    it('does not match when keyword absent', () => {
      const rules = [makeRule({ conditions: [{ kind: 'intent_contains', keywords: ['typescript'] }] })]
      const result = evaluator.evaluate(rules, 'write python code', {})
      expect(result.decision).toBe('PASS')
    })

    it('matches case-insensitive', () => {
      const rules = [makeRule({ conditions: [{ kind: 'intent_contains', keywords: ['TypeScript'] }] })]
      const result = evaluator.evaluate(rules, 'write typescript code', {})
      expect(result.decision).toBe('DENY')
    })

    it('matches any keyword (OR within single condition)', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'intent_contains', keywords: ['react', 'vue', 'angular'] }],
        action: { decision: 'ALLOW', instruction: 'Use framework best practices' },
      })]
      const result = evaluator.evaluate(rules, 'write vue component', {})
      expect(result.decision).toBe('ALLOW')
    })
  })

  describe('intent_matches matching', () => {
    it('matches regex pattern', () => {
      const rules = [makeRule({ conditions: [{ kind: 'intent_matches', pattern: 'write\\.(ts|tsx)' }] })]
      const result = evaluator.evaluate(rules, 'edit write.ts file', {})
      expect(result.decision).toBe('DENY')
    })

    it('does not match wrong pattern', () => {
      const rules = [makeRule({ conditions: [{ kind: 'intent_matches', pattern: 'write\\.(ts|tsx)' }] })]
      const result = evaluator.evaluate(rules, 'edit write.py file', {})
      expect(result.decision).toBe('PASS')
    })
  })

  describe('context_matches matching', () => {
    it('matches context field value', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'file', value: '.ts' }],
      })]
      const result = evaluator.evaluate(rules, 'edit file', { file: 'app.ts' })
      expect(result.decision).toBe('DENY')
    })

    it('does not match wrong context value', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'file', value: '.ts' }],
      })]
      const result = evaluator.evaluate(rules, 'edit file', { file: 'app.py' })
      expect(result.decision).toBe('PASS')
    })
  })

  describe('priority ordering', () => {
    it('higher priority DENY wins over lower priority ALLOW', () => {
      const rules: RuleDefinition[] = [
        makeRule({ id: 'LOW', priority: 100, action: { decision: 'ALLOW', instruction: 'ok' } }),
        makeRule({ id: 'HIGH', priority: 1, action: { decision: 'DENY', reason: 'blocked' } }),
      ]
      const result = evaluator.evaluate(rules, 'test with any keyword', {})
      expect(result.decision).toBe('DENY')
      expect(result.primaryReason).toBe('blocked')
    })

    it('first matched ALLOW instruction is used', () => {
      const rules: RuleDefinition[] = [
        makeRule({ id: 'FIRST', priority: 1, action: { decision: 'ALLOW', instruction: 'first instruction' } }),
        makeRule({ id: 'SECOND', priority: 2, action: { decision: 'ALLOW', instruction: 'second instruction' } }),
      ]
      const result = evaluator.evaluate(rules, 'test with any keyword', {})
      expect(result.decision).toBe('ALLOW')
      expect(result.primaryInstruction).toBe('first instruction')
    })
  })

  describe('disabled rules', () => {
    it('skips disabled rules', () => {
      const rules = [makeRule({ enabled: false })]
      const result = evaluator.evaluate(rules, 'test with any keyword', {})
      expect(result.decision).toBe('PASS')
      expect(result.totalMatched).toBe(0)
    })
  })

  describe('multiple conditions', () => {
    it('all conditions must match (AND logic)', () => {
      const rules: RuleDefinition[] = [{
        ...makeRule(),
        conditions: [
          { kind: 'intent_contains', keywords: ['typescript'] },
          { kind: 'context_matches', field: 'file', value: '.ts' },
        ],
      }]
      const result = evaluator.evaluate(rules, 'write typescript code', { file: 'app.ts' })
      expect(result.decision).toBe('DENY')
      expect(result.matchedRules).toHaveLength(1)
    })

    it('fails if any condition fails', () => {
      const rules: RuleDefinition[] = [{
        ...makeRule(),
        conditions: [
          { kind: 'intent_contains', keywords: ['typescript'] },
          { kind: 'context_matches', field: 'file', value: '.ts' },
        ],
      }]
      const result = evaluator.evaluate(rules, 'write typescript code', { file: 'app.py' })
      expect(result.decision).toBe('PASS')
    })
  })

  describe('empty/no rules', () => {
    it('returns PASS for empty rule set', () => {
      const result = evaluator.evaluate([], 'anything', {})
      expect(result.decision).toBe('PASS')
    })
  })
})
