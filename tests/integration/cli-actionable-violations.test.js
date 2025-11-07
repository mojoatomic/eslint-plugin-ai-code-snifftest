/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function writeLintJson(tmpDir) {
  const sample = [
    {
      filePath: 'astro.js',
      messages: [
        { ruleId: 'ai-code-snifftest/no-redundant-calculations', severity: 1, message: 'Use named constant instead of 365.25' },
        { ruleId: 'ai-code-snifftest/enforce-domain-terms', severity: 1, message: 'Prefer ecliptic over plane' },
        { ruleId: 'complexity', severity: 2, message: 'Function has a complexity of 12. Maximum allowed is 10' }
      ]
    }
  ];
  fs.writeFileSync(path.join(tmpDir, 'lint-results.json'), JSON.stringify(sample, null, 2));
}

function runCli(cmd, tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, cmd, ...args], { cwd: tmpDir, env, stdio: 'pipe' });
}

describe('CLI actionable violations flow', function () {
  it('generates analysis report, roadmap, and issue files with domain context', function () {
    this.timeout(5000);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-actionable-'));
    writeLintJson(tmp);

    // 1) analyze
    runCli('analyze', tmp, ['--input=lint-results.json', '--output=analysis-report.md']);
    const report = fs.readFileSync(path.join(tmp, 'analysis-report.md'), 'utf8');
    assert.match(report, /# Analysis Report/);
    assert.match(report, /## Configured Domains/);

    // 2) plan
    runCli('plan', tmp, ['--input=lint-results.json', '--output=FIXES-ROADMAP.md']);
    assert.ok(fs.existsSync(path.join(tmp, 'FIXES-ROADMAP.md')));

    // 3) create-issues
    runCli('create-issues', tmp, ['--input=lint-results.json', '--output=issues', '--include-commands=github-cli', '--labels=lint,tech-debt']);
    const readme = fs.readFileSync(path.join(tmp, 'issues', '00-README.md'), 'utf8');
    assert.match(readme, /How to Create Issues/);
    assert.match(readme, /gh issue create/);
    assert.match(readme, /lint,tech-debt/);
    const phase1 = fs.readFileSync(path.join(tmp, 'issues', '01-phase1-magic-numbers.md'), 'utf8');
    assert.match(phase1, /Configured Domains/);
    assert.match(phase1, /^-\s+\w+\s+\((primary|additional)\)/m);
  });
});
