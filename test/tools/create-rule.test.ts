/**
 * ERDL MCP Server — Create Rule Tool Tests
 *
 * Tests erdl_create_rule handler: create ALLOW rule, create DENY rule,
 * invalid input validation, structuredContent.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-17
 * @license MIT
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createRuleHandler } from '../../src/tools/create-rule.js'
import { ruleStore } from '../../src/engine/rule-store.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

beforeAll(async () => {
  await ruleStore.load()
})

describe('erdl_create_rule', () => {
  // ============================================
  // Happy Path
  // ============================================

  describe('create ALLOW rule', () => {
    it('creates a rule with ALLOW decision', async () => {
      const result = await createRuleHandler({
        naturalLanguage: 'Always add JSDoc comments to public functions',
        category: 'coding',
        decision: 'ALLOW',
        instruction: 'Add JSDoc comments',
        keywords: ['write_file', 'edit'],
      })
      expect(result.isError).toBeFalsy()
      const text = result.content[0].text as string
      expect(text).toContain('Rule created')
      expect(result.structuredContent.status).toBe('created')
      expect(result.structuredContent.category).toBe('coding')
      expect(result.structuredContent.decision).toBe('ALLOW')
    })
  })

  describe('create DENY rule', () => {
    it('creates a rule with DENY decision', async () => {
      const result = await createRuleHandler({
        naturalLanguage: 'Never use console.log in production code',
        category: 'coding',
        decision: 'DENY',
        instruction: 'console.log is forbidden in production',
        keywords: ['write_file', 'edit'],
      })
      expect(result.isError).toBeFalsy()
      expect(result.content[0].text).toContain('Rule created')
      expect(result.structuredContent.decision).toBe('DENY')
    })
  })

  // ============================================
  // Invalid Input
  // ============================================

  describe('invalid input', () => {
    it('returns error for empty naturalLanguage', async () => {
      const result = await createRuleHandler({
        naturalLanguage: '',
        category: 'coding',
        decision: 'ALLOW',
        instruction: 'test',
      })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid input')
    })

    it('returns error for invalid category', async () => {
      const result = await createRuleHandler({
        naturalLanguage: 'test rule',
        category: 'invalid_category',
        decision: 'ALLOW',
        instruction: 'test',
      })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid category')
    })

    it('returns error for invalid decision', async () => {
      const result = await createRuleHandler({
        naturalLanguage: 'test rule',
        category: 'coding',
        decision: 'INVALID_DECISION',
        instruction: 'test',
      })
      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid decision')
    })
  })

  // ============================================
  // Structured Content
  // ============================================

  describe('structuredContent', () => {
    it('includes ruleId, name, status, filePath, category, decision', async () => {
      const result = await createRuleHandler({
        naturalLanguage: 'Use const instead of let when possible',
        category: 'coding',
        decision: 'CORRECT',
        instruction: 'Prefer const over let',
        keywords: ['write_file'],
      })
      expect(result.structuredContent).toHaveProperty('ruleId')
      expect(result.structuredContent).toHaveProperty('name')
      expect(result.structuredContent).toHaveProperty('status', 'created')
      expect(result.structuredContent).toHaveProperty('filePath')
      expect(result.structuredContent).toHaveProperty('category', 'coding')
      expect(result.structuredContent).toHaveProperty('decision', 'CORRECT')
    })
  })

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('handles long natural language descriptions', async () => {
      const longDesc = 'A'.repeat(200)
      const result = await createRuleHandler({
        naturalLanguage: longDesc,
        category: 'custom',
        decision: 'ALLOW',
        instruction: 'test',
      })
      expect(result.isError).toBeFalsy()
      // Name should be truncated at 60 chars
      expect((result.structuredContent as any).name.length).toBeLessThanOrEqual(60)
    })

    it('handles rule without keywords (empty conditions)', async () => {
      const result = await createRuleHandler({
        naturalLanguage: 'Always write clean code',
        category: 'writing',
        decision: 'ALLOW',
        instruction: 'Write clean, maintainable code',
      })
      expect(result.isError).toBeFalsy()
      expect(result.content[0].text).toContain('Rule created')
    })

    it('creates rule in different categories', async () => {
      const categories = ['security', 'testing', 'engineering', 'writing', 'design', 'accessibility']
      for (const cat of categories) {
        const result = await createRuleHandler({
          naturalLanguage: `Test rule for ${cat}`,
          category: cat,
          decision: 'ALLOW',
          instruction: 'test',
        })
        expect(result.isError).toBeFalsy()
        expect(result.structuredContent.category).toBe(cat)
      }
    })
  })
})
