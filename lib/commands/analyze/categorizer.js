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
    // Use file-level fixable counts when available for accurate totals
    const fileFixable = (f && ((f.fixableWarningCount || 0) + (f.fixableErrorCount || 0))) || 0;
    let usedFileFixable = false;
    if (fileFixable > 0) {
      out.counts.autoFixable += fileFixable;
      usedFileFixable = true;
    }
    const messages = Array.isArray(f && f.messages) ? f.messages : [];
    for (const m of messages) {
      const rule = String(m.ruleId || '').toLowerCase();
      if (m.severity === 2) out.counts.errors += 1; else out.counts.warnings += 1;
      if (m.fix && !usedFileFixable) out.counts.autoFixable += 1;
      const rec = { filePath: f.filePath, message: m.message, ruleId: m.ruleId, line: m.line, column: m.column };
      const isMagic = rule.includes('no-redundant-calculations');
      const isComplexity = rule === 'complexity' || rule.includes('prefer-simpler-logic') || rule.includes('no-equivalent-branches') || rule.includes('no-redundant-conditionals');
      const isDomainTerms = rule.includes('enforce-domain-terms') || rule.includes('no-generic-names');
      const isArch = rule.includes('max-lines') || rule.includes('max-lines-per-function') || rule.includes('max-statements') || rule.includes('max-depth') || rule.includes('max-params');
      if (isMagic) push(out, 'magicNumbers', rec);
      else if (isComplexity) push(out, 'complexity', rec);
      else if (isDomainTerms) push(out, 'domainTerms', rec);
      else if (isArch) push(out, 'architecture', rec);
    }
  }
  return out;
}

module.exports = { categorizeViolations };