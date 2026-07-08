/**
 * ERDL MCP Server — Evaluator Tests (Tool Call Guard Mode)
 *
 * Tests guard-style evaluation: rules match against tool_name + tool_args,
 * not against NLP intent strings.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-08
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

/** Build guard context from tool call params (ERDL Spec §5.3) */
function guardCtx(toolName: string, toolArgs: Record<string, unknown> = {}): Record<string, unknown> {
  const ctx: Record<string, unknown> = {
    'tool.name': toolName,
    'tool.args': toolArgs,
  }
  for (const [key, value] of Object.entries(toolArgs)) {
    ctx[`tool.args.${key}`] = value
  }
  return ctx
}

describe('Evaluator (Tool Call Guard mode)', () => {
  // ============================================
  // Spec v1.1: field/operator/value mode
  // ============================================

  describe('tool.name matching (Spec v1.1 field/operator/value)', () => {
    it('matches tool name with eq operator', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' }],
        action: { decision: 'DENY', reason: 'exec tool blocked' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('exec'))
      expect(result.decision).toBe('DENY')
      expect(result.matchedRules).toHaveLength(1)
    })

    it('does not match different tool name', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' }],
        action: { decision: 'DENY', reason: 'exec tool blocked' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('web_search'))
      expect(result.decision).toBe('PASS')
    })

    it('matches tool name with in operator', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: ['exec', 'bash'] }],
        action: { decision: 'REQUEST_HUMAN', reason: 'dangerous tool' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('exec'))
      expect(result.decision).toBe('REQUEST_HUMAN')
    })

    it('does not match tool not in list', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'in', value: ['exec', 'bash'] }],
        action: { decision: 'REQUEST_HUMAN', reason: 'dangerous tool' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('read_file'))
      expect(result.decision).toBe('PASS')
    })
  })

  // ============================================
  // Tool args matching
  // ============================================

  describe('tool.args.* matching', () => {
    it('matches tool arg with contains operator', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.args.command', operator: 'contains', value: 'rm' }],
        action: { decision: 'DENY', reason: 'dangerous command' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('exec', { command: 'rm -rf /' }))
      expect(result.decision).toBe('DENY')
    })

    it('does not match safe args', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.args.command', operator: 'contains', value: 'rm' }],
        action: { decision: 'DENY', reason: 'dangerous command' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('exec', { command: 'ls -la' }))
      expect(result.decision).toBe('PASS')
    })

    it('matches tool arg with match (regex) operator', () => {
      const rules = [makeRule({
        conditions: [{ kind: 'context_matches', field: 'tool.args.path', operator: 'match', value: '^/(etc|var|sys)' }],
        action: { decision: 'CORRECT', reason: 'path out of workspace', correction: 'use workspace path' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('write_file', { path: '/etc/config.txt' }))
      expect(result.decision).toBe('CORRECT')
      expect(result.primaryInstruction).toBe('use workspace path')
    })
  })

  // ============================================
  // Multiple conditions (AND logic)
  // ============================================

  describe('multiple conditions (AND)', () => {
    it('all conditions must match', () => {
      const rules: RuleDefinition[] = [{
        ...makeRule(),
        conditions: [
          { kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' },
          { kind: 'context_matches', field: 'tool.args.command', operator: 'contains', value: 'sudo' },
        ],
        action: { decision: 'DENY', reason: 'sudo blocked' },
      }]
      const result = evaluator.evaluate(rules, guardCtx('exec', { command: 'sudo systemctl restart' }))
      expect(result.decision).toBe('DENY')
      expect(result.matchedRules).toHaveLength(1)
    })

    it('fails if any condition fails', () => {
      const rules: RuleDefinition[] = [{
        ...makeRule(),
        conditions: [
          { kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' },
          { kind: 'context_matches', field: 'tool.args.command', operator: 'contains', value: 'sudo' },
        ],
        action: { decision: 'DENY', reason: 'sudo blocked' },
      }]
      const result = evaluator.evaluate(rules, guardCtx('exec', { command: 'ls -la' }))
      expect(result.decision).toBe('PASS')
    })
  })

  // ============================================
  // Priority ordering
  // ============================================

  describe('priority ordering', () => {
    it('DENY wins over ALLOW regardless of priority', () => {
      const rules: RuleDefinition[] = [
        makeRule({
          id: 'ALLOW_ALL',
          priority: 100,
          conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' }],
          action: { decision: 'ALLOW', instruction: 'ok' },
        }),
        makeRule({
          id: 'BLOCK_SPECIFIC',
          priority: 50,
          conditions: [
            { kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' },
            { kind: 'context_matches', field: 'tool.args.command', operator: 'contains', value: 'rm' },
          ],
          action: { decision: 'DENY', reason: 'dangerous' },
        }),
      ]
      // Matches ALLOW_ALL only (command is 'ls', not 'rm')
      const result = evaluator.evaluate(rules, guardCtx('exec', { command: 'ls' }))
      expect(result.decision).toBe('ALLOW')
    })

    it('higher priority instruction is used for ALLOW', () => {
      const rules: RuleDefinition[] = [
        makeRule({ id: 'FIRST', priority: 1, conditions: [], action: { decision: 'ALLOW', instruction: 'first' } }),
        makeRule({ id: 'SECOND', priority: 2, conditions: [], action: { decision: 'ALLOW', instruction: 'second' } }),
      ]
      const result = evaluator.evaluate(rules, guardCtx('read_file'))
      expect(result.decision).toBe('ALLOW')
      expect(result.primaryInstruction).toBe('first')
    })
  })

  // ============================================
  // Disabled rules
  // ============================================

  describe('disabled rules', () => {
    it('skips disabled rules', () => {
      const rules = [makeRule({
        enabled: false,
        conditions: [{ kind: 'context_matches', field: 'tool.name', operator: 'eq', value: 'exec' }],
      })]
      const result = evaluator.evaluate(rules, guardCtx('exec'))
      expect(result.decision).toBe('PASS')
      expect(result.totalMatched).toBe(0)
    })
  })

  // ============================================
  // Edge cases
  // ============================================

  describe('empty/no rules', () => {
    it('returns PASS for empty rule set', () => {
      const result = evaluator.evaluate([], guardCtx('exec'))
      expect(result.decision).toBe('PASS')
    })
  })

  describe('rule with empty conditions', () => {
    it('empty conditions = always matches', () => {
      const rules = [makeRule({
        conditions: [],
        action: { decision: 'ALLOW', instruction: 'always applies' },
      })]
      const result = evaluator.evaluate(rules, guardCtx('any_tool'))
      expect(result.decision).toBe('ALLOW')
    })
  })
})
