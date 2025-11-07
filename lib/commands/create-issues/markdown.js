'use strict';

const fs = require('fs');
const path = require('path');
const { categorizeViolations } = require('../analyze/categorizer');
const { attachDomainContext, getDomainHints } = require('../analyze/domain');

function w(p, s) { fs.writeFileSync(p, s); }

function clip(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function readSnippet(filePath, line, context = 2) {
  try {
    const p = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const content = fs.readFileSync(p, 'utf8');
    const rows = content.split(/\r?\n/);
    const idx = Math.max(0, (Number(line) || 1) - 1);
    const start = Math.max(0, idx - context);
    const end = Math.min(rows.length, idx + context + 1);
    return rows.slice(start, end).join('\n');
  } catch (err) {
    return null;
  }
}

function examplesForDomainTerms(list, limit = 5) {
  const out = [];
  for (const r of list || []) {
    const msg = String(r.message || '');
    let fromTo = null;
    const prefer = msg.match(/Prefer\s+(\w+)\s+over\s+(\w+)/i);
    if (prefer) fromTo = `${prefer[2]} → ${prefer[1]}`;
    const generic = msg.match(/Generic name "([^"]+)"/i);
    if (!fromTo && generic) fromTo = `${generic[1]} → (domain-specific)`;
    if (fromTo) out.push({ text: `- ${fromTo}`, filePath: r.filePath, line: r.line });
    if (out.length >= limit) break;
  }
  return out;
}
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

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg } = {}) {
  const lines = [];

  // Configured domains (no counts, no hints when configured)
  const primary = cfg && cfg.domains && cfg.domains.primary;
  const additional = (cfg && cfg.domains && Array.isArray(cfg.domains.additional)) ? cfg.domains.additional : [];
  if (primary || (additional && additional.length)) {
    lines.push('### Configured Domains');
    if (primary) lines.push(`- ${primary} (primary)`);
    for (const d of additional) lines.push(`- ${d} (additional)`);
    lines.push('');
  } else {
    // Only when no configured domains, fall back to detected + hints
    const ds = Array.isArray(cats.domainSummary) ? cats.domainSummary.slice(0, 5) : [];
    const topDomains = ds.map(d => `- ${d.domain}: ${d.count}`).join('\n');
    if (topDomains) {
      lines.push('### Detected Domains');
      lines.push(topDomains);
      lines.push('');
      const allZero = ds.length > 0 && ds.every(d => (d.count || 0) === 0);
      if (allZero) {
        const hints = getDomainHints(cats, cfg) || [];
        if (hints.length) {
          lines.push('### Domain Hints');
          hints.forEach(h => lines.push(`- ${h.domain}: ${h.count}`));
          lines.push('');
        }
      }
    }
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
        const sample = (byDomTerms[d] || []).slice(0, Math.min(5, maxExamples || 5)).map(r => `- ${r.message}`).join('\n');
        if (sample) {
          lines.push(`- ${d}`);
          lines.push(sample);
        }
      }
      lines.push('');
    }
    const examples = examplesForDomainTerms(cats.domainTerms, Math.min(5, maxExamples || 5));
    if (examples.length) {
      lines.push('### Examples');
      for (const ex of examples) {
        lines.push(ex.text);
        const snip = readSnippet(ex.filePath, ex.line, 2);
        if (snip) {
          lines.push('');
          lines.push('```js');
          lines.push(snip);
          lines.push('```');
          lines.push('');
        }
      }
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
    const list = (cats.complexity || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
      for (const r of list) {
        lines.push(`- ${r.filePath}:${r.line || 0} ${r.ruleId} → ${r.message}`);
        const snip = readSnippet(r.filePath, r.line, 2);
        if (snip) {
          lines.push('');
          lines.push('```js');
          lines.push(snip);
          lines.push('```');
          lines.push('');
        }
      }
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
    const list = (cats.architecture || []).slice(0, Math.min(5, maxExamples || 5));
    if (list.length) {
      lines.push('### Examples');
      for (const r of list) {
        lines.push(`- ${r.filePath}:${r.line || 0} ${r.ruleId} → ${r.message}`);
        const snip = readSnippet(r.filePath, r.line, 2);
        if (snip) {
          lines.push('');
          lines.push('```js');
          lines.push(snip);
          lines.push('```');
          lines.push('');
        }
      }
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
  writeMarkdownIssues(outPath, cats, { topFiles: opts.topFiles, minCount: opts.minCount, maxExamples: opts.maxExamples, cfg });
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
