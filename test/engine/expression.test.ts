/**
 * ERDL MCP Server — Expression Engine Tests
 *
 * Migrated from the SafeExpr test suite.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { describe, it, expect } from 'vitest'
import { SafeExpr } from '../../src/engine/safe-expr.js'

describe('SafeExpr', () => {
  const engine = new SafeExpr()

  describe('basic arithmetic', () => {
    it('evaluates simple addition', () => {
      expect(engine.evaluate('1 + 2', {})).toBe(3)
    })

    it('evaluates subtraction', () => {
      expect(engine.evaluate('5 - 3', {})).toBe(2)
    })

    it('evaluates multiplication', () => {
      expect(engine.evaluate('4 * 3', {})).toBe(12)
    })

    it('evaluates division', () => {
      expect(engine.evaluate('10 / 2', {})).toBe(5)
    })

    it('evaluates modulo', () => {
      expect(engine.evaluate('10 % 3', {})).toBe(1)
    })
  })

  describe('variable substitution', () => {
    it('substitutes variables', () => {
      expect(engine.evaluate('retailPrice * 0.8', { retailPrice: 299 })).toBeCloseTo(239.2)
    })

    it('handles multiple variables', () => {
      expect(engine.evaluate('(a + b) / 2', { a: 10, b: 20 })).toBe(15)
    })

    it('throws for non-numeric variables', () => {
      expect(() => engine.evaluate('a + 1', { a: 'hello' as never })).toThrow()
    })

    it('throws for missing variables', () => {
      expect(() => engine.evaluate('a + 1', {})).toThrow()
    })
  })

  describe('operator precedence', () => {
    it('multiplies before adding', () => {
      expect(engine.evaluate('2 + 3 * 4', {})).toBe(14) // not 20
    })

    it('divides before adding', () => {
      expect(engine.evaluate('10 + 6 / 2', {})).toBe(13) // not 8
    })

    it('parentheses override precedence', () => {
      expect(engine.evaluate('(2 + 3) * 4', {})).toBe(20)
    })
  })

  describe('unary operators', () => {
    it('handles unary minus', () => {
      expect(engine.evaluate('-5 + 3', {})).toBe(-2)
    })

    it('handles unary plus', () => {
      expect(engine.evaluate('+5 + 3', {})).toBe(8)
    })

    it('handles double negative', () => {
      expect(engine.evaluate('--5', {})).toBe(5)
    })
  })

  describe('edge cases', () => {
    it('rejects division by zero', () => {
      expect(() => engine.evaluate('1 / 0', {})).toThrow('Division by zero')
    })

    it('handles decimal numbers', () => {
      expect(engine.evaluate('3.14 * 2', {})).toBe(6.28)
    })

    it('handles negative numbers', () => {
      expect(engine.evaluate('-10 + 5', {})).toBe(-5)
    })

    it('rejects property access (.)', () => {
      expect(() => engine.evaluate('obj.prop + 1', {})).toThrow()
    })

    it('rejects bracket access ([])', () => {
      expect(() => engine.evaluate("arr[0] + 1", {})).toThrow()
    })
  })

  describe('security', () => {
    it('rejects function calls', () => {
      expect(() => engine.evaluate('Math.round(3.5)', {})).toThrow()
    })

    it('rejects eval keyword', () => {
      expect(() => engine.evaluate('eval(1)', {})).toThrow()
    })

    it('rejects constructor access', () => {
      expect(() => engine.evaluate('constructor', {})).toThrow()
    })
  })
})
