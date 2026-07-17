/**
 * ERDL MCP Server — List Rules Tool Tests
 *
 * Tests erdl_list_rules handler: all rules, category filter, empty filter,
 * invalid input, structuredContent.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-17
 * @license MIT
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { listRulesHandler } from '../../src/tools/list-rules.js'
import { ruleStore } from '../../src/engine/rule-store.js'

beforeAll(async () => {
  await ruleStore.load()
})

describe('erdl_list_rules', () => {
  // ============================================
  // Happy Path
  // ============================================

  describe('list all rules', () => {
    it('returns all rules when no category specified', async () => {
      const result = await listRulesHandler({})
      expect(result.content[0].type).toBe('text')
      const text = result.content[0].text as string
      expect(text).toContain('ERDL')
      expect(result.structuredContent.count).toBeGreaterThan(0)
    })

    it('returns all rules when category is "all"', async () => {
      const result = await listRulesHandler({ category: 'all' })
      expect(result.structuredContent.count).toBeGreaterThan(0)
    })
  })

  describe('filter by category', () => {
    it('returns only coding rules when category is "coding"', async () => {
      const result = await listRulesHandler({ category: 'coding' })
      const rules = result.structuredContent.rules as any[]
      for (const r of rules) {
        expect(r.category).toBe('coding')
      }
    })

    it('returns only engineering rules', async () => {
      const result = await listRulesHandler({ category: 'engineering' })
      const rules = result.structuredContent.rules as any[]
      for (const r of rules) {
        expect(r.category).toBe('engineering')
      }
    })

    it('returns only security rules', async () => {
      const result = await listRulesHandler({ category: 'security' })
      const rules = result.structuredContent.rules as any[]
      for (const r of rules) {
        expect(r.category).toBe('security')
      }
    })
  })

  // ============================================
  // Invalid Input
  // ============================================

  describe('invalid input', () => {
    it('returns error for non-string category', async () => {
      const result = await listRulesHandler({ category: 123 as unknown as string })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid input')
    })
  })

  // ============================================
  // Structured Content
  // ============================================

  describe('structuredContent', () => {
    it('includes count, categories, and rules array', async () => {
      const result = await listRulesHandler({})
      expect(result.structuredContent).toHaveProperty('count')
      expect(result.structuredContent).toHaveProperty('categories')
      expect(result.structuredContent).toHaveProperty('rules')
      expect(Array.isArray(result.structuredContent.rules)).toBe(true)
    })

    it('each rule has id, name, category, enabled, priority', async () => {
      const result = await listRulesHandler({})
      const rules = result.structuredContent.rules as any[]
      const first = rules[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('category')
      expect(first).toHaveProperty('enabled')
      expect(first).toHaveProperty('priority')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('empty result for non-existent category', async () => {
      const result = await listRulesHandler({ category: 'compliance' })
      // English i18n default — 'No rules loaded yet'
      expect(result.content[0].text).toContain('No rules loaded')
      expect(result.structuredContent.count).toBe(0)
    })

    it('custom category works', async () => {
      const result = await listRulesHandler({ category: 'custom' })
      expect(result.isError).toBeFalsy()
    })
  })
})
