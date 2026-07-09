/**
 * ERDL MCP Server — evaluate tool
 *
 * Evaluates all loaded rules against the agent's current intent.
 * Agent should call this BEFORE outputting code, content, or making decisions.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07 · updated 2026-07-09 (badge cards)
 * @license MIT
 */

import { Evaluator } from '../engine/evaluator.js'
import { ruleStore } from '../engine/rule-store.js'
import type { EvaluationResult } from '../engine/rule-definition.js'
import { i18n } from '../i18n/index.js'

const evaluator = new Evaluator()

export const evaluateToolDef = {
  name: 'erdl_evaluate',
  title: 'ERDL Action Guard — Tool Call Interceptor',
  description: i18n().evaluate.description,

  inputSchema: {
    type: 'object',
    properties: {
      tool_name: {
        type: 'string',
        description: 'Name of the tool being called (e.g., "exec", "write_file", "web_search")',
      },
      tool_args: {
        type: 'object',
        description: 'Arguments being passed to the tool',
        additionalProperties: true,
      },
      agent_id: {
        type: 'string',
        description: 'Optional agent identity for audit context',
      },
      session_id: {
        type: 'string',
        description: 'Optional session identifier for audit chain',
      },
    },
    required: ['tool_name'],
  },
}

export async function evaluateHandler(args: {
  tool_name: string
  tool_args?: Record<string, unknown>
  agent_id?: string
  session_id?: string
}) {
  // Runtime input validation (MCP SDK doesn't enforce inputSchema at runtime)
  if (typeof args.tool_name !== 'string' || !args.tool_name) {
    return { content: [{ type: 'text' as const, text: 'Invalid input: tool_name must be a non-empty string' }], isError: true }
  }

  const rules = ruleStore.getAll()

  // Build guard context from Tool Call parameters (ERDL Spec §5.3)
  const guardContext: Record<string, unknown> = {
    'tool.name': args.tool_name,
    'tool.args': args.tool_args ?? {},
    ...(args.agent_id ? { 'agent.id': args.agent_id } : {}),
    ...(args.session_id ? { 'session.id': args.session_id } : {}),
  }

  // Flatten tool_args for direct field access (e.g., tool.args.command)
  if (args.tool_args) {
    for (const [key, value] of Object.entries(args.tool_args)) {
      guardContext[`tool.args.${key}`] = value
    }
  }

  const result: EvaluationResult = evaluator.evaluate(rules, guardContext)

  // Record hits
  for (const match of result.matchedRules) {
    ruleStore.recordHit(match.ruleId)
  }

  const badge = BADGE[result.decision] ?? { emoji: '⚪', label: result.decision, color: 'gray' }
  const decisionRules = result.matchedRules.map((r) => ({
    id: r.ruleId,
    name: r.ruleName,
    decision: r.decision,
    reason: r.reason,
    instruction: r.instruction,
  }))

  // Unified badge card output — compact, front-end renders as inline card
  if (result.decision === 'PASS') {
    return {
      content: [{ type: 'text' as const, text: `${badge.emoji} ${badge.label} · ${result.totalEvaluated} rules checked` }],
      structuredContent: { decision: 'PASS' as const, badge, totalEvaluated: result.totalEvaluated, totalMatched: 0 },
    }
  }

  if (result.decision === 'DENY') {
    return {
      content: [{ type: 'text' as const, text: `${badge.emoji} ${badge.label} · ${result.primaryReason ?? 'Blocked by rules'}` }],
      structuredContent: { decision: 'DENY' as const, badge, reason: result.primaryReason, matchedRules: decisionRules, totalEvaluated: result.totalEvaluated, totalMatched: result.totalMatched },
    }
  }

  if (result.decision === 'EMERGENCY_HALT') {
    return {
      content: [{ type: 'text' as const, text: `${badge.emoji} ${badge.label} · ${result.primaryReason ?? 'Emergency halt'}` }],
      structuredContent: { decision: 'EMERGENCY_HALT' as const, badge, reason: result.primaryReason, matchedRules: decisionRules },
      isError: true,
    }
  }

  if (result.decision === 'REQUEST_HUMAN') {
    return {
      content: [{ type: 'text' as const, text: `${badge.emoji} ${badge.label} · ${result.primaryReason ?? 'Approval required'}` }],
      structuredContent: { decision: 'REQUEST_HUMAN' as const, badge, reason: result.primaryReason, matchedRules: decisionRules },
    }
  }

  if (result.decision === 'CORRECT') {
    const correction = result.primaryCorrection ?? result.primaryInstruction
    return {
      content: [{ type: 'text' as const, text: `${badge.emoji} ${badge.label} · ${correction}` }],
      structuredContent: { decision: 'CORRECT' as const, badge, correction, matchedRules: decisionRules },
    }
  }

  // ALLOW
  const summary = result.primaryInstruction ?? `${result.totalMatched} rules matched`
  return {
    content: [{ type: 'text' as const, text: `${badge.emoji} ${badge.label} · ${result.totalMatched} rules` }],
    structuredContent: {
      decision: 'ALLOW' as const,
      badge,
      summary,
      matchedRules: decisionRules,
      totalEvaluated: result.totalEvaluated,
      totalMatched: result.totalMatched,
    },
  }
}

const BADGE = i18n().badge
