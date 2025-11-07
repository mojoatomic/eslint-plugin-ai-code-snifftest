'use strict';

function push(map, key, item) {
  if (!map[key]) map[key] = [];
  map[key].push(item);
}

function categorizeViolations(eslintJson /* array */, cfg) {
  const out = {
    magicNumbers: [],
    complexity: [],
    domainTerms: [],
    architecture: [],
    counts: { errors: 0, warnings: 0, autoFixable: 0 }
  };
  const files = Array.isArray(eslintJson) ? eslintJson : [];
  for (const f of files) {
    const messages = Array.isArray(f && f.messages) ? f.messages : [];
    for (const m of messages) {
      const rule = String(m.ruleId || '').toLowerCase();
      if (m.severity === 2) out.counts.errors += 1; else out.counts.warnings += 1;
      if (m.fix) out.counts.autoFixable += 1;
      const rec = { filePath: f.filePath, message: m.message, ruleId: m.ruleId, line: m.line, column: m.column };
      if (rule.includes('no-redundant-calculations')) push(out, 'magicNumbers', rec);
      else if (rule === 'complexity' || rule.includes('max-lines-per-function') || rule.includes('max-statements')) push(out, 'complexity', rec);
      else if (rule.includes('enforce-domain-terms') || rule.includes('no-generic-names')) push(out, 'domainTerms', rec);
      else if (rule.includes('max-lines') || rule.includes('max-params') || rule.includes('max-depth')) push(out, 'architecture', rec);
    }
  }
  return out;
}

module.exports = { categorizeViolations };