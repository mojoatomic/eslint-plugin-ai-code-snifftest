'use strict';

const fs = require('fs');

function countByRule(list) {
  const m = new Map();
  for (const r of list || []) {
    const k = String(r.ruleId || 'unknown');
    m.set(k, (m.get(k) || 0) + 1);
  }
  return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]);
}

function topFiles(list, limit = 10) {
  const m = new Map();
  for (const r of list || []) {
    const k = String(r.filePath || 'unknown');
    m.set(k, (m.get(k) || 0) + 1);
  }
  return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0, limit);
}

function writeRoadmap(outPath, { phases, categories } = {}) {
  const lines = [];
  lines.push('# FIXES Roadmap');
  lines.push('');
  // Quick summary
  lines.push('## Summary');
  lines.push(`- Total complexity: ${categories.complexity.length}`);
  lines.push(`- Total architecture: ${categories.architecture.length}`);
  lines.push(`- Total domain terms: ${categories.domainTerms.length}`);
  lines.push(`- Total magic numbers: ${categories.magicNumbers.length}`);
  lines.push('');

  phases.forEach((ph, idx) => {
    lines.push(`## Phase ${idx + 1}: ${ph.name}`);
    lines.push(`Items: ${ph.items.length}`);
    lines.push('');
    if (ph.name === 'Quick Wins') {
      const fixable = categories.counts?.autoFixable || 0;
      lines.push('### Tasks');
      lines.push(`- [ ] Run auto-fix: npx eslint --fix .  (est ~5-10m)  — fixes ~${fixable} issues`);
      lines.push('- [ ] Re-run analysis to update counts');
      lines.push('');
      lines.push('### Success Metrics');
      lines.push(`- Auto-fix reduced violations by ~${fixable}`);
      lines.push('');
    }
    if (ph.name === 'Domain Cleanup') {
      lines.push('### Tasks');
      const termRules = countByRule(categories.domainTerms).slice(0, 5);
      termRules.forEach(([rule, count]) => lines.push(`- [ ] Tidy ${rule} (top ${count})`));
      const files = topFiles(categories.domainTerms, 5);
      if (files.length) {
        lines.push('### Top Files');
        files.forEach(([f, count]) => lines.push(`- ${f}: ${count}`));
      }
      lines.push('');
      lines.push('### Success Metrics');
      lines.push('- Domain-term rule counts reduced by 80%');
      lines.push('');
    }
    if (ph.name === 'Refactoring') {
      lines.push('### Tasks');
      const rules = countByRule(categories.complexity).slice(0, 5);
      rules.forEach(([rule, count]) => lines.push(`- [ ] Reduce ${rule} (top ${count})`));
      const files = topFiles(categories.complexity, 5);
      if (files.length) {
        lines.push('### Top Files');
        files.forEach(([f, count]) => lines.push(`- ${f}: ${count}`));
      }
      lines.push('');
      lines.push('### Success Metrics');
      lines.push('- Complexity rule counts below thresholds');
      lines.push('');
    }
    if (ph.name === 'Polish') {
      lines.push('### Tasks');
      const rules = countByRule(categories.architecture).slice(0, 5);
      rules.forEach(([rule, count]) => lines.push(`- [ ] Tidy ${rule} (top ${count})`));
      const files = topFiles(categories.architecture, 5);
      if (files.length) {
        lines.push('### Top Files');
        files.forEach(([f, count]) => lines.push(`- ${f}: ${count}`));
      }
      lines.push('');
      lines.push('### Success Metrics');
      lines.push('- Architecture rule counts within configured limits');
      lines.push('');
    }
  });
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
}

module.exports = { writeRoadmap };
