'use strict';

const fs = require('fs');
const path = require('path');
const { categorizeViolations } = require('../analyze/categorizer');
const { attachDomainContext } = require('../analyze/domain');

function w(p, s) { fs.writeFileSync(p, s); }

function clip(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

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

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1 } = {}) {
  const lines = [];
  const topDomains = (cats.domainSummary || []).slice(0, 5).map(d => `- ${d.domain}: ${d.count}`).join('\n');
  if (topDomains) {
    lines.push('### Detected Domains');
    lines.push(topDomains);
    lines.push('');
  }
  const includeMagic = !which || which === 'magic';
  const includeTerms = !which || which === 'terms';
  const includeComplexity = !which || which === 'complexity';
  const includeArch = !which || which === 'architecture';

  if (includeMagic) {
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
  }

  if (includeTerms) {
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
  }

  if (includeComplexity) {
    const files = new Map();
    (cats.complexity || []).forEach(r => files.set(r.filePath, (files.get(r.filePath) || 0) + 1));
    const top = Array.from(files.entries()).filter(([,c]) => c >= minCount).sort((a,b)=>b[1]-a[1]).slice(0, clip(topFiles,1,50));
    if (top.length) {
      lines.push('### Complexity Hotspots (top files)');
      top.forEach(([f, c]) => lines.push(`- ${f}: ${c}`));
      lines.push('');
    }
  }

  if (includeArch) {
    const files = new Map();
    (cats.architecture || []).forEach(r => files.set(r.filePath, (files.get(r.filePath) || 0) + 1));
    const top = Array.from(files.entries()).filter(([,c]) => c >= minCount).sort((a,b)=>b[1]-a[1]).slice(0, clip(topFiles,1,50));
    if (top.length) {
      lines.push('### Architecture Hotspots (top files)');
      top.forEach(([f, c]) => lines.push(`- ${f}: ${c}`));
      lines.push('');
    }
  }

  lines.push('### Acceptance Criteria');
  lines.push('- [ ] Named constants exist for top recurring numeric values');
  lines.push('- [ ] Domain terminology aligns with catalog (and project conventions)');
  lines.push('- [ ] Complexity hotspots have clear refactor plans');
  lines.push('- [ ] Architecture limits are respected');
  lines.push('');
  return lines.join('\n');
}

function writeMarkdownIssues(outPath, cats, opts = {}) {
  function section(title, preface, which) {
    const parts = [];
    parts.push(`# ${title}`);
    parts.push('');
    if (preface) { parts.push(preface); parts.push(''); }
    parts.push(buildMarkdownSections(cats, which, opts));
    return parts.join('\n');
  }
  const files = [
    { name: '01-phase1-magic-numbers.md', content: section('[Phase 1] Fix Magic Numbers', 'Replace repeated numeric literals with named constants.', 'magic') },
    { name: '02-phase1-auto-fix.md', content: section('[Phase 1] Auto-fix Sweep', 'Run ESLint auto-fix to resolve straightforward issues (quotes, formatting, etc.).\n\n```bash\nnpx eslint --fix .\n```\n', null) },
    { name: '03-phase2-domain-terms.md', content: section('[Phase 2] Improve Domain Terms', 'Align terminology with configured domains.', 'terms') },
    { name: '04-phase3-complexity.md', content: section('[Phase 3] Reduce Complexity', 'Refactor complex functions and simplify logic.', 'complexity') },
    { name: '05-phase4-architecture.md', content: section('[Phase 4] Architecture Polish', 'Ensure file/function/params limits are respected.', 'architecture') }
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
  writeMarkdownIssues(outPath, cats, { topFiles: opts.topFiles, minCount: opts.minCount });
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
