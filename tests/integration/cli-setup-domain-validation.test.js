/* eslint-env mocha */
/* global describe, it */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

function cliPath() {
  return path.resolve(__dirname, '..', '..', 'bin', 'cli.js');
}

function withTmpDir(prefix, fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try { fn(tempDir); } finally { fs.rmSync(tempDir, { recursive: true, force: true }); }
}

describe('setup --yes domain inference/validation', function () {
  this.timeout(8000);

  it('errors when --yes has no --primary and domain cannot be inferred', function () {
    withTmpDir('cli-setup-no-domain-', (tempDir) => {
      // minimal package.json without clues
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'my-app' }, null, 2));
      const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1' };
      const res = spawnSync('node', [cliPath(), 'setup', '--yes'], { cwd: tempDir, env, encoding: 'utf8' });
      assert.notStrictEqual(res.status, 0, 'should exit non-zero');
      assert.ok(/--primary required/i.test(res.stderr || res.stdout), 'should print guidance about --primary');
    });
  });

  it('infers dev-tools for eslint plugin projects (no --primary)', function () {
    withTmpDir('cli-setup-infer-devtools-', (tempDir) => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'eslint-plugin-foo' }, null, 2));
      const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1' };
      execFileSync('node', [cliPath(), 'setup', '--yes'], { cwd: tempDir, env, stdio: 'pipe' });
      const cfg = JSON.parse(fs.readFileSync(path.join(tempDir, '.ai-coding-guide.json'), 'utf8'));
      assert.strictEqual(cfg.domains.primary, 'dev-tools');
      assert.ok(Array.isArray(cfg.domainPriority) && cfg.domainPriority[0] === 'dev-tools');
    });
  });

  it('accepts explicit --primary and succeeds', function () {
    withTmpDir('cli-setup-primary-', (tempDir) => {
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'my-app' }, null, 2));
      const env = { ...process.env, SKIP_AI_REQUIREMENTS: '1', FORCE_AI_CONFIG: '1', FORCE_ESLINT_CONFIG: '1' };
      execFileSync('node', [cliPath(), 'setup', '--yes', '--primary=dev-tools'], { cwd: tempDir, env, stdio: 'pipe' });
      const cfg = JSON.parse(fs.readFileSync(path.join(tempDir, '.ai-coding-guide.json'), 'utf8'));
      assert.strictEqual(cfg.domains.primary, 'dev-tools');
    });
  });
});
