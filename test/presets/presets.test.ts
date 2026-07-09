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
import { engineeringRules } from '../../src/presets/engineering/all.js'

const allRules = [...codingRules, ...allWritingRules, ...designRules, ...engineeringRules]

describe('Preset Rules', () => {
  const allCodingRules = codingRules
  const allDesignRules = designRules
  const allEngineeringRules = engineeringRules

  it('has exactly 30 preset rules', () => {
    expect(allRules).toHaveLength(30)
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

  it('engineering has 10 rules', () => {
    expect(allEngineeringRules).toHaveLength(10)
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

  // ============================================
  // Engineering rule integrity
  // ============================================

  describe('engineering rules integrity', () => {
    it('all engineering rules have unique IDs', () => {
      const ids = allEngineeringRules.map((r) => r.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(allEngineeringRules.length)
    })

    it('all engineering rules have required fields', () => {
      for (const rule of allEngineeringRules) {
        expect(rule.id).toBeTruthy()
        expect(rule.name).toBeTruthy()
        expect(rule.description).toBeTruthy()
        expect(rule.action.decision).toBeTruthy()
        expect(rule.priority).toBeGreaterThan(0)
      }
    })

    it('all engineering rules are enabled', () => {
      for (const rule of allEngineeringRules) {
        expect(rule.enabled).toBe(true)
      }
    })

    it('engineering DENY rules have a reason', () => {
      const denyRules = allEngineeringRules.filter((r) => r.action.decision === 'DENY')
      expect(denyRules.length).toBeGreaterThan(0)
      for (const rule of denyRules) {
        expect(rule.action.reason).toBeTruthy()
      }
    })

    it('engineering override rules have override=true', () => {
      const overrideRules = allEngineeringRules.filter((r) => r.override)
      expect(overrideRules.length).toBeGreaterThan(0)
      for (const rule of overrideRules) {
        expect(rule.override).toBe(true)
      }
    })

    it('EN-006 no_powershell_setcontent is DENY with always-match', () => {
      const rule = allEngineeringRules.find((r) => r.id === 'EN-006')
      expect(rule).toBeDefined()
      expect(rule!.action.decision).toBe('DENY')
      expect(rule!.conditions).toHaveLength(0) // always matches
    })

    it('EN-008 no_shortcut is DENY without override', () => {
      const rule = allEngineeringRules.find((r) => r.id === 'EN-008')
      expect(rule).toBeDefined()
      expect(rule!.action.decision).toBe('DENY')
      expect(rule!.override).toBeUndefined()
    })

    it('EN-001 honesty_with_henry is ALLOW without override', () => {
      const rule = allEngineeringRules.find((r) => r.id === 'EN-001')
      expect(rule).toBeDefined()
      expect(rule!.action.decision).toBe('ALLOW')
      expect(rule!.override).toBeUndefined()
      expect(rule!.priority).toBe(1)
    })
  })
})
