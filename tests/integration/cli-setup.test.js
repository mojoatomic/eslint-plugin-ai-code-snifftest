/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

function runCliSetup(tmpDir, args = []) {
  const cliPath = path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
  const env = { ...process.env, FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1', SKIP_AI_REQUIREMENTS: '1', NODE_ENV: 'test' };
  execFileSync('node', [cliPath, 'setup', ...args], {
    cwd: tmpDir,
    env,
    stdio: 'pipe'
  });
}

describe('CLI setup command', function () {
  it('runs learn (strict apply) then init with defaults when --yes is used', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-setup-'));
    runCliSetup(tmp, ['--yes', '--primary=web-app']);
    assert.ok(fs.existsSync(path.join(tmp, '.ai-coding-guide.json')));
    assert.ok(fs.existsSync(path.join(tmp, 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(tmp, 'eslint.config.mjs')));
  });

  it('supports --skip-learn and initializes with provided domain', function () {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-setup-skip-'));
    runCliSetup(tmp, ['--yes', '--skip-learn', '--primary=cli']);
    const cfg = JSON.parse(fs.readFileSync(path.join(tmp, '.ai-coding-guide.json'), 'utf8'));
    assert.strictEqual(cfg.domains.primary, 'cli');
  });
});