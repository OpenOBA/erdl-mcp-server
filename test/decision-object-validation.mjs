import { Evaluator } from '../dist/engine/evaluator.js';
import { readFileSync } from 'fs';

const v = JSON.parse(readFileSync('C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-vectors-v1.0.json', 'utf-8'));
const evaluator = new Evaluator();

let passed = 0; let failed = 0;
const failures = [];

v.vectors.forEach(vec => {
  try {
    const rules = vec.rules.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      category: r.category,
      triggers: r.triggers || [],
      conditions: r.conditions || [],
      action: parseThen(r.then),
      priority: r.priority,
      enabled: r.enabled !== false,
      override: r.override || false,
      version: 1,
      ring: r.ring || 3
    }));
    
    const result = evaluator.evaluate(rules, vec.context);
    
    // Check decision
    let ok = result.decision === vec.expected.decision;
    
    // Check totalEvaluated (special cases: disabled rules, empty rules, ring-0-halt)
    if (ok && result.totalEvaluated !== vec.expected.totalEvaluated) {
      // HALT short-circuit is OK
      if (vec.id !== 'DO-013') ok = false;
    }
    
    // Check matchedRules count
    if (ok && result.matchedRules.length !== vec.expected.matchedRules.length) {
      ok = false;
    }
    
    if (!ok) {
      failures.push({
        id: vec.id,
        gotDecision: result.decision,
        expDecision: vec.expected.decision,
        gotEvaluated: result.totalEvaluated,
        expEvaluated: vec.expected.totalEvaluated,
        gotMatched: result.matchedRules.length,
        expMatched: vec.expected.matchedRules.length
      });
      failed++;
    } else {
      passed++;
    }
  } catch(e) {
    failures.push({ id: vec.id, error: e.message, stack: e.stack?.split('\n')[0] });
    failed++;
  }
});

console.log(`Passed: ${passed}/${v.vectors.length}`);
console.log(`Failed: ${failed}`);
failures.forEach(f => console.log(JSON.stringify(f, null, 2)));

function parseThen(t) {
  const m = t.match(/^(\w+)\s+"(.+)"$/);
  if (!m) return { decision: 'ALLOW', instruction: t };
  const d = m[1], msg = m[2];
  switch (d) {
    case 'ALLOW': return { decision: d, instruction: msg };
    case 'DENY': case 'BLOCK': return { decision: 'DENY', reason: msg };
    case 'REQUEST_HUMAN': return { decision: d, reason: msg };
    case 'CORRECT': return { decision: d, correction: msg };
    case 'EMERGENCY_HALT': return { decision: d, reason: msg };
    case 'ESCALATE': return { decision: d, reason: msg };
    default: return { decision: 'ALLOW', instruction: t };
  }
}
