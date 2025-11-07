/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function writeLintJson(tmpDir) {
  // minimal config to constrain allowed domains to 'general' (which will be 0) so hints appear
  fs.writeFileSync(path.join(tmpDir, '.ai-coding-guide.json'), JSON.stringify({ domains: { primary: 'general', additional: [] } }, null, 2));
  const fileWithTerms = path.join(tmpDir, 'astro.js');
  fs.writeFileSync(fileWithTerms, '// ecliptic term appears here\nfunction x(){ return 0; }\n');
  const sample = [
    {
      filePath: fileWithTerms,
      messages: [
        { ruleId: 'ai-code-snifftest/enforce-domain-terms', severity: 1, message: 'Prefer ecliptic over plane', line: 1 },
        { ruleId: 'ai-code-snifftest/no-generic-names', severity: 1, message: 'Generic name "result" - use a domain-specific term', line: 1 },
        { ruleId: 'complexity', severity: 2, message: 'Function has a complexity of 12. Maximum allowed is 10', line: 2 },
        { ruleId: 'max-lines-per-function', severity: 1, message: 'Function too long', line: 2 }
      ]
    }
  ];
  fs.writeFileSync(path.join(tmpDir, 'lint-results.json'), JSON.stringify(sample, null, 2));
}

function runAll(tmpDir) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, 'create-issues', '--input=lint-results.json', '--output=issues'], { cwd: tmpDir, env, stdio: 'pipe' });
}

describe('CLI issues hints + snippets', function () {
  it('adds Domain Hints and rich sections to issues', function () {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-issues-hints-'));
    writeLintJson(tmpDir);
    runAll(tmpDir);
    const phase2 = fs.readFileSync(path.join(tmpDir, 'issues', '03-phase2-domain-terms.md'), 'utf8');
    assert.match(phase2, /Configured Domains/);
    // Rich sections present
    assert.match(phase2, /^## Summary/m);
    assert.match(phase2, /^## Violations Breakdown/m);
    assert.match(phase2, /^## Top Files Affected/m);
    assert.match(phase2, /^## Fix Strategy/m);
    assert.match(phase2, /^## Verification/m);
    assert.match(phase2, /^## Acceptance Criteria/m);
    // Examples bullet appears with rule arrow
    assert.match(phase2, /### Examples[\s\S]*- .* → /);
  });
});
