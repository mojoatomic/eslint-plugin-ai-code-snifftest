'use strict';

const fs = require('fs');
const path = require('path');
const { categorizeViolations } = require('../analyze/categorizer');
const { attachDomainContext } = require('../analyze/domain');

function w(p, s) { fs.writeFileSync(p, s); }

function generateIssues(cwd, outDir, eslintJson /* array */, opts = {}) {
  const outPath = (name) => path.join(cwd, outDir, name);
  const cfg = opts.cfg || {};
  let cats = categorizeViolations(eslintJson, cfg);
  cats = attachDomainContext(cats, cfg);
  const topDomains = (cats.domainSummary || []).slice(0, 5).map(d => `- ${d.domain}: ${d.count}`).join('\n');

  function section(title, body) {
    const lines = [];
    lines.push(`# ${title}`);
    lines.push('');
    if (topDomains) {
      lines.push('### Detected Domains');
      lines.push(topDomains);
      lines.push('');
    }
    lines.push(body);
    lines.push('');
    lines.push('### Next Steps');
    lines.push('- [ ] Review and confirm domain terminology and constants');
    lines.push('- [ ] Create named constants for recurring values');
    lines.push('- [ ] Add examples and acceptance criteria');
    lines.push('');
    return lines.join('\n');
  }

  const files = [
    { name: '01-phase1-magic-numbers.md', content: section('[Phase 1] Fix Magic Numbers', 'Describe magic number cleanup steps here.') },
    { name: '03-phase2-domain-terms.md', content: section('[Phase 2] Improve Domain Terms', 'Describe domain term cleanup here.') },
    { name: '04-phase3-complexity.md', content: section('[Phase 3] Reduce Complexity', 'Refactor complex functions here.') },
    { name: '05-phase4-architecture.md', content: section('[Phase 4] Architecture Polish', 'Tighten file/function limits and structure.') }
  ];
  files.forEach(f => w(outPath(f.name), f.content));
}

function generateInstructions(cwd, outDir, { includeCmd = 'github-cli', labels = 'lint,tech-debt' } = {}) {
  const p = path.join(cwd, outDir, '00-README.md');
  const lines = [];
  lines.push('# How to Create Issues from These Files');
  lines.push('');
  lines.push('This directory contains issue files generated from ESLint analysis.');
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