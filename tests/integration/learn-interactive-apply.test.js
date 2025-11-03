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

describe('integration: learn --interactive --accept-defaults', function () {
  this.timeout(10000);

  it('applies recommended naming and forbidden names to .ai-coding-guide.json', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'learn-ia-'));
    writeFile(path.join(tmp, 'src', 'a.js'), `
      const isReady = true;
      const tropicalYear = 365.25;
      const result = 0;
    `);

    const cli = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
    const cmd = `node ${cli} learn --interactive --accept-defaults`;
    cp.execSync(cmd, { cwd: tmp, stdio: 'pipe' });

    const cfgPath = path.join(tmp, '.ai-coding-guide.json');
    assert.ok(fs.existsSync(cfgPath), 'config should be written');
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    assert.strictEqual(cfg.naming.style, 'camelCase');
    assert.ok(Array.isArray(cfg.antiPatterns.forbiddenNames));
    assert.ok(cfg.antiPatterns.forbiddenNames.includes('result'));
  });
});