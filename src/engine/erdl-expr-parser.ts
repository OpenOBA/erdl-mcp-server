/**
 * ERDL — Enterprise Resource Definition Language
 *
 * @file ERDL V2 Expression Parser — when/then 表达式 → V1 AST 编译器
 * @author 唐浩然（OpenOBA AI 执行官）
 * @since 2026-07-02
 * @license MIT
 *
 * @description
 * 将 ERDL V2 的 when/then 表达式（论文中描述的 7 种运算符）
 * 编译为与 ERDLParser V1 兼容的 AST（condition/conditions/field/operator/value）。
 *
 * 这保证了向后兼容——V2 规则可以和 V1 规则共存于同一个 Registry 中。
 */

import * as yaml from 'js-yaml'
import * as fs from 'fs'

// ═══════════════════════════════════════════
// V2 Rule AST (轻量，不依赖 Zod)
// ═══════════════════════════════════════════

export interface ERDLV2Rule {
  name: string
  when?: string        // 条件表达式（可选，无 when 表示默认规则）
  then?: string        // 结果表达式（动作）
  priority?: number
  tier?: 'policy' | 'validation'
  entity?: string
  /** 扩展层元属性 */
  within?: string
  state?: string
  combine?: string
  threshold?: string
  override?: boolean
}

export interface ERDLV2Condition {
  name: string
  expression: string   // 条件表达式
}

export interface ERDLV2Chain {
  name: string
  steps: string[]
}

export interface ERDLV2Fn {
  name: string
  signature: string    // e.g., "MA(series, period) → number"
}

export interface ERDLV2Document {
  namespace?: string
  entities?: Record<string, any>   // Entity definitions (same as V1)
  conditions?: ERDLV2Condition[]
  rules?: ERDLV2Rule[]
  chains?: ERDLV2Chain[]
  functions?: ERDLV2Fn[]
}

// ═══════════════════════════════════════════
// Expression Tokenizer
// ═══════════════════════════════════════════

type TokenKind = 'identifier' | 'number' | 'string' | 'operator' | 'lparen' | 'rparen' | 'comma' | 'kw_and' | 'kw_or' | 'kw_not' | 'kw_in' | 'kw_not_in' | 'kw_exists' | 'kw_not_exists'

interface Token {
  kind: TokenKind
  value: string
  pos: number
}

function tokenizeWhen(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]

    // Whitespace
    if (ch === ' ' || ch === '\t') { i++; continue }

    // Parentheses
    if (ch === '(') { tokens.push({ kind: 'lparen', value: '(', pos: i }); i++; continue }
    if (ch === ')') { tokens.push({ kind: 'rparen', value: ')', pos: i }); i++; continue }
    if (ch === ',') { tokens.push({ kind: 'comma', value: ',', pos: i }); i++; continue }

    // String literals
    if (ch === '"') {
      let j = i + 1
      while (j < expr.length && expr[j] !== '"') j++
      if (j >= expr.length) throw new Error(`Unterminated string at position ${i}`)
      tokens.push({ kind: 'string', value: expr.slice(i + 1, j), pos: i })
      i = j + 1
      continue
    }

    // Numeric literals (including decimals and negatives)
    if ((ch >= '0' && ch <= '9') || (ch === '-' && i + 1 < expr.length && expr[i + 1] >= '0' && expr[i + 1] <= '9')) {
      let j = i + 1
      while (j < expr.length && ((expr[j] >= '0' && expr[j] <= '9') || expr[j] === '.')) j++
      tokens.push({ kind: 'number', value: expr.slice(i, j), pos: i })
      i = j
      continue
    }

    // Comparison operators
    if (ch === '>' || ch === '<' || ch === '=' || ch === '!') {
      if (i + 1 < expr.length && expr[i + 1] === '=') {
        tokens.push({ kind: 'operator', value: expr.slice(i, i + 2), pos: i })
        i += 2
      } else {
        tokens.push({ kind: 'operator', value: ch, pos: i })
        i++
      }
      continue
    }

    // Arrow (→, ->) — state transition operator
    if (ch === '→' || ch === '-') {
      if (ch === '-' && i + 1 < expr.length && expr[i + 1] === '>') {
        tokens.push({ kind: 'operator', value: '->', pos: i })
        i += 2
      } else if (ch === '→') {
        tokens.push({ kind: 'operator', value: '→', pos: i })
        i++
      } else {
        throw new Error(`Unexpected character '-' at position ${i}`)
      }
      continue
    }

    // Identifiers and keywords
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let j = i
      while (j < expr.length && ((expr[j] >= 'a' && expr[j] <= 'z') || (expr[j] >= 'A' && expr[j] <= 'Z') || (expr[j] >= '0' && expr[j] <= '9') || expr[j] === '_' || expr[j] === '.')) j++
      const word = expr.slice(i, j)
      const upper = word.toUpperCase()
      if (upper === 'AND') tokens.push({ kind: 'kw_and', value: word, pos: i })
      else if (upper === 'OR') tokens.push({ kind: 'kw_or', value: word, pos: i })
      else if (upper === 'NOT') tokens.push({ kind: 'kw_not', value: word, pos: i })
      else if (upper === 'IN') tokens.push({ kind: 'kw_in', value: word, pos: i })
      else if (upper === 'EXISTS') tokens.push({ kind: 'kw_exists', value: word, pos: i })
      else tokens.push({ kind: 'identifier', value: word, pos: i })
      i = j
      continue
      i = j
      continue
    }

    throw new Error(`Unexpected character '${ch}' at position ${i} in: ${expr}`)
  }
  return tokens
}

