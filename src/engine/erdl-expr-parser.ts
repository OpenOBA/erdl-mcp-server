/**
 * ERDL — Entity-Rule Definition Language
 *
 * @file when/then 表达式 → V1 AST 编译器
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-02 · updated 2026-07-09 (removed unused V2 parser)
 * @license MIT
 */

// ═══════════════════════════════════════════
// Tokenizer
// ═══════════════════════════════════════════

interface Token {
  kind: string
  value: string
  pos: number
}

function tokenizeWhen(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < expr.length) {
    const ch = expr[i]
    if (ch === ' ' || ch === '\t') { i++; continue }
    if (ch === '(') { tokens.push({ kind: 'lparen', value: '(', pos: i }); i++; continue }
    if (ch === ')') { tokens.push({ kind: 'rparen', value: ')', pos: i }); i++; continue }
    if (ch === ',') { tokens.push({ kind: 'comma', value: ',', pos: i }); i++; continue }

    // Strings
    if (ch === '"' || ch === "'") {
      const quote = ch
      let j = i + 1
      let val = ''
      while (j < expr.length && expr[j] !== quote) {
        if (expr[j] === '\\') { val += expr[j + 1]; j += 2 }
        else { val += expr[j]; j++ }
      }
      tokens.push({ kind: 'string', value: val, pos: i })
      i = j + 1
      continue
    }

    // Numbers
    if (ch >= '0' && ch <= '9') {
      let j = i
      while (j < expr.length && expr[j] >= '0' && expr[j] <= '9') j++
      tokens.push({ kind: 'number', value: expr.slice(i, j), pos: i })
      i = j
      continue
    }

    // Operators and arrow
    if (ch === '-' && expr[i + 1] === '>') {
      tokens.push({ kind: 'operator', value: '→', pos: i })
      i += 2
      continue
    }
    if (ch === '>' && expr[i + 1] === '=') {
      tokens.push({ kind: 'operator', value: 'gte', pos: i }); i += 2; continue
    }
    if (ch === '<' && expr[i + 1] === '=') {
      tokens.push({ kind: 'operator', value: 'lte', pos: i }); i += 2; continue
    }
    if (ch === '!' && expr[i + 1] === '=') {
      tokens.push({ kind: 'operator', value: 'ne', pos: i }); i += 2; continue
    }
    if (ch === '>' || ch === '<' || ch === '=' || ch === '!' || ch === '+' || ch === '*' || ch === '/') {
      tokens.push({ kind: 'operator', value: ch, pos: i })
      i++
      continue
    }
    if (ch === '-' && expr[i + 1] !== '>') {
      throw new Error(`Unexpected character '-' at position ${i}`)
    }

    // Identifiers and keywords
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let j = i
      while (j < expr.length && ((expr[j] >= 'a' && expr[j] <= 'z') || (expr[j] >= 'A' && expr[j] <= 'Z') || expr[j] === '_' || (expr[j] >= '0' && expr[j] <= '9') || expr[j] === '.')) j++
      const word = expr.slice(i, j)
      const upper = word.toUpperCase()
      if (upper === 'AND') tokens.push({ kind: 'kw_and', value: word, pos: i })
      else if (upper === 'OR') tokens.push({ kind: 'kw_or', value: word, pos: i })
      else if (upper === 'NOT') tokens.push({ kind: 'kw_not', value: word, pos: i })
      else if (upper === 'IN') tokens.push({ kind: 'kw_in', value: word, pos: i })
      else if (upper === 'CONTAINS') tokens.push({ kind: 'kw_contains', value: word, pos: i })
      else if (upper === 'MATCH') tokens.push({ kind: 'kw_match', value: word, pos: i })
      else tokens.push({ kind: 'identifier', value: word, pos: i })
      i = j
      continue
    }

    throw new Error(`Unexpected character '${ch}' at position ${i} in: ${expr}`)
  }

  return tokens
}

// ═══════════════════════════════════════════
// V1 AST types
// ═══════════════════════════════════════════

interface V1Condition {
  field: string
  operator: string
  value: unknown
}

interface V1Compiled {
  conditions: V1Condition[]
  logic: 'AND' | 'OR'
}

// ═══════════════════════════════════════════
// Parser
// ═══════════════════════════════════════════

