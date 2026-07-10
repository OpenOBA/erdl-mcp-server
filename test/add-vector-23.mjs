import { readFileSync, writeFileSync } from 'fs';
const v = JSON.parse(readFileSync('C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-vectors-v1.0.json','utf-8'));

v.vectors.push({
  id: 'DO-023',
  category: 'auto-correction',
  scenario: 'An insurance claims Agent attempts to route a claim for auto-approval but the amount exceeds the delegated authority threshold. The compliance rule triggers automatic correction — redirecting to manual review with an adjusted workflow flag.',
  rules: [
    {
      id: 'INS-CORRECT-001',
      name: 'auto_approval_cap_correction',
      description: 'Claims exceeding the auto-approval threshold must be redirected to manual review via correction',
      category: 'compliance',
      triggers: ['claim_decision'],
      when: 'claim.amount > 5000',
      then: 'CORRECT "claim exceeds auto-approval cap — redirecting to manual review queue"',
      priority: 2,
      enabled: true,
      ring: 1,
      conditions: [
        { kind: 'context_matches', field: 'claim.amount', operator: 'gt', value: 5000 }
      ]
    }
  ],
  context: { 'tool.name': 'claim_decision', 'claim.id': 'CLM-20260710-0123', 'claim.amount': 7500, 'claim.type': 'auto_body' },
  expected: {
    decision: 'CORRECT',
    matchedRules: [
      { ruleId: 'INS-CORRECT-001', decision: 'CORRECT', correction: 'claim exceeds auto-approval cap — redirecting to manual review queue', ring: 1 }
    ],
    totalEvaluated: 1,
    totalMatched: 1
  }
});

writeFileSync('C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-vectors-v1.0.json', JSON.stringify(v, null, 2), 'utf-8');
console.log('Added DO-023. Total vectors:', v.vectors.length);

// Update spec docs to reflect 23 vectors
const specFiles = [
  'C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-v1.0.md',
  'C:/Users/99tan/openoba/repos/erdl-landing/spec/decision-object-v1.0.en.md'
];
specFiles.forEach(f => {
  let s = readFileSync(f, 'utf-8');
  s = s.replace(/\*\*22\s+cross-implementation/g, '**23 cross-implementation');
  s = s.replace(/\*\*22\s+条跨实现/g, '**23 条跨实现');
  s = s.replace(/22 cross-implementation vectors/g, '23 cross-implementation vectors');
  s = s.replace(/22 条跨实现测试向量/g, '23 条跨实现测试向量');
  s = s.replace(/22 条合规向量/g, '23 条合规向量');
  s = s.replace(/22条/g, '23条');
  s = s.replace(/22 vectors/g, '23 vectors');
  writeFileSync(f, s, 'utf-8');
});
console.log('Spec count updated to 23.');
