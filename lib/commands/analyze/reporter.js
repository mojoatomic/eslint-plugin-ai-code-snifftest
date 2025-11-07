'use strict';

const fs = require('fs');
const path = require('path');

function writeAnalysisReport(outPath, { categories, effort, returnString, topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
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

  // Configured domains (from .ai-coding-guide.json)
  const primary = cfg && cfg.domains && cfg.domains.primary;
  const additional = (cfg && cfg.domains && Array.isArray(cfg.domains.additional)) ? cfg.domains.additional : [];
  if (primary || (additional && additional.length)) {
    lines.push('## Configured Domains');
    if (primary) lines.push(`- ${primary} (primary)`);
    for (const d of additional) lines.push(`- ${d} (additional)`);
    lines.push('');

    // Summarize domain-term violations at a high level (no per-domain counts)
    lines.push('### Domain term violations');
    lines.push(`- Total: ${categories.domainTerms.length}`);
    lines.push('- See AGENTS.md for project terminology.');
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
  function topFilesFn(list, limit = 10, min = 1) {
    const m = new Map();
    for (const r of list || []) {
      const k = String(r.filePath || 'unknown');
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).filter(([,c]) => c >= min).sort((a,b)=>b[1]-a[1]).slice(0, limit);
  }
  function sample(list, n = 5) { return (list || []).slice(0, n); }
  function readSnippet(filePath, line, context = 2) {
    try {
      const p = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      const content = fs.readFileSync(p, 'utf8');
      const rows = content.split(/\r?\n/);
      const idx = Math.max(0, (Number(line) || 1) - 1);
      const start = Math.max(0, idx - context);
      const end = Math.min(rows.length, idx + context + 1);
      return rows.slice(start, end).join('\n');
    } catch (_) {
      return null;
    }
  }

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
    const files = topFilesFn(list, topFiles, minCount);
    if (files.length) {
      lines.push('### Top files');
      files.forEach(([f, count]) => lines.push(`- ${f}: ${count}`));
      lines.push('');
    }
    const examples = sample(list, maxExamples);
    if (examples.length) {
      lines.push('### Examples');
      examples.forEach(r => {
        lines.push(`- ${r.filePath}:${r.line || 0} ${r.ruleId} → ${r.message}`);
        const snippet = readSnippet(r.filePath, r.line, 2);
        if (snippet) {
          lines.push('');
          lines.push('```js');
          lines.push(snippet);
          lines.push('```');
          lines.push('');
        }
      });
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