// ═══════════════════════════════════════════
// Expression → V1 Condition Compiler
// ═══════════════════════════════════════════

interface V1Condition {
  logic?: string
  conditions?: Array<{
    field: string
    operator: string
    value?: any
  }>
}

// Map ERDL operators to V1 operator names
const OP_MAP: Record<string, string> = {
  '=': 'eq', '==': 'eq',
  '!=': 'ne', '<>': 'ne',
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte',
}

class ExpressionCompiler {
  private tokens: Token[]
  private pos: number
  private readonly conditionRefs: Map<string, string>

  constructor(tokens: Token[], conditionRefs: Map<string, string> = new Map()) {
    this.tokens = tokens
    this.pos = 0
    this.conditionRefs = conditionRefs
  }

  private peek(): Token | undefined { return this.tokens[this.pos] }
  private advance(): Token { return this.tokens[this.pos++] }
  private expect(kind: TokenKind): Token {
    const t = this.peek()
    if (!t) throw new Error('Unexpected end of expression')
    if (t.kind !== kind) throw new Error(`Expected ${kind}, got ${t.kind} at position ${t.pos}`)
    return this.advance()
  }

  /** Parse full when expression → V1 condition tree */
  parseCondition(): V1Condition {
    return this.parseOr()
  }

  private parseOr(): V1Condition {
    let left = this.parseAnd()
    while (this.peek()?.kind === 'kw_or') {
      this.advance()
      const right = this.parseAnd()
      // Flatten OR into conditions array with logic: OR
      if (left.conditions && right.conditions) {
        // V1 doesn't directly support nested OR — wrap in single condition
        // For simplicity, we create a joined condition
        return {
          logic: 'OR',
          conditions: [...left.conditions, ...right.conditions],
        }
      }
    }
    return left
  }

  private parseAnd(): V1Condition {
    let left = this.parseComparison()
    const conditions: any[] = []
    if (left.conditions) conditions.push(...left.conditions)
    while (this.peek()?.kind === 'kw_and') {
      this.advance()
      const right = this.parseComparison()
      if (right.conditions) conditions.push(...right.conditions)
    }
    if (conditions.length > 1) {
      return { logic: 'AND', conditions }
    }
    if (conditions.length === 1) {
      return { conditions }
    }
    return left
  }

