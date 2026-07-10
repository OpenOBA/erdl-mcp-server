const { Evaluator } = require('./dist/engine/evaluator.js');
const vectors = require('../../erdl-landing/spec/decision-object-vectors-v1.0.json');
const evaluator = new Evaluator();

let passed = 0; let failed = 0;
const failures = [];

vectors.vectors.forEach(vec => {
  try {
    const rules = vec.rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      category: r.category,
      triggers: r.triggers || [],
      conditions: parseWhen(r.when),
      action: parseThen(r.then),
      priority: r.priority,
      enabled: r.enabled !== false,
      override: r.override || false,
      version: 1,
      ring: r.ring || 3
    }));
    
    const result = evaluator.evaluate(rules, vec.context);
    const match = result.decision === vec.expected.decision;
    if (!match) {
      failures.push({ id: vec.id, got: result.decision, expected: vec.expected.decision, gotMatched: result.matchedRules?.length, expMatched: vec.expected.matchedRules?.length });
      failed++;
    } else {
      passed++;
    }
  } catch(e) {
    failures.push({ id: vec.id, error: e.message });
    failed++;
  }
});

console.log(`Passed: ${passed}/${vectors.vectors.length}`);
console.log(`Failed: ${failed}`);
failures.forEach(f => console.log(JSON.stringify(f, null, 2)));

function parseWhen(w) {
  if (!w) return [];
  return [{ kind: 'when_expression', expression: w }];
}

function parseThen(t) {
  // Format: "DECISION_TYPE \"message\""
  const m = t.match(/^(\w+)\s+"(.+)"$/);
  if (!m) return { decision: 'ALLOW', instruction: t };
  const decision = m[1];
  const msg = m[2];
  if (decision === 'ALLOW') return { decision, instruction: msg };
  if (decision === 'DENY' || decision === 'BLOCK') return { decision: 'DENY', reason: msg };
  if (decision === 'REQUEST_HUMAN') return { decision, reason: msg };
  if (decision === 'CORRECT') return { decision, correction: msg };
  if (decision === 'EMERGENCY_HALT') return { decision, reason: msg };
  if (decision === 'ESCALATE') return { decision, reason: msg };
  return { decision: 'ALLOW', instruction: t };
}
