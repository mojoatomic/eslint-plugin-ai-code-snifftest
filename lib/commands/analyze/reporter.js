'use strict';

const fs = require('fs');

function writeAnalysisReport(outPath, { categories, effort, returnString } = {}) {
  const lines = [];
  lines.push('# Analysis Report');
  lines.push('');
  lines.push(`Errors: ${categories.counts.errors}  Warnings: ${categories.counts.warnings}  Auto-fixable: ${categories.counts.autoFixable}`);
  lines.push('');
  lines.push('## Categories');
  lines.push(`- Magic numbers: ${categories.magicNumbers.length}`);
  lines.push(`- Complexity: ${categories.complexity.length}`);
  lines.push(`- Domain terms: ${categories.domainTerms.length}`);
  lines.push(`- Architecture: ${categories.architecture.length}`);
  lines.push('');
  // Domains: restricted to configured domains
  if (Array.isArray(categories.domainSummary) && categories.domainSummary.length) {
    lines.push('## Top Domains');
    const tops = categories.domainSummary.slice(0, 5);
    tops.forEach(d => lines.push(`- ${d.domain}: ${d.count}`));
    lines.push('');
  }
  // Per-category breakdowns
  function byRule(list) {
    const m = new Map();
    for (const r of list || []) {
      const key = String(r.ruleId || 'unknown');
      m.set(key, (m.get(key) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }
  function topFiles(list, limit = 10) {
    const m = new Map();
    for (const r of list || []) {
      const k = String(r.filePath || 'unknown');
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0, limit);
  }
  function sample(list, n = 5) { return (list || []).slice(0, n); }

  const sections = [
    ['Complexity', categories.complexity],
    ['Architecture', categories.architecture],
    ['Domain terms', categories.domainTerms],
    ['Magic numbers', categories.magicNumbers]
  ];
  for (const [name, list] of sections) {
    lines.push(`## ${name} (${list.length})`);
    const rules = byRule(list);
    if (rules.length) {
      lines.push('### By rule');
      rules.slice(0, 10).forEach(([rule, count]) => lines.push(`- ${rule}: ${count}`));
      lines.push('');
    }
    const files = topFiles(list, 10);
    if (files.length) {
      lines.push('### Top files');
      files.forEach(([f, count]) => lines.push(`- ${f}: ${count}`));
      lines.push('');
    }
    const examples = sample(list, 5);
    if (examples.length) {
      lines.push('### Examples');
      examples.forEach(r => lines.push(`- ${r.filePath}:${r.line || 0} ${r.ruleId} → ${r.message}`));
      lines.push('');
    }
  }

  lines.push('## Effort (rough estimate)');
  lines.push(`- Hours: ${effort.hours}`);
  lines.push(`- Days: ${effort.days}`);
  lines.push(`- Weeks: ${effort.weeks}`);
  if (effort.byCategory) {
    lines.push('');
    lines.push('### Effort by category (hours)');
    lines.push(`- Complexity: ${effort.byCategory.complexity}`);
    lines.push(`- Architecture: ${effort.byCategory.architecture}`);
    lines.push(`- Domain terms: ${effort.byCategory.domainTerms}`);
    lines.push(`- Magic numbers: ${effort.byCategory.magicNumbers}`);
  }
  lines.push('');
  lines.push('## Prioritization (impact × effort heuristic)');
  const impact = [
    ['Complexity', categories.complexity.length, effort.byCategory?.complexity || 0],
    ['Architecture', categories.architecture.length, effort.byCategory?.architecture || 0],
    ['Domain terms', categories.domainTerms.length, effort.byCategory?.domainTerms || 0],
    ['Magic numbers', categories.magicNumbers.length, effort.byCategory?.magicNumbers || 0]
  ];
  impact.sort((a, b) => (b[1] - a[1]) || (a[2] - b[2]));
  impact.forEach(([n, c, h]) => lines.push(`- ${n}: count=${c}, est=${h}h`));
  lines.push('');

  lines.push('Note: Domains are constrained to your configuration (domains.primary/additional).');

  const content = lines.join('\n') + '\n';
  if (returnString) return content;
  fs.writeFileSync(outPath, content);
}

module.exports = { writeAnalysisReport };