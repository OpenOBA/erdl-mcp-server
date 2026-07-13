const fs = require('fs');
const path = require('path');

const RULES_DIR = 'C:/Users/99tan/openoba/repos/erdl-mcp-server/rules';

// 30 条核心规则（保留）
const CORE_RULES = new Set([
  'security/no-hardcoded-secrets.erdl.yaml',
  'security/no-eval-with-input.erdl.yaml',
  'security/no-stack-trace-to-user.erdl.yaml',
  'security/no-string-sql.erdl.yaml',
  'security/validate-all-input.erdl.yaml',
  'security/security-headers.erdl.yaml',
  'engineering/no-force-push-main.erdl.yaml',
  'engineering/no-stash.erdl.yaml',
  'engineering/no-shortcut.erdl.yaml',
  'engineering/no-dead-code.erdl.yaml',
  'engineering/read-before-code.erdl.yaml',
  'engineering/self-verify.erdl.yaml',
  'engineering/change-summary.erdl.yaml',
  'engineering/docs-with-delivery.erdl.yaml',
  'engineering/config-as-code.erdl.yaml',
  'engineering/dependency-audit.erdl.yaml',
  'engineering/pipeline-before-push.erdl.yaml',
  'engineering/stay-on-target.erdl.yaml',
  'engineering/decision-log.erdl.yaml',
  'observability/no-secrets-in-logs.erdl.yaml',
  'coding/no-any.erdl.yaml',
  'coding/no-ts-ignore.erdl.yaml',
  'coding/one-commit-one-change.erdl.yaml',
  'coding/naming-conventions.erdl.yaml',
  'coding/confirm-dependencies.erdl.yaml',
  'coding/no-nested-ternary.erdl.yaml',
  'testing/no-behavior-without-test.erdl.yaml',
  'testing/coverage-never-drops.erdl.yaml',
  'writing/direct-tone.erdl.yaml',
  'writing/no-ai-jargon.erdl.yaml',
]);

// Delete non-core rules
let deleted = 0;
let kept = 0;

const categories = fs.readdirSync(RULES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const cat of categories) {
  const catDir = path.join(RULES_DIR, cat);
  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.erdl.yaml'));

  for (const f of files) {
    const relPath = cat + '/' + f;
    if (!CORE_RULES.has(relPath)) {
      fs.unlinkSync(path.join(catDir, f));
      deleted++;
    } else {
      kept++;
    }
  }

  // Remove empty dirs
  const remaining = fs.readdirSync(catDir).filter(f => !f.startsWith('.'));
  if (remaining.length === 0) {
    fs.rmdirSync(catDir);
  }
}

console.log('Deleted:', deleted);
console.log('Kept:', kept);
console.log('Total remaining:', kept);
