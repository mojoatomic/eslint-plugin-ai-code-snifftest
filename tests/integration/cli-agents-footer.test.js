/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function runCliInit(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1' };
  execFileSync('node', [cliPath, 'init', '--primary=dev-tools', '--yes', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('AGENTS.md footer references .ai-coding-guide.json', function () {
  it('footer references .json and not .md', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-agents-footer-'));
    runCliInit(tmp);
    const agents = fs.readFileSync(path.join(tmp, 'AGENTS.md'), 'utf8');
    assert.ok(agents.includes('.ai-coding-guide.json'));
    assert.ok(!agents.includes('.ai-coding-guide.md'));
  });
});
