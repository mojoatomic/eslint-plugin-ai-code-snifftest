/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function writeLintJson(tmpDir) {
  const f1 = path.join(tmpDir, 'a.js');
  const f2 = path.join(tmpDir, 'b.js');
  fs.writeFileSync(f1, 'function a(){ return 1; }\n');
  fs.writeFileSync(f2, 'function b(){ return 2; }\n');
  const sample = [
    { filePath: f1, messages: [
      { ruleId: 'complexity', severity: 2, message: 'Function complexity high', line: 1 },
      { ruleId: 'complexity', severity: 2, message: 'Function complexity high', line: 1 },
      { ruleId: 'ai-code-snifftest/prefer-simpler-logic', severity: 1, message: 'Prefer simpler logic', line: 1 }
    ]},
    { filePath: f2, messages: [
      { ruleId: 'complexity', severity: 2, message: 'Function complexity high', line: 1 },
      { ruleId: 'complexity', severity: 2, message: 'Function complexity high', line: 1 }
    ]}
  ];
  fs.writeFileSync(path.join(tmpDir, 'lint-results.json'), JSON.stringify(sample, null, 2));
}

function runAnalyze(tmpDir, extra = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, 'analyze', '--input=lint-results.json', '--output=analysis-report.md', '--top-files=1', '--min-count=2', '--max-examples=1', ...extra], { cwd: tmpDir, env, stdio: 'pipe' });
}

describe('CLI analyze thresholds', function () {
  it('applies --top-files, --min-count and --max-examples', function () {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-thr-'));
    writeLintJson(tmpDir);
    runAnalyze(tmpDir);
    const report = fs.readFileSync(path.join(tmpDir, 'analysis-report.md'), 'utf8');
    assert.match(report, /## Complexity/);
    // Only one top file listed
    let topFilesSection = report.split('### Top files')[1] || '';
    // Cut at next header to isolate the section
    const cutIdx = topFilesSection.search(/\n### |\n## /);
    if (cutIdx > -1) topFilesSection = topFilesSection.slice(0, cutIdx);
    const topLines = topFilesSection.trim().split('\n');
    const bullets = topLines.filter(l => l.startsWith('- ') && l.includes(path.sep));
    assert.ok(bullets.length <= 1);
    // Only one example
    let examplesSection = report.split('### Examples')[1] || '';
    const cutEx = examplesSection.search(/\n### |\n## /);
    if (cutEx > -1) examplesSection = examplesSection.slice(0, cutEx);
    const exampleBullets = examplesSection.split('\n').filter(l => l.startsWith('- '));
    assert.ok(exampleBullets.length <= 1);
  });
});
