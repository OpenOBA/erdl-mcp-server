/**
 * ERDL MCP Server — evaluate tool
 *
 * Evaluates all loaded rules against the agent's current intent.
 * Agent should call this BEFORE outputting code, content, or making decisions.
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-07
 * @license MIT
 */

import { Evaluator } from '../engine/evaluator.js'
import { ruleStore } from '../engine/rule-store.js'
import type { EvaluationResult } from '../engine/rule-definition.js'

const evaluator = new Evaluator()

export const evaluateToolDef = {
  name: 'erdl_evaluate',
  title: 'ERDL Action Guard — Tool Call Interceptor',
  description: `ERDL Action Guard: evaluates Agent's planned Tool Call against loaded rules BEFORE execution.

This is the protocol-level guard (ERDL Spec §3.6). The Agent Host MUST call this
before executing any Tool Call. The Guard cannot be bypassed.

Parameters follow ERDL Spec §5.3 MCP Tool Declaration:
- tool_name: the MCP tool being called (e.g., "exec", "write_file")  
- tool_args: the arguments being passed to the tool
- agent_id: optional agent identity for audit context
- session_id: optional session identifier for audit chain

RESPONSE:
- "ALLOW": Tool call permitted. Follow instruction if provided.
- "DENY": Tool call blocked. Do NOT execute. Show reason to user.
- "REQUEST_HUMAN": Human approval required before execution.
- "CORRECT": Tool call permitted with corrected parameters.
- "PASS": No matching rules. Tool call permitted.`,

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

  if (result.decision === 'PASS') {
    return {
      content: [
        {
          type: 'text' as const,
          text: `🔵 PASS: No rules matched for tool call "${args.tool_name}". (${result.totalEvaluated} rules checked)`,
        },
      ],
      structuredContent: {
        decision: 'PASS' as const,
        matchedRules: [] as string[],
        totalEvaluated: result.totalEvaluated,
        totalMatched: 0,
      },
    }
  }

  if (result.decision === 'DENY') {
    const rulesSummary = result.matchedRules
      .filter((r) => r.decision === 'DENY')
      .map((r) => `- ${r.ruleId}: ${r.reason}`)
      .join('\n')

    return {
      content: [
        {
          type: 'text' as const,
          text: `🛑 DENY: Blocked by rules.\\n\\n${rulesSummary}\\n\\nDo NOT proceed.`,
        },
      ],
      structuredContent: {
        decision: 'DENY' as const,
        reason: result.primaryReason,
        matchedRules: result.matchedRules.map((r) => ({ id: r.ruleId, name: r.ruleName, reason: r.reason })),
        totalEvaluated: result.totalEvaluated,
        totalMatched: result.totalMatched,
      },
      isError: false,
    }
  }

  if (result.decision === 'EMERGENCY_HALT') {
    return {
      content: [
        { type: 'text' as const, text: `EMERGENCY_HALT: ${result.primaryReason}\nRule: ${result.matchedRules.filter(r => r.decision === 'EMERGENCY_HALT').map(r => r.ruleId).join(', ')}\n\nSTOP ALL ACTIONS IMMEDIATELY.` },
      ],
      structuredContent: { decision: 'EMERGENCY_HALT' as const, reason: result.primaryReason, matchedRules: result.matchedRules.map(r => ({ id: r.ruleId, name: r.ruleName })) },
      isError: true,
    }
  }

  if (result.decision === 'REQUEST_HUMAN') {
    return {
      content: [
        { type: 'text' as const, text: `REQUEST_HUMAN: ${result.primaryReason}\nRule: ${result.matchedRules.filter(r => r.decision === 'REQUEST_HUMAN').map(r => r.ruleId).join(', ')}\n\nAsk the user for approval before proceeding.` },
      ],
      structuredContent: { decision: 'REQUEST_HUMAN' as const, reason: result.primaryReason, matchedRules: result.matchedRules.map(r => ({ id: r.ruleId, name: r.ruleName })) },
      isError: false,
    }
  }

  if (result.decision === 'CORRECT') {
    return {
      content: [
        { type: 'text' as const, text: `CORRECT: ${result.primaryInstruction}\nRules matched: ${result.matchedRules.map(r => r.ruleId).join(', ')}\n\nRewrite your output following the correction above.` },
      ],
      structuredContent: { decision: 'CORRECT' as const, correction: result.primaryInstruction, matchedRules: result.matchedRules.map(r => ({ id: r.ruleId, name: r.ruleName })) },
    }
  }

  // ALLOW
  const instructions = result.matchedRules.map((r) => r.instruction).filter(Boolean)
  const summary = instructions.length > 0 ? instructions.join('\n') : 'No specific instructions.'

  return {
    content: [
      {
        type: 'text' as const,
        text: `✅ ALLOW: Rule check passed.\\n\\nRules: ${result.matchedRules.map((r) => r.ruleId).join(', ')}\\n\\n${summary}`,
      },
    ],
    structuredContent: {
      decision: 'ALLOW' as const,
      instructions,
      matchedRules: result.matchedRules.map((r) => ({ id: r.ruleId, name: r.ruleName, instruction: r.instruction })),
      totalEvaluated: result.totalEvaluated,
      totalMatched: result.totalMatched,
    },
  }
}