  private parseComparison(): V1Condition {
    const t = this.peek()
    if (!t) throw new Error('Unexpected end of expression')

    // Negation: NOT ...
    if (t.kind === 'kw_not') {
      this.advance()
      // NOT + field + EXISTS → not_exists
      // NOT + field + IN (...) → not_in
      // NOT + comparison → flip operator
      const fieldToken = this.peek()
      if (fieldToken?.kind === 'identifier') {
        const field = this.advance().value
        const next = this.peek()
        if (next?.kind === 'kw_exists') {
          this.advance()
          return { conditions: [{ field, operator: 'not_exists' }] }
        }
        if (next?.kind === 'kw_in') {
          this.advance()
          this.expect('lparen')
          const values: string[] = []
          while (this.peek() && this.peek()!.kind !== 'rparen') {
            const v = this.peek()!
            if (v.kind === 'string') values.push(this.advance().value)
            else if (v.kind === 'number') values.push(this.advance().value)
            else throw new Error(`Unexpected token in NOT IN list: ${v.kind}`)
            if (this.peek()?.kind === 'comma') this.advance()
          }
          this.expect('rparen')
          return { conditions: [{ field, operator: 'not_in', value: values }] }
        }
        // NOT + field + operator + value → flip
        if (next?.kind === 'operator') {
          const op = this.advance().value
          const val = this.parseOperand()
          const opFlip: Record<string, string> = { '=': 'ne', 'ne': 'eq', '>': 'lte', '<': 'gte', '>=': 'lt', '<=': 'gt', '==': 'ne', 'eq': 'ne', 'gt': 'lte', 'lt': 'gte', 'gte': '<', 'lte': '>' }
          const v1op = OP_MAP[op] || op
          return { conditions: [{ field, operator: opFlip[v1op] || `not_${v1op}`, value: val }] }
        }
        // NOT bare field → treated as field ne true
        return { conditions: [{ field, operator: 'ne', value: true }] }
      }
      // Fallback: parse inner comparison and flip
      const inner = this.parseComparison()
      if (inner.conditions && inner.conditions.length === 1) {
        const c = inner.conditions[0]
        const opFlip: Record<string, string> = {
          'eq': 'ne', 'ne': 'eq', 'gt': 'lte', '<': 'gte',
          'gte': '<', 'lte': '>',
          'exists': 'not_exists', 'in': 'not_in',
        }
        return { conditions: [{ field: c.field, operator: opFlip[c.operator] || `not_${c.operator}`, value: c.value }] }
      }
      return { conditions: [{ field: `not(${JSON.stringify(inner)})`, operator: 'eq', value: true }] }
    }

    // Parenthesized expression
    if (t.kind === 'lparen') {
      this.advance()
      const inner = this.parseOr()
      this.expect('rparen')
      return inner
    }

    // EXISTS / NOT EXISTS
    if (t.kind === 'kw_exists' || t.kind === 'kw_not_exists') {
      const kind = t.kind
      this.advance()
      // Parse the field reference after EXISTS
      const fieldRef = this.parseOperand()
      const field = typeof fieldRef === 'string' ? fieldRef : String(fieldRef)
      return {
        conditions: [{
          field,
          operator: kind === 'kw_exists' ? 'exists' : 'not_exists',
        }],
      }
    }

    // Resolve condition references ("库存过低" → expansion)
    if (t.kind === 'identifier' && this.conditionRefs.has(t.value)) {
      const refName = t.value
      this.advance()
      // Check next token — if AND/OR follows, the ref is part of a larger expression
      const next = this.peek()
      if (!next || next.kind === 'rparen' || next.kind === 'kw_and' || next.kind === 'kw_or') {
        // Simple reference to a named condition
        // Return a marker that will be resolved by ConditionExpander
        return { conditions: [{ field: '__condition_ref__', operator: 'eq', value: refName }] }
      }
    }

    // operand operator operand
    const left = this.parseOperand()
    const op = this.peek()
    if (!op) throw new Error(`Unexpected end of expression after ${left}`)
    if (op.kind !== 'operator' && op.kind !== 'kw_in' && op.kind !== 'kw_not_in' && op.kind !== 'kw_not') {
      throw new Error(`Expected operator, got ${op.kind} at position ${op.pos}`)
    }
    const opKind = op.kind
    this.advance()

    // NOT as operator: `country NOT IN (...)` → flux back to parseComparison NOT logic
    if (opKind === 'kw_not') {
      if (this.peek()?.kind === 'kw_in') {
        this.advance()
        this.expect('lparen')
        const values: string[] = []
        while (this.peek() && this.peek()!.kind !== 'rparen') {
          const v = this.peek()!
          if (v.kind === 'string') values.push(this.advance().value)
          else if (v.kind === 'number') values.push(this.advance().value)
          else throw new Error(`Unexpected token in NOT IN list: ${v.kind}`)
          if (this.peek()?.kind === 'comma') this.advance()
        }
        this.expect('rparen')
        return { conditions: [{ field: String(left), operator: 'not_in', value: values }] }
      }
      if (this.peek()?.kind === 'kw_exists') {
        this.advance()
        return { conditions: [{ field: String(left), operator: 'not_exists' }] }
      }
      // NOT operator value → flip the operator
      const flipOp = this.peek()
      if (flipOp?.kind === 'operator') {
        this.advance()
        const val = this.parseOperand()
        const flip: Record<string, string> = { '=': 'ne', '>': 'lte', '<': 'gte', '>=': '<', '<=': '>' }
        const v1op = OP_MAP[flipOp.value] || flipOp.value
        return { conditions: [{ field: String(left), operator: flip[v1op] || `not_${v1op}`, value: val }] }
      }
    }

    if (opKind === 'kw_in' || opKind === 'kw_not_in') {
      // Parse IN (...) or NOT IN (...)
      this.expect('lparen')
      const values: string[] = []
      while (this.peek() && this.peek()!.kind !== 'rparen') {
        const v = this.peek()!
        if (v.kind === 'string') {
          values.push(this.advance().value)
        } else if (v.kind === 'number') {
          values.push(this.advance().value)
        } else {
          throw new Error(`Unexpected token in IN list: ${v.kind} at position ${v.pos}`)
        }
        if (this.peek()?.kind === 'comma') this.advance()
      }
      this.expect('rparen')
      return {
        conditions: [{
          field: String(left),
          operator: opKind === 'kw_in' ? 'in' : 'not_in',
          value: values,
        }],
      }
    }

    const right = this.parseOperand()
    const v1op = OP_MAP[op.value] || op.value

    // Parse string or number value
    let value: any = right
    if (typeof right === 'string') {
      // If right side looks like an identifier, it's a field reference
      value = right
    }

    return {
      conditions: [{
        field: String(left),
        operator: v1op,
        value,
      }],
    }
  }