/** Map V2 operator tokens to V1 operator strings */
function mapOp(op: string): string {
  switch (op) {
    case '=': return 'eq'
    case '!=': return 'ne'
    case '>': case 'gt': return 'gt'
    case '<': case 'lt': return 'lt'
    case '>=': case 'gte': return 'gte'
    case '<=': case 'lte': return 'lte'
    case 'in': return 'in'
    case 'contains': return 'contains'
    case 'match': return 'match'
    default: return op
  }
}

/**
 * Parse a `when` expression string → V1-compatible compiled AST.
 *
 * Supported format:
 *   field op value                  (e.g., `tool.name eq "exec"`)
 *   field operator "value" AND field operator "value"
 *   field operator "value" OR field operator "value"
 *   field in ("a", "b", "c")
 *   field contains "substring"
 *   field match "regex"
 */
export function compileWhen(
  whenExpr: string,
  conditionRefs: Map<string, string> = new Map(),
): V1Compiled {
  if (!whenExpr || whenExpr === 'true') return { conditions: [], logic: 'AND' }

  const tokens = tokenizeWhen(whenExpr)
  if (tokens.length === 0) return { conditions: [], logic: 'AND' }

  let logic: 'AND' | 'OR' = 'AND'
  const conditions: V1Condition[] = []

  // Resolve condition reference
  if (tokens.length === 1 && tokens[0].kind === 'identifier') {
    if (conditionRefs.has(tokens[0].value)) {
      return compileWhen(conditionRefs.get(tokens[0].value)!, conditionRefs)
    }
    return { conditions: [], logic: 'AND' }
  }

  let idx = 0
  function peek(): Token | undefined { return idx < tokens.length ? tokens[idx] : undefined }
  function next(): Token { return tokens[idx++] }

  while (idx < tokens.length) {
    // Check for logic keyword
    const look = peek()
    if (look && (look.kind === 'kw_and' || look.kind === 'kw_or')) {
      logic = look.kind === 'kw_or' ? 'OR' : 'AND'
      next()
      continue
    }

    const field = next()
    if (field.kind !== 'identifier') {
      throw new Error(`Expected field name, got ${field.kind} at ${field.pos}`)
    }

    const op = next()
    if (op.kind !== 'operator' && op.kind !== 'kw_in' && op.kind !== 'kw_contains' && op.kind !== 'kw_match') {
      throw new Error(`Expected operator after field, got ${op.kind}`)
    }

    let value: unknown
    if (op.kind === 'kw_in') {
      // field in ("a", "b", "c")
      if (peek()?.kind !== 'lparen') throw new Error(`Expected '(' after 'in' at ${op.pos}`)
      next() // lparen
      const values: string[] = []
      while (peek() && peek()!.kind !== 'rparen') {
        const v = next()
        if (v.kind !== 'string' && v.kind !== 'number') {
          throw new Error(`Expected value inside in(...), got ${v.kind}`)
        }
        values.push(v.value)
        if (peek()?.kind === 'comma') next()
      }
      if (peek()?.kind !== 'rparen') throw new Error(`Missing closing ')' after in(...)`)
      next() // rparen
      value = values
    } else {
      const v = next()
      if (v.kind !== 'string' && v.kind !== 'number' && v.kind !== 'identifier') {
        throw new Error(`Expected value, got ${v.kind} at ${v.pos}`)
      }
      value = v.kind === 'number' ? Number(v.value) : v.value
    }

    conditions.push({
      field: field.value,
      operator: mapOp(op.value),
      value,
    })
  }

  return { conditions, logic }
}

/**
 * Legacy compatibility: compile a `then` expression (not used by current MCP Server).
 * Kept for backward compatibility with external consumers.
 */
export function compileThen(thenExpr: string): Array<Record<string, unknown>> {
  if (!thenExpr) return [{ decision: 'ALLOW' }]
  const upper = thenExpr.toUpperCase()
  const decision = upper.includes('DENY') ? 'DENY'
    : upper.includes('REQUEST_HUMAN') ? 'REQUEST_HUMAN'
    : upper.includes('CORRECT') ? 'CORRECT'
    : upper.includes('EMERGENCY_HALT') ? 'EMERGENCY_HALT'
    : 'ALLOW'
  const reason = thenExpr.replace(/^(ALLOW|DENY|CORRECT|REQUEST_HUMAN|EMERGENCY_HALT)\s*/i, '').replace(/^["']|["']$/g, '')
  return [{ decision, reason: reason || undefined }]
}
