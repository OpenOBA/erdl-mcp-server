/**
 * SafeExpr — Safe Expression Evaluator
 *
 * Pure recursive-descent parser for arithmetic expressions.
 * Zero external dependencies, zero code-injection risk.
 * No eval(), no new Function(), no vm.
 *
 * Replaces expr-eval@2.0.2 (GHSA-8gw3-rxh4-v6jx, GHSA-jc85-fpwf-qm7x).
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-06-15 (original) · 2026-07-07 (extracted to erdl-mcp)
 * @license MIT
 *
 * Security guarantees:
 *   - No property access (.) or bracket access ([]): prototype chain safe
 *   - No function calls: Math.* etc must be pre-computed
 *   - No eval, Function, vm, setTimeout
 */

// ============================================
// Token Types
// ============================================

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; name: string }
  | { type: 'operator'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }

// ============================================
// Lexer
// ============================================

function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < expression.length) {
    const ch = expression[i]

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }

    // Number (including decimals)
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = ''
      while (
        i < expression.length &&
        ((expression[i] >= '0' && expression[i] <= '9') || expression[i] === '.')
      ) {
        numStr += expression[i]
        i++
      }
      const num = parseFloat(numStr)
      if (isNaN(num)) {
        throw new Error(`[SafeExpr] Invalid number literal: ${numStr}`)
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Identifier (variable name)
    if (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      ch === '_'
    ) {
      let name = ''
      while (
        i < expression.length &&
        ((expression[i] >= 'a' && expression[i] <= 'z') ||
          (expression[i] >= 'A' && expression[i] <= 'Z') ||
          (expression[i] >= '0' && expression[i] <= '9') ||
          expression[i] === '_')
      ) {
        name += expression[i]
        i++
      }
      tokens.push({ type: 'identifier', name })
      continue
    }

    // Operators
    if ('+-*/%^'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch })
      i++
      continue
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'lparen' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen' })
      i++
      continue
    }

    // Disallowed characters
    throw new Error(
      `[SafeExpr] Unexpected character '${ch}' at position ${i} in: ${expression}`,
    )
  }

  return tokens
}

// ============================================
// Recursive Descent Parser
// ============================================

/**
 * Grammar (BNF):
 *   expr    -> term (('+' | '-') term)*
 *   term    -> factor (('*' | '/' | '%') factor)*
 *   factor  -> ('-' | '+')? factor   // unary sign
 *            | primary
 *   primary -> NUMBER | IDENTIFIER | '(' expr ')'
 */
class Parser {
  private pos = 0

  constructor(private readonly tokens: Token[]) {}

  evaluate(context: Record<string, number>): number {
    const result = this.parseExpr(context)
    if (this.pos < this.tokens.length) {
      throw new Error(
        `[SafeExpr] Unexpected token after expression at position ${this.pos}: ${JSON.stringify(this.tokens[this.pos])}`,
      )
    }
    return result
  }

  private parseExpr(context: Record<string, number>): number {
    let left = this.parseTerm(context)

    while (this.match('+', '-')) {
      const op = this.advanceOp()
      const right = this.parseTerm(context)
      left = op === '+' ? left + right : left - right
    }

    return left
  }

  private parseTerm(context: Record<string, number>): number {
    let left = this.parseFactor(context)

    while (this.match('*', '/', '%')) {
      const op = this.advanceOp()
      const right = this.parseFactor(context)
      if (op === '*') {
        left = left * right
      } else if (op === '/') {
        if (right === 0) {
          throw new Error('[SafeExpr] Division by zero')
        }
        left = left / right
      } else {
        left = left % right
      }
    }

    return left
  }

  private parseFactor(context: Record<string, number>): number {
    if (this.match('-')) {
      this.advance()
      return -this.parseFactor(context)
    }
    if (this.match('+')) {
      this.advance()
      return this.parseFactor(context)
    }

    return this.parsePrimary(context)
  }

  private parsePrimary(context: Record<string, number>): number {
    const token = this.advance()

    if (token.type === 'number') {
      return token.value
    }

    if (token.type === 'identifier') {
      const val = context[token.name]
      if (typeof val !== 'number') {
        throw new Error(
          `[SafeExpr] Variable "${token.name}" is not a number in context`,
        )
      }
      return val
    }

    if (token.type === 'lparen') {
      const val = this.parseExpr(context)
      if (!this.match(')')) {
        throw new Error('[SafeExpr] Missing closing parenthesis')
      }
      this.advance()
      return val
    }

    throw new Error(`[SafeExpr] Unexpected token: ${JSON.stringify(token)}`)
  }

  // --- Helpers ---

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private advance(): Token {
    const token = this.tokens[this.pos]
    if (!token) {
      throw new Error('[SafeExpr] Unexpected end of expression')
    }
    this.pos++
    return token
  }

  private advanceOp(): string {
    const token = this.tokens[this.pos]
    if (!token || token.type !== 'operator') {
      throw new Error('[SafeExpr] Expected operator')
    }
    this.pos++
    return token.value
  }

  private match(...values: string[]): boolean {
    const token = this.peek()
    if (!token) return false
    if (token.type === 'operator' && values.includes(token.value)) return true
    if (token.type === 'lparen' && values.includes('(')) return true
    if (token.type === 'rparen' && values.includes(')')) return true
    return false
  }
}

// ============================================
// SafeExpr Class
// ============================================

/**
 * SafeExpr — safe arithmetic expression evaluator.
 *
 * Pure lexer + parser. No eval, no Function, no vm.
 * Designed for ERDL rule engine: arithmetic + variable substitution only.
 */
export class SafeExpr {
  evaluate(formula: string, context: Record<string, number>): number {
    try {
      const tokens = tokenize(formula)
      const parser = new Parser(tokens)
      return parser.evaluate(context)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[SafeExpr] Evaluation failed for "${formula}": ${message}`)
    }
  }

  static eval(formula: string, context: Record<string, number>): number {
    return new SafeExpr().evaluate(formula, context)
  }
}
