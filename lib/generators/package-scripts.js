'use strict';

const fs = require('fs');
const path = require('path');

function ensurePackageScripts(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  let changed = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};

    const want = {
      'lint': 'eslint .',
      'lint:ci': 'eslint . || true',
      'lint:json': 'eslint . -f json -o lint-results.json',
      'analyze:current': 'eslint-plugin-ai-code-snifftest analyze --input=lint-results.json --format=json --output=analysis-current.json',
      'ratchet': 'eslint-plugin-ai-code-snifftest ratchet',
      'ratchet:context': 'eslint-plugin-ai-code-snifftest ratchet --mode=context',
      'ci:ratchet': 'npm run lint:json && npm run analyze:current && npm run ratchet'
    };

    for (const [k, v] of Object.entries(want)) {
      if (!pkg.scripts[k]) {
        pkg.scripts[k] = v;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('Updated package.json with CI-safe lint and ratchet scripts.');
    }
    return changed;
  } catch (e) {
    console.warn(`Warning: could not update package.json scripts: ${e && e.message}`);
    return false;
  }
}

module.exports = { ensurePackageScripts };