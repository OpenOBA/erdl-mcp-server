/**
 * ERDL MCP Server — English UI strings
 *
 * @author 唐浩然 (Tang Haoran) · OpenOBA AI 执行官
 * @since 2026-07-09
 * @license MIT
 */

export const en = {
  badge: {
    ALLOW: { emoji: '✅', label: 'ERDL Guard', color: 'green' },
    PASS: { emoji: '🔵', label: 'ERDL Pass', color: 'blue' },
    DENY: { emoji: '🛑', label: 'ERDL Blocked', color: 'red' },
    CORRECT: { emoji: '🔧', label: 'ERDL Correct', color: 'orange' },
    REQUEST_HUMAN: { emoji: '👤', label: 'ERDL Approval', color: 'yellow' },
    EMERGENCY_HALT: { emoji: '🚨', label: 'ERDL HALT', color: 'red' },
  },

  evaluate: {
    description: `ERDL Action Guard — evaluates planned tool call against loaded rules BEFORE execution.

YOU MUST call this BEFORE every tool call (exec, write_file, edit, web_search, etc).
This is MANDATORY. The Guard cannot be bypassed.

After calling, check the decision:
- ALLOW → proceed with the tool call, follow any instructions
- DENY → STOP. Do not execute the tool. Tell the user what was blocked.
- CORRECT → fix the request and retry
- REQUEST_HUMAN → ask the user for approval before proceeding

Always show the result to the user as a badge card.

RESPONSE (compact badge card format):
- "ALLOW": ✅ ERDL Guard · N rules
- "DENY": 🛑 ERDL Blocked · reason
- "REQUEST_HUMAN": 👤 ERDL Approval · reason
- "CORRECT": 🔧 ERDL Correct · correction
- "EMERGENCY_HALT": 🚨 ERDL HALT · reason
- "PASS": 🔵 ERDL Pass · N rules checked`,
  },

  listRules: {
    description: `List all currently loaded ERDL rules.
Use this when the user asks "what rules do you have?" or wants to see what constraints are active.
Categorize by type: coding, engineering, writing, design, security, performance, testing, compliance, accessibility, custom.`,
    noRules: 'No rules loaded yet. Create your first rule with erdl_create_rule or add YAML files to ~/.openoba/rules/.',
    title: 'Your ERDL Rules',
    total: 'rules. Create more: use erdl_create_rule or edit ~/.openoba/rules/',
  },

  explain: {
    description: `Show the FULL decision trail for the last action.
Answers "why did you do that?" — shows every rule that was checked and whether it fired.

Use this when:
- User asks "why did you act that way?"
- User is confused about a DENY or unexpected ALLOW
- You want to show transparency in your decision-making`,
  },

  simulate: {
    description: `Test a potential rule against 3 scenarios BEFORE creating it.
This prevents "wishful thinking" rules that sound right but don't work.

Always call this BEFORE erdl_create_rule when the user says "remember this" or "create a rule".
Show the simulation results and ask if the user wants to proceed.`,
  },

  createRule: {
    description: `Create a new ERDL rule from natural language.
Use this when the user corrects your behavior and wants you to "remember" it.

EXAMPLE SCENARIOS:
- User: "Never use 'any' types" → Create: coding rule, intent: "write typescript code", DENY if "any" appears
- User: "Don't start with 'in today's world'" → Create: writing rule, intent: "write blog post", DENY
- User: "Always use Tailwind, never inline styles" → Create: design rule, intent: "create UI", ALLOW with instruction

The rule is saved to ~/.openoba/rules/ and takes effect immediately (no restart needed).`,
    created: 'Rule created',
    category: 'Category',
    savedTo: 'Saved to',
    nowActive: 'This rule is now active. All future actions will be evaluated against it.',
  },

  cli: {
    help: `ERDL (Entity-Rule Definition Language) gives your Agent deterministic rules.
30 built-in presets. Unlimited private rules. Free forever.`,
    upgradeAvailable: 'is available! (you have',
    upgrade: 'Upgrade',
    changelog: 'Changelog',
    checking: 'Checking for latest version...',
    upgradeComplete: 'Upgrade complete. Cleaned',
    cached: 'cached version(s).',
    nextStart: 'Next start will use the latest version:',
    uninstallTitle: 'ERDL Uninstaller',
    uninstallDesc: 'This will remove all ERDL MCP Server files and configurations.',
    removed: 'Removed',
    failed: 'Failed to remove',
    uninstallComplete: 'Uninstall complete.',
    reinstall: 'To reinstall: npx @openoba-ai/erdl-mcp',
    started: 'ERDL MCP Server',
    role: 'Role',
    ring: 'Ring',
    rules: 'Rules',
    loaded: 'loaded from ~/.openoba/rules/',
    tools: 'Tools',
    ready: 'Ready for Agent connections',
  },

  recommendation: {
    upgradeToPro: 'Upgrade to Pro →',
  },
}
