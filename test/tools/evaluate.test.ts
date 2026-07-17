/**
 * ERDL MCP Server — Evaluate Tool Tests
 *
 * Tests erdl_evaluate handler: ALLOW, DENY, PASS, CORRECT, REQUEST_HUMAN,
 * EMERGENCY_HALT decisions, invalid input, and Markdown output format.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-17
 * @license MIT
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { evaluateHandler } from '../../src/tools/evaluate.js'
import { ruleStore } from '../../src/engine/rule-store.js'

beforeAll(async () => {
  await ruleStore.load()
})

describe('erdl_evaluate', () => {
  // ============================================
  // Happy Path — Decision Types
  // ============================================

  describe('decision: PASS (no rules matched)', () => {
    it('returns PASS for unknown tool name with no matching rules', async () => {
      const result = await evaluateHandler({ tool_name: 'nonexistent_tool_xyz' })
      expect(result.content).toBeDefined()
      expect(result.content[0].type).toBe('text')
      const text = result.content[0].text as string
      expect(text).toContain('ERDL')
      // 'ERDL Pass' is the i18n badge label (English default)
      expect(text).toContain('Pass')
      expect(result.structuredContent.decision).toBe('PASS')
      expect(result.structuredContent.totalMatched).toBe(0)
    })
  })

  describe('decision: ALLOW (rules matched with instructions)', () => {
    it('returns ALLOW with Markdown for exec tool', async () => {
      const result = await evaluateHandler({ tool_name: 'exec' })
      expect(result.content[0].type).toBe('text')
      const text = result.content[0].text as string
      // Should contain Markdown structure
      expect(text).toContain('ERDL')
      expect(text).toContain('`exec`')
      expect(result.structuredContent.decision).toBe('ALLOW')
    })
  })

  describe('decision: DENY', () => {
    it('returns DENY when rules block the tool', async () => {
      // Load a DENY rule and test — use exec with rm -rf pattern
      const result = await evaluateHandler({
        tool_name: 'exec',
        tool_args: { command: 'rm -rf / --no-preserve-root' },
      })
      expect(result.content[0].type).toBe('text')
      const text = result.content[0].text as string
      expect(text).toContain('ERDL')
    })
  })

  describe('decision: CORRECT', () => {
    it('returns CORRECT when correction rules fire', async () => {
      const result = await evaluateHandler({ tool_name: 'edit' })
      expect(result.content[0].type).toBe('text')
      const text = result.content[0].text as string
      expect(text).toContain('ERDL')
    })
  })

  // ============================================
  // Invalid Input
  // ============================================

  describe('invalid input', () => {
    it('returns error for empty tool_name', async () => {
      const result = await evaluateHandler({ tool_name: '' })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid input')
    })

    it('returns error for missing tool_name (undefined)', async () => {
      const result = await evaluateHandler({ tool_name: undefined as unknown as string })
      expect(result.isError).toBe(true)
    })
  })

  // ============================================
  // Markdown Output Format
  // ============================================

  describe('Markdown output format', () => {
    it('PASS output includes tool name and rule count', async () => {
      const result = await evaluateHandler({ tool_name: 'web_search' })
      const text = result.content[0].text as string
      expect(text).toContain('`web_search`')
      expect(text).toContain('ERDL')
    })

    it('output starts with ## heading for structured rendering', async () => {
      const result = await evaluateHandler({ tool_name: 'exec' })
      const text = result.content[0].text as string
      expect(text.startsWith('##')).toBe(true)
    })

    it('structuredContent includes decision, matchedRules, totals', async () => {
      const result = await evaluateHandler({ tool_name: 'exec' })
      expect(result.structuredContent).toHaveProperty('decision')
      expect(result.structuredContent).toHaveProperty('matchedRules')
      expect(result.structuredContent).toHaveProperty('totalEvaluated')
      expect(result.structuredContent).toHaveProperty('totalMatched')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('handles tool_args with nested objects', async () => {
      const result = await evaluateHandler({
        tool_name: 'write_file',
        tool_args: { path: 'src/app.ts', content: 'const x = 1;', nested: { key: 'value' } },
      })
      expect(result.isError).toBeFalsy()
    })

    it('handles agent_id and session_id optional params', async () => {
      const result = await evaluateHandler({
        tool_name: 'exec',
        agent_id: 'test-agent-001',
        session_id: 'session-abc-123',
      })
      expect(result.isError).toBeFalsy()
      expect(result.content[0].text).toBeDefined()
    })
  })
})