  private parseOperand(): string | number {
    const t = this.peek()
    if (!t) throw new Error('Unexpected end of expression')

    if (t.kind === 'number') {
      this.advance()
      return parseFloat(t.value)
    }

    if (t.kind === 'string') {
      this.advance()
      return t.value
    }

    if (t.kind === 'identifier') {
      this.advance()
      // Function call?
      if (this.peek()?.kind === 'lparen') {
        // fn(field, period) → skip, handled by fn registry
        this.advance()
        let depth = 1
        while (depth > 0 && this.peek()) {
          const ct = this.peek()!
          if (ct.kind === 'lparen') depth++
          else if (ct.kind === 'rparen') depth--
          this.advance()
        }
        return t.value + '(...)'
      }
      return t.value
    }

    throw new Error(`Expected operand, got ${t.kind} at position ${t.pos}`)
  }
}

// ═══════════════════════════════════════════
// V2 → V1 Compiler
// ═══════════════════════════════════════════

/**
 * 将 V2 when 表达式编译为 V1 condition 树
 */
export function compileWhen(whenExpr: string, conditionRefs: Map<string, string> = new Map()): V1Condition {
  // Resolve condition references
  let expandedExpr = whenExpr
  for (const [name, expression] of conditionRefs) {
    // Replace the condition name with its definition
    expandedExpr = expandedExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), `(${expression})`)
  }

  // Tokenize and compile
  const tokens = tokenizeWhen(expandedExpr)
  if (tokens.length === 0) return { conditions: [] }

  const compiler = new ExpressionCompiler(tokens, conditionRefs)
  return compiler.parseCondition()
}

