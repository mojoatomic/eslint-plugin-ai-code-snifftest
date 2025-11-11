'use strict';

const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function ensureCIWorkflow(cwd) {
  try {
    const dir = path.join(cwd, '.github', 'workflows');
    const file = path.join(dir, 'ci-ratchet.yml');
    if (fs.existsSync(file)) {
      console.log('Found existing .github/workflows/ci-ratchet.yml — leaving it unchanged.');
      return false;
    }
    ensureDir(dir);
    const yaml = [
      'name: ci-ratchet',
      '',
      'on:',
      '  pull_request:',
      '  push:',
      '    branches: [main]',
      '  workflow_dispatch:',
      '',
      'jobs:',
      '  ratchet-and-tests:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '        with:',
      '          fetch-depth: 0',
      '',
      '      - uses: actions/setup-node@v4',
      '        with:',
      "          node-version: '20'",
      "          cache: 'npm'",
      '',
      '      - name: Install dependencies',
      '        run: npm ci',
      '',
      '      - name: ESLint JSON',
      '        run: npm run lint:json',
      '',
      '      - name: Analyze current',
      '        run: npm run analyze:current',
      '',
      '      - name: Ratchet (fail on new debt)',
      '        run: npm run ratchet',
      '',
      '      - name: Health gate (context-aware ratchet)',
      '        run: |',
      '          if npm run -s | grep -q "ratchet:context"; then',
      '            npm run ratchet:context',
      '          else',
      '            node scripts/ratchet.js --mode=context --baseline=analysis-baseline.json --current=analysis-current.json',
      '          fi',
      '',
      '      - name: Upload artifacts',
      '        if: always()',
      '        uses: actions/upload-artifact@v4',
      '        with:',
      '          name: analysis-and-lint-${{ github.sha }}',
      '          path: |',
      '            lint-results.json',
      '            analysis-current.json',
      '          if-no-files-found: error',
      '          retention-days: 7',
      ''
    ].join('\n');
    fs.writeFileSync(file, yaml + '\n');
    console.log('Created .github/workflows/ci-ratchet.yml');
    return true;
  } catch (e) {
    console.warn(`Warning: could not create CI workflow: ${e && e.message}`);
    return false;
  }
}

module.exports = { ensureCIWorkflow };