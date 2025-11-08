/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function writeFile(dir, rel, content) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function runCliLearn(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1' };
  execFileSync('node', [cliPath, 'learn', '--sample=50', '--no-cache', '--apply', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI learn (non-interactive)', function () {
  it('applies adaptive changes to .ai-coding-guide.json', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-'));
    writeFile(tmp, 'src/a.js', `
      const isReady = true; const hasValue = false;
      const fooBar = 1; const data = 0; const result = 1; const data2 = 2; const data3 = 3;
      function days() { return 365.25; }
    `);
    runCliLearn(tmp, []);
    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    assert.ok(fs.existsSync(cfgPath));
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.ok(cfg.naming && cfg.naming.style); // naming recorded
  });

  it('strict mode updates config; permissive writes report only', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-'));
    writeFile(tmp, 'src/b.js', 'const snake_case = 1; const data = 0; const data = 1; const data = 2;');
    runCliLearn(tmp, ['--strict']);
    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    assert.ok(fs.existsSync(cfgPath));
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.strictEqual(cfg.naming.style, 'camelCase');

    const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-learn-'));
    writeFile(tmp2, 'src/c.js', 'const snake_case = 1;');
    runCliLearn(tmp2, ['--permissive']);
    const reportPath = path.join(tmp2, '.ai-learn-report.json');
    assert.ok(fs.existsSync(reportPath));
  });
});