/**
 * 将 V2 then 表达式解析为 V1 actions 数组
 */
export function compileThen(thenExpr: string): Array<Record<string, any>> {
  const actions: Array<Record<string, any>> = []

  // Split by AND (multiple actions)
  const parts = thenExpr.split(/\s+AND\s+/).map(s => s.trim())

  for (const part of parts) {
    // state transition: state → newState or state -> newState
    const stateMatch = part.match(/state\s*[\u2192\-\>]+\s*(.+)/)
    if (stateMatch) {
      actions.push({ type: 'state_transition', params: { target: stateMatch[1] } })
      continue
    }

    // Simple assignment: target = value or target = expression
    const assignMatch = part.match(/^(\w+(?:\.\w+)*)\s*=\s*(.+)$/)
    if (assignMatch) {
      const [, target, valueStr] = assignMatch
      const value = valueStr.trim()

      // Try parsing as number or string
      if (value.startsWith('"') && value.endsWith('"')) {
        actions.push({ type: 'assign', params: { target, value: value.slice(1, -1) } })
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        actions.push({ type: 'assign', params: { target, value: parseFloat(value) } })
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Array value
        try {
          const arr = JSON.parse(value)
          actions.push({ type: 'assign', params: { target, value: arr } })
        } catch {
          actions.push({ type: 'assign', params: { target, value } })
        }
      } else {
        // Formula expression
        actions.push({ type: 'calculate', params: { formula: value, target } })
      }
      continue
    }

    // Bare expression (no target)
    actions.push({ type: 'assign', params: { value: part } })
  }

  return actions
}

// ═══════════════════════════════════════════
// ERDL V2 Parser
// ═══════════════════════════════════════════

export class ERDLExprParser {
  /**
   * Parse a .erdl V2 file into a V2 document
   */
  static parseFile(filePath: string): ERDLV2Document {
    if (!fs.existsSync(filePath)) throw new Error(`ERDL file not found: ${filePath}`)
    return this.parseString(fs.readFileSync(filePath, 'utf-8'))
  }

  /**
   * Parse YAML string into ERDL V2 document
   */
  static parseString(yamlStr: string): ERDLV2Document {
    const raw = yaml.load(yamlStr)
    if (raw === null || typeof raw !== 'object') throw new Error('ERDL content cannot be empty')

    const obj = raw as Record<string, any>
    const doc: ERDLV2Document = {}

    if (obj.namespace) doc.namespace = String(obj.namespace)
    if (obj.entities) doc.entities = obj.entities as Record<string, any>

    // Parse conditions (keys prefixed with "condition ")
    const condMap: Record<string, string> = {}
    const ruleMap: Record<string, any> = {}
    const chainMap: Record<string, string | string[]> = {}
    const fnMap: Record<string, string> = {}

    for (const key of Object.keys(obj)) {
      if (key.startsWith('condition ')) {
        condMap[key.slice('condition '.length)] = String(obj[key])
      } else if (key.startsWith('rule ')) {
        ruleMap[key.slice('rule '.length)] = obj[key]
      } else if (key.startsWith('chain ')) {
        chainMap[key.slice('chain '.length)] = obj[key]
      } else if (key.startsWith('fn ') || key.startsWith('function ')) {
        fnMap[key.split(' ')[1] || key] = String(obj[key])
      }
    }

    // Also support collections
    if (obj.condition) this._mergeCondMap(condMap, obj.condition)
    if (obj.conditions) this._mergeCondMap(condMap, obj.conditions)
    if (obj.rule) this._mergeRuleMap(ruleMap, obj.rule)
    if (obj.rules) this._mergeRuleMap(ruleMap, obj.rules)
    if (obj.chain) this._mergeChainMap(chainMap, obj.chain)
    if (obj.chains) this._mergeChainMap(chainMap, obj.chains)
    if (obj.fn) Object.assign(fnMap, obj.fn)
    if (obj.functions) Object.assign(fnMap, obj.functions)

    if (Object.keys(condMap).length > 0) {
      doc.conditions = Object.entries(condMap).map(([name, expr]) => ({ name, expression: String(expr) }))
    }

    if (Object.keys(ruleMap).length > 0) {
      doc.rules = Object.entries(ruleMap).map(([name, ruleObj]) => ({ name, ...(ruleObj as any) }))
    }

    if (Object.keys(chainMap).length > 0) {
      doc.chains = Object.entries(chainMap).map(([name, steps]) => ({
        name,
        steps: typeof steps === 'string'
          ? steps.split(/\s*[→\->]+\s*/).map(s => s.trim()).filter(Boolean)
          : (steps as string[]),
      }))
    }

    if (Object.keys(fnMap).length > 0) {
      doc.functions = Object.entries(fnMap).map(([name, sig]) => ({ name, signature: String(sig) }))
    }

    return doc
  }

