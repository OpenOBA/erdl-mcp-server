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
  title: 'ERDL Rule Evaluator',
  description: `Evaluate a planned action against your ERDL rules BEFORE you execute it.

Call this tool when:
- About to output code → checks coding rules
- About to write content → checks writing rules  
- About to add dependencies → checks dependency rules
- About to create UI → checks design rules
- User asks you to do something sensitive

RESPONSE MEANING:
- "ALLOW": Action is permitted. Follow the instruction exactly.
- "DENY": Action is blocked. Present the reason to the user. Do NOT proceed.
- "PASS": No matching rules. Use your best judgment.`,

  inputSchema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        description: 'What you are about to do (e.g., "write code", "git commit", "write blog post", "add dependency")',
      },
      context: {
        type: 'object',
        description: 'Relevant context: file type, programming language, platform, project name, etc.',
        additionalProperties: true,
      },
    },
    required: ['intent'],
  },
}

export async function evaluateHandler(args: { intent: string; context?: Record<string, unknown> }) {
  const rules = ruleStore.getAll()
  const result: EvaluationResult = evaluator.evaluate(rules, args.intent, args.context ?? {})

  // Record hits
  for (const match of result.matchedRules) {
    ruleStore.recordHit(match.ruleId)
  }

  if (result.decision === 'PASS') {
    return {
      content: [
        {
          type: 'text' as const,
          text: `🔵 PASS: No rules matched for "${args.intent}". (${result.totalEvaluated} rules checked)`,
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
