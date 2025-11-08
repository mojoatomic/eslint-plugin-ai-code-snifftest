'use strict';

const fs = require('fs');
const path = require('path');
const { categorizeViolations } = require('../analyze/categorizer');
const { attachDomainContext, getDomainHints } = require('../analyze/domain');

function w(p, s) { fs.writeFileSync(p, s); }

function clip(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function rel(filePath) {
  try {
    const cwd = process.cwd().replace(/\\+/g, '/');
    const norm = String(filePath || '').replace(/\\+/g, '/');
    return norm.startsWith(cwd + '/') ? norm.slice(cwd.length + 1) : norm;
  } catch { return filePath; }
}

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

// --- small helpers to reduce complexity & function size ---
function byRule(listLocal) {
  const m = new Map();
  for (const r of listLocal || []) {
    const key = String(r.ruleId || 'unknown');
    m.set(key, (m.get(key) || 0) + 1);
  }
  return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]);
}

function selectList(cats, which) {
  const map = {
    magic: cats.magicNumbers || [],
    terms: cats.domainTerms || [],
    complexity: cats.complexity || [],
    architecture: cats.architecture || []
  };
  if (!which) return ([]).concat(map.magic, map.terms, map.complexity, map.architecture);
  return map[which] || ([]).concat(map.magic, map.terms, map.complexity, map.architecture);
}

function pushConfiguredDomains(lines, primary, additional) {
  lines.push('### Configured Domains');
  if (primary) lines.push(`- ${primary} (primary)`);
  for (const d of additional) lines.push(`- ${d} (additional)`);
  lines.push('');
}

function pushDetectedDomains(lines, cats, cfg) {
  const ds = Array.isArray(cats.domainSummary) ? cats.domainSummary.slice(0, 5) : [];
  const topDomains = ds.map(d => `- ${d.domain}: ${d.count}`).join('\n');
  if (!topDomains) return;
  lines.push('### Detected Domains');
  lines.push(topDomains);
  lines.push('');
  const allZero = ds.length > 0 && ds.every(d => (d.count || 0) === 0);
  if (!allZero) return;
  const hints = getDomainHints(cats, cfg) || [];
  if (!hints.length) return;
  lines.push('### Domain Hints');
  hints.forEach(h => lines.push(`- ${h.domain}: ${h.count}`));
  lines.push('');
}

function addConfiguredDomainsSection(lines, cats, cfg) {
  const primary = cfg && cfg.domains && cfg.domains.primary;
  const additional = (cfg && cfg.domains && Array.isArray(cfg.domains.additional)) ? cfg.domains.additional : [];
  if (primary || (additional && additional.length)) {
    pushConfiguredDomains(lines, primary, additional);
  } else {
    pushDetectedDomains(lines, cats, cfg);
  }
}

function getEffortHours(which, analysis) {
  try {
    const byCat = analysis && (analysis.effort?.byCategory || analysis.categories?.effortByCategory || null);
    const key = which === 'magic' ? 'magicNumbers' : which === 'terms' ? 'domainTerms' : which;
    const v = byCat && (byCat[key] || byCat[key] === 0) ? byCat[key] : null;
    return typeof v === 'number' ? v : null;
  } catch {
    return null;
  }
}

function addSummarySection(lines, which, list, analysis) {
  const uniqueFiles = Array.from(new Set(list.map(r => rel(r.filePath))));
  const count = list.length;
  const effortHours = getEffortHours(which, analysis);
  lines.push('## Summary');
  if (count > 0) {
    lines.push(`${count} violations found across ${uniqueFiles.length} file(s).`);
    if (typeof effortHours === 'number') {
      const days = (effortHours/8).toFixed(1);
      lines.push(`Estimated effort: ${effortHours} hours (~${days} days)`);
    }
    const priority = which === 'complexity' ? 'High' : which === 'terms' ? 'High' : which === 'architecture' ? 'Medium' : 'Low';
    lines.push('');
    lines.push(`**Priority:** ${priority} (${which || 'all'})`);
    lines.push('');
  } else {
    lines.push('0 violations in this category.');
    lines.push('');
  }
}

