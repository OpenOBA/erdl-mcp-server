/**
 * ERDL MCP Server — Preset Rules Tests
 *
 * Validates all 20 preset rules for integrity.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { describe, it, expect } from 'vitest'
import { codingRules } from '../../src/presets/coding/all.js'
import { allWritingRules } from '../../src/presets/writing/all.js'
import { designRules } from '../../src/presets/design/all.js'

const allRules = [...codingRules, ...allWritingRules, ...designRules]

describe('Preset Rules', () => {
  const allCodingRules = codingRules
  const allDesignRules = designRules
  it('has exactly 20 preset rules', () => {
    expect(allRules).toHaveLength(20)
  })

  it('coding has 10 rules', () => {
    expect(allCodingRules).toHaveLength(10)
  })

  it('writing has 7 rules', () => {
    expect(allWritingRules).toHaveLength(7)
  })

  it('design has 3 rules', () => {
    expect(allDesignRules).toHaveLength(3)
  })

  it('all rules have unique IDs', () => {
    const ids = allRules.map((r) => r.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(allRules.length)
  })

  it('all rules have required fields', () => {
    for (const rule of allRules) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.description).toBeTruthy()
      expect(rule.category).toBeTruthy()
      expect(rule.action.decision).toBeTruthy()
      expect(rule.priority).toBeGreaterThan(0)
    }
  })

  it('all rules are enabled by default', () => {
    for (const rule of allRules) {
      expect(rule.enabled).toBe(true)
    }
  })

  it('coding rules use correct category', () => {
    for (const rule of allCodingRules) {
      expect(rule.category).toBe('coding')
    }
  })

  it('writing rules use correct category', () => {
    for (const rule of allWritingRules) {
      expect(rule.category).toBe('writing')
    }
  })

  it('design rules use correct category', () => {
    for (const rule of allDesignRules) {
      expect(rule.category).toBe('design')
    }
  })

  it('all conditions are well-formed', () => {
    for (const rule of allRules) {
      for (const cond of rule.conditions) {
        expect(cond.kind).toBeTruthy()
        if (cond.kind === 'context_matches') {
          expect(cond.field).toBeTruthy()
          expect(cond.operator).toBeTruthy()
        }
      }
    }
  })

  it('DENY rules have a reason', () => {
    const denyRules = allRules.filter((r) => r.action.decision === 'DENY')
    for (const rule of denyRules) {
      expect(rule.action.reason).toBeTruthy()
    }
  })

  it('ALLOW rules have an instruction', () => {
    const allowRules = allRules.filter((r) => r.action.decision === 'ALLOW')
    for (const rule of allowRules) {
      expect(rule.action.instruction).toBeTruthy()
    }
  })
})
