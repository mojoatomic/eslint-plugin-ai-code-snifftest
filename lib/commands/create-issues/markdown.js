'use strict';

const fs = require('fs');
const path = require('path');
const { categorizeViolations } = require('../analyze/categorizer');

function w(p, s) { fs.writeFileSync(p, s); }

function generateIssues(cwd, outDir, eslintJson /* array */, opts = {}) {
  const outPath = (name) => path.join(cwd, outDir, name);
  const cats = categorizeViolations(eslintJson, {});
  // Minimal initial files
  const files = [
    { name: '01-phase1-magic-numbers.md', content: '# [Phase 1] Fix Magic Numbers\n\nDescribe magic number cleanup steps here.\n' },
    { name: '03-phase2-domain-terms.md', content: '# [Phase 2] Improve Domain Terms\n\nDescribe domain term cleanup here.\n' },
    { name: '04-phase3-complexity.md', content: '# [Phase 3] Reduce Complexity\n\nRefactor complex functions here.\n' },
    { name: '05-phase4-architecture.md', content: '# [Phase 4] Architecture Polish\n\nTighten file/function limits and structure.\n' }
  ];
  files.forEach(f => w(outPath(f.name), f.content));
}

function generateInstructions(cwd, outDir, { includeCmd = 'github-cli' } = {}) {
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
    lines.push('  gh issue create --title "$title" --body-file "$file" --label "lint,tech-debt"');
    lines.push('done');
    lines.push('```');
  } else if (includeCmd === 'gitlab-cli') {
    lines.push('## Option 2: GitLab CLI (Bulk)');
    lines.push('```bash');
    lines.push('for file in issues/*.md; do');
    lines.push('  if [ "$file" = "issues/00-README.md" ]; then continue; fi');
    lines.push('  title=$(head -n1 "$file" | sed "s/^# //")');
    lines.push('  glab issue create --title "$title" --description "$(cat $file)" --label "lint,tech-debt"');
    lines.push('done');
    lines.push('```');
  }
  w(p, lines.join('\n') + '\n');
}

module.exports = { generateIssues, generateInstructions };