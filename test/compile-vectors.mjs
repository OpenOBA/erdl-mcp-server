import { readFileSync, writeFileSync } from 'fs';

const v = JSON.parse(readFileSync('C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-vectors-v1.0.json', 'utf-8'));

function compileWhen(w) {
  if (!w || w.trim() === '') return [];
  if (w.includes(' OR ')) {
    return w.split(' OR ').map(p => compileSingle(p.trim())).filter(Boolean);
  }
  if (w.includes(' AND ')) {
    return w.split(' AND ').map(p => compileSingle(p.trim())).filter(Boolean);
  }
  const c = compileSingle(w.trim());
  return c ? [c] : [];
}

function compileSingle(expr) {
  let m;
  // field = "value"
  m = expr.match(/^(.+?)\s*=\s*"(.+)"$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'eq', value: m[2] };
  // field != "value"
  m = expr.match(/^(.+?)\s*!=\s*"(.+)"$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'neq', value: m[2] };
  // field > number
  m = expr.match(/^(.+?)\s*>\s*(\d+(?:\.\d+)?)$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'gt', value: Number(m[2]) };
  // field < number
  m = expr.match(/^(.+?)\s*<\s*(\d+(?:\.\d+)?)$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'lt', value: Number(m[2]) };
  // field >= number
  m = expr.match(/^(.+?)\s*>=\s*(\d+(?:\.\d+)?)$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'gte', value: Number(m[2]) };
  // field <= number
  m = expr.match(/^(.+?)\s*<=\s*(\d+(?:\.\d+)?)$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'lte', value: Number(m[2]) };
  // field contains "value"
  m = expr.match(/^(.+?)\s+contains\s+"(.+)"$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'contains', value: m[2] };
  // field match "regex"
  m = expr.match(/^(.+?)\s+match\s+"(.+)"$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'match', value: m[2] };
  // field in ("a","b")
  m = expr.match(/^(.+?)\s+in\s+\((.+)\)$/);
  if (m) {
    const vals = m[2].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    return { kind: 'context_matches', field: m[1].trim(), operator: 'in', value: vals };
  }
  // field exists
  m = expr.match(/^(.+?)\s+exists$/);
  if (m) return { kind: 'context_matches', field: m[1].trim(), operator: 'exists', value: true };
  return null;
}

let warnings = 0;
v.vectors.forEach(vec => {
  vec.rules.forEach(rule => {
    if (rule.when !== undefined) {
      rule.conditions = compileWhen(rule.when);
      if (rule.conditions.length === 0 && rule.when.trim() !== '') {
        console.log('WARNING:', vec.id, rule.id, ':', rule.when);
        warnings++;
      }
    }
  });
});

writeFileSync('C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-vectors-v1.0.json', JSON.stringify(v, null, 2), 'utf-8');
console.log(`Done. ${warnings} warnings.`);