function addMagicNumbersSection(lines, cats, includeMagic) {
  if (!includeMagic) return;
  const byDom = groupByDomain(cats.magicNumbers);
  const domains = Object.keys(byDom);
  if (!domains.length) return;
  lines.push('### Suggested Constants by Domain');
  for (const d of domains) {
    const nums = extractNumbersFromMessages(byDom[d]);
    if (!nums.length) continue;
    lines.push(`- ${d}`);
    nums.slice(0, 10).forEach(n => lines.push(`  - ${n.value} (seen ${n.count}x)`));
  }
  lines.push('');
}

function addByRuleSection(lines, list) {
  const rules = byRule(list).slice(0,5);
  if (!rules.length) return;
  lines.push('## Violations Breakdown');
  lines.push('');
  lines.push('### By Rule');
  rules.forEach(([rule, c])=>lines.push(`- \`${rule}\`: ${c} occurrences`));
  lines.push('');
}

function addDomainTermsSection(lines, cats, primary, maxExamples) {
  const termList = cats.domainTerms || [];
  if (termList.length) {
    const nameCounts = new Map();
    for (const r of termList) {
      const msg = String(r.message || '');
      const m = msg.match(/Generic name\s+"([^"]+)"/i);
      if (m && m[1]) nameCounts.set(m[1], (nameCounts.get(m[1])||0)+1);
    }
    if (nameCounts.size) {
      lines.push('### By Generic Name');
      const dom = (primary || '').toLowerCase();
      const SUGGESTIONS = {
        'dev-tools': {
          result: ['ruleResult','validationResult','parseResult'],
          arr: ['violations','rules','constants'],
          list: ['violationList','ruleList','constantList'],
          data: ['ruleData','configData','parserData']
        },
        'cli': {
          result: ['commandResult','executionResult'],
          arr: ['commands','arguments','options'],
          list: ['commandList','argumentList']
        },
        'linting': {
          result: ['lintResult','analysisResult'],
          arr: ['violations','warnings','errors'],
          list: ['violationList','warningList']
        }
      };
      const sorted = Array.from(nameCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
      for (const [n,cnt] of sorted) {
        const sug = (SUGGESTIONS[dom] && SUGGESTIONS[dom][n]) || [];
        const suffix = sug.length ? ` → ${sug.join(', ')}` : '';
        lines.push(`- \`${n}\`: ${cnt} occurrences${suffix}`);
      }
      lines.push('');
    }
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

function addTopFilesAffected(lines, list, topFiles) {
  const m = new Map();
  for (const r of list) {
    const k = rel(r.filePath);
    const fileViolations = m.get(k) || [];
    fileViolations.push(r);
    m.set(k, fileViolations);
  }
  const top = Array.from(m.entries()).map(([f, fileViolations])=>[f, fileViolations]).sort((a,b)=>b[1].length - a[1].length).slice(0, Math.min(10, topFiles||10));
  if (!top.length) return;
  lines.push('## Top Files Affected');
  let i = 1;
  for (const [f, fileViolations] of top) {
    lines.push(`${i}. \`${f}\`: ${fileViolations.length} violations`);
    const detail = fileViolations.slice(0,3).map(v=>`   - Line ${v.line || 0}: ${v.message}`).join('\n');
    if (detail) lines.push(detail);
    lines.push('');
    i++;
  }
}

function addCategoryTopFiles(lines, title, list, topFiles, minCount) {
  const files = new Map();
  (list || []).forEach(r => files.set(r.filePath, (files.get(r.filePath) || 0) + 1));
  const top = Array.from(files.entries()).filter(([,c]) => c >= minCount).sort((a,b)=>b[1]-a[1]).slice(0, clip(topFiles,1,50));
  if (!top.length) return;
  lines.push(title);
  top.forEach(([f, c]) => lines.push(`- ${f}: ${c}`));
  lines.push('');
}

function addExamplesWithSuggestion(lines, list, maxExamples, suggestionLine) {
  const ex = (list || []).slice(0, Math.min(5, maxExamples || 5));
  if (!ex.length) return;
  lines.push('### Examples');
  for (const r of ex) {
    lines.push(`- ${rel(r.filePath)}:${r.line || 0} ${r.ruleId} → ${r.message}`);
    const code = r.source || readSnippet(r.filePath, r.line, 2);
    if (code) {
      lines.push('');
      lines.push('```js');
      lines.push(code);
      lines.push('```');
      lines.push('');
    }
  }
  if (suggestionLine) {
    lines.push(suggestionLine);
    lines.push('');
  }
}

function addFixStrategy(lines, which) {
  lines.push('## Fix Strategy');
  if (which === 'magic') {
    lines.push('- Extract repeated numeric literals into named constants.');
    lines.push('- Centralize common units/time/geometry values.');
  } else if (which === 'terms') {
    lines.push('- Replace generic names with domain-appropriate terms (see suggestions above).');
    lines.push('- Apply changes consistently per file to avoid mixed terminology.');
  } else if (which === 'complexity') {
    lines.push('- Use orchestration shells and strategy maps to reduce branching.');
    lines.push('- Extract helpers from long functions; use guard clauses.');
  } else if (which === 'architecture') {
    lines.push('- Enforce function/file limits from .ai-coding-guide.json.');
    lines.push('- Split by feature; keep orchestrators thin.');
  }
  lines.push('');
}

function addVerification(lines) {
  lines.push('## Verification');
  lines.push('```bash');
  lines.push('npx eslint . --format json > lint-results.json');
  lines.push('npx eslint-plugin-ai-code-snifftest analyze --input=lint-results.json');
  lines.push('```');
  lines.push('');
}

function addAcceptanceCriteria(lines, count) {
  const targetDown = count ? Math.max(0, Math.ceil(count*0.2)) : 0;
  lines.push('## Acceptance Criteria');
  lines.push(`- [ ] Violations reduced: ${count} → ${targetDown} (or 0)`);
  lines.push('- [ ] Top 5 files addressed');
  lines.push('- [ ] Tests green: npm test');
  lines.push('- [ ] Patterns in AGENTS.md followed');
  lines.push('');
}

function buildMarkdownSections(cats, which /* 'magic'|'terms'|'complexity'|'architecture'|null */, { topFiles = 10, minCount = 1, maxExamples = 5, cfg, analysis } = {}) {
  const lines = [];

  // Domains
  addConfiguredDomainsSection(lines, cats, cfg);

  // Summary
  const list = selectList(cats, which);
  addSummarySection(lines, which, list, analysis);

  const includeMagic = !which || which === 'magic';
  const includeTerms = !which || which === 'terms';
  const includeComplexity = !which || which === 'complexity';
  const includeArch = !which || which === 'architecture';

  // Magic numbers (by domain suggestions)
  addMagicNumbersSection(lines, cats, includeMagic);

  // By Rule
  if (list.length) addByRuleSection(lines, list);

  // Domain terms details
  if (includeTerms) {
    const primary = cfg && cfg.domains && cfg.domains.primary;
    addDomainTermsSection(lines, cats, primary, maxExamples);
  }

  // Top files affected (selected category)
  if (list.length) addTopFilesAffected(lines, list, topFiles);

  // Complexity hotspots + examples
  if (includeComplexity) {
    addCategoryTopFiles(lines, '### Complexity Hotspots (top files)', cats.complexity, topFiles, minCount);
    addExamplesWithSuggestion(
      lines,
      cats.complexity,
      maxExamples,
      'Suggested Fix: Extract helpers, use guard clauses, and prefer a command map to reduce branching.'
    );
  }

  // Architecture hotspots + examples
  if (includeArch) {
    addCategoryTopFiles(lines, '### Architecture Hotspots (top files)', cats.architecture, topFiles, minCount);
    addExamplesWithSuggestion(
      lines,
      cats.architecture,
      maxExamples,
      'Suggested Fix: Split monolithic functions/files; enforce limits from .ai-coding-guide.json.'
    );
  }

  // Fix Strategy, Verification, Acceptance
  addFixStrategy(lines, which);
  addVerification(lines);
  addAcceptanceCriteria(lines, list.length);

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
  writeMarkdownIssues(outPath, cats, { topFiles: opts.topFiles, minCount: opts.minCount, maxExamples: opts.maxExamples, cfg, analysis: opts.analysis });
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
