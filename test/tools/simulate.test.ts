/**
 * ERDL MCP Server — Simulate Tool Tests
 *
 * Tests erdl_simulate handler: scenario generation, correct predictions,
 * invalid input, structuredContent.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-17
 * @license MIT
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { simulateHandler } from '../../src/tools/simulate.js'
import { ruleStore } from '../../src/engine/rule-store.js'

beforeAll(async () => {
  await ruleStore.load()
})

describe('erdl_simulate', () => {
  // ============================================
  // Happy Path — DENY rules
  // ============================================

  describe('simulate DENY rule', () => {
    it('generates 3 scenarios for a DENY rule', async () => {
      const result = await simulateHandler({
        ruleName: 'block_dangerous_commands',
        category: 'security',
        keywords: ['exec'],
        decision: 'DENY',
        instruction: 'Dangerous commands are blocked',
      })
      expect(result.isError).toBeFalsy()
      const text = result.content[0].text as string
      expect(text).toContain('Rule Simulation')
      expect(text).toContain('block_dangerous_commands')
      expect(result.structuredContent.totalScenarios).toBe(3)
    })

    it('correctly predicts DENY for matched keyword', async () => {
      const result = await simulateHandler({
        ruleName: 'block_exec',
        category: 'security',
        keywords: ['exec'],
        decision: 'DENY',
        instruction: 'exec is blocked',
      })
      const results = result.structuredContent.results as any[]
      // First scenario: should match and be DENY
      const matchScenario = results.find((r: any) => r.description.includes('BLOCK'))
      expect(matchScenario).toBeDefined()
      if (matchScenario) {
        expect(matchScenario.correct).toBe(true)
        expect(matchScenario.decision).toBe('DENY')
      }
    })

    it('correctly predicts NONE for unmatched keyword', async () => {
      const result = await simulateHandler({
        ruleName: 'block_exec_only',
        category: 'security',
        keywords: ['exec'],
        decision: 'DENY',
        instruction: 'exec is blocked',
      })
      const results = result.structuredContent.results as any[]
      // Second scenario: different tool should NOT match
      const noMatchScenario = results.find((r: any) => r.description.includes('NOT block'))
      expect(noMatchScenario).toBeDefined()
      if (noMatchScenario) {
        expect(noMatchScenario.decision).toBe('NONE')
      }
    })
  })

  // ============================================
  // Happy Path — ALLOW rules
  // ============================================

  describe('simulate ALLOW rule', () => {
    it('generates 3 scenarios for an ALLOW rule', async () => {
      const result = await simulateHandler({
        ruleName: 'enforce_tailwind',
        category: 'design',
        keywords: ['write_file', 'edit'],
        decision: 'ALLOW',
        instruction: 'Use Tailwind CSS classes',
      })
      expect(result.structuredContent.totalScenarios).toBe(3)
    })
  })

  // ============================================
  // Invalid Input
  // ============================================

  describe('invalid input', () => {
    it('returns error for empty ruleName', async () => {
      const result = await simulateHandler({
        ruleName: '',
        category: 'coding',
        keywords: ['exec'],
        decision: 'DENY',
        instruction: 'test',
      })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid input')
    })
  })

  // ============================================
  // Structured Content
  // ============================================

  describe('structuredContent', () => {
    it('includes ruleName, results, passCount, totalScenarios', async () => {
      const result = await simulateHandler({
        ruleName: 'test_rule_struct',
        category: 'coding',
        keywords: ['exec'],
        decision: 'DENY',
        instruction: 'test',
      })
      expect(result.structuredContent).toHaveProperty('ruleName', 'test_rule_struct')
      expect(result.structuredContent).toHaveProperty('results')
      expect(result.structuredContent).toHaveProperty('passCount')
      expect(result.structuredContent).toHaveProperty('totalScenarios', 3)
      expect(result.structuredContent).toHaveProperty('recommendation')
    })

    it('recommendation is "ready" when all scenarios pass', async () => {
      const result = await simulateHandler({
        ruleName: 'exact_match_rule',
        category: 'coding',
        keywords: ['exec'],
        decision: 'DENY',
        instruction: 'test',
      })
      const passCount = result.structuredContent.passCount as number
      const total = result.structuredContent.totalScenarios as number
      if (passCount === total) {
        expect(result.structuredContent.recommendation).toBe('ready')
      }
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('handles multiple keywords', async () => {
      const result = await simulateHandler({
        ruleName: 'multi_keyword_rule',
        category: 'coding',
        keywords: ['exec', 'write_file', 'edit'],
        decision: 'DENY',
        instruction: 'multiple tools blocked',
      })
      expect(result.isError).toBeFalsy()
      expect(result.structuredContent.totalScenarios).toBe(3)
    })

    it('handles custom matchField', async () => {
      const result = await simulateHandler({
        ruleName: 'field_rule',
        category: 'coding',
        keywords: ['rm -rf'],
        decision: 'DENY',
        instruction: 'dangerous command',
        matchField: 'tool.args.command',
      })
      expect(result.isError).toBeFalsy()
    })
  })
})
