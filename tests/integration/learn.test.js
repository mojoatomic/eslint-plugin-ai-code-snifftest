/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

describe('integration: learn command', function () {
  this.timeout(10000);

  it('produces a reconciliation report and optional fingerprint', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-'));
    // sample code with camelCase + boolean prefixes + known constant 365.25
    writeFile(path.join(tmp, 'src', 'a.js'), `
      const isReady = true;
      const tropicalYear = 365.25;
      function hasData() { return false; }
      const result = 1;
    `);

const cli = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const cmd = `node ${cli} learn --fingerprint`;
    cp.execSync(cmd, { cwd: tmp, stdio: 'pipe' });

    const reportPath = path.join(tmp, 'learn-report.json');
    assert.ok(fs.existsSync(reportPath), 'learn-report.json should exist');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.ok(report.findings, 'report should include findings');
    assert.ok(report.result, 'report should include result');
    assert.strictEqual(report.result.naming.style, 'camelCase');
    assert.ok(report.result.score >= 0 && report.result.score <= 100);

    const fp = path.join(tmp, '.ai-constants', 'project-fingerprint.js');
    assert.ok(fs.existsSync(fp), 'fingerprint should be written when --fingerprint');
  });
});