  /**
   * Compile a V2 document's rules into V1-compatible policies/validations arrays
   */
  static compileToV1Rules(doc: ERDLV2Document): {
    policies: any[]
    validations: any[]
  } {
    const policies: any[] = []
    const validations: any[] = []

    // Build condition reference map
    const conditionRefs = new Map<string, string>()
    for (const cond of doc.conditions || []) {
      conditionRefs.set(cond.name, cond.expression)
    }

    for (const rule of doc.rules || []) {
      const tier = rule.tier || 'policy'
      const v1Rule: any = {
        name: rule.name,
        priority: rule.priority || 1,
        tier,
        entity: rule.entity || 'default',
      }

      // Compile when → V1 condition tree
      if (rule.when) {
        try {
          v1Rule.condition = compileWhen(rule.when, conditionRefs)
        } catch (e) {
          // If compilation fails, store as raw expression
          v1Rule.condition = { logic: 'AND', conditions: [{ field: '_when_', operator: 'eq', value: rule.when }] }
        }
      } else {
        v1Rule.condition = { logic: 'AND', conditions: [] } // Default rule (always matches)
      }

      // Compile then → V1 actions
      if (rule.then) {
        v1Rule.actions = compileThen(rule.then)
      } else {
        v1Rule.actions = []
      }

      // Extension properties
      if (rule.override) v1Rule.override = true
      if (rule.within) v1Rule.within = rule.within
      if (rule.state) v1Rule.state = rule.state
      if (rule.combine) v1Rule.combine = rule.combine
      if (rule.threshold) v1Rule.threshold = rule.threshold

      if (tier === 'validation') {
        validations.push(v1Rule)
      } else {
        policies.push(v1Rule)
      }
    }

    return { policies, validations }
  }

  // ── Private helpers for merging YAML collections ──

  /**
   * Merge conditions object or array into condMap.
   * Supports both { name: "expr" } and { name: { expression: "expr" } } formats.
   */
  private static _mergeCondMap(condMap: Record<string, string>, source: any): void {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (item.name && item.expression) {
          condMap[item.name] = String(item.expression)
        }
      }
    } else if (typeof source === 'object') {
      for (const [key, val] of Object.entries(source)) {
        if (typeof val === 'object' && val !== null && (val as any).expression) {
          condMap[key] = String((val as any).expression)
        } else {
          condMap[key] = String(val)
        }
      }
    }
  }

  /**
   * Merge rules object or array into ruleMap.
   * Supports both { name: { when, then } } and [{ name, when, then }] formats.
   */
  private static _mergeRuleMap(ruleMap: Record<string, any>, source: any): void {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (item.name) {
          ruleMap[item.name] = item
        }
      }
    } else if (typeof source === 'object') {
      Object.assign(ruleMap, source)
    }
  }

  /**
   * Merge chains object or array into chainMap.
   */
  private static _mergeChainMap(chainMap: Record<string, string | string[]>, source: any): void {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (item.name) {
          chainMap[item.name] = item.steps || item
        }
      }
    } else if (typeof source === 'object') {
      Object.assign(chainMap, source)
    }
  }
}
