/**
 * ERDL MCP Server — Explain Tool Tests
 *
 * Tests erdl_explain handler: decision trail output, matched/unmatched rules,
 * invalid input, and Markdown format.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-17
 * @license MIT
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { explainHandler } from '../../src/tools/explain.js'
import { ruleStore } from '../../src/engine/rule-store.js'

beforeAll(async () => {
  await ruleStore.load()
})

describe('erdl_explain', () => {
  // ============================================
  // Happy Path
  // ============================================

  describe('decision trail output', () => {
    it('returns Markdown decision trail for a tool call', async () => {
      const result = await explainHandler({ tool_name: 'exec' })
      expect(result.content[0].type).toBe('text')
      const text = result.content[0].text as string
      expect(text).toContain('决策链路')
      expect(text).toContain('`exec`')
      expect(text).toContain('规则总数')
    })

    it('includes matched and unmatched rule counts', async () => {
      const result = await explainHandler({ tool_name: 'write_file' })
      const text = result.content[0].text as string
      // Should show total rules, matched count, skipped count
      expect(text).toContain('条')
    })

    it('shows final decision', async () => {
      const result = await explainHandler({ tool_name: 'exec' })
      const text = result.content[0].text as string
      expect(text).toContain('最终判定')
      expect(result.structuredContent.decision).toBeDefined()
    })

    it('groups matched rules by decision type', async () => {
      const result = await explainHandler({ tool_name: 'exec' })
      const text = result.content[0].text as string
      // Should have decision badges in the output
      expect(text).toMatch(/✅|🛑|🔧|👤/)
    })
  })

  // ============================================
  // Invalid Input
  // ============================================

  describe('invalid input', () => {
    it('returns error for empty tool_name', async () => {
      const result = await explainHandler({ tool_name: '' })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid input')
    })

    it('returns error for missing tool_name', async () => {
      const result = await explainHandler({ tool_name: undefined as unknown as string })
      expect(result.isError).toBe(true)
    })
  })

  // ============================================
  // Structured Content
  // ============================================

  describe('structuredContent', () => {
    it('includes tool_name, decision, totalChecked', async () => {
      const result = await explainHandler({ tool_name: 'exec' })
      expect(result.structuredContent).toHaveProperty('tool_name', 'exec')
      expect(result.structuredContent).toHaveProperty('decision')
      expect(result.structuredContent).toHaveProperty('totalChecked')
      expect(result.structuredContent).toHaveProperty('matched')
      expect(result.structuredContent).toHaveProperty('skipped')
      expect((result.structuredContent as any).totalChecked).toBeGreaterThan(0)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('handles tool with tool_args', async () => {
      const result = await explainHandler({
        tool_name: 'write_file',
        tool_args: { path: 'test.ts', content: 'console.log("hello")' },
      })
      expect(result.isError).toBeFalsy()
    })

    it('matched + unmatched sum equals total', async () => {
      const result = await explainHandler({ tool_name: 'exec' })
      const sc = result.structuredContent as any
      expect(sc.matched.length + sc.skipped.length).toBe(sc.totalChecked)
    })
  })
})
