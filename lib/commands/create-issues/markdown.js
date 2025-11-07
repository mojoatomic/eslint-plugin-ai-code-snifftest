'use strict';

const fs = require('fs');
const path = require('path');
const { categorizeViolations } = require('../analyze/categorizer');
const { attachDomainContext } = require('../analyze/domain');

function w(p, s) { fs.writeFileSync(p, s); }

function extractNumbersFromMessages(list) {
  const nums = new Map();
  for (const r of list || []) {
    const matches = String(r.message || '').match(/-?\d+(?:\.\d+)?/g);
    if (!matches) continue;
    for (const m of matches) {
      nums.set(m, (nums.get(m) || 0) + 1);
    }
  }
  return Array.from(nums.entries()).sort((a,b)=>b[1]-a[1]).map(([v,c])=>({ value: v, count: c }));
}

function groupByDomain(list) {
  const out = {};
  for (const r of list || []) {
    const d = r.domain || 'unknown';
    if (!out[d]) out[d] = [];
    out[d].push(r);
  }
  return out;
}

function buildMarkdownSections(cats) {
  const lines = [];
  const topDomains = (cats.domainSummary || []).slice(0, 5).map(d => `- ${d.domain}: ${d.count}`).join('\n');
  if (topDomains) {
    lines.push('### Detected Domains');
    lines.push(topDomains);
    lines.push('');
  }
  // Constants by domain (from magic numbers)
  const byDom = groupByDomain(cats.magicNumbers);
  const domains = Object.keys(byDom);
  if (domains.length) {
    lines.push('### Suggested Constants by Domain');
    for (const d of domains) {
      const nums = extractNumbersFromMessages(byDom[d]);
      if (!nums.length) continue;
      lines.push(`- ${d}`);
      nums.slice(0, 10).forEach(n => lines.push(`  - ${n.value} (seen ${n.count}x)`));
    }
    lines.push('');
  }
  // Terminology section from domainTerms
  const byDomTerms = groupByDomain(cats.domainTerms);
  const termDomains = Object.keys(byDomTerms);
  if (termDomains.length) {
    lines.push('### Terminology to Review');
    for (const d of termDomains) {
      const sample = (byDomTerms[d] || []).slice(0, 5).map(r => `- ${r.message}`).join('\n');
      if (sample) {
        lines.push(`- ${d}`);
        lines.push(sample);
      }
    }
    lines.push('');
  }
  // Acceptance criteria scaffold
  lines.push('### Acceptance Criteria');
  lines.push('- [ ] Named constants exist for top recurring numeric values');
  lines.push('- [ ] Domain terminology aligns with catalog (and project conventions)');
  lines.push('- [ ] Complexity hotspots have clear refactor plans');
  lines.push('');
  return lines.join('\n');
}

function writeMarkdownIssues(outPath, cats) {
  function section(title, preface) {
    const parts = [];
    parts.push(`# ${title}`);
    parts.push('');
    if (preface) { parts.push(preface); parts.push(''); }
    parts.push(buildMarkdownSections(cats));
    return parts.join('\n');
  }
  const files = [
    { name: '01-phase1-magic-numbers.md', content: section('[Phase 1] Fix Magic Numbers', 'Describe magic number cleanup steps here.') },
    { name: '03-phase2-domain-terms.md', content: section('[Phase 2] Improve Domain Terms', 'Describe domain term cleanup here.') },
    { name: '04-phase3-complexity.md', content: section('[Phase 3] Reduce Complexity', 'Refactor complex functions here.') },
    { name: '05-phase4-architecture.md', content: section('[Phase 4] Architecture Polish', 'Tighten file/function limits and structure.') }
  ];
  files.forEach(f => w(outPath(f.name), f.content));
}

function writeJsonIndex(outPath, cats) {
  const byDom = groupByDomain(cats.magicNumbers);
  const suggestions = {};
  for (const [domain, list] of Object.entries(byDom)) {
    suggestions[domain] = { constants: extractNumbersFromMessages(list) };
  }
  const payload = {
    domainSummary: cats.domainSummary || [],
    suggestions,
    counts: cats.counts
  };
  fs.writeFileSync(outPath('index.json'), JSON.stringify(payload, null, 2) + '\n');
}

function generateIssues(cwd, outDir, eslintJson /* array */, opts = {}) {
  const outPath = (name) => path.join(cwd, outDir, name);
  const cfg = opts.cfg || {};
  let cats = categorizeViolations(eslintJson, cfg);
  cats = attachDomainContext(cats, cfg);
  if (opts.format === 'json') {
    writeJsonIndex(outPath, cats);
    return;
  }
  writeMarkdownIssues(outPath, cats);
}

function generateInstructions(cwd, outDir, { includeCmd = 'github-cli', labels = 'lint,tech-debt' } = {}) {
  const p = path.join(cwd, outDir, '00-README.md');
  const lines = [];
  lines.push('# How to Create Issues from These Files');
  lines.push('');
  lines.push('This directory contains issue files generated from ESLint analysis. It deliberately does not create tracker issues via API.');
  lines.push('');
  lines.push('## Option 1: Create Manually');
  lines.push('Copy each .md into your tracker as a new issue, edit, then submit.');
  lines.push('');
  if (includeCmd === 'github-cli') {
    lines.push('## Option 2: GitHub CLI (Bulk)');
    lines.push('```bash');
    lines.push('for file in issues/*.md; do');
    lines.push('  if [ "$file" = "issues/00-README.md" ]; then continue; fi');
    lines.push('  title=$(head -n1 "$file" | sed "s/^# //")');
    lines.push(`  gh issue create --title "$title" --body-file "$file" --label "${labels}"`);
    lines.push('done');
    lines.push('```');
  } else if (includeCmd === 'gitlab-cli') {
    lines.push('## Option 2: GitLab CLI (Bulk)');
    lines.push('```bash');
    lines.push('for file in issues/*.md; do');
    lines.push('  if [ "$file" = "issues/00-README.md" ]; then continue; fi');
    lines.push('  title=$(head -n1 "$file" | sed "s/^# //")');
    lines.push(`  glab issue create --title "$title" --description "$(cat $file)" --label "${labels}"`);
    lines.push('done');
    lines.push('```');
  }
  w(p, lines.join('\n') + '\n');
}

module.exports = { generateIssues, generateInstructions };
