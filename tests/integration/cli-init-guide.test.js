/* eslint-env mocha */
/* global describe, it */
"use strict";

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function runCliInit(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1' };
  execFileSync('node', [cliPath, 'init', '--primary=astronomy', '--yes', '--md', '--cursor', '--agents', '--eslint', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI init guide content', function () {
  it('writes .ai-coding-guide.md with ambiguity and precedence sections', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-guide-'));
    runCliInit(tmp);
    const guide = fs.readFileSync(path.join(tmp, '.ai-coding-guide.md'), 'utf8');
    assert.match(guide, /Ambiguity and Disambiguation/);
    assert.match(guide, /Active-Domain Precedence/);
    assert.match(guide, /constantResolution/);
  });
});