/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function runCliInit(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, 'init', '--primary=general', '--yes', '--md', '--external', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI init with external constants (experimental)', function () {
  it('includes discovery summary and domains list', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-ext-'));
    write(path.join(tmp, '.ai-constants', 'x.js'),
      "module.exports = { domain: 'x', version: '1.0.0', constants: [{ value: 3, name: 'THREE', description: 'the number three' }], terms: { entities: ['X'] } };\n");
    runCliInit(tmp);
    const guide = fs.readFileSync(path.join(tmp, '.ai-coding-guide.md'), 'utf8');
    assert.match(guide, /External Constants Discovery/);
    assert.match(guide, /Local: 1/);
    assert.match(guide, /Domains: .*x/);
  });
});
